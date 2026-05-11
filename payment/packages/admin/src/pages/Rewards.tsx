import { useRef, useState } from "react";
import { Button, message, Modal, Tag, Space, Form, Select, Input, DatePicker, Popconfirm } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { ProTable } from "@ant-design/pro-components";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import api from "../services/api";

interface RewardRecord {
  id: number;
  student: { id: number; name: string; studentNo: string };
  type: string;
  category: string;
  description: string;
  recordDate: string;
  recordedBy: { name: string };
}

export function RewardListPage() {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      await api.post("/rewards", {
        ...values,
        recordDate: values.recordDate
          ? (values.recordDate as { format: (f: string) => string }).format("YYYY-MM-DD")
          : undefined,
      });
      message.success("创建成功");
      setModalVisible(false);
      form.resetFields();
      actionRef.current?.reload();
    } catch (err: any) {
      message.error(err.response?.data?.error || "创建失败");
    } finally {
      setLoading(false);
    }
  };

  const columns: ProColumns<RewardRecord>[] = [
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      width: 80,
      valueType: "select",
      valueEnum: { reward: "奖励", punishment: "惩罚" },
      render: (_, r) => <Tag color={r.type === "reward" ? "green" : "red"}>{r.type === "reward" ? "奖励" : "惩罚"}</Tag>,
    },
    { title: "类别", dataIndex: "category", key: "category", width: 100 },
    { title: "学生", dataIndex: ["student", "name"], key: "student", width: 100 },
    { title: "学号", dataIndex: ["student", "studentNo"], key: "studentNo", width: 120 },
    { title: "描述", dataIndex: "description", key: "description", width: 250, ellipsis: true },
    { title: "日期", dataIndex: "recordDate", key: "recordDate", width: 120, valueType: "date" },
    {
      title: "操作",
      key: "action",
      width: 80,
      render: (_, record) => (
        <Popconfirm title="确定删除？" onConfirm={async () => {
          await api.delete(`/rewards/${record.id}`);
          message.success("删除成功");
          actionRef.current?.reload();
        }}>
          <Button type="link" danger>删除</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <ProTable<RewardRecord>
        columns={columns}
        request={async (params) => {
          const res = await api.get("/rewards", {
            params: { page: params.current, pageSize: params.pageSize, studentId: params.studentId, type: params.type },
          });
          return { data: res.data.data.data, total: res.data.data.total, success: true };
        }}
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: "auto" }}
        headerTitle="奖惩记录"
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => {
            form.resetFields();
            setModalVisible(true);
          }}>新增记录</Button>,
        ]}
      />
      <Modal title="新增奖惩记录" open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        onOk={() => form.submit()} confirmLoading={loading}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select options={[{ label: "奖励", value: "reward" }, { label: "惩罚", value: "punishment" }]} />
          </Form.Item>
          <Form.Item name="category" label="类别" rules={[{ required: true }]}>
            <Input placeholder="如 三好学生、违纪等" />
          </Form.Item>
          <Form.Item name="studentId" label="学生ID" rules={[{ required: true }]}>
            <Input placeholder="输入学生ID" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="recordDate" label="日期">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
