import { useState, useEffect } from "react";
import { Table, Tag, Typography, Spin } from "antd";
import api from "../services/api";

const statusMap: Record<string, { label: string; color: string }> = {
  unpaid: { label: "未缴", color: "red" },
  partial: { label: "部分", color: "orange" },
  paid: { label: "已缴", color: "green" },
  waived: { label: "免缴", color: "default" },
};

export function StudentFees() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/fees/payments/my");
      setPayments(res.data.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: "费用项目", dataIndex: ["feeItem", "name"], key: "item", width: 150 },
    { title: "金额", dataIndex: ["feeItem", "amount"], key: "amount", width: 100, render: (v: number) => `¥${v}` },
    { title: "已缴", dataIndex: "paidAmount", key: "paid", width: 100, render: (v: number) => `¥${v || 0}` },
    {
      title: "状态", dataIndex: "status", key: "status", width: 80,
      render: (v: string) => <Tag color={statusMap[v]?.color}>{statusMap[v]?.label || v}</Tag>,
    },
    { title: "截止日期", dataIndex: ["feeItem", "dueDate"], key: "dueDate", width: 110, render: (v: string) => v ? v.slice(0, 10) : "-" },
  ];

  return (
    <Spin spinning={loading}>
      <Typography.Title level={4} style={{ marginBottom: 16 }}>费用中心</Typography.Title>
      <Table
        dataSource={payments}
        rowKey="id"
        columns={columns}
        pagination={false}
        size="middle"
        locale={{ emptyText: "暂无费用记录" }}
      />
    </Spin>
  );
}
