import { PrismaClient, Prisma } from "@prisma/client";
import { AppError } from "../middleware/error-handler";

const prisma = new PrismaClient();

export class AttendanceService {
  /**
   * 查询考勤记录
   */
  async list(params: { page?: number; pageSize?: number; classId?: number; recordDate?: string }) {
    const { page = 1, pageSize = 20, classId, recordDate } = params;
    const where: Prisma.AttendanceWhereInput = {};

    if (classId) {
      const studentIds = await prisma.student.findMany({
        where: { classId, deletedAt: null },
        select: { id: true },
      });
      where.studentId = { in: studentIds.map((s) => s.id) };
    }
    if (recordDate) {
      where.recordDate = new Date(recordDate);
    }

    const [data, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: { student: { select: { id: true, studentNo: true, name: true, class: { select: { name: true } } } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ recordDate: "desc" }, { student: { studentNo: "asc" } }],
      }),
      prisma.attendance.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  /**
   * 批量标记考勤
   */
  async batchCreate(data: {
    recordDate: string;
    period: string;
    records: { studentId: number; status: string; remark?: string }[];
  }, teacherId: number) {
    const results = [];
    for (const record of data.records) {
      const existing = await prisma.attendance.findFirst({
        where: {
          studentId: record.studentId,
          recordDate: new Date(data.recordDate),
          period: data.period,
        },
      });

      if (existing) {
        const updated = await prisma.attendance.update({
          where: { id: existing.id },
          data: { status: record.status, remark: record.remark, recordedBy: teacherId },
        });
        results.push(updated);
      } else {
        const created = await prisma.attendance.create({
          data: {
            studentId: record.studentId,
            recordDate: new Date(data.recordDate),
            period: data.period,
            status: record.status,
            remark: record.remark,
            recordedBy: teacherId,
          },
        });
        results.push(created);
      }
    }
    return results;
  }

  /**
   * 考勤统计
   */
  async getStats(params: { classId?: number; startDate?: string; endDate?: string }) {
    const where: Prisma.AttendanceWhereInput = {};

    if (params.classId) {
      const studentIds = await prisma.student.findMany({
        where: { classId: params.classId, deletedAt: null },
        select: { id: true },
      });
      where.studentId = { in: studentIds.map((s) => s.id) };
    }
    if (params.startDate || params.endDate) {
      where.recordDate = {};
      if (params.startDate) where.recordDate.gte = new Date(params.startDate);
      if (params.endDate) where.recordDate.lte = new Date(params.endDate);
    }

    const records = await prisma.attendance.findMany({ where });

    const total = records.length;
    const stats = {
      total,
      present: records.filter((r) => r.status === "present").length,
      absent: records.filter((r) => r.status === "absent").length,
      late: records.filter((r) => r.status === "late").length,
      earlyLeave: records.filter((r) => r.status === "early_leave").length,
      sickLeave: records.filter((r) => r.status === "sick_leave").length,
      personalLeave: records.filter((r) => r.status === "personal_leave").length,
      attendanceRate: total > 0 ? (records.filter((r) => r.status === "present" || r.status === "late").length / total * 100).toFixed(1) : "0",
    };

    return stats;
  }

  /**
   * 请假申请（学生/家长端）
   */
  async createLeaveRequest(data: { studentId: number; startDate: string; endDate: string; leaveType: string; reason: string }) {
    return prisma.leaveRequest.create({
      data: {
        studentId: data.studentId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        leaveType: data.leaveType,
        reason: data.reason,
      },
    });
  }

  /**
   * 请假列表
   */
  async listLeaveRequests(params: { page?: number; pageSize?: number; classId?: number; status?: string }) {
    const { page = 1, pageSize = 20, classId, status } = params;
    const where: Prisma.LeaveRequestWhereInput = {};
    if (classId) {
      const studentIds = await prisma.student.findMany({ where: { classId, deletedAt: null }, select: { id: true } });
      where.studentId = { in: studentIds.map((s) => s.id) };
    }
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        include: { student: { select: { id: true, studentNo: true, name: true, class: { select: { name: true } } } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  /**
   * 审批请假
   */
  async approveLeave(id: number, status: string, approverId: number, remark?: string) {
    return prisma.leaveRequest.update({
      where: { id },
      data: { status, approvedBy: approverId, approvalRemark: remark },
    });
  }
}

export const attendanceService = new AttendanceService();
