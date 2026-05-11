import { Router } from "express";
import { attendanceController } from "../controllers/attendance.controller";
import { authMiddleware, rbacMiddleware } from "../middleware/auth";
import { Role } from "@sms/shared";

export const attendanceRouter = Router();

attendanceRouter.use(authMiddleware);

attendanceRouter.get("/", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => attendanceController.list(req, res, next));
attendanceRouter.post("/batch", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => attendanceController.batchCreate(req, res, next));
attendanceRouter.get("/stats", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => attendanceController.getStats(req, res, next));

// 请假相关
attendanceRouter.get("/leave-requests", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => attendanceController.listLeaveRequests(req, res, next));
attendanceRouter.post("/leave-requests", (req, res, next) => attendanceController.createLeaveRequest(req, res, next));
attendanceRouter.put("/leave-requests/:id/approve", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => attendanceController.approveLeave(req, res, next));
