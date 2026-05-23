import { PrismaClient, Prisma } from "@prisma/client";
import { AppError } from "../middleware/error-handler";
import ExcelJS from "exceljs";
import sharp from "sharp";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

export class StudentService {
  /**
   * 查询学生列表（分页、筛选、搜索）
   */
  async list(params: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    classId?: number;
    gradeLevel?: string;
    status?: string;
    userRole?: string;
  }) {
    const { page = 1, pageSize = 20, keyword, classId, gradeLevel, status, userRole } = params;
    const where: Prisma.StudentWhereInput = {};

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { studentNo: { contains: keyword } },
      ];
    }
    if (classId) where.classId = classId;
    if (gradeLevel) where.class = { gradeLevel };
    if (status) where.status = status;
    where.deletedAt = null;

    const [data, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          class: { select: { id: true, name: true, gradeLevel: true } },
          parents: true,
          user: { select: { id: true, username: true, phone: true, status: true, avatarUrl: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { studentNo: "asc" },
      }),
      prisma.student.count({ where }),
    ]);

    return {
      data: data.map((s) => this.maskSensitive(s, userRole)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 获取单个学生详情
   */
  async getById(id: number, userRole?: string) {
    const student = await prisma.student.findFirst({
      where: { id, deletedAt: null },
      include: {
        class: { select: { id: true, name: true, gradeLevel: true } },
        parents: true,
        user: { select: { id: true, username: true, phone: true, status: true, avatarUrl: true } },
        dormitory: { include: { building: true } },
      },
    });

    if (!student) throw new AppError(404, "学生不存在");
    return this.maskSensitive(student, userRole);
  }

  /**
   * 新增学生
   */
  async create(data: {
    studentNo: string;
    name: string;
    gender: string;
    birthDate?: string;
    idCard?: string;
    address?: string;
    nativePlace?: string;
    hobbies?: string;
    classId?: number;
    enrollmentDate?: string;
    fatherName?: string;
    fatherPhone?: string;
    motherName?: string;
    motherPhone?: string;
  }) {
    // 学号唯一性校验
    const existing = await prisma.student.findUnique({ where: { studentNo: data.studentNo } });
    if (existing) throw new AppError(400, `学号 ${data.studentNo} 已存在`);

    // 预先生成密码哈希
    const studentHash = await bcrypt.hash("Student@123", 10);
    const parentHash = await bcrypt.hash("Parent@123", 10);

    return prisma.$transaction(async (tx) => {
      // 创建学生用户
      const user = await tx.user.create({
        data: {
          username: `stu_${data.studentNo}`,
          passwordHash: studentHash,
          role: "student",
          name: data.name,
        },
      });

      // 创建学生
      const student = await tx.student.create({
        data: {
          userId: user.id,
          studentNo: data.studentNo,
          name: data.name,
          gender: data.gender,
          birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
          idCard: data.idCard,
          address: data.address,
          nativePlace: data.nativePlace,
          hobbies: data.hobbies,
          classId: data.classId,
          enrollmentDate: data.enrollmentDate ? new Date(data.enrollmentDate) : undefined,
        },
      });

      // 创建家长记录
      if (data.fatherName || data.fatherPhone) {
        const fatherUser = await tx.user.create({
          data: {
            username: `parent_${data.studentNo}_f`,
            passwordHash: parentHash,
            role: "parent",
            name: data.fatherName || `${data.name}父亲`,
            phone: data.fatherPhone,
          },
        });
        await tx.parent.create({
          data: {
            userId: fatherUser.id,
            studentId: student.id,
            relation: "father",
            name: data.fatherName || `${data.name}父亲`,
            phone: data.fatherPhone || "",
            isPrimary: true,
          },
        });
      }

      if (data.motherName || data.motherPhone) {
        const motherUser = await tx.user.create({
          data: {
            username: `parent_${data.studentNo}_m`,
            passwordHash: parentHash,
            role: "parent",
            name: data.motherName || `${data.name}母亲`,
            phone: data.motherPhone,
          },
        });
        await tx.parent.create({
          data: {
            userId: motherUser.id,
            studentId: student.id,
            relation: "mother",
            name: data.motherName || `${data.name}母亲`,
            phone: data.motherPhone || "",
            isPrimary: false,
          },
        });
      }

      // 更新班级人数
      if (data.classId) {
        await tx.class.update({
          where: { id: data.classId },
          data: { studentCount: { increment: 1 } },
        });
      }

      return student;
    });
  }

  /**
   * 更新学生
   */
  async update(id: number, data: any) {
    const student = await prisma.student.findFirst({ where: { id, deletedAt: null } });
    if (!student) throw new AppError(404, "学生不存在");

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.birthDate !== undefined) updateData.birthDate = data.birthDate ? new Date(data.birthDate) : null;
    if (data.idCard !== undefined) updateData.idCard = data.idCard;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.nativePlace !== undefined) updateData.nativePlace = data.nativePlace;
    if (data.hobbies !== undefined) updateData.hobbies = data.hobbies;
    if (data.enrollmentDate !== undefined) updateData.enrollmentDate = data.enrollmentDate ? new Date(data.enrollmentDate) : null;
    if (data.status !== undefined) updateData.status = data.status;

    // 班级变更处理
    if (data.classId !== undefined && data.classId !== student.classId) {
      if (student.classId) {
        await prisma.class.update({ where: { id: student.classId }, data: { studentCount: { increment: -1 } } });
      }
      if (data.classId) {
        await prisma.class.update({ where: { id: data.classId }, data: { studentCount: { increment: 1 } } });
      }
      updateData.classId = data.classId;
    }

    // 获取已有家长记录
    const existingParents = await prisma.parent.findMany({ where: { studentId: id } });
    const existingFather = existingParents.find((p) => p.relation === "father");
    const existingMother = existingParents.find((p) => p.relation === "mother");

    // 更新父亲信息
    if (data.fatherName !== undefined || data.fatherPhone !== undefined) {
      if (existingFather) {
        const fatherUserUpdate: any = {};
        if (data.fatherName !== undefined) fatherUserUpdate.name = data.fatherName;
        if (data.fatherPhone !== undefined) fatherUserUpdate.phone = data.fatherPhone;
        if (Object.keys(fatherUserUpdate).length > 0) {
          await prisma.user.update({ where: { id: existingFather.userId }, data: fatherUserUpdate });
        }
        const fatherUpdate: any = {};
        if (data.fatherName !== undefined) fatherUpdate.name = data.fatherName;
        if (data.fatherPhone !== undefined) fatherUpdate.phone = data.fatherPhone;
        if (Object.keys(fatherUpdate).length > 0) {
          await prisma.parent.update({ where: { id: existingFather.id }, data: fatherUpdate });
        }
      } else if (data.fatherName || data.fatherPhone) {
        // 新建父亲记录
        const parentHash = await bcrypt.hash("Parent@123", 10);
        const fatherUser = await prisma.user.create({
          data: {
            username: `parent_${student.studentNo}_f`,
            passwordHash: parentHash,
            role: "parent",
            name: data.fatherName || `${student.name}父亲`,
            phone: data.fatherPhone,
          },
        });
        await prisma.parent.create({
          data: {
            userId: fatherUser.id,
            studentId: id,
            relation: "father",
            name: data.fatherName || `${student.name}父亲`,
            phone: data.fatherPhone || "",
            isPrimary: true,
          },
        });
      }
    }

    // 更新母亲信息
    if (data.motherName !== undefined || data.motherPhone !== undefined) {
      if (existingMother) {
        const motherUserUpdate: any = {};
        if (data.motherName !== undefined) motherUserUpdate.name = data.motherName;
        if (data.motherPhone !== undefined) motherUserUpdate.phone = data.motherPhone;
        if (Object.keys(motherUserUpdate).length > 0) {
          await prisma.user.update({ where: { id: existingMother.userId }, data: motherUserUpdate });
        }
        const motherUpdate: any = {};
        if (data.motherName !== undefined) motherUpdate.name = data.motherName;
        if (data.motherPhone !== undefined) motherUpdate.phone = data.motherPhone;
        if (Object.keys(motherUpdate).length > 0) {
          await prisma.parent.update({ where: { id: existingMother.id }, data: motherUpdate });
        }
      } else if (data.motherName || data.motherPhone) {
        const parentHash = await bcrypt.hash("Parent@123", 10);
        const motherUser = await prisma.user.create({
          data: {
            username: `parent_${student.studentNo}_m`,
            passwordHash: parentHash,
            role: "parent",
            name: data.motherName || `${student.name}母亲`,
            phone: data.motherPhone,
          },
        });
        await prisma.parent.create({
          data: {
            userId: motherUser.id,
            studentId: id,
            relation: "mother",
            name: data.motherName || `${student.name}母亲`,
            phone: data.motherPhone || "",
            isPrimary: false,
          },
        });
      }
    }

    return prisma.student.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * 软删除学生（标记删除，保留关联数据）
   */
  async delete(id: number) {
    const student = await prisma.student.findFirst({
      where: { id, deletedAt: null },
      include: { parents: { select: { id: true, userId: true } } },
    });
    if (!student) throw new AppError(404, "学生不存在");

    return prisma.$transaction(async (tx) => {
      // 标记学生为已删除
      await tx.student.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // 禁用关联用户账号
      if (student.userId) {
        await tx.user.update({
          where: { id: student.userId },
          data: { status: "disabled" },
        });
      }
      for (const p of student.parents) {
        if (p.userId) {
          await tx.user.update({
            where: { id: p.userId },
            data: { status: "disabled" },
          });
        }
      }

      // 更新班级人数
      if (student.classId) {
        await tx.class.update({
          where: { id: student.classId },
          data: { studentCount: { decrement: 1 } },
        });
      }
    });
  }

  /**
   * Excel 批量导入
   */
  async importExcel(buffer: Buffer): Promise<{ success: number; failed: number; errors: { row: number; reason: string }[] }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) throw new AppError(400, "Excel 文件为空");

    const headerMap: Record<string, string> = {
      "学号": "studentNo", "姓名": "name", "性别": "gender", "年龄": "age",
      "爱好": "hobbies", "住址": "address",
      "父亲姓名": "fatherName", "父亲电话": "fatherPhone",
      "母亲姓名": "motherName", "母亲电话": "motherPhone",
      "班级": "className",
    };

    // 解析表头
    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = cell.text?.trim() || "";
    });

    const columnMap: Record<number, string> = {};
    for (let i = 1; i < headers.length; i++) {
      if (headerMap[headers[i]]) {
        columnMap[i] = headerMap[headers[i]];
      }
    }

    // 预加载班级映射 (名称 → id)
    const allClasses = await prisma.class.findMany({
      select: { id: true, name: true },
    });
    const classNameMap = new Map<string, number>();
    for (const c of allClasses) {
      classNameMap.set(c.name, c.id);
    }

    // 解析数据行
    const rows: any[] = [];
    const errors: { row: number; reason: string }[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // 跳过表头

      const rowData: any = {};
      row.eachCell((cell, colNumber) => {
        if (columnMap[colNumber]) {
          let value = cell.value;
          if (cell.type === ExcelJS.ValueType.Number) {
            value = String(Math.floor(cell.value as number));
          } else {
            value = String(value ?? "").trim();
          }
          rowData[columnMap[colNumber]] = value;
        }
      });

      if (rowData.studentNo && rowData.name) {
        // 通过班级名称查找 classId
        if (rowData.className) {
          const classId = classNameMap.get(rowData.className);
          if (classId) {
            rowData.classId = classId;
          }
        }
        rows.push(rowData);
      }
    });

    let success = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        await this.create({
          studentNo: row.studentNo,
          name: row.name,
          gender: row.gender === "男" ? "male" : row.gender === "女" ? "female" : "male",
          hobbies: row.hobbies,
          address: row.address,
          classId: row.classId,
          fatherName: row.fatherName,
          fatherPhone: row.fatherPhone,
          motherName: row.motherName,
          motherPhone: row.motherPhone,
        });
        success++;
      } catch (err) {
        errors.push({ row: i + 2, reason: (err as Error).message });
      }
    }

    return { success, failed: rows.length - success, errors };
  }

  /**
   * 上传照片
   */
  async uploadPhoto(id: number, fileBuffer: Buffer): Promise<string> {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) throw new AppError(404, "学生不存在");

    const timestamp = Date.now();
    const filename = `avatars/${id}/${timestamp}.webp`;
    const uploadDir = path.resolve(__dirname, "../../uploads/avatars", String(id));
    fs.mkdirSync(uploadDir, { recursive: true });

    const outputPath = path.join(uploadDir, `${timestamp}.webp`);

    // 用 sharp 处理图片 → webp
    await sharp(fileBuffer)
      .resize(600, 600, { fit: "cover" })
      .webp({ quality: 85 })
      .toFile(outputPath);

    // 本地存储 URL（生产环境换成 COS 上传）
    const photoUrl = `/uploads/${filename}`;

    await prisma.student.update({
      where: { id },
      data: { photoUrl },
    });

    return photoUrl;
  }

  /**
   * 数据导出
   */
  async exportExcel(params: { classId?: number; gradeLevel?: string; status?: string }): Promise<Buffer> {
    const where: Prisma.StudentWhereInput = {};
    if (params.classId) where.classId = params.classId;
    if (params.gradeLevel) where.class = { gradeLevel: params.gradeLevel };
    if (params.status) where.status = params.status;
    where.deletedAt = null;

    const students = await prisma.student.findMany({
      where,
      include: { class: true, parents: true },
      orderBy: { studentNo: "asc" },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("学生信息");

    sheet.columns = [
      { header: "学号", key: "studentNo", width: 15 },
      { header: "姓名", key: "name", width: 10 },
      { header: "性别", key: "gender", width: 8 },
      { header: "班级", key: "className", width: 18 },
      { header: "爱好", key: "hobbies", width: 20 },
      { header: "住址", key: "address", width: 30 },
      { header: "父亲姓名", key: "fatherName", width: 12 },
      { header: "父亲电话", key: "fatherPhone", width: 15 },
      { header: "母亲姓名", key: "motherName", width: 12 },
      { header: "母亲电话", key: "motherPhone", width: 15 },
    ];

    students.forEach((s) => {
      sheet.addRow({
        studentNo: s.studentNo,
        name: s.name,
        gender: s.gender === "male" ? "男" : "女",
        className: s.class?.name || "",
        hobbies: s.hobbies || "",
        address: s.address || "",
        fatherName: s.parents.find((p) => p.relation === "father")?.name || "",
        fatherPhone: s.parents.find((p) => p.relation === "father")?.phone || "",
        motherName: s.parents.find((p) => p.relation === "mother")?.name || "",
        motherPhone: s.parents.find((p) => p.relation === "mother")?.phone || "",
      });
    });

    return Buffer.from(await workbook.xlsx.writeBuffer() as ArrayBuffer);
  }

  /**
   * 脱敏处理 - 非管理员角色隐藏敏感信息
   */
  private maskSensitive(student: any, userRole?: string) {
    const masked = { ...student };
    // 身份证只保留后 4 位
    if (masked.idCard) {
      masked.idCard = masked.idCard.replace(/./g, "*").slice(0, -4) + masked.idCard.slice(-4);
    }
    // 家长电话中间 4 位打星号（管理员不脱敏）
    if (masked.parents) {
      masked.parents = masked.parents.map((p: any) => ({
        ...p,
        phone: userRole === "admin" ? p.phone : (p.phone ? p.phone.slice(0, 3) + "****" + p.phone.slice(-4) : p.phone),
      }));
    }
    return masked;
  }
}

export const studentService = new StudentService();
