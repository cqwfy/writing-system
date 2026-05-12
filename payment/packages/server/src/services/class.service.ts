import { PrismaClient, Prisma } from "@prisma/client";
import { AppError } from "../middleware/error-handler";

const prisma = new PrismaClient();

export class ClassService {
  async list(params: { page?: number; pageSize?: number; gradeLevel?: string; academicYear?: string }) {
    const { page = 1, pageSize = 20, gradeLevel, academicYear } = params;
    const where: Prisma.ClassWhereInput = {};
    if (gradeLevel) where.gradeLevel = gradeLevel;
    if (academicYear) where.academicYear = academicYear;

    const [rows, total] = await Promise.all([
      prisma.class.findMany({
        where,
        include: { homeroomTeacher: { select: { id: true, name: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      prisma.class.count({ where }),
    ]);

    // 统计每个班级的实际学生数（排除软删除）
    const classIds = rows.map((r) => r.id);
    const counts = await prisma.student.groupBy({
      by: ["classId"],
      where: { classId: { in: classIds }, deletedAt: null },
      _count: { id: true },
    });
    const countMap: Record<number, number> = {};
    counts.forEach((c) => { countMap[c.classId] = c._count.id; });

    const data = rows.map((r) => ({
      ...r,
      studentCount: countMap[r.id] || 0,
    }));

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getAll() {
    return prisma.class.findMany({
      include: { homeroomTeacher: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    });
  }

  async getById(id: number) {
    const cls = await prisma.class.findUnique({
      where: { id },
      include: {
        homeroomTeacher: { select: { id: true, name: true } },
        students: { where: { deletedAt: null }, select: { id: true, studentNo: true, name: true, gender: true } },
      },
    });
    if (!cls) throw new AppError(404, "班级不存在");
    return cls;
  }

  async create(data: { name: string; gradeLevel: string; homeroomTeacherId?: number; academicYear: string }) {
    return prisma.class.create({
      data: {
        name: data.name,
        gradeLevel: data.gradeLevel,
        homeroomTeacherId: data.homeroomTeacherId || null,
        academicYear: data.academicYear,
      },
    });
  }

  async update(id: number, data: { name?: string; gradeLevel?: string; homeroomTeacherId?: number | null; academicYear?: string; status?: string }) {
    const cls = await prisma.class.findUnique({ where: { id } });
    if (!cls) throw new AppError(404, "班级不存在");
    return prisma.class.update({ where: { id }, data });
  }

  async setHomeroomTeacher(id: number, teacherId: number) {
    return prisma.class.update({
      where: { id },
      data: { homeroomTeacherId: teacherId },
    });
  }

  async getStudents(id: number) {
    return prisma.student.findMany({
      where: { classId: id, status: "active", deletedAt: null },
      select: { id: true, studentNo: true, name: true, gender: true },
      orderBy: { studentNo: "asc" },
    });
  }

  async transferStudent(studentId: number, fromClassId: number, toClassId: number) {
    await prisma.$transaction([
      prisma.student.update({ where: { id: studentId }, data: { classId: toClassId } }),
      prisma.class.update({ where: { id: fromClassId }, data: { studentCount: { increment: -1 } } }),
      prisma.class.update({ where: { id: toClassId }, data: { studentCount: { increment: 1 } } }),
    ]);
  }
}

export const classService = new ClassService();
