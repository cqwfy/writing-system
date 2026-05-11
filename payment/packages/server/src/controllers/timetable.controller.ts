import { Request, Response, NextFunction } from "express";
import { timetableService } from "../services/timetable.service";

export class TimetableController {
  async getByClass(req: Request, res: Response, next: NextFunction) {
    try {
      const classId = parseInt(req.params.classId);
      const { semester = "first", academicYear = "2026-2027" } = req.query;
      const result = await timetableService.getByClass(classId, semester as string, academicYear as string);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async getByTeacher(req: Request, res: Response, next: NextFunction) {
    try {
      const teacherId = parseInt(req.params.teacherId);
      const { semester = "first", academicYear = "2026-2027" } = req.query;
      const result = await timetableService.getByTeacher(teacherId, semester as string, academicYear as string);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async batchSet(req: Request, res: Response, next: NextFunction) {
    try {
      const { entries } = req.body;
      const result = await timetableService.batchSet(entries);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const result = await timetableService.update(id, req.body);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await timetableService.delete(id);
      res.json({ success: true, message: "删除成功" });
    } catch (err) { next(err); }
  }
}

export const timetableController = new TimetableController();
