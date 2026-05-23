import { useRef, useState, useEffect } from "react";
import { Button, message, Modal, Tag, Space, Form, Input, Select, Popconfirm } from "antd";
import { PlusOutlined, RiseOutlined } from "@ant-design/icons";
import { ProTable } from "@ant-design/pro-components";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import api from "../services/api";
import { PageHeader } from "../components/PageHeader";

interface ClassRecord {
  id: number;
  name: string;
  gradeLevel: string;
  studentCount: number;
  homeroomTeacher: { id: number; name: string } | null;
  homeroomTeacherId?: number;
  academicYear: string;
  status: string;
}

export function ClassListPage() {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<{ id: number; name: string; teacherNo: string; subject: string }[]>([]);

  useEffect(() => {
    api.get("/teachers/all").then((res) => setTeachers(res.data.data || []));
  }, []);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      if (editingId) {
        await api.put(`/classes/${editingId}`, values);
        message.success("更新成功");
      } else {
        await api.post("/classes", values);
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

  const handlePromoteGrades = () => {
    Modal.confirm({
      title: "执行学年升级",
      icon: <RiseOutlined />,
      content: (
        <div style={{ lineHeight: 2 }}>
          <p>确定要执行<strong>学年升级</strong>吗？执行后：</p>
          <div style={{ background: "#f5f5f5", borderRadius: 8, padding: "8px 16px", margin: "8px 0" }}>
            <p style={{ margin: 2 }}>七年级 → 八年级</p>
            <p style={{ margin: 2 }}>八年级 → 九年级</p>
            <p style={{ margin: 2 }}>九年级 → 高一</p>
            <p style={{ margin: 2 }}>高一 → 高二</p>
            <p style={{ margin: 2 }}>高二 → 高三</p>
            <p style={{ margin: 2, color: "#cf1322" }}>高三 → 已毕业</p>
          </div>
          <p style={{ color: "#ff4d4f" }}>此操作不可撤销！</p>
        </div>
      ),
      okText: "确认升级",
      okButtonProps: { danger: true },
      width: 480,
      onOk: async () => {
        try {
          const res = await api.post("/classes/promote-grades");
          const { promotedStudents, graduatedStudents, promotedClasses, archivedClasses } = res.data.data;
          Modal.info({
            title: "学年升级完成",
            content: (
              <div style={{ lineHeight: 2.2 }}>
                <p>升级班级：<strong>{promotedClasses}</strong> 个</p>
                <p>升级学生：<strong>{promotedStudents}</strong> 名</p>
                <p>毕业学生：<strong>{graduatedStudents}</strong> 名</p>
                <p>归档班级：<strong>{archivedClasses}</strong> 个</p>
              </div>
            ),
            okText: "知道了",
          });
          actionRef.current?.reload();
        } catch (err: any) {
          message.error(err.response?.data?.error || "学年升级失败");
        }
      },
    });
  };

  const columns: ProColumns<ClassRecord>[] = [
    { title: "班级名称", dataIndex: "name", key: "name", width: 160 },
    {
      title: "年级",
      dataIndex: "gradeLevel",
      key: "gradeLevel",
      width: 80,
      valueType: "select",
      valueEnum: { "7": "七年级", "8": "八年级", "9": "九年级", "10": "高一", "11": "高二", "12": "高三" },
      render: (_, r) => {
        const m: Record<string, string> = { "7": "七年级", "8": "八年级", "9": "九年级", "10": "高一", "11": "高二", "12": "高三" };
        return m[r.gradeLevel] || r.gradeLevel;
      },
    },
    { title: "人数", dataIndex: "studentCount", key: "studentCount", width: 80 },
    {
      title: "班主任",
      dataIndex: ["homeroomTeacher", "name"],
      key: "teacher",
      width: 120,
      render: (_, r) => r.homeroomTeacher?.name || "-",
    },
    { title: "学年", dataIndex: "academicYear", key: "academicYear", width: 120 },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 80,
      valueType: "select",
      valueEnum: { active: "启用", archived: "归档" },
      render: (_, r) => <Tag color={r.status === "active" ? "green" : "default"}>{r.status === "active" ? "启用" : "归档"}</Tag>,
    },
    {
      title: "操作",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => {
            setEditingId(record.id);
            form.setFieldsValue({ ...record, homeroomTeacherId: record.homeroomTeacher?.id });
            setModalVisible(true);
          }}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={async () => {
            await api.put(`/classes/${record.id}`, { status: "archived" });
            message.success("已归档");
            actionRef.current?.reload();
          }}>
            <Button type="link" danger>归档</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <ProTable<ClassRecord>
        columns={columns}
        request={async (params) => {
          const res = await api.get("/classes", {
            params: { page: params.current, pageSize: params.pageSize, keyword: params.keyword },
          });
          return { data: res.data.data.data, total: res.data.data.total, success: true };
        }}
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: "auto" }}
        headerTitle={<PageHeader title="班级列表" desc="按年级管理班级，设置班主任和班号" />}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => {
            setEditingId(null);
            form.resetFields();
            setModalVisible(true);
          }}>新增班级</Button>,
          <Button key="promote" icon={<RiseOutlined />} onClick={handlePromoteGrades}>
            执行学年升级
          </Button>,
        ]}
      />
      <Modal title={editingId ? "编辑班级" : "新增班级"} open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        onOk={() => form.submit()} confirmLoading={loading}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="班级名称" rules={[{ required: true }]}>
            <Input placeholder="如 七年级(1)班" />
          </Form.Item>
          <Form.Item name="gradeLevel" label="年级" rules={[{ required: true }]}>
            <Select options={[{ label: "七年级", value: "7" }, { label: "八年级", value: "8" }, { label: "九年级", value: "9" }, { label: "高一", value: "10" }, { label: "高二", value: "11" }, { label: "高三", value: "12" }]} />
          </Form.Item>
          <Form.Item name="homeroomTeacherId" label="班主任">
            <Select allowClear placeholder="选择班主任" options={teachers.map((t) => ({ label: `${t.name}（${t.subject}）`, value: t.id }))} />
          </Form.Item>
          <Form.Item name="academicYear" label="学年" rules={[{ required: true }]}>
            <Input placeholder="如 2026-2027" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
