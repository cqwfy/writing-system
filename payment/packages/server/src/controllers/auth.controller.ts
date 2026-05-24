import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { loginSchema, wechatLoginSchema, bindUserSchema, mobileLoginSchema } from "@sms/shared";
import { z } from "zod";

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "请输入旧密码"),
  newPassword: z.string().min(6, "新密码至少 6 位").max(50),
});

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

  async mobileLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { loginId, password } = mobileLoginSchema.parse(req.body);
      const result = await authService.loginByMobile(loginId, password);
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

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: "未登录" });
        return;
      }
      const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);
      await authService.changePassword(req.user.id, oldPassword, newPassword);
      res.json({ success: true, message: "密码修改成功" });
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
