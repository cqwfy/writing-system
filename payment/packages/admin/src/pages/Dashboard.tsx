import { useState, useEffect, useCallback } from "react";
import { Card, Col, Row, Statistic, Table, Typography, Skeleton, Button, Result } from "antd";
import { TeamOutlined, UserOutlined, BookOutlined, BankOutlined, ReloadOutlined } from "@ant-design/icons";
import api from "../services/api";

const gradeLabels: Record<string, string> = { "7": "七年级", "8": "八年级", "9": "九年级", "10": "高一", "11": "高二", "12": "高三" };

export function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get("/dashboard/stats");
      setStats(res.data.data);
    } catch (err: any) {
      console.error("Dashboard 加载失败:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (error) {
    return (
      <Result
        status="warning"
        title="数据加载失败"
        extra={
          <Button type="primary" icon={<ReloadOutlined />} onClick={loadStats}>
            重新加载
          </Button>
        }
      />
    );
  }

  const statCards = [
    { title: "在校学生", value: stats?.studentCount, icon: <TeamOutlined /> },
    { title: "教师人数", value: stats?.teacherCount, icon: <UserOutlined /> },
    { title: "班级数量", value: stats?.classCount, icon: <BankOutlined /> },
    { title: "课程数量", value: stats?.courseCount, icon: <BookOutlined /> },
  ];

  return (
    <>
      <Row gutter={[16, 16]}>
        {statCards.map((card) => (
          <Col xs={12} sm={12} md={6} key={card.title}>
            <Card>
              {loading ? (
                <Skeleton paragraph={{ rows: 1 }} active />
              ) : (
                <Statistic
                  title={card.title}
                  value={card.value ?? "-"}
                  prefix={card.icon}
                />
              )}
            </Card>
          </Col>
        ))}
      </Row>

      {stats?.gradeStats && stats.gradeStats.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card title="各年级学生人数">
              <Row gutter={16}>
                {stats.gradeStats.map((g: any) => (
                  <Col xs={24} sm={12} md={8} key={g.gradeLevel}>
                    <Card size="small">
                      <Statistic
                        title={`${gradeLabels[g.gradeLevel] || g.gradeLevel + "年级"}`}
                        value={g.count}
                        suffix="人"
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        </Row>
      )}

      {stats?.recentGrades && stats.recentGrades.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={12}>
            <Card title="最近成绩记录">
              <Table
                dataSource={stats.recentGrades}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  { title: "学生", dataIndex: "studentName", key: "student" },
                  { title: "考试", dataIndex: "examName", key: "exam" },
                  { title: "科目", dataIndex: "courseName", key: "course" },
                  { title: "分数", dataIndex: "score", key: "score" },
                ]}
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="最近考试">
              <Table
                dataSource={stats.recentExams}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  { title: "考试名称", dataIndex: "name", key: "name" },
                  { title: "学年", dataIndex: "academicYear", key: "year" },
                  {
                    title: "学期",
                    dataIndex: "semester",
                    key: "semester",
                    render: (v: string) => (v === "first" ? "上学期" : "下学期"),
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>
      )}
    </>
  );
}
