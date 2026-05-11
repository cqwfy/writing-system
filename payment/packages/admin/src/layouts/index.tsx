import { useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, Button, Dropdown, Typography, theme } from "antd";
import {
  TeamOutlined,
  BankOutlined,
  BookOutlined,
  ScheduleOutlined,
  CheckSquareOutlined,
  PieChartOutlined,
  DollarOutlined,
  NotificationOutlined,
  HomeOutlined,
  TrophyOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../stores/auth";
import { StudentListPage } from "../pages/Students";
import { DashboardPage } from "../pages/Dashboard";
import { ClassListPage } from "../pages/Classes";
import { CourseListPage } from "../pages/Courses";
import { TimetablePage } from "../pages/Timetable";
import { AttendancePage } from "../pages/Attendance";
import { GradesPage } from "../pages/Grades";
import { FeesPage } from "../pages/Fees";
import { NoticeListPage } from "../pages/Notices";
import { DormitoryPage } from "../pages/Dormitory";
import { RewardListPage } from "../pages/Rewards";
import { TeacherListPage } from "../pages/Teachers";

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: "/", icon: <PieChartOutlined />, label: "工作台" },
  { key: "/students", icon: <TeamOutlined />, label: "学生管理" },
  { key: "/teachers", icon: <IdcardOutlined />, label: "教师管理" },
  { key: "/classes", icon: <BankOutlined />, label: "班级管理" },
  { key: "/courses", icon: <BookOutlined />, label: "课程管理" },
  { key: "/timetable", icon: <ScheduleOutlined />, label: "课表管理" },
  { key: "/attendance", icon: <CheckSquareOutlined />, label: "考勤管理" },
  { key: "/grades", icon: <PieChartOutlined />, label: "成绩管理" },
  { key: "/fees", icon: <DollarOutlined />, label: "费用管理" },
  { key: "/notices", icon: <NotificationOutlined />, label: "通知公告" },
  { key: "/dormitory", icon: <HomeOutlined />, label: "宿舍管理" },
  { key: "/rewards", icon: <TrophyOutlined />, label: "奖惩记录" },
];

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { token: themeToken } = theme.useToken();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userMenu = {
    items: [
      { key: "profile", icon: <UserOutlined />, label: "个人信息" },
      { key: "logout", icon: <LogoutOutlined />, label: "退出登录", danger: true },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === "logout") handleLogout();
    },
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography.Title level={4} style={{ color: "#fff", margin: 0, whiteSpace: "nowrap" }}>
            {collapsed ? "学管" : "学校管理系统"}
          </Typography.Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: "0 24px", background: themeToken.colorBgContainer, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Dropdown menu={userMenu}>
            <Button type="text" icon={<UserOutlined />}>
              {user?.name || "用户"}
            </Button>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: themeToken.colorBgContainer, borderRadius: themeToken.borderRadiusLG }}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/students" element={<StudentListPage />} />
            <Route path="/teachers" element={<TeacherListPage />} />
            <Route path="/classes" element={<ClassListPage />} />
            <Route path="/courses" element={<CourseListPage />} />
            <Route path="/timetable" element={<TimetablePage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/grades" element={<GradesPage />} />
            <Route path="/fees" element={<FeesPage />} />
            <Route path="/notices" element={<NoticeListPage />} />
            <Route path="/dormitory" element={<DormitoryPage />} />
            <Route path="/rewards" element={<RewardListPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}
