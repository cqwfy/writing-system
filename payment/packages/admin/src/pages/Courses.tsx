import { useEffect, useRef, useState } from "react";
import { Button, message, Modal, Space, Form, Input, Select, InputNumber, Popconfirm } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { ProTable } from "@ant-design/pro-components";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import api from "../services/api";
import { PageHeader } from "../components/PageHeader";

interface CourseRecord {
  id: number;
  name: string;
  code: string;
  gradeLevel: string;
  teacher: { id: number; name: string } | null;
  weeklyHours: number;
  semester: string;
  academicYear: string;
}

export function CourseListPage() {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    api.get("/teachers/all").then((res) => {
      setTeachers(res.data.data || []);
    });
  }, []);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      if (editingId) {
        await api.put(`/courses/${editingId}`, values);
        message.success("更新成功");
      } else {
        await api.post("/courses", values);
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

  const columns: ProColumns<CourseRecord>[] = [
    { title: "课程名称", dataIndex: "name", key: "name", width: 150 },
    { title: "课程代码", dataIndex: "code", key: "code", width: 120 },
    {
      title: "年级",
      dataIndex: "gradeLevel",
      key: "gradeLevel",
      width: 100,
      valueType: "select",
      valueEnum: { "7": "七年级", "8": "八年级", "9": "九年级", "10": "高一", "11": "高二", "12": "高三" },
      render: (_, r) => ({ "7": "七年级", "8": "八年级", "9": "九年级", "10": "高一", "11": "高二", "12": "高三" })[r.gradeLevel] || r.gradeLevel,
    },
    {
      title: "教师",
      dataIndex: ["teacher", "name"],
      key: "teacher",
      width: 120,
      render: (_, r) => r.teacher?.name || "-",
    },
    { title: "周课时", dataIndex: "weeklyHours", key: "weeklyHours", width: 80 },
    {
      title: "学期",
      dataIndex: "semester",
      key: "semester",
      width: 80,
      valueType: "select",
      valueEnum: { first: "上学期", second: "下学期" },
      render: (_, r) => r.semester === "first" ? "上学期" : "下学期",
    },
    { title: "学年", dataIndex: "academicYear", key: "academicYear", width: 120 },
    {
      title: "操作",
      key: "action",
      width: 120,
      hideInSearch: true,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => {
            setEditingId(record.id);
            form.setFieldsValue({ ...record, teacherId: record.teacher?.id });
            setModalVisible(true);
          }}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={async () => {
            await api.delete(`/courses/${record.id}`);
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
      <ProTable<CourseRecord>
        columns={columns}
        request={async (params) => {
          const res = await api.get("/courses", {
            params: { page: params.current, pageSize: params.pageSize, keyword: params.keyword },
          });
          return { data: res.data.data.data, total: res.data.data.total, success: true };
        }}
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: "auto" }}
        headerTitle={<PageHeader title="课程列表" desc="管理课程信息，关联年级、教师和课时" />}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => {
            setEditingId(null);
            form.resetFields();
            setModalVisible(true);
          }}>新增课程</Button>,
        ]}
      />
      <Modal title={editingId ? "编辑课程" : "新增课程"} open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        onOk={() => form.submit()} confirmLoading={loading}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="课程名称" rules={[{ required: true }]}>
            <Input placeholder="如 数学" />
          </Form.Item>
          <Form.Item name="code" label="课程代码" rules={[{ required: true }]}>
            <Input placeholder="如 MATH7" />
          </Form.Item>
          <Space style={{ display: "flex", gap: 16 }}>
            <Form.Item name="gradeLevel" label="年级" rules={[{ required: true }]} style={{ width: 160 }}>
              <Select options={[{ label: "七年级", value: "7" }, { label: "八年级", value: "8" }, { label: "九年级", value: "9" }, { label: "高一", value: "10" }, { label: "高二", value: "11" }, { label: "高三", value: "12" }]} />
            </Form.Item>
            <Form.Item name="weeklyHours" label="周课时" rules={[{ required: true }]} style={{ width: 160 }}>
              <InputNumber min={1} max={10} style={{ width: "100%" }} />
            </Form.Item>
          </Space>
          <Form.Item name="teacherId" label="关联教师" style={{ width: "100%" }}>
            <Select
              showSearch
              allowClear
              placeholder="选择教师（可选）"
              filterOption={(input, option) =>
                (option?.label as string)?.includes(input)
              }
              options={teachers.map((t) => ({ label: t.name, value: t.id }))}
            />
          </Form.Item>
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
  );
}
