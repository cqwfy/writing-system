import { Request, Response, NextFunction } from "express";
import { dormitoryService } from "../services/dormitory.service";
import { createBuildingSchema, createRoomSchema } from "@sms/shared";

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
      const { studentId } = req.body;
      await dormitoryService.assignStudent(roomId, studentId);
      res.json({ success: true, message: "分配成功" });
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
      const { studentId } = req.body;
      await dormitoryService.removeStudent(roomId, studentId);
      res.json({ success: true, message: "移除成功" });
    } catch (err) { next(err); }
  }
}

export const dormitoryController = new DormitoryController();
