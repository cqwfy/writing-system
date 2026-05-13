import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { dormitoryService } from "../services/dormitory.service";
import { createBuildingSchema, createRoomSchema } from "@sms/shared";

const assignStudentSchema = z.object({
  studentId: z.coerce.number().int(),
});

const assignStudentsSchema = z.object({
  studentIds: z.array(z.coerce.number().int()).min(1, "至少选择一个学生"),
});

const removeStudentSchema = z.object({
  studentId: z.coerce.number().int(),
});

export class DormitoryController {
  async listBuildings(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await dormitoryService.listBuildings();
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async createBuilding(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createBuildingSchema.parse(req.body);
      const result = await dormitoryService.createBuilding(data);
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async listRooms(req: Request, res: Response, next: NextFunction) {
    try {
      const { buildingId } = req.query;
      const result = await dormitoryService.listRooms(buildingId ? parseInt(buildingId as string) : undefined);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async createRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createRoomSchema.parse(req.body);
      const result = await dormitoryService.createRoom(data);
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async assignStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const roomId = parseInt(req.params.roomId);
      const { studentId } = assignStudentSchema.parse(req.body);
      await dormitoryService.assignStudent(roomId, studentId);
      res.json({ success: true, message: "分配成功" });
    } catch (err) { next(err); }
  }

  async assignStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const roomId = parseInt(req.params.roomId);
      const { studentIds } = assignStudentsSchema.parse(req.body);
      const result = await dormitoryService.assignStudents(roomId, studentIds);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async getMyDormitory(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user?.studentId;
      if (!studentId) {
        res.status(400).json({ success: false, error: "无法获取学生信息" });
        return;
      }
      const result = await dormitoryService.getMyDormitory(studentId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async removeStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const roomId = parseInt(req.params.roomId);
      const { studentId } = removeStudentSchema.parse(req.body);
      await dormitoryService.removeStudent(roomId, studentId);
      res.json({ success: true, message: "移除成功" });
    } catch (err) { next(err); }
  }
}

export const dormitoryController = new DormitoryController();
