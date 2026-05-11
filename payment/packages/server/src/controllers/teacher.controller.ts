import { Request, Response, NextFunction } from "express";
import { teacherService } from "../services/teacher.service";

export class TeacherController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, pageSize, keyword } = req.query;
      const result = await teacherService.list({
        page: page ? parseInt(page as string) : 1,
        pageSize: pageSize ? parseInt(pageSize as string) : 20,
        keyword: keyword as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await teacherService.getAll();
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const result = await teacherService.getById(id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await teacherService.create(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const result = await teacherService.update(id, req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await teacherService.delete(id);
      res.json({ success: true, message: "删除成功" });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const result = await teacherService.resetPassword(id);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}

export const teacherController = new TeacherController();
