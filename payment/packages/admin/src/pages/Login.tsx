import { useState } from "react";
import { Button, Card, Form, Input, message, Typography } from "antd";
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth";
import api from "../services/api";

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", values);
      const { tokens, user } = res.data.data;
      setAuth(tokens.accessToken, tokens.refreshToken, user);
      message.success(`欢迎，${user.name}`);
      navigate("/");
    } catch (err: any) {
      message.error(err.response?.data?.error || "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #A78BFA 100%)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* 背景装饰圆 */}
      <div style={{
        position: "absolute",
        top: -120,
        right: -120,
        width: 400,
        height: 400,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.06)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        bottom: -80,
        left: -80,
        width: 300,
        height: 300,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.04)",
        pointerEvents: "none",
      }} />

      <Card
        style={{
          width: 420,
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(79, 70, 229, 0.3), 0 0 0 1px rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(20px)",
        }}
        styles={{ body: { padding: "40px 36px 36px" } }}
      >
        {/* 品牌区 */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            boxShadow: "0 8px 24px rgba(79, 70, 229, 0.35)",
          }}>
            <SafetyCertificateOutlined style={{ fontSize: 28, color: "#fff" }} />
          </div>
          <Typography.Title level={3} style={{ marginBottom: 6 }}>
            学校管理系统
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 14 }}>
            中小学综合管理平台
          </Typography.Text>
        </div>

        <Form onFinish={onFinish} size="large">
          <Form.Item name="username" rules={[{ required: true, message: "请输入用户名" }]}>
            <Input
              prefix={<UserOutlined style={{ color: "#a0a0a0" }} />}
              placeholder="用户名"
              autoComplete="username"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: "请输入密码" }]}>
            <Input.Password
              prefix={<LockOutlined style={{ color: "#a0a0a0" }} />}
              placeholder="密码"
              autoComplete="current-password"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 44,
                borderRadius: 8,
                fontSize: 16,
                background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
                border: "none",
              }}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
