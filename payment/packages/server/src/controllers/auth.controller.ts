import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { loginSchema, wechatLoginSchema, bindUserSchema } from "@sms/shared";

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const result = await authService.loginByPassword(username, password);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async wechatLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = wechatLoginSchema.parse(req.body);
      const result = await authService.loginByWechat(code);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async bindUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { tempToken, bindType, bindValue } = bindUserSchema.parse(req.body);
      const result = await authService.bindWechatUser(tempToken, bindType, bindValue);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({ success: false, error: "缺少 refreshToken" });
        return;
      }
      const result = await authService.refreshToken(refreshToken);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: "未登录" });
        return;
      }
      const result = await authService.getCurrentUser(req.user.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
