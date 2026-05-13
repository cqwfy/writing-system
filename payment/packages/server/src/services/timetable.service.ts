import { PrismaClient } from "@prisma/client";
import { AppError } from "../middleware/error-handler";

const prisma = new PrismaClient();

export class TimetableService {
  async getByClass(classId: number, semester: string, academicYear: string) {
    return prisma.timetable.findMany({
      where: { classId, semester, academicYear },
      include: {
        course: { select: { id: true, name: true, code: true, teacher: { select: { id: true, name: true } } } },
        class: { select: { id: true, name: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
    });
  }

  async getByTeacher(teacherId: number, semester: string, academicYear: string) {
    const courses = await prisma.course.findMany({
      where: { teacherId },
      select: { id: true },
    });
    const courseIds = courses.map((c) => c.id);

    return prisma.timetable.findMany({
      where: { courseId: { in: courseIds }, semester, academicYear },
      include: {
        course: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
    });
  }

  async batchSet(entries: {
    classId: number; courseId: number; dayOfWeek: number; period: number;
    classroom?: string; semester: string; academicYear: string;
  }[]) {
    const results = [];
    for (const entry of entries) {
      const existing = await prisma.timetable.findFirst({
        where: {
          classId: entry.classId,
          dayOfWeek: entry.dayOfWeek,
          period: entry.period,
          semester: entry.semester,
          academicYear: entry.academicYear,
        },
      });

      if (existing) {
        // 更新已有课表
        const updated = await prisma.timetable.update({
          where: { id: existing.id },
          data: { courseId: entry.courseId, classroom: entry.classroom },
        });
        results.push(updated);
      } else {
        const created = await prisma.timetable.create({ data: entry as any });
        results.push(created);
      }
    }
    return results;
  }

  async update(id: number, data: { courseId?: number; classroom?: string; dayOfWeek?: number; period?: number }) {
    const entry = await prisma.timetable.findUnique({ where: { id } });
    if (!entry) throw new AppError(404, "课表记录不存在");
    return prisma.timetable.update({ where: { id }, data });
  }

  async delete(id: number) {
    return prisma.timetable.delete({ where: { id } });
  }
}

export const timetableService = new TimetableService();
