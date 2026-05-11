import { Router } from "express";
import { gradeController } from "../controllers/grade.controller";
import { authMiddleware, rbacMiddleware, ownershipMiddleware } from "../middleware/auth";
import { Role } from "@sms/shared";

export const gradeRouter = Router();

gradeRouter.use(authMiddleware);

// 考试管理
gradeRouter.get("/exams", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => gradeController.listExams(req, res, next));
gradeRouter.post("/exams", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => gradeController.createExam(req, res, next));

// 成绩管理
gradeRouter.get("/", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => gradeController.list(req, res, next));
gradeRouter.post("/batch", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => gradeController.batchCreate(req, res, next));
gradeRouter.post("/publish/:examId", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => gradeController.publish(req, res, next));
gradeRouter.get("/stats/:examId", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => gradeController.getStats(req, res, next));

// 学生/家长端
gradeRouter.get("/my", (req, res, next) => gradeController.getMyGrades(req, res, next));
