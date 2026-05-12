import { useState, useEffect } from "react";
import { Card, Table, Tag, Typography, Spin } from "antd";
import { useAuthStore } from "../stores/auth";
import api from "../services/api";

export function StudentGrades() {
  const user = useAuthStore((s) => s.user);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGrades();
  }, []);

  const loadGrades = async () => {
    setLoading(true);
    try {
      const res = await api.get("/grades/my");
      setGrades(res.data.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: "科目", dataIndex: ["course", "name"], key: "course", width: 100 },
    { title: "考试", dataIndex: ["examType", "name"], key: "exam", width: 120 },
    { title: "考试日期", dataIndex: ["examType", "examDate"], key: "date", width: 110, render: (v: string) => v ? v.slice(0, 10) : "-" },
    { title: "分数", dataIndex: "score", key: "score", width: 80 },
    {
      title: "班排", dataIndex: "classRank", key: "classRank", width: 80,
      render: (v: number | null) => v ? <Tag color={v <= 5 ? "red" : v <= 10 ? "orange" : "default"}>{v}</Tag> : "-",
    },
    {
      title: "级排", dataIndex: "gradeRank", key: "gradeRank", width: 80,
      render: (v: number | null) => v ? <Tag color={v <= 20 ? "red" : "default"}>{v}</Tag> : "-",
    },
  ];

  return (
    <Spin spinning={loading}>
      <Typography.Title level={4} style={{ marginBottom: 16 }}>成绩查询</Typography.Title>
      <Table
        dataSource={grades}
        rowKey="id"
        columns={columns}
        pagination={false}
        size="middle"
        locale={{ emptyText: "暂无成绩数据，等待教师发布" }}
      />
    </Spin>
  );
}
