import { useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, Button, Dropdown, Typography, theme } from "antd";
import {
  PieChartOutlined,
  CheckSquareOutlined,
  DollarOutlined,
  NotificationOutlined,
  LogoutOutlined,
  UserOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../stores/auth";
import { UserDashboard } from "../pages/UserDashboard";
import { StudentGrades } from "../pages/StudentGrades";
import { StudentAttendance } from "../pages/StudentAttendance";
import { StudentFees } from "../pages/StudentFees";
import { NoticeListPage } from "../pages/Notices";
import { ProfilePage } from "../pages/Profile";

const { Header, Sider, Content } = Layout;

export function UserLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { token: themeToken } = theme.useToken();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    { key: "/", icon: <PieChartOutlined />, label: "首页" },
    { key: "/grades", icon: <BookOutlined />, label: "成绩查询" },
    { key: "/attendance", icon: <CheckSquareOutlined />, label: "考勤记录" },
    { key: "/fees", icon: <DollarOutlined />, label: "费用中心" },
    { key: "/notices", icon: <NotificationOutlined />, label: "通知公告" },
  ];

  const userMenu = {
    items: [
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
            icon={collapsed ? "☰" : "☰"}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16 }}
          >
            {collapsed ? "" : ""}
          </Button>
          <Dropdown menu={userMenu}>
            <Button type="text" icon={<UserOutlined />}>
              {user?.name || "用户"}
              {user?.role === "parent" ? "（家长）" : user?.role === "student" ? "（学生）" : ""}
            </Button>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: themeToken.colorBgContainer, borderRadius: themeToken.borderRadiusLG }}>
          <Routes>
            <Route path="/" element={<UserDashboard />} />
            <Route path="/grades" element={<StudentGrades />} />
            <Route path="/attendance" element={<StudentAttendance />} />
            <Route path="/fees" element={<StudentFees />} />
            <Route path="/notices" element={<NoticeListPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}
