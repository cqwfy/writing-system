import { useState, useEffect } from "react";
import { Card, Col, Row, Statistic, Table, Typography, Spin } from "antd";
import { TeamOutlined, UserOutlined, BookOutlined, BankOutlined } from "@ant-design/icons";
import api from "../services/api";

export function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await api.get("/dashboard/stats");
      setStats(res.data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <Spin spinning={loading}>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic title="在校学生" value={stats?.studentCount ?? "-"} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="教师人数" value={stats?.teacherCount ?? "-"} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="班级数量" value={stats?.classCount ?? "-"} prefix={<BankOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="课程数量" value={stats?.courseCount ?? "-"} prefix={<BookOutlined />} />
          </Card>
        </Col>
      </Row>

      {stats?.gradeStats && stats.gradeStats.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card title="各年级学生人数">
              <Row gutter={16}>
                {stats.gradeStats.map((g: any) => (
                  <Col span={8} key={g.gradeLevel}>
                    <Card size="small">
                      <Statistic
                        title={`${g.gradeLevel === "7" ? "七年级" : g.gradeLevel === "8" ? "八年级" : g.gradeLevel === "9" ? "九年级" : g.gradeLevel + "年级"}`}
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
          <Col span={12}>
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
          <Col span={12}>
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
    </Spin>
  );
}
