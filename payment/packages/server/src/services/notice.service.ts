import { PrismaClient, Prisma } from "@prisma/client";
import { AppError } from "../middleware/error-handler";

const prisma = new PrismaClient();

export class NoticeService {
  async list(params: { page?: number; pageSize?: number; category?: string; targetType?: string; role?: string; studentId?: number; classId?: number; gradeLevel?: string }) {
    const { page = 1, pageSize = 20, category, role, studentId, classId, gradeLevel } = params;
    const where: Prisma.NoticeWhereInput = { isPublished: true };

    if (category) where.category = category;

    // 按角色和目标过滤可见通知
    if (role === "student" || role === "parent") {
      where.OR = [
        { targetType: "all" },
        { targetType: "grade", targetId: gradeLevel ? parseInt(gradeLevel) : undefined },
        { targetType: "class", targetId: classId },
        { targetType: "specific", targetId: studentId },
      ].filter((c) => !role || c.targetType !== "grade" || c.targetId);
    }

    const [data, total] = await Promise.all([
      prisma.notice.findMany({
        where,
        include: { publisher: { select: { id: true, name: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      }),
      prisma.notice.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getById(id: number) {
    const notice = await prisma.notice.findUnique({
      where: { id },
      include: { publisher: { select: { id: true, name: true } } },
    });
    if (!notice) throw new AppError(404, "通知不存在");
    return notice;
  }

  async create(data: { title: string; content: string; category: string; targetType: string; targetId?: number }, publisherId: number) {
    return prisma.notice.create({
      data: { ...data, publisherId },
    });
  }

  async update(id: number, data: any) {
    return prisma.notice.update({ where: { id }, data });
  }

  async publish(id: number) {
    return prisma.notice.update({
      where: { id },
      data: { isPublished: true, publishedAt: new Date() },
    });
  }

  async delete(id: number) {
    return prisma.notice.delete({ where: { id } });
  }
}

export const noticeService = new NoticeService();
