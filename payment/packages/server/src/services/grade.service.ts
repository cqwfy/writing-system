import { PrismaClient, Prisma } from "@prisma/client";
import { AppError } from "../middleware/error-handler";

const prisma = new PrismaClient();

export class GradeService {
  /**
   * 考试类型 CRUD
   */
  async listExams(params: { semester?: string; academicYear?: string }) {
    return prisma.examType.findMany({
      where: { semester: params.semester, academicYear: params.academicYear },
      orderBy: { examDate: "desc" },
    });
  }

  async createExam(data: { name: string; semester?: string; academicYear: string; examDate?: string; weight?: number; month?: number }) {
    if (data.name === "月考" && !data.month) throw new AppError(400, "月考必须选择月份");
    if (data.name !== "月考" && !data.semester) throw new AppError(400, "期中/期末考试必须选择学期");
    return prisma.examType.create({
      data: {
        name: data.name,
        semester: data.semester || null,
        academicYear: data.academicYear,
        examDate: data.examDate ? new Date(data.examDate) : undefined,
        weight: data.weight,
        month: data.month || null,
      },
    });
  }

  async deleteExam(id: number) {
    // 先删成绩再删考试
    await prisma.grade.deleteMany({ where: { examTypeId: id } });
    await prisma.examType.delete({ where: { id } });
  }

  /**
   * 批量录入成绩
   */
  async batchCreateGrades(data: { examTypeId: number; grades: { studentId: number; courseId: number; score: number }[] }, teacherId: number) {
    const results = [];
    const errors: { studentId: number; courseId: number; reason: string }[] = [];

    for (const g of data.grades) {
      try {
        const existing = await prisma.grade.findFirst({
          where: { studentId: g.studentId, courseId: g.courseId, examTypeId: data.examTypeId },
        });

        if (existing) {
          const updated = await prisma.grade.update({
            where: { id: existing.id },
            data: { score: g.score, createdBy: teacherId },
          });
          results.push(updated);
        } else {
          const created = await prisma.grade.create({
            data: {
              studentId: g.studentId,
              courseId: g.courseId,
              examTypeId: data.examTypeId,
              score: g.score,
              createdBy: teacherId,
            },
          });
          results.push(created);
        }
      } catch (err: any) {
        errors.push({ studentId: g.studentId, courseId: g.courseId, reason: err.message });
      }
    }

    return { results, errors };
  }

  /**
   * 查询成绩（按考试和课程）
   */
  async listGrades(params: { examTypeId: number; courseId?: number; classId?: number; page?: number; pageSize?: number }) {
    const { examTypeId, courseId, classId, page = 1, pageSize = 50 } = params;
    const where: Prisma.GradeWhereInput = { examTypeId, student: { deletedAt: null } };

    if (courseId) where.courseId = courseId;
    if (classId) {
      const studentIds = await prisma.student.findMany({ where: { classId, deletedAt: null }, select: { id: true } });
      where.studentId = { in: studentIds.map((s) => s.id) };
    }

    const [data, total] = await Promise.all([
      prisma.grade.findMany({
        where,
        include: {
          student: { select: { id: true, studentNo: true, name: true, class: { select: { id: true, name: true, gradeLevel: true } } } },
          course: { select: { id: true, name: true } },
          examType: { select: { id: true, name: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ student: { class: { name: "asc" } } }, { course: { name: "asc" } }, { score: "desc" }],
      }),
      prisma.grade.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  /**
   * 发布成绩
   */
  async publishGrades(examTypeId: number) {
    return prisma.grade.updateMany({
      where: { examTypeId },
      data: { isPublished: true },
    });
  }

  /**
   * 计算排名并写入（按课程分别排名，同分同名次）
   */
  async calculateRanks(examTypeId: number) {
    const exam = await prisma.examType.findUnique({ where: { id: examTypeId } });
    if (!exam) throw new AppError(404, "考试不存在");

    const allGrades = await prisma.grade.findMany({
      where: { examTypeId, student: { deletedAt: null } },
      include: { student: { select: { classId: true } } },
    });

    // 按课程分组
    const courseGroups = new Map<number, typeof allGrades>();
    for (const g of allGrades) {
      const group = courseGroups.get(g.courseId) || [];
      group.push(g);
      courseGroups.set(g.courseId, group);
    }

    const updates: any[] = [];

    for (const [, grades] of courseGroups) {
      // 年级排名：同一课程内按分数降序，同分同名次
      const gradeSorted = [...grades].sort((a, b) => Number(b.score) - Number(a.score));
      const gradeRankMap = new Map<number, number>();
      for (let i = 0; i < gradeSorted.length; i++) {
        if (i > 0 && Number(gradeSorted[i].score) === Number(gradeSorted[i - 1].score)) {
          gradeRankMap.set(gradeSorted[i].id, gradeRankMap.get(gradeSorted[i - 1].id)!);
        } else {
          gradeRankMap.set(gradeSorted[i].id, i + 1);
        }
      }

      // 班级排名：按班级分组，各自排名
      const classGroups = new Map<number, typeof grades>();
      for (const g of grades) {
        const cg = classGroups.get(g.student.classId!) || [];
        cg.push(g);
        classGroups.set(g.student.classId!, cg);
      }

      const classRankMap = new Map<number, number>();
      for (const [, cg] of classGroups) {
        const classSorted = [...cg].sort((a, b) => Number(b.score) - Number(a.score));
        for (let i = 0; i < classSorted.length; i++) {
          if (i > 0 && Number(classSorted[i].score) === Number(classSorted[i - 1].score)) {
            classRankMap.set(classSorted[i].id, classRankMap.get(classSorted[i - 1].id)!);
          } else {
            classRankMap.set(classSorted[i].id, i + 1);
          }
        }
      }

      for (const g of grades) {
        updates.push(
          prisma.grade.update({
            where: { id: g.id },
            data: {
              gradeRank: gradeRankMap.get(g.id) || null,
              classRank: classRankMap.get(g.id) || null,
            },
          })
        );
      }
    }

    if (updates.length > 0) {
      await prisma.$transaction(updates);
    }

    return { gradeCount: allGrades.length, courseCount: courseGroups.size };
  }

  /**
   * 成绩统计
   */
  async getStats(examTypeId: number, courseId?: number, classId?: number) {
    const where: Prisma.GradeWhereInput = { examTypeId, student: { deletedAt: null } };
    if (courseId) where.courseId = courseId;
    if (classId) {
      where.student = { ...((where.student as any) || {}), classId, deletedAt: null };
    }

    const grades = await prisma.grade.findMany({
      where,
      include: { course: { select: { name: true } }, examType: { select: { name: true } } },
    });

    if (grades.length === 0) throw new AppError(404, "暂无成绩数据");

    const courseName = courseId ? grades[0].course.name : "全部课程";
    const scores = grades.map((g) => Number(g.score)).sort((a, b) => a - b);
    const total = scores.length;
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = sum / total;
    const maxScore = scores[total - 1];
    const minScore = scores[0];
    const medianScore = total % 2 === 0 ? (scores[total / 2 - 1] + scores[total / 2]) / 2 : scores[Math.floor(total / 2)];

    // 及格率（>= 60）和优秀率（>= 90）
    const passCount = scores.filter((s) => s >= 60).length;
    const excellentCount = scores.filter((s) => s >= 90).length;

    // 分数段分布
    const ranges = [
      { min: 0, max: 60, label: "不及格" },
      { min: 60, max: 70, label: "60-69" },
      { min: 70, max: 80, label: "70-79" },
      { min: 80, max: 90, label: "80-89" },
      { min: 90, max: 101, label: "90-100" },
    ];

    const distribution = ranges.map((r) => ({
      range: r.label,
      count: scores.filter((s) => s >= r.min && s < r.max).length,
    }));

    return {
      examId: examTypeId,
      examName: grades[0].examType?.name || "",
      courseName,
      studentCount: total,
      avgScore: Math.round(avg * 10) / 10,
      maxScore,
      minScore,
      medianScore,
      passRate: Math.round((passCount / total) * 100 * 10) / 10,
      excellenceRate: Math.round((excellentCount / total) * 100 * 10) / 10,
      distribution,
    };
  }

  /**
   * 我的成绩（学生/家长端）
   */
  async getMyGrades(studentId: number, examTypeId?: number) {
    const where: Prisma.GradeWhereInput = { studentId, isPublished: true };
    if (examTypeId) where.examTypeId = examTypeId;

    return prisma.grade.findMany({
      where,
      include: {
        course: { select: { id: true, name: true } },
        examType: { select: { id: true, name: true, examDate: true } },
      },
      orderBy: { examType: { examDate: "desc" } },
    });
  }
}

export const gradeService = new GradeService();
