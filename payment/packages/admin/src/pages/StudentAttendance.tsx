import { useState, useEffect } from "react";
import { Card, Table, Tag, Typography, Spin } from "antd";
import api from "../services/api";

const statusMap: Record<string, { label: string; color: string }> = {
  present: { label: "出勤", color: "green" },
  absent: { label: "缺勤", color: "red" },
  late: { label: "迟到", color: "orange" },
  early_leave: { label: "早退", color: "gold" },
  sick_leave: { label: "病假", color: "blue" },
  personal_leave: { label: "事假", color: "purple" },
};

const periodMap: Record<string, string> = {
  morning: "上午",
  afternoon: "下午",
  full_day: "全天",
};

export function StudentAttendance() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get("/attendance/my", { params: { pageSize: 100 } });
      setRecords(res.data.data?.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: "日期", dataIndex: "recordDate", key: "date", width: 110, render: (v: string) => v?.slice(0, 10) },
    {
      title: "时段", dataIndex: "period", key: "period", width: 80,
      render: (v: string) => periodMap[v] || v,
    },
    {
      title: "状态", dataIndex: "status", key: "status", width: 100,
      render: (v: string) => <Tag color={statusMap[v]?.color}>{statusMap[v]?.label || v}</Tag>,
    },
    { title: "备注", dataIndex: "remark", key: "remark" },
  ];

  return (
    <Spin spinning={loading}>
      <Typography.Title level={4} style={{ marginBottom: 16 }}>考勤记录</Typography.Title>
      <Table
        dataSource={records}
        rowKey="id"
        columns={columns}
        pagination={{ pageSize: 20 }}
        size="middle"
        locale={{ emptyText: "暂无考勤记录" }}
      />
    </Spin>
  );
}
