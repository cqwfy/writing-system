import { Router } from "express";
import { studentController } from "../controllers/student.controller";
import { authMiddleware, rbacMiddleware } from "../middleware/auth";
import { Role } from "@sms/shared";

export const studentRouter = Router();

// 所有路由需要登录
studentRouter.use(authMiddleware);

// 管理员可写，教师只读
studentRouter.get("/", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => studentController.list(req, res, next));
studentRouter.get("/export", rbacMiddleware(Role.ADMIN), (req, res, next) => studentController.exportExcel(req, res, next));
studentRouter.get("/:id", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => studentController.getById(req, res, next));
studentRouter.post("/", rbacMiddleware(Role.ADMIN), (req, res, next) => studentController.create(req, res, next));
studentRouter.put("/:id", rbacMiddleware(Role.ADMIN), (req, res, next) => studentController.update(req, res, next));
studentRouter.delete("/:id", rbacMiddleware(Role.ADMIN), (req, res, next) => studentController.delete(req, res, next));

// 文件上传
studentRouter.post(
  "/import",
  rbacMiddleware(Role.ADMIN),
  studentController.uploadSingle,
  (req, res, next) => studentController.importExcel(req, res, next)
);

studentRouter.post(
  "/:id/photo",
  rbacMiddleware(Role.ADMIN),
  studentController.uploadSingle,
  (req, res, next) => studentController.uploadPhoto(req, res, next)
);
