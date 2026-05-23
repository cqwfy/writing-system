import { useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, Button, Dropdown, Typography, theme, Modal, Form, Input, message } from "antd";
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
  LockOutlined,
  FundOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../stores/auth";
import api from "../services/api";
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
import { ProfilePage } from "../pages/Profile";

const { Header, Sider, Content } = Layout;

const allMenuItems = [
  { key: "/", icon: <PieChartOutlined />, label: "工作台", roles: ["admin", "teacher"] },
  { key: "/students", icon: <TeamOutlined />, label: "学生管理", roles: ["admin", "teacher"] },
  { key: "/teachers", icon: <IdcardOutlined />, label: "教师管理", roles: ["admin"] },
  { key: "/classes", icon: <BankOutlined />, label: "班级管理", roles: ["admin", "teacher"] },
  { key: "/courses", icon: <BookOutlined />, label: "课程管理", roles: ["admin", "teacher"] },
  { key: "/timetable", icon: <ScheduleOutlined />, label: "课表管理", roles: ["admin", "teacher"] },
  { key: "/attendance", icon: <CheckSquareOutlined />, label: "考勤管理", roles: ["admin", "teacher"] },
  { key: "/grades", icon: <FundOutlined />, label: "成绩管理", roles: ["admin", "teacher"] },
  { key: "/fees", icon: <DollarOutlined />, label: "费用管理", roles: ["admin"] },
  { key: "/notices", icon: <NotificationOutlined />, label: "通知公告", roles: ["admin", "teacher"] },
  { key: "/dormitory", icon: <HomeOutlined />, label: "宿舍管理", roles: ["admin"] },
  { key: "/rewards", icon: <TrophyOutlined />, label: "奖惩记录", roles: ["admin"] },
];

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordForm] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { token: themeToken } = theme.useToken();

  const menuItems = allMenuItems.filter((item) => item.roles.includes(user?.role || ""));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleChangePassword = async (values: { oldPassword: string; newPassword: string }) => {
    setPasswordLoading(true);
    try {
      await api.post("/auth/change-password", values);
      message.success("密码修改成功，请重新登录");
      setPasswordModalVisible(false);
      passwordForm.resetFields();
      setTimeout(() => handleLogout(), 1500);
    } catch (err: any) {
      message.error(err.response?.data?.error || "修改失败");
    } finally {
      setPasswordLoading(false);
    }
  };

  const userMenu = {
    items: [
      { key: "profile", icon: <UserOutlined />, label: "个人信息" },
      { key: "changePassword", icon: <LockOutlined />, label: "修改口令" },
      { type: "divider" as const },
      { key: "logout", icon: <LogoutOutlined />, label: "退出登录", danger: true },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === "profile") navigate("/profile");
      if (key === "changePassword") {
        passwordForm.resetFields();
        setPasswordModalVisible(true);
      }
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
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </Content>
      </Layout>

      <Modal
        title="修改口令"
        open={passwordModalVisible}
        onCancel={() => { setPasswordModalVisible(false); passwordForm.resetFields(); }}
        onOk={() => passwordForm.submit()}
        confirmLoading={passwordLoading}
        destroyOnClose
      >
        <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
          <Form.Item name="oldPassword" label="旧密码" rules={[{ required: true, message: "请输入旧密码" }]}>
            <Input.Password placeholder="输入旧密码" />
          </Form.Item>
          <Form.Item name="newPassword" label="新密码" rules={[
            { required: true, message: "请输入新密码" },
            { min: 6, message: "新密码至少 6 位" },
          ]}>
            <Input.Password placeholder="输入新密码（至少 6 位）" />
          </Form.Item>
          <Form.Item name="confirmPassword" label="确认新密码" dependencies={["newPassword"]} rules={[
            { required: true, message: "请确认新密码" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("newPassword") === value) return Promise.resolve();
                return Promise.reject(new Error("两次密码输入不一致"));
              },
            }),
          ]}>
            <Input.Password placeholder="再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
