import { useState, useEffect, useRef } from "react";
import { Button, message, Modal, Upload, Tag, Space, Descriptions, Form, Input, Select, DatePicker, Tooltip } from "antd";
import { PlusOutlined, UploadOutlined, DownloadOutlined, EyeOutlined, EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { ProTable } from "@ant-design/pro-components";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import api from "../services/api";
import { GENDER_MAP, STUDENT_STATUS_MAP } from "../constants/status";
import { PageHeader } from "../components/PageHeader";

interface StudentRecord {
  id: number;
  studentNo: string;
  name: string;
  gender: string;
  class: { id: number; name: string } | null;
  status: string;
  hobbies: string;
  address: string;
  parents: { relation: string; name: string; phone: string }[];
}

interface ClassOption {
  id: number;
  name: string;
  gradeLevel: string;
}

export function StudentListPage() {
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<StudentRecord | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form] = Form.useForm();
  const actionRef = useRef<ActionType>();

  useEffect(() => {
    api.get("/classes", { params: { pageSize: 100 } }).then((res) => {
      setClasses(res.data.data.data || []);
    });
  }, []);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitLoading(true);
    try {
      const payload: Record<string, unknown> = {
        ...values,
        enrollmentDate: values.enrollmentDate
          ? (values.enrollmentDate as { format: (f: string) => string }).format("YYYY-MM-DD")
          : undefined,
        birthDate: values.birthDate
          ? (values.birthDate as { format: (f: string) => string }).format("YYYY-MM-DD")
          : undefined,
      };
      // 编辑时电话留空不覆盖，新增时允许传空
      if (editingStudent) {
        if (!(payload.fatherPhone as string)?.trim()) delete payload.fatherPhone;
        if (!(payload.motherPhone as string)?.trim()) delete payload.motherPhone;
      }

      if (editingStudent) {
        await api.put(`/students/${editingStudent.id}`, payload);
        message.success("更新成功");
      } else {
        await api.post("/students", payload);
        message.success("新增学生成功");
      }
      setFormVisible(false);
      form.resetFields();
      setEditingStudent(null);
      actionRef.current?.reload();
    } catch (err: any) {
      message.error(err.response?.data?.error || "操作失败");
    } finally {
      setSubmitLoading(false);
    }
  };

  const openEdit = async (record: StudentRecord) => {
    setEditingStudent(record);
    // 加载完整学生详情（含出生日期、入学日期、未脱敏电话等）
    try {
      const res = await api.get(`/students/${record.id}`);
      const detail = res.data.data;
      form.setFieldsValue({
        studentNo: detail.studentNo,
        name: detail.name,
        gender: detail.gender,
        classId: detail.class?.id ?? undefined,
        birthDate: detail.birthDate ? dayjs(detail.birthDate) : undefined,
        enrollmentDate: detail.enrollmentDate ? dayjs(detail.enrollmentDate) : undefined,
        address: detail.address,
        hobbies: detail.hobbies,
        fatherName: detail.parents?.find((p: any) => p.relation === "father")?.name,
        fatherPhone: "",
        motherName: detail.parents?.find((p: any) => p.relation === "mother")?.name,
        motherPhone: "",
      });
    } catch {
      message.error("加载学生信息失败");
      return;
    }
    setFormVisible(true);
  };

  const openAdd = () => {
    setEditingStudent(null);
    form.resetFields();
    setFormVisible(true);
  };

  const handleDelete = (id: number, name: string) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定要删除学生「${name}」吗？删除后将标记为已删除状态，该学生将从所有列表、统计中排除，关联账号将被禁用。`,
      onOk: async () => {
        try {
          await api.delete(`/students/${id}`);
          message.success("删除成功");
          actionRef.current?.reload();
        } catch (err: any) {
          message.error(err.response?.data?.error || "删除失败");
        }
      },
    });
  };

  const handleExport = async () => {
    try {
      const res = await api.get("/students/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = "students.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success("导出成功");
    } catch (err: any) {
      message.error("导出失败");
    }
  };

  const gradeStatusMap: Record<string, string> = { "7": "Default", "8": "Processing", "9": "Warning", "10": "Error", "11": "Success", "12": undefined as any };
  const classValueEnum = Object.fromEntries(
    classes.map((c) => [String(c.id), { text: c.name, status: gradeStatusMap[c.gradeLevel] || "Default" }])
  );

  const columns: ProColumns<StudentRecord>[] = [
    {
      title: "关键词",
      dataIndex: "keyword",
      hideInTable: true,
      fieldProps: { placeholder: "学号 / 姓名" },
    },
    {
      title: "班级",
      dataIndex: "classId",
      hideInTable: true,
      valueType: "select",
      fieldProps: { allowClear: true, placeholder: "选择班级" },
      valueEnum: classValueEnum,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      hideInTable: true,
      valueType: "select",
      valueEnum: Object.fromEntries(Object.entries(STUDENT_STATUS_MAP).map(([k, v]) => [k, v.text])),
    },
    { title: "学号", dataIndex: "studentNo", key: "studentNo", width: 120, hideInSearch: true },
    { title: "姓名", dataIndex: "name", key: "name", width: 100, hideInSearch: true },
    {
      title: "性别",
      dataIndex: "gender",
      key: "gender",
      width: 60,
      hideInSearch: true,
      render: (_, r) => {
        const g = GENDER_MAP[r.gender];
        return g ? <Tag color={g.color}>{g.text}</Tag> : r.gender;
      },
    },
    {
      title: "班级",
      dataIndex: ["class", "name"],
      key: "class",
      width: 120,
      hideInSearch: true,
      render: (_, r) => r.class?.name || "-",
    },
    { title: "爱好", dataIndex: "hobbies", key: "hobbies", width: 90, ellipsis: true, hideInSearch: true },
    { title: "住址", dataIndex: "address", key: "address", width: 140, ellipsis: true, hideInSearch: true },
    {
      title: "状态",
      dataIndex: "status",
      key: "status_table",
      width: 70,
      hideInSearch: true,
      render: (_, r) => {
        const s = STUDENT_STATUS_MAP[r.status];
        return s ? <Tag color={s.color}>{s.text}</Tag> : r.status;
      },
    },
    {
      title: "操作",
      key: "action",
      width: 200,
      fixed: "right",
      hideInSearch: true,
      render: (_, record) => (
        <Space size={0} split={<span style={{ color: "#e8e8e8" }}>|</span>}>
          <Button type="link" size="small" onClick={() => openEdit(record)}>编辑</Button>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setCurrentStudent(record); setDetailVisible(true); }}>详情</Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(record.id, record.name)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <ProTable<StudentRecord>
        columns={columns}
        request={async (params) => {
          const res = await api.get("/students", {
            params: {
              page: params.current,
              pageSize: params.pageSize,
              keyword: params.keyword || undefined,
              classId: params.classId ? Number(params.classId) : undefined,
              status: params.status || undefined,
            },
          });
          const { data, total } = res.data.data;
          return { data, total, success: true };
        }}
        actionRef={actionRef}
        rowKey="id"
        scroll={{ x: 1000 }}
        search={{ labelWidth: "auto" }}
        headerTitle={<PageHeader title="学生列表" desc="管理全校学生信息，支持新增、编辑、导入导出" />}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            新增学生
          </Button>,
          <Upload
            key="import"
            accept=".xlsx,.xls"
            showUploadList={false}
            customRequest={async (options) => {
              const formData = new FormData();
              formData.append("file", options.file as File);
              try {
                const res = await api.post("/students/import", formData);
                const { success: count, failed, errors } = res.data.data;
                if (failed > 0) {
                  const errorDetail = errors?.map((e: { row: number; reason: string }) => `第${e.row}行: ${e.reason}`).join("\n");
                  Modal.warning({
                    title: `导入完成: 成功 ${count} 条，失败 ${failed} 条`,
                    content: <pre style={{ maxHeight: 300, overflow: "auto", fontSize: 13 }}>{errorDetail}</pre>,
                    width: 500,
                  });
                } else {
                  message.success(`全部导入成功: ${count} 条`);
                }
                actionRef.current?.reload();
              } catch (err: any) {
                message.error(err.response?.data?.error || "导入失败");
              }
              options.onSuccess?.({});
            }}
          >
            <Tooltip title="支持列: 学号*(必填), 姓名*(必填), 性别, 年龄, 爱好, 住址, 班级, 父亲姓名, 父亲电话, 母亲姓名, 母亲电话">
              <Button icon={<UploadOutlined />}>导入 Excel</Button>
            </Tooltip>
          </Upload>,
          <Button key="export" icon={<DownloadOutlined />} onClick={handleExport}>
            导出 Excel
          </Button>,
        ]}
      />

      <Modal
        title="学生详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          currentStudent && (
            <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => {
              setDetailVisible(false);
              openEdit(currentStudent);
            }}>编辑</Button>
          ),
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>,
        ]}
        width={600}
      >
        {currentStudent && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="学号">{currentStudent.studentNo}</Descriptions.Item>
            <Descriptions.Item label="姓名">{currentStudent.name}</Descriptions.Item>
            <Descriptions.Item label="性别">{GENDER_MAP[currentStudent.gender]?.text || currentStudent.gender}</Descriptions.Item>
            <Descriptions.Item label="班级">{currentStudent.class?.name || "-"}</Descriptions.Item>
            <Descriptions.Item label="爱好">{currentStudent.hobbies || "-"}</Descriptions.Item>
            <Descriptions.Item label="状态">{STUDENT_STATUS_MAP[currentStudent.status]?.text || currentStudent.status}</Descriptions.Item>
            <Descriptions.Item label="住址" span={2}>{currentStudent.address || "-"}</Descriptions.Item>
            {currentStudent.parents?.map((p) => (
              <Descriptions.Item key={p.relation} label={p.relation === "father" ? "父亲" : "母亲"}>
                {p.name} - {p.phone}
              </Descriptions.Item>
            ))}
          </Descriptions>
        )}
      </Modal>

      <Modal
        title={editingStudent ? "编辑学生" : "新增学生"}
        open={formVisible}
        onCancel={() => {
          setFormVisible(false);
          form.resetFields();
          setEditingStudent(null);
        }}
        onOk={() => form.submit()}
        confirmLoading={submitLoading}
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Space style={{ display: "flex", gap: 16 }} wrap>
            <Form.Item name="studentNo" label="学号" rules={[{ required: true, message: "请输入学号" }]} style={{ width: 180 }}>
              <Input placeholder="如 20260011" />
            </Form.Item>
            <Form.Item name="name" label="姓名" rules={[{ required: true, message: "请输入姓名" }]} style={{ width: 180 }}>
              <Input placeholder="学生姓名" />
            </Form.Item>
            <Form.Item name="gender" label="性别" rules={[{ required: true, message: "请选择性别" }]} style={{ width: 180 }}>
              <Select
                options={[
                  { label: "男", value: "male" },
                  { label: "女", value: "female" },
                ]}
              />
            </Form.Item>
          </Space>
          <Space style={{ display: "flex", gap: 16 }} wrap>
            <Form.Item name="classId" label="班级" style={{ width: 180 }}>
              <Select
                allowClear
                placeholder="选择班级"
                options={classes.map((c) => ({ label: c.name, value: c.id }))}
              />
            </Form.Item>
            <Form.Item name="birthDate" label="出生日期" style={{ width: 180 }}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="enrollmentDate" label="入学日期" style={{ width: 180 }}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Space>
          <Form.Item name="address" label="住址">
            <Input placeholder="家庭住址" />
          </Form.Item>
          <Form.Item name="hobbies" label="爱好">
            <Input placeholder="兴趣爱好" />
          </Form.Item>
          <Space style={{ display: "flex", gap: 16 }} wrap>
            <Form.Item name="fatherName" label="父亲姓名" style={{ width: 275 }}>
              <Input placeholder="父亲姓名" />
            </Form.Item>
            <Form.Item name="fatherPhone" label="父亲电话" style={{ width: 275 }}>
              <Input placeholder="父亲电话" />
            </Form.Item>
          </Space>
          <Space style={{ display: "flex", gap: 16 }} wrap>
            <Form.Item name="motherName" label="母亲姓名" style={{ width: 275 }}>
              <Input placeholder="母亲姓名" />
            </Form.Item>
            <Form.Item name="motherPhone" label="母亲电话" style={{ width: 275 }}>
              <Input placeholder="母亲电话" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
