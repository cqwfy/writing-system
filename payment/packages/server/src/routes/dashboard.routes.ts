import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller";
import { authMiddleware, rbacMiddleware } from "../middleware/auth";
import { Role } from "@sms/shared";

export const dashboardRouter = Router();

dashboardRouter.use(authMiddleware);
dashboardRouter.get("/stats", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => dashboardController.getStats(req, res, next));
