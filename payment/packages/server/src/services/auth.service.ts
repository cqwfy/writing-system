import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { Role } from "@sms/shared";
import { AppError } from "../middleware/error-handler";
import { AuthUser, generateAccessToken, generateRefreshToken } from "../middleware/auth";
import { config } from "../config";

const prisma = new PrismaClient();

export class AuthService {
  /**
   * 用户名密码登录（Web 管理后台）
   */
  async loginByPassword(username: string, password: string) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !user.passwordHash) {
      throw new AppError(401, "用户名或密码错误");
    }

    if (user.status !== "active") {
      throw new AppError(403, "账号已被禁用");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, "用户名或密码错误");
    }

    return this.buildLoginResponse(user);
  }

  /**
   * 微信小程序登录
   */
  async loginByWechat(code: string) {
    // 用 code 换取 openid
    const openid = await this.getWechatOpenid(code);

    // 查找已绑定的用户
    const user = await prisma.user.findUnique({ where: { wechatOpenid: openid } });
    if (user) {
      if (user.status !== "active") {
        throw new AppError(403, "账号已被禁用");
      }
      return { isNewUser: false, ...(await this.buildLoginResponse(user)) };
    }

    // 新用户，返回临时 token 用于后续绑定
    const tempToken = generateAccessToken({ id: 0, role: Role.STUDENT, name: "" });
    return { isNewUser: true, tempToken };
  }

  /**
   * 绑定微信用户
   */
  async bindWechatUser(tempToken: string, bindType: string, bindValue: string) {
    let user;
    if (bindType === "student_no") {
      const student = await prisma.student.findFirst({ where: { studentNo: bindValue, deletedAt: null } });
      if (!student) throw new AppError(404, "未找到该学号对应的学生");
      if (!student.userId) throw new AppError(400, "该学号尚未创建登录账号");
      user = await prisma.user.findUnique({ where: { id: student.userId } });
    } else if (bindType === "parent_phone") {
      const parent = await prisma.parent.findFirst({ where: { phone: bindValue } });
      if (!parent) throw new AppError(404, "未找到该手机号对应的家长");
      if (!parent.userId) throw new AppError(400, "该手机号尚未创建登录账号");
      user = await prisma.user.findUnique({ where: { id: parent.userId } });
    } else {
      throw new AppError(400, "无效的绑定类型");
    }

    if (!user) throw new AppError(404, "用户不存在");

    return this.buildLoginResponse(user);
  }

  /**
   * 刷新 token
   */
  async refreshToken(refreshToken: string) {
    const jwt = await import("jsonwebtoken");
    try {
      const payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as { id: number; role: Role };
      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      if (!user) throw new AppError(401, "用户不存在");
      return this.buildLoginResponse(user);
    } catch {
      throw new AppError(401, "刷新令牌无效");
    }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: { include: { class: true } },
        teacher: true,
        parent: { include: { student: true } },
      },
    });

    if (!user) throw new AppError(404, "用户不存在");

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      status: user.status,
      student: user.student ? {
        id: user.student.id,
        studentNo: user.student.studentNo,
        name: user.student.name,
        classId: user.student.classId,
        className: user.student.class?.name || null,
        photoUrl: user.student.photoUrl,
      } : null,
      teacher: user.teacher ? {
        id: user.teacher.id,
        teacherNo: user.teacher.teacherNo,
        subject: user.teacher.subject,
      } : null,
      parent: user.parent ? {
        id: user.parent.id,
        studentId: user.parent.studentId,
        studentName: user.parent.student?.name || null,
      } : null,
    };
  }

  private async buildLoginResponse(user: any) {
    // 加载关联信息
    const fullUser = await this.getCurrentUser(user.id);

    const authUser: AuthUser = {
      id: fullUser.id,
      role: fullUser.role as Role,
      name: fullUser.name,
      studentId: fullUser.student?.id,
      parentId: fullUser.parent?.id,
      teacherId: fullUser.teacher?.id,
    };

    return {
      tokens: {
        accessToken: generateAccessToken(authUser),
        refreshToken: generateRefreshToken(authUser),
        expiresIn: 7200,
      },
      user: fullUser,
    };
  }

  private async getWechatOpenid(code: string): Promise<string> {
    const { appId, appSecret } = config.wechat;
    if (!appId || !appSecret) {
      // 开发环境返回 mock openid
      if (config.nodeEnv === "development") {
        return `mock_openid_${code}`;
      }
      throw new AppError(500, "微信配置未设置");
    }

    const response = await fetch(
      `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`
    );
    const data: any = await response.json();

    if (data.errcode) {
      throw new AppError(400, `微信登录失败: ${data.errmsg}`);
    }

    return data.openid;
  }
}

export const authService = new AuthService();
