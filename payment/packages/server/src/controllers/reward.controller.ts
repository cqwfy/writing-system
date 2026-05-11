import { Request, Response, NextFunction } from "express";
import { rewardService } from "../services/reward.service";
import { createRewardPunishmentSchema } from "@sms/shared";

export class RewardController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, pageSize, studentId, type } = req.query;
      const result = await rewardService.list({
        page: page ? parseInt(page as string) : 1,
        pageSize: pageSize ? parseInt(pageSize as string) : 20,
        studentId: studentId ? parseInt(studentId as string) : undefined,
        type: type as string,
      });
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async getByStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = parseInt(req.params.studentId);
      const result = await rewardService.getByStudent(studentId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createRewardPunishmentSchema.parse(req.body);
      const result = await rewardService.create(data, req.user!.id);
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await rewardService.delete(parseInt(req.params.id));
      res.json({ success: true, message: "删除成功" });
    } catch (err) { next(err); }
  }
}

export const rewardController = new RewardController();
