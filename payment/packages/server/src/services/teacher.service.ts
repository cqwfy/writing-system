import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../middleware/error-handler";

const prisma = new PrismaClient();

export class TeacherService {
  async list(params: { page?: number; pageSize?: number; keyword?: string }) {
    const { page = 1, pageSize = 20, keyword } = params;
    const where: any = {};
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { teacherNo: { contains: keyword } },
        { phone: { contains: keyword } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.teacher.findMany({
        where,
        include: { user: { select: { id: true, username: true, status: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { teacherNo: "asc" },
      }),
      prisma.teacher.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getAll() {
    return prisma.teacher.findMany({
      select: { id: true, name: true, teacherNo: true, subject: true },
      orderBy: { name: "asc" },
    });
  }

  async getById(id: number) {
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: { user: { select: { id: true, username: true, status: true } } },
    });
    if (!teacher) throw new AppError(404, "教师不存在");
    return teacher;
  }

  async create(data: { name: string; teacherNo: string; username: string; password: string; subject?: string; phone?: string }) {
    const existingUser = await prisma.user.findUnique({ where: { username: data.username } });
    if (existingUser) throw new AppError(400, "用户名已存在");

    const existingNo = await prisma.teacher.findUnique({ where: { teacherNo: data.teacherNo } });
    if (existingNo) throw new AppError(400, "工号已存在");

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        passwordHash,
        role: "teacher",
        name: data.name,
        phone: data.phone || null,
      },
    });

    return prisma.teacher.create({
      data: {
        userId: user.id,
        name: data.name,
        teacherNo: data.teacherNo,
        subject: data.subject || null,
        phone: data.phone || null,
      },
      include: { user: { select: { id: true, username: true, status: true } } },
    });
  }

  async update(id: number, data: { name?: string; teacherNo?: string; username?: string; subject?: string; phone?: string }) {
    const teacher = await prisma.teacher.findUnique({ where: { id } });
    if (!teacher) throw new AppError(404, "教师不存在");

    return prisma.$transaction(async (tx) => {
      // 更新 teacher 表
      await tx.teacher.update({
        where: { id },
        data: {
          name: data.name,
          teacherNo: data.teacherNo,
          subject: data.subject,
          phone: data.phone,
        },
      });

      // 更新 user 表
      const userUpdate: any = {};
      if (data.name) userUpdate.name = data.name;
      if (data.phone !== undefined) userUpdate.phone = data.phone;
      if (data.username) userUpdate.username = data.username;
      if (Object.keys(userUpdate).length > 0) {
        await tx.user.update({ where: { id: teacher.userId }, data: userUpdate });
      }

      return tx.teacher.findUnique({
        where: { id },
        include: { user: { select: { id: true, username: true, status: true } } },
      });
    });
  }

  async delete(id: number) {
    const teacher = await prisma.teacher.findUnique({ where: { id } });
    if (!teacher) throw new AppError(404, "教师不存在");

    // 检查是否还有班级引用
    const hasClass = await prisma.class.findFirst({ where: { homeroomTeacherId: id } });
    if (hasClass) {
      throw new AppError(400, `该教师仍是「${hasClass.name}」的班主任，请先更换班主任后再删除`);
    }

    await prisma.$transaction(async (tx) => {
      await tx.teacher.delete({ where: { id } });
      await tx.user.delete({ where: { id: teacher.userId } });
    });
  }

  async resetPassword(id: number) {
    const teacher = await prisma.teacher.findUnique({ where: { id } });
    if (!teacher) throw new AppError(404, "教师不存在");

    const defaultPassword = "Teacher@123";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    await prisma.user.update({
      where: { id: teacher.userId },
      data: { passwordHash },
    });

    return { message: `密码已重置为 ${defaultPassword}` };
  }
}

export const teacherService = new TeacherService();
