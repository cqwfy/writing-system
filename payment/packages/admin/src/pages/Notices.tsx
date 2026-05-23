import { useRef, useState } from "react";
import { Button, message, Modal, Tag, Space, Form, Input, Select, Popconfirm } from "antd";
import { PlusOutlined, SendOutlined } from "@ant-design/icons";
import { ProTable } from "@ant-design/pro-components";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import { useAuthStore } from "../stores/auth";
import api from "../services/api";
import { PageHeader } from "../components/PageHeader";

interface NoticeRecord {
  id: number;
  title: string;
  content: string;
  category: string;
  targetType: string;
  isPublished: boolean;
  publisher: { name: string };
  publishedAt: string | null;
  createdAt: string;
}

export function NoticeListPage() {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const isStudentOrParent = user?.role === "student" || user?.role === "parent";

  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      if (editingId) {
        await api.put(`/notices/${editingId}`, values);
        message.success("更新成功");
      } else {
        await api.post("/notices", values);
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

  const columns: ProColumns<NoticeRecord>[] = [
    { title: "标题", dataIndex: "title", key: "title", width: 200, ellipsis: true },
    {
      title: "类别",
      dataIndex: "category",
      key: "category",
      width: 100,
      valueType: "select",
      valueEnum: { notice: "通知", announcement: "公告", homework: "作业", event: "活动", communication: "沟通" },
      render: (_, r) => {
        const colors: Record<string, string> = { notice: "blue", announcement: "orange", homework: "purple", event: "green", communication: "default" };
        const labels: Record<string, string> = { notice: "通知", announcement: "公告", homework: "作业", event: "活动", communication: "沟通" };
        return <Tag color={colors[r.category]}>{labels[r.category] || r.category}</Tag>;
      },
    },
    {
      title: "目标",
      dataIndex: "targetType",
      key: "targetType",
      width: 100,
      valueType: "select",
      valueEnum: { all: "全校", grade: "按年级", class: "按班级", specific: "指定" },
    },
    {
      title: "状态",
      dataIndex: "isPublished",
      key: "isPublished",
      width: 80,
      valueType: "select",
      valueEnum: { true: "已发布", false: "草稿" },
      render: (_, r) => <Tag color={r.isPublished ? "green" : "default"}>{r.isPublished ? "已发布" : "草稿"}</Tag>,
    },
    { title: "发布者", dataIndex: ["publisher", "name"], key: "publisher", width: 100 },
    { title: "发布时间", dataIndex: "publishedAt", key: "publishedAt", width: 160, valueType: "dateTime", render: (_, r) => r.publishedAt ? new Date(r.publishedAt).toLocaleString() : "-" },
    {
      title: "操作",
      key: "action",
      width: isStudentOrParent ? 0 : 200,
      hideInTable: isStudentOrParent,
      render: isStudentOrParent ? undefined : (_, record) => (
        <Space>
          <Button type="link" onClick={() => {
            setEditingId(record.id);
            form.setFieldsValue(record);
            setModalVisible(true);
          }}>编辑</Button>
          {!record.isPublished && (
            <Button type="link" icon={<SendOutlined />} onClick={async () => {
              await api.post(`/notices/${record.id}/publish`);
              message.success("已发布");
              actionRef.current?.reload();
            }}>发布</Button>
          )}
          <Popconfirm title="确定删除？" onConfirm={async () => {
            await api.delete(`/notices/${record.id}`);
            message.success("删除成功");
            actionRef.current?.reload();
          }}>
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <ProTable<NoticeRecord>
        columns={columns}
        request={async (params) => {
          const res = await api.get("/notices", {
            params: { page: params.current, pageSize: params.pageSize, keyword: params.keyword },
          });
          return { data: res.data.data.data, total: res.data.data.total, success: true };
        }}
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: "auto" }}
        headerTitle={<PageHeader title="通知公告" desc="发布和管理全校通知，支持角色定向推送" />}
        toolBarRender={() => isStudentOrParent ? [] : [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => {
            setEditingId(null);
            form.resetFields();
            setModalVisible(true);
          }}>新建通知</Button>,
        ]}
      />
      <Modal title={editingId ? "编辑通知" : "新建通知"} open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        onOk={() => form.submit()} confirmLoading={loading}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input placeholder="通知标题" />
          </Form.Item>
          <Space style={{ display: "flex", gap: 16 }}>
            <Form.Item name="category" label="类别" rules={[{ required: true }]} style={{ width: 200 }}>
              <Select options={[
                { label: "通知", value: "notice" }, { label: "公告", value: "announcement" }, { label: "作业", value: "homework" }, { label: "活动", value: "event" }, { label: "沟通", value: "communication" },
              ]} />
            </Form.Item>
            <Form.Item name="targetType" label="目标范围" rules={[{ required: true }]} style={{ width: 200 }}>
              <Select options={[
                { label: "全校", value: "all" }, { label: "按年级", value: "grade" }, { label: "按班级", value: "class" },
              ]} />
            </Form.Item>
          </Space>
          <Form.Item name="content" label="内容" rules={[{ required: true }]}>
            <Input.TextArea rows={5} placeholder="通知内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
