import { useState, useEffect } from "react";
import { Card, Descriptions, Tag, Spin, Typography } from "antd";
import api from "../services/api";

export function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get("/auth/me");
      setProfile(res.data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const roleMap: Record<string, { label: string; color: string }> = {
    admin: { label: "管理员", color: "red" },
    teacher: { label: "教师", color: "blue" },
    student: { label: "学生", color: "green" },
    parent: { label: "家长", color: "orange" },
  };

  return (
    <Spin spinning={loading}>
      <Typography.Title level={4} style={{ marginBottom: 24 }}>个人信息</Typography.Title>
      {profile && (
        <Card style={{ maxWidth: 700 }}>
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="用户名">{profile.username}</Descriptions.Item>
            <Descriptions.Item label="姓名">{profile.name}</Descriptions.Item>
            <Descriptions.Item label="角色">
              <Tag color={roleMap[profile.role]?.color}>{roleMap[profile.role]?.label || profile.role}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="手机号">{profile.phone || "-"}</Descriptions.Item>
            {profile.student && (
              <>
                <Descriptions.Item label="学号">{profile.student.studentNo}</Descriptions.Item>
                <Descriptions.Item label="班级">{profile.student.className || "-"}</Descriptions.Item>
              </>
            )}
            {profile.teacher && (
              <>
                <Descriptions.Item label="教师编号">{profile.teacher.teacherNo}</Descriptions.Item>
                <Descriptions.Item label="科目">{profile.teacher.subject}</Descriptions.Item>
              </>
            )}
            {profile.parent && (
              <Descriptions.Item label="关联学生">{profile.parent.studentName || "-"}</Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}
    </Spin>
  );
}
