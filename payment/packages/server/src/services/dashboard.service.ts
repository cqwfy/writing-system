import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class DashboardService {
  async getStats() {
    const [studentCount, teacherCount, classCount, courseCount, recentGrades] = await Promise.all([
      prisma.student.count({ where: { deletedAt: null } }),
      prisma.teacher.count(),
      prisma.class.count(),
      prisma.course.count(),
      prisma.grade.findMany({
        where: { student: { deletedAt: null }, isPublished: true },
        include: {
          student: { select: { name: true } },
          course: { select: { name: true } },
          examType: { select: { name: true } },
        },
        orderBy: { id: "desc" },
        take: 10,
      }),
    ]);

    // 最近考试统计
    const recentExams = await prisma.examType.findMany({
      orderBy: { id: "desc" },
      take: 5,
    });

    // 按年级统计学生数
    const classes = await prisma.class.findMany({
      include: { students: { where: { deletedAt: null }, select: { id: true } } },
    });
    const gradeMap = new Map<string, number>();
    for (const c of classes) {
      const count = gradeMap.get(c.gradeLevel) || 0;
      gradeMap.set(c.gradeLevel, count + c.students.length);
    }
    const gradeStats = Array.from(gradeMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([gradeLevel, count]) => ({ gradeLevel, count }));

    return {
      studentCount,
      teacherCount,
      classCount,
      courseCount,
      recentGrades: recentGrades.map((g) => ({
        id: g.id,
        studentName: g.student.name,
        courseName: g.course.name,
        examName: g.examType.name,
        score: g.score,
      })),
      recentExams: recentExams.map((e) => ({
        id: e.id,
        name: e.name,
        academicYear: e.academicYear,
        semester: e.semester,
        examDate: e.examDate,
      })),
      gradeStats,
    };
  }
}

export const dashboardService = new DashboardService();
