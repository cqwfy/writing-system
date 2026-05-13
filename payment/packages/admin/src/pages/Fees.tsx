import { useRef, useState } from "react";
import { Button, message, Modal, Tag, Space, Form, Input, Select, InputNumber, Tabs, Popconfirm } from "antd";
import { PlusOutlined, DollarOutlined } from "@ant-design/icons";
import { ProTable } from "@ant-design/pro-components";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import api from "../services/api";

interface FeeItem {
  id: number;
  name: string;
  amount: number;
  feeType: string;
  gradeLevel: string;
  semester: string;
  academicYear: string;
  dueDate: string;
}

interface PaymentRecord {
  id: number;
  student: { id: number; name: string; studentNo: string };
  feeItem: { id: number; name: string; amount: number };
  amount: number;
  paidAmount: number;
  status: string;
  paidAt: string | null;
}

export function FeesPage() {
  const itemActionRef = useRef<ActionType>();
  const paymentActionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleCreateItem = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      await api.post("/fees/items", values);
      message.success("创建费用项目成功");
      setModalVisible(false);
      form.resetFields();
      itemActionRef.current?.reload();
    } catch (err: any) {
      message.error(err.response?.data?.error || "创建失败");
    } finally {
      setLoading(false);
    }
  };

  const itemColumns: ProColumns<FeeItem>[] = [
    { title: "费用名称", dataIndex: "name", key: "name", width: 150 },
    { title: "金额", dataIndex: "amount", key: "amount", width: 100, render: (_, r) => `¥${r.amount}` },
    {
      title: "类型", dataIndex: "feeType", key: "feeType", width: 100,
      valueType: "select",
      valueEnum: { tuition: "学费", material: "教材费", boarding: "住宿费", activity: "活动费", other: "其他" },
    },
    {
      title: "年级", dataIndex: "gradeLevel", key: "gradeLevel", width: 100,
      render: (_, r) => ({ "7": "七年级", "8": "八年级", "9": "九年级", "10": "高一", "11": "高二", "12": "高三" })[r.gradeLevel] || r.gradeLevel,
    },
    { title: "学期", dataIndex: "semester", key: "semester", width: 80, render: (_, r) => r.semester === "first" ? "上学期" : "下学期" },
    { title: "学年", dataIndex: "academicYear", key: "academicYear", width: 120 },
    {
      title: "操作", key: "action", width: 120,
      render: (_, record) => (
        <Button type="link" onClick={async () => {
          await api.post(`/fees/items/${record.id}/generate`);
          message.success("已为所有学生生成缴费记录");
          paymentActionRef.current?.reload();
        }}>生成缴费单</Button>
      ),
    },
  ];

  const paymentColumns: ProColumns<PaymentRecord>[] = [
    { title: "学生", dataIndex: ["student", "name"], key: "student", width: 100 },
    { title: "学号", dataIndex: ["student", "studentNo"], key: "studentNo", width: 120 },
    { title: "费用项目", dataIndex: ["feeItem", "name"], key: "feeItem", width: 120 },
    { title: "应缴", dataIndex: ["feeItem", "amount"], key: "amount", width: 80, render: (_, r) => `¥${r.feeItem?.amount || 0}` },
    { title: "已缴", dataIndex: "paidAmount", key: "paidAmount", width: 80, render: (_, r) => `¥${r.paidAmount}` },
    {
      title: "状态", dataIndex: "status", key: "status", width: 80,
      valueType: "select",
      valueEnum: { unpaid: "未缴", partial: "部分", paid: "已缴", waived: "免除" },
      render: (_, r) => {
        const m: Record<string, { text: string; color: string }> = {
          unpaid: { text: "未缴", color: "red" },
          partial: { text: "部分", color: "orange" },
          paid: { text: "已缴", color: "green" },
          waived: { text: "免除", color: "default" },
        };
        const s = m[r.status];
        return s ? <Tag color={s.color}>{s.text}</Tag> : r.status;
      },
    },
    {
      title: "操作", key: "action", width: 120,
      render: (_, record) => record.status !== "paid" ? (
        <Space>
          <Button type="link" onClick={async () => {
            await api.post(`/fees/payments/${record.id}/paid`);
            message.success("标记为已缴费");
            paymentActionRef.current?.reload();
          }}>确认缴费</Button>
        </Space>
      ) : <span style={{ color: "#999" }}>{record.paidAt ? new Date(record.paidAt).toLocaleDateString() : ""}</span>,
    },
  ];

  return (
    <Tabs defaultActiveKey="payments" items={[
      {
        key: "payments",
        label: "缴费管理",
        children: (
          <ProTable<PaymentRecord>
            columns={paymentColumns}
            request={async (params) => {
              const res = await api.get("/fees/payments", { params: { page: params.current, pageSize: params.pageSize } });
              return { data: res.data.data.data, total: res.data.data.total, success: true };
            }}
            actionRef={paymentActionRef}
            rowKey="id"
            search={{ labelWidth: "auto" }}
            headerTitle="缴费记录"
          />
        ),
      },
      {
        key: "items",
        label: "费用项目",
        children: (
          <div>
            <ProTable<FeeItem>
              columns={itemColumns}
              request={async (params) => {
                const res = await api.get("/fees/items");
                const items = res.data.data || [];
                return { data: items, total: items.length, success: true };
              }}
              actionRef={itemActionRef}
              rowKey="id"
              search={false}
              headerTitle="费用项目"
              toolBarRender={() => [
                <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => {
                  form.resetFields();
                  setModalVisible(true);
                }}>新增费用项目</Button>,
              ]}
            />
            <Modal title="新增费用项目" open={modalVisible}
              onCancel={() => { setModalVisible(false); form.resetFields(); }}
              onOk={() => form.submit()} confirmLoading={loading}
            >
              <Form form={form} layout="vertical" onFinish={handleCreateItem}>
                <Form.Item name="name" label="费用名称" rules={[{ required: true }]}>
                  <Input placeholder="如 2026年秋季学费" />
                </Form.Item>
                <Form.Item name="amount" label="金额" rules={[{ required: true }]}>
                  <InputNumber min={0} style={{ width: "100%" }} placeholder="金额" />
                </Form.Item>
                <Space style={{ display: "flex", gap: 16 }}>
                  <Form.Item name="feeType" label="类型" rules={[{ required: true }]} style={{ width: 160 }}>
                    <Select options={[
                      { label: "学费", value: "tuition" }, { label: "教材费", value: "material" },
                      { label: "住宿费", value: "boarding" }, { label: "活动费", value: "activity" }, { label: "其他", value: "other" },
                    ]} />
                  </Form.Item>
                  <Form.Item name="gradeLevel" label="年级" rules={[{ required: true }]} style={{ width: 160 }}>
                    <Select options={[{ label: "七年级", value: "7" }, { label: "八年级", value: "8" }, { label: "九年级", value: "9" }, { label: "高一", value: "10" }, { label: "高二", value: "11" }, { label: "高三", value: "12" }]} />
                  </Form.Item>
                </Space>
                <Space style={{ display: "flex", gap: 16 }}>
                  <Form.Item name="semester" label="学期" rules={[{ required: true }]} style={{ width: 160 }}>
                    <Select options={[{ label: "上学期", value: "first" }, { label: "下学期", value: "second" }]} />
                  </Form.Item>
                  <Form.Item name="academicYear" label="学年" rules={[{ required: true }]} style={{ width: 160 }}>
                    <Input placeholder="如 2026-2027" />
                  </Form.Item>
                </Space>
              </Form>
            </Modal>
          </div>
        ),
      },
    ]} />
  );
}
