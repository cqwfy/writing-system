import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role, ROLE_PERMISSIONS } from "@sms/shared";
import { config } from "../config";
import { AppError } from "./error-handler";

export interface AuthUser {
  id: number;
  role: Role;
  name: string;
  studentId?: number;
  parentId?: number;
  teacherId?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * JWT 认证中间件 - 验证所有需要登录的接口
 */
export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError(401, "未登录，请先登录");
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, config.jwt.secret) as AuthUser;
    req.user = payload;
    next();
  } catch {
    throw new AppError(401, "登录已过期，请重新登录");
  }
}

/**
 * 可选的 JWT 认证 - 不强制登录，但如果带了 token 就解析
 */
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, config.jwt.secret) as AuthUser;
    req.user = payload;
  } catch {
    // 忽略无效 token
  }
  next();
}

/**
 * RBAC 角色权限中间件
 * @param allowedRoles 允许访问的角色列表
 */
export function rbacMiddleware(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, "未登录");
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(403, "无权限访问");
    }

    next();
  };
}

/**
 * 数据所有权中间件 - 学生只能看自己的数据，家长只能看孩子的数据
 */
export function ownershipMiddleware(entityType: "student" | "child") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, "未登录");
    }

    // admin 和 teacher 不受所有权限制
    if (req.user.role === Role.ADMIN || req.user.role === Role.TEACHER) {
      next();
      return;
    }

    // 学生只能访问自己的
    if (req.user.role === Role.STUDENT && entityType === "student") {
      (req as any).ownershipFilter = { studentId: req.user.studentId };
      next();
      return;
    }

    // 家长只能访问孩子的
    if (req.user.role === Role.PARENT) {
      (req as any).ownershipFilter = { parentId: req.user.parentId };
      next();
      return;
    }

    throw new AppError(403, "无权限访问");
  };
}

/**
 * 生成 Access Token
 */
export function generateAccessToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, studentId: user.studentId, parentId: user.parentId, teacherId: user.teacherId },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpires as any }
  );
}

/**
 * 生成 Refresh Token
 */
export function generateRefreshToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, role: user.role },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpires as any }
  );
}
