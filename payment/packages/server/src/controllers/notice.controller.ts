import { Request, Response, NextFunction } from "express";
import { noticeService } from "../services/notice.service";
import { createNoticeSchema } from "@sms/shared";

export class NoticeController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, pageSize, category } = req.query;
      const user = req.user;
      const result = await noticeService.list({
        page: page ? parseInt(page as string) : 1,
        pageSize: pageSize ? parseInt(pageSize as string) : 20,
        category: category as string,
        role: user?.role,
        studentId: user?.studentId,
        classId: undefined,
        gradeLevel: undefined,
      });
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await noticeService.getById(parseInt(req.params.id));
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createNoticeSchema.parse(req.body);
      const result = await noticeService.create(data, req.user!.id);
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await noticeService.update(parseInt(req.params.id), req.body);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await noticeService.publish(parseInt(req.params.id));
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await noticeService.delete(parseInt(req.params.id));
      res.json({ success: true, message: "删除成功" });
    } catch (err) { next(err); }
  }
}

export const noticeController = new NoticeController();
