import { useState, useEffect, useCallback } from "react";
import { Card, Row, Col, Statistic, Descriptions, Typography, Table, Skeleton, Button, Result, Empty } from "antd";
import { BookOutlined, CheckSquareOutlined, TrophyOutlined, ReloadOutlined } from "@ant-design/icons";
import { useAuthStore } from "../stores/auth";
import api from "../services/api";

export function UserDashboard() {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [recentGrades, setRecentGrades] = useState<any[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      if (user?.role === "student" || user?.role === "parent") {
        const [gradesRes, attendanceRes] = await Promise.all([
          api.get("/grades/my"),
          api.get("/attendance/my"),
        ]);
        setRecentGrades((gradesRes.data.data || []).slice(0, 5));
        setRecentAttendance((attendanceRes.data.data || []).slice(0, 5));

        const grades = gradesRes.data.data || [];
        const attendance = attendanceRes.data.data || [];

        const newStats: any = {};

        if (grades.length > 0) {
          const scores = grades.map((g: any) => g.score);
          newStats.courseCount = grades.length;
          newStats.avgScore = (scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1);
          newStats.maxScore = Math.max(...scores);
          newStats.minScore = Math.min(...scores);
        }

        if (attendance.length > 0) {
          const present = attendance.filter((a: any) => a.status === "present").length;
          newStats.totalAttendance = attendance.length;
          newStats.attendanceRate = ((present / attendance.length) * 100).toFixed(1);
        }

        setStats(Object.keys(newStats).length > 0 ? newStats : null);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (error) {
    return (
      <Result
        status="warning"
        title="数据加载失败"
        extra={
          <Button type="primary" icon={<ReloadOutlined />} onClick={loadData}>
            重新加载
          </Button>
        }
      />
    );
  }

  const hasAnyData = stats || recentGrades.length > 0 || recentAttendance.length > 0;

  return (
    <>
      <Typography.Title level={4} style={{ marginBottom: 24 }}>
        欢迎，{user?.name}
        {user?.role === "parent" ? "（家长）" : ""}
      </Typography.Title>

      {user?.student && (
        <Descriptions bordered size="small" column={2} style={{ marginBottom: 24 }}>
          <Descriptions.Item label="学号">{user.student.studentNo}</Descriptions.Item>
          <Descriptions.Item label="班级">{user.student.className || "-"}</Descriptions.Item>
        </Descriptions>
      )}

      {loading ? (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          {[1, 2, 3, 4].map((i) => (
            <Col xs={12} sm={12} md={6} key={i}>
              <Card><Skeleton paragraph={{ rows: 1 }} active /></Card>
            </Col>
          ))}
        </Row>
      ) : stats ? (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          {stats.avgScore && (
            <>
              <Col xs={12} sm={12} md={6}><Card><Statistic title="平均分" value={stats.avgScore} prefix={<BookOutlined />} /></Card></Col>
              <Col xs={12} sm={12} md={6}><Card><Statistic title="最高分" value={stats.maxScore} prefix={<TrophyOutlined />} /></Card></Col>
              <Col xs={12} sm={12} md={6}><Card><Statistic title="最低分" value={stats.minScore} /></Card></Col>
              <Col xs={12} sm={12} md={6}><Card><Statistic title="科目数" value={stats.courseCount} /></Card></Col>
            </>
          )}
          {stats.attendanceRate && (
            <Col xs={12} sm={12} md={6}><Card><Statistic title="出勤率" value={stats.attendanceRate} suffix="%" prefix={<CheckSquareOutlined />} /></Card></Col>
          )}
        </Row>
      ) : null}

      {recentGrades.length > 0 && (
        <Card title="最近成绩" style={{ marginBottom: 24 }}>
          <Table
            dataSource={recentGrades}
            rowKey="id"
            pagination={false}
            size="small"
            columns={[
              { title: "科目", dataIndex: ["course", "name"], key: "course" },
              { title: "考试", dataIndex: ["examType", "name"], key: "exam" },
              { title: "分数", dataIndex: "score", key: "score" },
              { title: "班排", dataIndex: "classRank", key: "classRank", render: (v: any) => v || "-" },
              { title: "级排", dataIndex: "gradeRank", key: "gradeRank", render: (v: any) => v || "-" },
            ]}
          />
        </Card>
      )}

      {recentAttendance.length > 0 && (
        <Card title="最近考勤">
          <Table
            dataSource={recentAttendance}
            rowKey="id"
            pagination={false}
            size="small"
            columns={[
              { title: "日期", dataIndex: "recordDate", key: "date" },
              { title: "时段", dataIndex: "period", key: "period", render: (v: string) => v === "morning" ? "上午" : v === "afternoon" ? "下午" : "全天" },
              { title: "状态", dataIndex: "status", key: "status", render: (v: string) => {
                const map: Record<string, string> = { present: "出勤", absent: "缺勤", late: "迟到", sick_leave: "病假", personal_leave: "事假" };
                return map[v] || v;
              }},
            ]}
          />
        </Card>
      )}

      {!loading && !hasAnyData && (
        <Empty description="暂无数据，请等待教师录入成绩和考勤后查看" />
      )}
    </>
  );
}
