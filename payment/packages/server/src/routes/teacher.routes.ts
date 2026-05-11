import { Router } from "express";
import { teacherController } from "../controllers/teacher.controller";
import { authMiddleware, rbacMiddleware } from "../middleware/auth";
import { Role } from "@sms/shared";

export const teacherRouter = Router();

teacherRouter.use(authMiddleware);
teacherRouter.get("/all", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => teacherController.getAll(req, res, next));
teacherRouter.get("/", rbacMiddleware(Role.ADMIN), (req, res, next) => teacherController.list(req, res, next));
teacherRouter.post("/", rbacMiddleware(Role.ADMIN), (req, res, next) => teacherController.create(req, res, next));
teacherRouter.get("/:id", rbacMiddleware(Role.ADMIN), (req, res, next) => teacherController.getById(req, res, next));
teacherRouter.put("/:id", rbacMiddleware(Role.ADMIN), (req, res, next) => teacherController.update(req, res, next));
teacherRouter.delete("/:id", rbacMiddleware(Role.ADMIN), (req, res, next) => teacherController.delete(req, res, next));
teacherRouter.post("/:id/reset-password", rbacMiddleware(Role.ADMIN), (req, res, next) => teacherController.resetPassword(req, res, next));
