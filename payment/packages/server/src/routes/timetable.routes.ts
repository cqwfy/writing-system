import { Router } from "express";
import { timetableController } from "../controllers/timetable.controller";
import { authMiddleware, rbacMiddleware } from "../middleware/auth";
import { Role } from "@sms/shared";

export const timetableRouter = Router();

timetableRouter.use(authMiddleware);
timetableRouter.get("/class/:classId", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => timetableController.getByClass(req, res, next));
timetableRouter.get("/teacher/:teacherId", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => timetableController.getByTeacher(req, res, next));
timetableRouter.post("/batch", rbacMiddleware(Role.ADMIN), (req, res, next) => timetableController.batchSet(req, res, next));
timetableRouter.put("/:id", rbacMiddleware(Role.ADMIN), (req, res, next) => timetableController.update(req, res, next));
timetableRouter.delete("/:id", rbacMiddleware(Role.ADMIN), (req, res, next) => timetableController.delete(req, res, next));
