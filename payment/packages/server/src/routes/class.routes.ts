import { Router } from "express";
import { classController } from "../controllers/class.controller";
import { authMiddleware, rbacMiddleware } from "../middleware/auth";
import { Role } from "@sms/shared";

export const classRouter = Router();

classRouter.use(authMiddleware);
classRouter.get("/", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => classController.list(req, res, next));
classRouter.get("/all", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => classController.getAll(req, res, next));
classRouter.get("/:id", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => classController.getById(req, res, next));
classRouter.post("/", rbacMiddleware(Role.ADMIN), (req, res, next) => classController.create(req, res, next));
classRouter.put("/:id", rbacMiddleware(Role.ADMIN), (req, res, next) => classController.update(req, res, next));
classRouter.put("/:id/homeroom-teacher", rbacMiddleware(Role.ADMIN), (req, res, next) => classController.setHomeroomTeacher(req, res, next));
classRouter.get("/:id/students", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => classController.getStudents(req, res, next));
classRouter.post("/transfer", rbacMiddleware(Role.ADMIN), (req, res, next) => classController.transferStudent(req, res, next));
