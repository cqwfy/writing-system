import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth";

export const authRouter = Router();

// 登录（公开）
authRouter.post("/login", (req, res, next) => authController.login(req, res, next));
authRouter.post("/mobile-login", (req, res, next) => authController.mobileLogin(req, res, next));
authRouter.post("/wechat-login", (req, res, next) => authController.wechatLogin(req, res, next));
authRouter.post("/bind", (req, res, next) => authController.bindUser(req, res, next));
authRouter.post("/refresh", (req, res, next) => authController.refresh(req, res, next));

// 当前用户信息（需登录）
authRouter.get("/me", authMiddleware, (req, res, next) => authController.me(req, res, next));
// 修改密码（需登录）
authRouter.post("/change-password", authMiddleware, (req, res, next) => authController.changePassword(req, res, next));
