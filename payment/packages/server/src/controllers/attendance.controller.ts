import { Request, Response, NextFunction } from "express";
import { attendanceService } from "../services/attendance.service";
import { batchAttendanceSchema, createLeaveRequestSchema } from "@sms/shared";

export class AttendanceController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, pageSize, classId, recordDate } = req.query;
      const result = await attendanceService.list({
        page: page ? parseInt(page as string) : 1,
        pageSize: pageSize ? parseInt(pageSize as string) : 20,
        classId: classId ? parseInt(classId as string) : undefined,
        recordDate: recordDate as string,
      });
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async batchCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = batchAttendanceSchema.parse(req.body);
      const teacherId = req.user?.teacherId || req.user?.id || 0;
      const result = await attendanceService.batchCreate(data, teacherId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { classId, startDate, endDate } = req.query;
      const result = await attendanceService.getStats({
        classId: classId ? parseInt(classId as string) : undefined,
        startDate: startDate as string,
        endDate: endDate as string,
      });
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async getMyAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user?.studentId;
      if (!studentId) {
        res.status(400).json({ success: false, error: "无法获取学生信息" });
        return;
      }
      const { page, pageSize } = req.query;
      const result = await attendanceService.getMyAttendance(studentId, {
        page: page ? parseInt(page as string) : 1,
        pageSize: pageSize ? parseInt(pageSize as string) : 20,
      });
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async createLeaveRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createLeaveRequestSchema.parse(req.body);
      const result = await attendanceService.createLeaveRequest(data);
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async getMyLeaveRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user?.studentId;
      if (!studentId) {
        res.status(400).json({ success: false, error: "无法获取学生信息" });
        return;
      }
      const result = await attendanceService.getMyLeaveRequests(studentId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async listLeaveRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, pageSize, classId, status } = req.query;
      const result = await attendanceService.listLeaveRequests({
        page: page ? parseInt(page as string) : 1,
        pageSize: pageSize ? parseInt(pageSize as string) : 20,
        classId: classId ? parseInt(classId as string) : undefined,
        status: status as string,
      });
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async approveLeave(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const { status, remark } = req.body;
      const approverId = req.user?.id || 0;
      const result = await attendanceService.approveLeave(id, status, approverId, remark);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }
}

export const attendanceController = new AttendanceController();
