import { Request, Response, NextFunction } from "express";
import { studentService } from "../services/student.service";
import { createStudentSchema, updateStudentSchema } from "@sms/shared";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export class StudentController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, pageSize, keyword, classId, gradeLevel, status } = req.query;
      const result = await studentService.list({
        page: page ? parseInt(page as string) : 1,
        pageSize: pageSize ? parseInt(pageSize as string) : 20,
        keyword: keyword as string,
        classId: classId ? parseInt(classId as string) : undefined,
        gradeLevel: gradeLevel as string,
        status: status as string,
        userRole: req.user?.role,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const result = await studentService.getById(id, req.user?.role);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createStudentSchema.parse(req.body);
      const result = await studentService.create(data);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const data = updateStudentSchema.parse(req.body);
      const result = await studentService.update(id, data);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await studentService.delete(id);
      res.json({ success: true, message: "删除成功" });
    } catch (err) {
      next(err);
    }
  }

  async importExcel(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: "请上传 Excel 文件" });
        return;
      }
      const result = await studentService.importExcel(req.file.buffer);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async uploadPhoto(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: "请上传照片" });
        return;
      }
      const id = parseInt(req.params.id);
      const photoUrl = await studentService.uploadPhoto(id, req.file.buffer);
      res.json({ success: true, data: { photoUrl } });
    } catch (err) {
      next(err);
    }
  }

  async exportExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const { classId, gradeLevel, status } = req.query;
      const buffer = await studentService.exportExcel({
        classId: classId ? parseInt(classId as string) : undefined,
        gradeLevel: gradeLevel as string,
        status: status as string,
      });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=students.xlsx");
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  }

  // Multer 中间件
  uploadSingle = upload.single("file");
}

export const studentController = new StudentController();
