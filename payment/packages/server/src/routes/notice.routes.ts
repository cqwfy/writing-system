import { Router } from "express";
import { noticeController } from "../controllers/notice.controller";
import { authMiddleware, rbacMiddleware } from "../middleware/auth";
import { Role } from "@sms/shared";

export const noticeRouter = Router();

noticeRouter.use(authMiddleware);
noticeRouter.get("/", (req, res, next) => noticeController.list(req, res, next));
noticeRouter.get("/:id", (req, res, next) => noticeController.getById(req, res, next));
noticeRouter.post("/", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => noticeController.create(req, res, next));
noticeRouter.put("/:id", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => noticeController.update(req, res, next));
noticeRouter.post("/:id/publish", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => noticeController.publish(req, res, next));
noticeRouter.delete("/:id", rbacMiddleware(Role.ADMIN), (req, res, next) => noticeController.delete(req, res, next));
