import { Request, Response, NextFunction } from "express";
import { gradeService } from "../services/grade.service";
import { createExamSchema, batchGradeSchema } from "@sms/shared";

export class GradeController {
  async listExams(req: Request, res: Response, next: NextFunction) {
    try {
      const { semester, academicYear } = req.query;
      const result = await gradeService.listExams({ semester: semester as string, academicYear: academicYear as string });
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async createExam(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createExamSchema.parse(req.body);
      const result = await gradeService.createExam(data);
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async deleteExam(req: Request, res: Response, next: NextFunction) {
    try {
      await gradeService.deleteExam(parseInt(req.params.id));
      res.json({ success: true, message: "删除成功" });
    } catch (err) { next(err); }
  }

  async batchCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = batchGradeSchema.parse(req.body);
      const teacherId = req.user?.teacherId || req.user?.id || 0;
      const result = await gradeService.batchCreateGrades(data, teacherId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { examTypeId, courseId, classId, page, pageSize } = req.query;
      const result = await gradeService.listGrades({
        examTypeId: parseInt(examTypeId as string),
        courseId: courseId ? parseInt(courseId as string) : undefined,
        classId: classId ? parseInt(classId as string) : undefined,
        page: page ? parseInt(page as string) : 1,
        pageSize: pageSize ? parseInt(pageSize as string) : 50,
      });
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const examId = parseInt(req.params.examId);
      // 先算排名再发布
      await gradeService.calculateRanks(examId);
      await gradeService.publishGrades(examId);
      res.json({ success: true, message: "成绩发布成功" });
    } catch (err) { next(err); }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const examId = parseInt(req.params.examId);
      const { courseId } = req.query;
      const result = await gradeService.getStats(examId, courseId ? parseInt(courseId as string) : undefined);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async getMyGrades(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user?.studentId;
      if (!studentId) {
        res.status(400).json({ success: false, error: "无法获取学生信息" });
        return;
      }
      const { examTypeId } = req.query;
      const result = await gradeService.getMyGrades(studentId, examTypeId ? parseInt(examTypeId as string) : undefined);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }
}

export const gradeController = new GradeController();
