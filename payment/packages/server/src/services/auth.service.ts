import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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

    // 禁止学生和家长通过 Web 后台登录
    if (user.role === Role.STUDENT || user.role === Role.PARENT) {
      throw new AppError(403, "学生和家长请用学号和手机号登陆");
    }

    return this.buildLoginResponse(user);
  }

  /**
   * 移动端登录（学号/手机号 + 密码）
   */
  async loginByMobile(loginId: string, password: string) {
    let user;

    // 先按学号查学生
    const student = await prisma.student.findFirst({
      where: { studentNo: loginId, deletedAt: null },
    });
    if (student) {
      if (!student.userId) throw new AppError(400, "该学号尚未创建登录账号");
      user = await prisma.user.findUnique({ where: { id: student.userId } });
    } else {
      // 再按手机号查家长
      const parent = await prisma.parent.findFirst({ where: { phone: loginId } });
      if (parent) {
        if (!parent.userId) throw new AppError(400, "该手机号尚未创建登录账号");
        user = await prisma.user.findUnique({ where: { id: parent.userId } });
      }
    }

    if (!user) throw new AppError(401, "学号或手机号错误");
    if (!user.passwordHash) throw new AppError(401, "该账号未设置密码");
    if (user.status !== "active") throw new AppError(403, "账号已被禁用");

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError(401, "密码错误");

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
    const tempToken = generateAccessToken({ id: 0, role: Role.STUDENT, name: "", openid });
    return { isNewUser: true, tempToken };
  }

  /**
   * 绑定微信用户
   */
  async bindWechatUser(tempToken: string, bindType: string, bindValue: string) {
    // 从临时 token 中解析 openid
    let openid: string;
    try {
      const payload = jwt.verify(tempToken, config.jwt.secret) as { openid?: string };
      openid = payload.openid || "";
    } catch {
      throw new AppError(401, "临时凭证已过期");
    }

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

    // 保存微信 openid 到用户记录，下次登录可直接识别
    if (openid) {
      await prisma.user.update({ where: { id: user.id }, data: { wechatOpenid: openid } });
    }

    return this.buildLoginResponse(user);
  }

  /**
   * 刷新 token
   */
  async refreshToken(refreshToken: string) {
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
      studentId: fullUser.student?.id || fullUser.parent?.studentId,
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

  /**
   * 修改密码
   */
  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new AppError(404, "用户不存在");
    }

    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) {
      throw new AppError(400, "旧密码错误");
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
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
