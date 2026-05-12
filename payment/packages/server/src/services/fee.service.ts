import { PrismaClient } from "@prisma/client";
import { AppError } from "../middleware/error-handler";

const prisma = new PrismaClient();

export class FeeService {
  async listItems(params: { gradeLevel?: string; semester?: string }) {
    return prisma.feeItem.findMany({
      where: { gradeLevel: params.gradeLevel, semester: params.semester },
      orderBy: { createdAt: "desc" },
    });
  }

  async createItem(data: { name: string; amount: number; feeType: string; gradeLevel?: string; semester: string; academicYear: string; dueDate?: string; description?: string }) {
    return prisma.feeItem.create({
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });
  }

  async listPayments(params: { studentId?: number; classId?: number; status?: string; page?: number; pageSize?: number }) {
    const { page = 1, pageSize = 20, studentId, classId, status } = params;
    const where: any = { student: { deletedAt: null } };
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;
    if (classId) {
      const studentIds = await prisma.student.findMany({ where: { classId, deletedAt: null }, select: { id: true } });
      where.studentId = { in: studentIds.map((s) => s.id) };
    }

    const [data, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          student: { select: { id: true, studentNo: true, name: true, class: { select: { name: true } } } },
          feeItem: { select: { id: true, name: true, amount: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.payment.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getMyPayments(studentId: number) {
    return prisma.payment.findMany({
      where: { studentId },
      include: { feeItem: { select: { id: true, name: true, amount: true, dueDate: true, feeType: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async markAsPaid(paymentId: number, transactionId: string) {
    return prisma.payment.update({
      where: { id: paymentId },
      data: { status: "paid", transactionId, paidAt: new Date(), paidAmount: undefined },
    });
  }

  async generatePayments(feeItemId: number) {
    const feeItem = await prisma.feeItem.findUnique({ where: { id: feeItemId } });
    if (!feeItem) throw new AppError(404, "费用项目不存在");

    const where: any = { status: "active", deletedAt: null };
    if (feeItem.gradeLevel) where.class = { gradeLevel: feeItem.gradeLevel };

    const students = await prisma.student.findMany({ where, select: { id: true } });

    const results = [];
    for (const student of students) {
      const existing = await prisma.payment.findFirst({
        where: { studentId: student.id, feeItemId },
      });
      if (!existing) {
        const payment = await prisma.payment.create({
          data: { studentId: student.id, feeItemId, amount: feeItem.amount },
        });
        results.push(payment);
      }
    }

    return { generated: results.length, total: students.length };
  }
}

export const feeService = new FeeService();
