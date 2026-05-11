import { Request, Response, NextFunction } from "express";
import { feeService } from "../services/fee.service";
import { createFeeItemSchema } from "@sms/shared";

export class FeeController {
  async listItems(req: Request, res: Response, next: NextFunction) {
    try {
      const { gradeLevel, semester } = req.query;
      const result = await feeService.listItems({ gradeLevel: gradeLevel as string, semester: semester as string });
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async createItem(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createFeeItemSchema.parse(req.body);
      const result = await feeService.createItem(data);
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async listPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, pageSize, studentId, classId, status } = req.query;
      const result = await feeService.listPayments({
        page: page ? parseInt(page as string) : 1,
        pageSize: pageSize ? parseInt(pageSize as string) : 20,
        studentId: studentId ? parseInt(studentId as string) : undefined,
        classId: classId ? parseInt(classId as string) : undefined,
        status: status as string,
      });
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async getMyPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user?.studentId;
      if (!studentId) {
        res.status(400).json({ success: false, error: "无法获取学生信息" });
        return;
      }
      const result = await feeService.getMyPayments(studentId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async generatePayments(req: Request, res: Response, next: NextFunction) {
    try {
      const feeItemId = parseInt(req.params.feeItemId);
      const result = await feeService.generatePayments(feeItemId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async markAsPaid(req: Request, res: Response, next: NextFunction) {
    try {
      const paymentId = parseInt(req.params.paymentId);
      const { transactionId } = req.body;
      const result = await feeService.markAsPaid(paymentId, transactionId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }
}

export const feeController = new FeeController();
