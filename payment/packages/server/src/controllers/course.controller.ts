import { Request, Response, NextFunction } from "express";
import { courseService } from "../services/course.service";
import { createCourseSchema } from "@sms/shared";

export class CourseController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, pageSize, gradeLevel, semester } = req.query;
      const result = await courseService.list({
        page: page ? parseInt(page as string) : 1,
        pageSize: pageSize ? parseInt(pageSize as string) : 20,
        gradeLevel: gradeLevel as string,
        semester: semester as string,
      });
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await courseService.getAll();
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const result = await courseService.getById(id);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createCourseSchema.parse(req.body);
      const result = await courseService.create(data);
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const result = await courseService.update(id, req.body);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await courseService.delete(id);
      res.json({ success: true, message: "删除成功" });
    } catch (err) { next(err); }
  }
}

export const courseController = new CourseController();
