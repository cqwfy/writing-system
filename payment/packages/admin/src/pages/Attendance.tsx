import { useRef, useState, useEffect } from "react";
import { Button, message, Modal, Tag, Space, Form, Select, DatePicker, Tabs } from "antd";
import { ProTable } from "@ant-design/pro-components";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import api from "../services/api";

interface AttendanceRecord {
  id: number;
  student: { id: number; name: string; studentNo: string };
  recordDate: string;
  period: string;
  status: string;
  remark?: string;
}

interface LeaveRequest {
  id: number;
  student: { id: number; name: string };
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
  status: string;
}

const STATUS_MAP: Record<string, { text: string; color: string }> = {
  present: { text: "出勤", color: "green" },
  absent: { text: "缺勤", color: "red" },
  late: { text: "迟到", color: "orange" },
  early_leave: { text: "早退", color: "gold" },
  sick_leave: { text: "病假", color: "blue" },
  personal_leave: { text: "事假", color: "purple" },
};

export function AttendancePage() {
  const actionRef = useRef<ActionType>();
  const leaveActionRef = useRef<ActionType>();
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    api.get("/classes/all").then((res) => setClasses(res.data.data || []));
  }, []);

  const attendanceColumns: ProColumns<AttendanceRecord>[] = [
    {
      title: "学生", dataIndex: ["student", "name"], key: "student", width: 100,
    },
    { title: "学号", dataIndex: ["student", "studentNo"], key: "studentNo", width: 120 },
    { title: "日期", dataIndex: "recordDate", key: "recordDate", width: 120, valueType: "date" },
    {
      title: "时段", dataIndex: "period", key: "period", width: 80,
      valueType: "select",
      valueEnum: { morning: "上午", afternoon: "下午", full_day: "全天" },
    },
    {
      title: "状态", dataIndex: "status", key: "status", width: 80,
      valueType: "select",
      valueEnum: {
        present: "出勤", absent: "缺勤", late: "迟到",
        early_leave: "早退", sick_leave: "病假", personal_leave: "事假",
      },
      render: (_, r) => {
        const s = STATUS_MAP[r.status];
        return s ? <Tag color={s.color}>{s.text}</Tag> : r.status;
      },
    },
    { title: "备注", dataIndex: "remark", key: "remark", width: 120, ellipsis: true },
  ];

  const leaveColumns: ProColumns<LeaveRequest>[] = [
    { title: "学生", dataIndex: ["student", "name"], key: "student", width: 100 },
    {
      title: "类型", dataIndex: "leaveType", key: "leaveType", width: 80,
      render: (_, r) => r.leaveType === "sick" ? <Tag color="blue">病假</Tag> : <Tag color="purple">事假</Tag>,
    },
    { title: "开始", dataIndex: "startDate", key: "startDate", width: 120, valueType: "date" },
    { title: "结束", dataIndex: "endDate", key: "endDate", width: 120, valueType: "date" },
    { title: "原因", dataIndex: "reason", key: "reason", width: 200, ellipsis: true },
    {
      title: "状态", dataIndex: "status", key: "status", width: 80,
      render: (_, r) => {
        const m: Record<string, { text: string; color: string }> = {
          pending: { text: "待审批", color: "orange" },
          approved: { text: "已批准", color: "green" },
          rejected: { text: "已拒绝", color: "red" },
        };
        const s = m[r.status];
        return s ? <Tag color={s.color}>{s.text}</Tag> : r.status;
      },
    },
    {
      title: "操作", key: "action", width: 200,
      render: (_, record) => record.status === "pending" ? (
        <Space>
          <Button type="link" onClick={async () => {
            await api.put(`/attendance/leave-requests/${record.id}/approve`, { status: "approved" });
            message.success("已批准");
            leaveActionRef.current?.reload();
          }}>批准</Button>
          <Button type="link" danger onClick={async () => {
            await api.put(`/attendance/leave-requests/${record.id}/approve`, { status: "rejected" });
            message.success("已拒绝");
            leaveActionRef.current?.reload();
          }}>拒绝</Button>
        </Space>
      ) : null,
    },
  ];

  return (
    <Tabs defaultActiveKey="attendance" items={[
      {
        key: "attendance",
        label: "考勤记录",
        children: (
          <ProTable<AttendanceRecord>
            columns={attendanceColumns}
            request={async (params) => {
              const res = await api.get("/attendance", { params: { page: params.current, pageSize: params.pageSize } });
              return { data: res.data.data.data, total: res.data.data.total, success: true };
            }}
            actionRef={actionRef}
            rowKey="id"
            search={{ labelWidth: "auto" }}
            headerTitle="考勤记录"
          />
        ),
      },
      {
        key: "leaves",
        label: "请假审批",
        children: (
          <ProTable<LeaveRequest>
            columns={leaveColumns}
            request={async (params) => {
              const res = await api.get("/attendance/leave-requests", { params: { page: params.current, pageSize: params.pageSize } });
              return { data: res.data.data, total: res.data.total, success: true };
            }}
            actionRef={leaveActionRef}
            rowKey="id"
            search={false}
            headerTitle="请假申请"
          />
        ),
      },
    ]} />
  );
}
