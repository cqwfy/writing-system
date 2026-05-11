import { PrismaClient, Prisma } from "@prisma/client";
import { AppError } from "../middleware/error-handler";

const prisma = new PrismaClient();

export class CourseService {
  async list(params: { page?: number; pageSize?: number; gradeLevel?: string; semester?: string }) {
    const { page = 1, pageSize = 20, gradeLevel, semester } = params;
    const where: Prisma.CourseWhereInput = {};
    if (gradeLevel) where.gradeLevel = gradeLevel;
    if (semester) where.semester = semester;

    const [data, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: { teacher: { select: { id: true, name: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { code: "asc" },
      }),
      prisma.course.count({ where }),
    ]);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getAll() {
    return prisma.course.findMany({
      include: { teacher: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    });
  }

  async getById(id: number) {
    const course = await prisma.course.findUnique({
      where: { id },
      include: { teacher: { select: { id: true, name: true } } },
    });
    if (!course) throw new AppError(404, "课程不存在");
    return course;
  }

  async create(data: { name: string; code: string; gradeLevel: string; teacherId?: number; weeklyHours?: number; semester: string; academicYear: string }) {
    return prisma.course.create({ data });
  }

  async update(id: number, data: any) {
    return prisma.course.update({ where: { id }, data });
  }

  async delete(id: number) {
    return prisma.course.update({ where: { id }, data: { status: "inactive" } });
  }
}

export const courseService = new CourseService();
