import { Router } from "express";
import { courseController } from "../controllers/course.controller";
import { authMiddleware, rbacMiddleware } from "../middleware/auth";
import { Role } from "@sms/shared";

export const courseRouter = Router();

courseRouter.use(authMiddleware);
courseRouter.get("/", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => courseController.list(req, res, next));
courseRouter.get("/all", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => courseController.getAll(req, res, next));
courseRouter.get("/:id", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => courseController.getById(req, res, next));
courseRouter.post("/", rbacMiddleware(Role.ADMIN), (req, res, next) => courseController.create(req, res, next));
courseRouter.put("/:id", rbacMiddleware(Role.ADMIN), (req, res, next) => courseController.update(req, res, next));
courseRouter.delete("/:id", rbacMiddleware(Role.ADMIN), (req, res, next) => courseController.delete(req, res, next));
