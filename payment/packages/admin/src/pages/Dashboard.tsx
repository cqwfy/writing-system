import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, Col, Row, Statistic, Table, Typography, Skeleton, Button, Result, Space } from "antd";
import { TeamOutlined, UserOutlined, BookOutlined, BankOutlined, ReloadOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth";
import api from "../services/api";

const gradeLabels: Record<string, string> = { "7": "七年级", "8": "八年级", "9": "九年级", "10": "高一", "11": "高二", "12": "高三" };

const statConfig = [
  { key: "studentCount", title: "在校学生", icon: <TeamOutlined />, color: "#4F46E5", bg: "#EEF2FF", link: "/students" },
  { key: "teacherCount", title: "教师人数", icon: <UserOutlined />, color: "#0891B2", bg: "#ECFEFF", link: "/teachers" },
  { key: "classCount", title: "班级数量", icon: <BankOutlined />, color: "#059669", bg: "#ECFDF5", link: "/classes" },
  { key: "courseCount", title: "课程数量", icon: <BookOutlined />, color: "#D97706", bg: "#FFFBEB", link: "/courses" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return "夜深了";
  if (h < 9) return "早上好";
  if (h < 12) return "上午好";
  if (h < 14) return "中午好";
  if (h < 18) return "下午好";
  return "晚上好";
}

function formatDate() {
  const d = new Date();
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${weekDays[d.getDay()]}`;
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
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

  const greeting = useMemo(() => getGreeting(), []);

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

  return (
    <>
      {/* 欢迎横幅 */}
      <div style={{
        background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
        borderRadius: 12,
        padding: "24px 28px",
        marginBottom: 20,
        color: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div>
          <Typography.Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 14 }}>
            {greeting}，{user?.name || "管理员"}
          </Typography.Text>
          <Typography.Title level={3} style={{ color: "#fff", margin: "4px 0 0", fontWeight: 600 }}>
            工作台
          </Typography.Title>
          <Typography.Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
            {formatDate()}
          </Typography.Text>
        </div>
        <Space size={12} wrap>
          <Button ghost size="small" onClick={() => navigate("/students")}>
            学生管理 <ArrowRightOutlined />
          </Button>
          <Button ghost size="small" onClick={() => navigate("/attendance")}>
            今日考勤 <ArrowRightOutlined />
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        {statConfig.map((cfg) => (
          <Col xs={12} sm={12} md={6} key={cfg.key}>
            <Card
              hoverable
              style={{ borderRadius: 12, cursor: "pointer" }}
              onClick={() => navigate(cfg.link)}
            >
              {loading ? (
                <Skeleton paragraph={{ rows: 1 }} active />
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: cfg.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, color: cfg.color, flexShrink: 0,
                  }}>
                    {cfg.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 2 }}>{cfg.title}</div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: "#111827", lineHeight: 1 }}>
                      {(stats?.[cfg.key]) ?? "-"}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      {/* 年级分布 */}
      {stats?.gradeStats && stats.gradeStats.length > 0 && (
        <Card title="各年级学生人数" style={{ marginTop: 16, borderRadius: 12 }}>
          <Row gutter={16}>
            {stats.gradeStats.map((g: any) => (
              <Col xs={12} sm={8} md={4} key={g.gradeLevel}>
                <div style={{
                  textAlign: "center",
                  padding: "16px 8px",
                  borderRadius: 10,
                  background: "#F9FAFB",
                  marginBottom: 8,
                }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#4F46E5" }}>{g.count}</div>
                  <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
                    {gradeLabels[g.gradeLevel] || g.gradeLevel + "年级"}
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* 最近数据 */}
      {stats?.recentGrades && stats.recentGrades.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={12}>
            <Card title="最近成绩记录" style={{ borderRadius: 12 }}>
              <Table
                dataSource={stats.recentGrades}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  { title: "学生", dataIndex: "studentName" },
                  { title: "考试", dataIndex: "examName" },
                  { title: "科目", dataIndex: "courseName" },
                  { title: "分数", dataIndex: "score" },
                ]}
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="最近考试" style={{ borderRadius: 12 }}>
              <Table
                dataSource={stats.recentExams}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  { title: "考试名称", dataIndex: "name" },
                  { title: "学年", dataIndex: "academicYear" },
                  {
                    title: "学期",
                    dataIndex: "semester",
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
