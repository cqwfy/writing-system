import { Router } from "express";
import { rewardController } from "../controllers/reward.controller";
import { authMiddleware, rbacMiddleware } from "../middleware/auth";
import { Role } from "@sms/shared";

export const rewardRouter = Router();

rewardRouter.use(authMiddleware);
rewardRouter.get("/", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => rewardController.list(req, res, next));
rewardRouter.get("/student/:studentId", (req, res, next) => rewardController.getByStudent(req, res, next));
rewardRouter.post("/", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => rewardController.create(req, res, next));
rewardRouter.delete("/:id", rbacMiddleware(Role.ADMIN), (req, res, next) => rewardController.delete(req, res, next));
