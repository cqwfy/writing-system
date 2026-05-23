import { useRef, useState } from "react";
import { Button, message, Modal, Tag, Space, Form, Input, Popconfirm, Select } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { ProTable } from "@ant-design/pro-components";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import api from "../services/api";
import { PageHeader } from "../components/PageHeader";

interface TeacherRecord {
  id: number;
  userId: number;
  name: string;
  teacherNo: string;
  subject: string;
  phone: string;
  user: { id: number; username: string; status: string } | null;
}

export function TeacherListPage() {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      if (editingId) {
        await api.put(`/teachers/${editingId}`, values);
        message.success("更新成功");
      } else {
        await api.post("/teachers", values);
        message.success("创建成功");
      }
      setModalVisible(false);
      form.resetFields();
      setEditingId(null);
      actionRef.current?.reload();
    } catch (err: any) {
      message.error(err.response?.data?.error || "操作失败");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (teacherId: number) => {
    try {
      const res = await api.post(`/teachers/${teacherId}/reset-password`);
      message.success(res.data.message || "密码已重置");
    } catch (err: any) {
      message.error(err.response?.data?.error || "重置失败");
    }
  };

  const columns: ProColumns<TeacherRecord>[] = [
    {
      title: "关键词",
      dataIndex: "keyword",
      hideInTable: true,
      fieldProps: { placeholder: "工号 / 姓名 / 电话" },
    },
    { title: "工号", dataIndex: "teacherNo", key: "teacherNo", width: 100, search: false },
    { title: "姓名", dataIndex: "name", key: "name", width: 100, search: false },
    {
      title: "科目",
      dataIndex: "subject",
      key: "subject",
      width: 80,
      search: false,
      valueType: "select",
      valueEnum: {
        语文: "语文",
        数学: "数学",
        英语: "英语",
        物理: "物理",
        化学: "化学",
        生物: "生物",
        政治: "政治",
        历史: "历史",
        地理: "地理",
        体育: "体育",
        音乐: "音乐",
        美术: "美术",
        信息技术: "信息技术",
      },
    },
    { title: "电话", dataIndex: "phone", key: "phone", width: 130, search: false },
    {
      title: "账号",
      dataIndex: "username",
      key: "username",
      width: 120,
      search: false,
      render: (_, r) => r.user?.username || "-",
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 80,
      search: false,
      render: (_, r) => {
        const status = r.user?.status;
        return <Tag color={status === "active" ? "green" : "red"}>
          {status === "active" ? "启用" : "禁用"}
        </Tag>;
      },
    },
    {
      title: "操作",
      key: "action",
      width: 200,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => {
            setEditingId(record.id);
            form.setFieldsValue({
              name: record.name,
              teacherNo: record.teacherNo,
              subject: record.subject,
              phone: record.phone,
              username: record.user?.username || "",
            });
            setModalVisible(true);
          }}>编辑</Button>
          <Popconfirm title={`重置 ${record.name} 的密码？`}
            onConfirm={() => handleResetPassword(record.id)}
          >
            <Button type="link">重置密码</Button>
          </Popconfirm>
          <Popconfirm title={`确定删除 ${record.name}？`}
            onConfirm={async () => {
              await api.delete(`/teachers/${record.id}`);
              message.success("已删除");
              actionRef.current?.reload();
            }}
          >
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <ProTable<TeacherRecord>
        columns={columns}
        request={async (params) => {
          const res = await api.get("/teachers", {
            params: { page: params.current, pageSize: params.pageSize, keyword: params.keyword },
          });
          return { data: res.data.data.data, total: res.data.data.total, success: true };
        }}
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: "auto" }}
        headerTitle={<PageHeader title="教师列表" desc="管理全校教师信息，关联用户账号与课程" />}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => {
            setEditingId(null);
            form.resetFields();
            setModalVisible(true);
          }}>新增教师</Button>,
        ]}
      />
      <Modal title={editingId ? "编辑教师" : "新增教师"} open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        onOk={() => form.submit()} confirmLoading={loading}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Space style={{ display: "flex", gap: 16 }}>
            <Form.Item name="name" label="姓名" rules={[{ required: true }]} style={{ width: 160 }}>
              <Input placeholder="姓名" />
            </Form.Item>
            <Form.Item name="teacherNo" label="工号" rules={[{ required: true }]} style={{ width: 160 }}>
              <Input placeholder="如 T0004" />
            </Form.Item>
          </Space>
          <Form.Item name="username" label="登录账号" rules={[{ required: true }]}>
            <Input placeholder="登录用户名" />
          </Form.Item>
          {!editingId && (
            <Form.Item name="password" label="登录密码" rules={[{ required: true, min: 6 }]}>
              <Input.Password placeholder="至少6位" />
            </Form.Item>
          )}
          <Space style={{ display: "flex", gap: 16 }}>
            <Form.Item name="subject" label="科目" rules={[{ required: true }]} style={{ width: 160 }}>
              <Select options={[
                { label: "语文", value: "语文" }, { label: "数学", value: "数学" },
                { label: "英语", value: "英语" }, { label: "物理", value: "物理" },
                { label: "化学", value: "化学" }, { label: "生物", value: "生物" },
                { label: "政治", value: "政治" }, { label: "历史", value: "历史" },
                { label: "地理", value: "地理" }, { label: "体育", value: "体育" },
                { label: "音乐", value: "音乐" }, { label: "美术", value: "美术" },
                { label: "信息技术", value: "信息技术" },
              ]} />
            </Form.Item>
            <Form.Item name="phone" label="电话" style={{ width: 160 }}>
              <Input placeholder="手机号码" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
