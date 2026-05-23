import { Request, Response, NextFunction } from "express";
import { classService } from "../services/class.service";
import { createClassSchema, updateClassSchema } from "@sms/shared";

export class ClassController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, pageSize, gradeLevel, academicYear } = req.query;
      const result = await classService.list({
        page: page ? parseInt(page as string) : 1,
        pageSize: pageSize ? parseInt(pageSize as string) : 20,
        gradeLevel: gradeLevel as string,
        academicYear: academicYear as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await classService.getAll();
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const result = await classService.getById(id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createClassSchema.parse(req.body);
      const result = await classService.create(data);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const data = updateClassSchema.parse(req.body);
      const result = await classService.update(id, data);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async setHomeroomTeacher(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const { teacherId } = req.body;
      const result = await classService.setHomeroomTeacher(id, teacherId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const result = await classService.getStudents(id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async transferStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId, fromClassId, toClassId } = req.body;
      await classService.transferStudent(studentId, fromClassId, toClassId);
      res.json({ success: true, message: "转班成功" });
    } catch (err) {
      next(err);
    }
  }

  async promoteGrades(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await classService.promoteGrades();
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const classController = new ClassController();
