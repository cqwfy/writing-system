import { PrismaClient } from "@prisma/client";
import { AppError } from "../middleware/error-handler";

const prisma = new PrismaClient();

export class RewardService {
  async list(params: { page?: number; pageSize?: number; studentId?: number; type?: string }) {
    const { page = 1, pageSize = 20, studentId, type } = params;
    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (type) where.type = type;

    const [data, total] = await Promise.all([
      prisma.rewardPunishment.findMany({
        where,
        include: { student: { select: { id: true, studentNo: true, name: true, class: { select: { name: true } } } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { recordDate: "desc" },
      }),
      prisma.rewardPunishment.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getByStudent(studentId: number) {
    return prisma.rewardPunishment.findMany({
      where: { studentId },
      orderBy: { recordDate: "desc" },
    });
  }

  async create(data: { studentId: number; type: string; category: string; description: string; recordDate: string }, userId: number) {
    return prisma.rewardPunishment.create({
      data: { ...data, recordDate: new Date(data.recordDate), recordedBy: userId },
    });
  }

  async delete(id: number) {
    return prisma.rewardPunishment.delete({ where: { id } });
  }
}

export const rewardService = new RewardService();
