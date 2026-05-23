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

  /**
   * 批量升年级：低年级升一级，最高年级（12）学生毕业、班级归档
   */
  async promoteGrades() {
    const GRADE_LABELS: Record<string, string> = {
      "7": "七年级", "8": "八年级", "9": "九年级",
      "10": "高一", "11": "高二", "12": "高三",
    };
    const NEXT_GRADE: Record<string, string> = {
      "7": "8", "8": "9", "9": "10", "10": "11", "11": "12",
    };

    const activeClasses = await prisma.class.findMany({ where: { status: "active" } });

    let promotedStudents = 0;
    let graduatedStudents = 0;
    let promotedClasses = 0;
    let archivedClasses = 0;

    await prisma.$transaction(async (tx) => {
      for (const cls of activeClasses) {
        const gradeLevel = cls.gradeLevel;

        if (gradeLevel === "12") {
          // 高三 → 毕业
          const result = await tx.student.updateMany({
            where: { classId: cls.id, deletedAt: null, status: "active" },
            data: { status: "graduated" },
          });
          graduatedStudents += result.count;
          await tx.class.update({
            where: { id: cls.id },
            data: { status: "archived" },
          });
          archivedClasses++;
        } else if (NEXT_GRADE[gradeLevel]) {
          // 低年级 → 升一级
          const newGradeLevel = NEXT_GRADE[gradeLevel];
          const oldLabel = GRADE_LABELS[gradeLevel];
          const newLabel = GRADE_LABELS[newGradeLevel];
          const newName = cls.name.replace(oldLabel, newLabel);

          const result = await tx.student.updateMany({
            where: { classId: cls.id, deletedAt: null, status: "active" },
            data: {},
          });
          // 统计该班活跃学生数
          const count = await tx.student.count({
            where: { classId: cls.id, deletedAt: null, status: "active" },
          });
          promotedStudents += count;

          await tx.class.update({
            where: { id: cls.id },
            data: { gradeLevel: newGradeLevel, name: newName, studentCount: count },
          });
          promotedClasses++;
        }
      }
    });

    return { promotedStudents, graduatedStudents, promotedClasses, archivedClasses };
  }
}

export const classService = new ClassService();
