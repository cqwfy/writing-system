import { useRef, useState, useEffect } from "react";
import { Button, message, Modal, Tag, Space, Form, Select, InputNumber, Tabs, Descriptions, Card, Statistic, Row, Col, Table } from "antd";
import { PlusOutlined, SendOutlined, BarChartOutlined } from "@ant-design/icons";
import { ProTable } from "@ant-design/pro-components";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import api from "../services/api";

interface ExamRecord {
  id: number;
  name: string;
  semester: string;
  academicYear: string;
  examDate: string | null;
  weight: number | null;
}

interface GradeRecord {
  id: number;
  student: { id: number; name: string; studentNo: string };
  course: { id: number; name: string };
  score: number;
  classRank: number | null;
  gradeRank: number | null;
}

export function GradesPage() {
  const examActionRef = useRef<ActionType>();
  const gradeActionRef = useRef<ActionType>();
  const [examModalVisible, setExamModalVisible] = useState(false);
  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [courses, setCourses] = useState<{ id: number; name: string }[]>([]);
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
  const [examOptions, setExamOptions] = useState<{ label: string; value: number }[]>([]);
  const [gradeClassId, setGradeClassId] = useState<number | null>(null);
  const [classStudents, setClassStudents] = useState<{ id: number; name: string; studentNo: string }[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [examForm] = Form.useForm();
  const [gradeForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [examTypeName, setExamTypeName] = useState<string>("");

  useEffect(() => {
    api.get("/courses/all").then((res) => setCourses(res.data.data || []));
    api.get("/classes/all").then((res) => setClasses(res.data.data || []));
    api.get("/grades/exams").then((res) => {
      const exams = res.data.data || [];
      setExamOptions(exams.map((e: any) => ({ label: `${e.name}（${e.academicYear} ${e.semester === "first" ? "上" : "下"}）`, value: e.id })));
    });
  }, []);

  const loadClassStudents = async (classId: number) => {
    setGradeClassId(classId);
    const res = await api.get(`/classes/${classId}/students`);
    setClassStudents(res.data.data || []);
  };

  const examColumns: ProColumns<ExamRecord>[] = [
    { title: "考试名称", dataIndex: "name", key: "name", width: 150 },
    {
      title: "学期", dataIndex: "semester", key: "semester", width: 100,
      render: (_, r) => r.semester === "first" ? "上学期" : "下学期",
    },
    { title: "学年", dataIndex: "academicYear", key: "academicYear", width: 120 },
    { title: "考试日期", dataIndex: "examDate", key: "examDate", width: 120, valueType: "date" },
    {
      title: "操作", key: "action", width: 280,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => {
            setSelectedExamId(record.id);
            gradeForm.resetFields();
            setGradeClassId(null);
            setClassStudents([]);
            setGradeModalVisible(true);
          }}>录入成绩</Button>
          <Button type="link" icon={<SendOutlined />} onClick={async () => {
            try {
              await api.post(`/grades/publish/${record.id}`);
              message.success("成绩已发布");
              examActionRef.current?.reload();
            } catch (err: any) {
              message.error(err.response?.data?.error || "发布失败");
            }
          }}>发布</Button>
          <Button type="link" icon={<BarChartOutlined />} onClick={async () => {
            try {
              setSelectedExamId(record.id);
              const res = await api.get(`/grades/stats/${record.id}`);
              setStats(res.data.data);
              setStatsModalVisible(true);
            } catch (err: any) {
              message.error(err.response?.data?.error || "获取统计失败");
            }
          }}>统计</Button>
        </Space>
      ),
    },
  ];

  const gradeColumns: ProColumns<GradeRecord>[] = [
    {
      title: "考试",
      dataIndex: "examTypeId",
      hideInTable: true,
      valueType: "select",
      fieldProps: { allowClear: false, placeholder: "选择考试" },
      valueEnum: Object.fromEntries(examOptions.map((e) => [String(e.value), e.label])),
    },
    {
      title: "科目",
      dataIndex: "courseId",
      hideInTable: true,
      valueType: "select",
      fieldProps: { allowClear: true, placeholder: "全部科目" },
      valueEnum: Object.fromEntries(courses.map((c) => [String(c.id), c.name])),
    },
    { title: "学生", dataIndex: ["student", "name"], key: "student", width: 100, search: false },
    { title: "学号", dataIndex: ["student", "studentNo"], key: "studentNo", width: 120, search: false },
    { title: "科目", dataIndex: ["course", "name"], key: "course", width: 100, search: false },
    { title: "分数", dataIndex: "score", key: "score", width: 80, search: false },
    {
      title: "班排", dataIndex: "classRank", key: "classRank", width: 60, search: false,
      render: (_, r) => r.classRank ? <Tag color={r.classRank <= 5 ? "red" : r.classRank <= 10 ? "orange" : "default"}>{r.classRank}</Tag> : "-",
    },
    {
      title: "级排", dataIndex: "gradeRank", key: "gradeRank", width: 60, search: false,
      render: (_, r) => r.gradeRank ? <Tag color={r.gradeRank <= 20 ? "red" : "default"}>{r.gradeRank}</Tag> : "-",
    },
  ];

  const handleCreateExam = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      const payload = { ...values };
      if (values.name === "月考" && values.examMonth) {
        payload.name = `${values.examMonth}月月考`;
      }
      delete payload.examMonth;
      await api.post("/grades/exams", payload);
      message.success("创建考试成功");
      setExamModalVisible(false);
      examForm.resetFields();
      setExamTypeName("");
      examActionRef.current?.reload();
    } catch (err: any) {
      message.error(err.response?.data?.error || "创建失败");
    } finally {
      setLoading(false);
    }
  };

  const handleBatchGrade = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      const grades = (values as any).grades || [];
      await api.post("/grades/batch", { examTypeId: selectedExamId, grades });
      message.success("成绩录入成功");
      setGradeModalVisible(false);
      gradeActionRef.current?.reload();
    } catch (err: any) {
      message.error(err.response?.data?.error || "录入失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Tabs defaultActiveKey="exams" items={[
        {
          key: "exams",
        label: "考试管理",
        children: (
          <div>
            <ProTable<ExamRecord>
              columns={examColumns}
              request={async (params) => {
                const res = await api.get("/grades/exams", { params: { page: params.current, pageSize: params.pageSize } });
                return { data: res.data.data, total: res.data.total, success: true };
              }}
              actionRef={examActionRef}
              rowKey="id"
              search={false}
              headerTitle="考试列表"
              toolBarRender={() => [
                <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => {
                  examForm.resetFields();
                  setExamTypeName("");
                  setExamModalVisible(true);
                }}>新增考试</Button>,
              ]}
            />
            <Modal title="新增考试" open={examModalVisible}
              onCancel={() => { setExamModalVisible(false); examForm.resetFields(); setExamTypeName(""); }}
              onOk={() => examForm.submit()} confirmLoading={loading}
            >
              <Form form={examForm} layout="vertical" onFinish={handleCreateExam}>
                <Form.Item name="name" label="考试名称" rules={[{ required: true }]}>
                  <Select
                    options={[{ label: "月考", value: "月考" }, { label: "期中考试", value: "期中考试" }, { label: "期末考试", value: "期末考试" }]}
                    onChange={(val) => { setExamTypeName(val); examForm.resetFields(["examMonth"]); }}
                  />
                </Form.Item>
                {examTypeName === "月考" && (
                  <Form.Item name="examMonth" label="选择月份" rules={[{ required: true, message: "请选择月份" }]}>
                    <Select
                      placeholder="选择月份"
                      options={Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}月`, value: i + 1 }))}
                    />
                  </Form.Item>
                )}
                <Space style={{ display: "flex", gap: 16 }}>
                  <Form.Item name="semester" label="学期" rules={[{ required: true }]} style={{ width: 200 }}>
                    <Select options={[{ label: "上学期", value: "first" }, { label: "下学期", value: "second" }]} />
                  </Form.Item>
                  <Form.Item name="academicYear" label="学年" rules={[{ required: true }]} style={{ width: 200 }}>
                    <Select options={[{ label: "2026-2027", value: "2026-2027" }, { label: "2025-2026", value: "2025-2026" }]} />
                  </Form.Item>
                </Space>
              </Form>
            </Modal>
          </div>
        ),
      },
      {
        key: "grades",
        label: "成绩查询",
        children: (
          <ProTable<GradeRecord>
            columns={gradeColumns}
            request={async (params) => {
              if (!params.examTypeId) return { data: [], total: 0, success: true };
              const res = await api.get("/grades", { params: { page: params.current, pageSize: params.pageSize, examTypeId: params.examTypeId, courseId: params.courseId || undefined } });
              return { data: res.data.data.data, total: res.data.data.total, success: true };
            }}
            actionRef={gradeActionRef}
            rowKey="id"
            search={{ labelWidth: "auto" }}
            headerTitle="成绩列表"
          />
        ),
      },
    ]} />
      <Modal title="录入成绩" open={gradeModalVisible}
        onCancel={() => { setGradeModalVisible(false); setGradeClassId(null); setClassStudents([]); }}
        onOk={() => gradeForm.submit()} confirmLoading={loading}
        width={640}
      >
        <Space style={{ marginBottom: 16 }}>
          <span>选择班级：</span>
          <Select
            placeholder="选择班级"
            style={{ width: 220 }}
            value={gradeClassId}
            options={classes.map((c) => ({ label: c.name, value: c.id }))}
            onChange={(val) => { loadClassStudents(val); gradeForm.resetFields(["grades"]); }}
          />
        </Space>
        <Form form={gradeForm} layout="vertical" onFinish={handleBatchGrade}>
          <Form.List name="grades">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                    <Form.Item {...rest} name={[name, "studentId"]} rules={[{ required: true }]} style={{ width: 170 }}>
                      <Select
                        placeholder="选择学生"
                        showSearch
                        optionFilterProp="label"
                        disabled={!gradeClassId}
                        options={classStudents.map((s) => ({ label: `${s.name} (${s.studentNo})`, value: s.id }))}
                      />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, "courseId"]} rules={[{ required: true }]} style={{ width: 160 }}>
                      <Select placeholder="科目" options={courses.map((c) => ({ label: c.name, value: c.id }))} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, "score"]} rules={[{ required: true }]} style={{ width: 100 }}>
                      <InputNumber min={0} max={300} placeholder="分数" />
                    </Form.Item>
                    <Button type="link" danger onClick={() => remove(name)}>删除</Button>
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block disabled={!gradeClassId}>
                  + 添加成绩行
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      <Modal title="成绩统计" open={statsModalVisible}
        onCancel={() => setStatsModalVisible(false)}
        footer={null} width={700}
      >
        {stats && (
          <Row gutter={16}>
            <Col span={8}><Statistic title="平均分" value={stats.avgScore} precision={1} /></Col>
            <Col span={8}><Statistic title="中位数" value={stats.medianScore} precision={1} /></Col>
            <Col span={8}><Statistic title="最高分" value={stats.maxScore} /></Col>
            <Col span={8}><Statistic title="最低分" value={stats.minScore} /></Col>
            <Col span={8}><Statistic title="及格率" value={stats.passRate} suffix="%" precision={1} /></Col>
            <Col span={8}><Statistic title="优秀率" value={stats.excellenceRate} suffix="%" precision={1} /></Col>
          </Row>
        )}
        {stats?.distribution && (
          <Table
            style={{ marginTop: 16 }}
            dataSource={stats.distribution.map((d: any) => ({ key: d.range, range: d.range, count: d.count }))}
            columns={[
              { title: "分数段", dataIndex: "range", key: "range" },
              { title: "人数", dataIndex: "count", key: "count" },
            ]}
            pagination={false}
            size="small"
          />
        )}
      </Modal>
    </>
  );
}
