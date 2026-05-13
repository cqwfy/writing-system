import { useState, useEffect, useCallback, useRef } from "react";
import { Button, message, Select, Table, Tag, Card, Modal, Form, Input, Space, Popconfirm } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import api from "../services/api";

interface CourseInfo {
  id: number;
  name: string;
  code: string;
  teacher: { id: number; name: string } | null;
}

interface TimetableEntry {
  id: number;
  course: CourseInfo;
  dayOfWeek: number;
  period: number;
  classroom?: string;
  classId: number;
  semester: string;
  academicYear: string;
}

const DAYS = ["", "周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function TimetablePage() {
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [semester, setSemester] = useState("first");
  const [academicYear, setAcademicYear] = useState("2026-2027");
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ dayOfWeek: number; period: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    api.get("/classes/all").then((res) => {
      const list = res.data.data || [];
      setClasses(list);
      if (list.length > 0) setSelectedClassId(list[0].id);
    });
    api.get("/courses/all").then((res) => {
      setCourses(res.data.data || []);
    });
  }, []);

  const loadTimetable = useCallback(() => {
    if (!selectedClassId) return;
    setLoading(true);
    api.get(`/timetables/class/${selectedClassId}`, {
      params: { semester, academicYear, _t: Date.now() },
    })
      .then((res) => setEntries(res.data.data || []))
      .catch((err) => {
        console.error("课表加载失败:", err);
        message.error("课表加载失败");
      })
      .finally(() => setLoading(false));
  }, [selectedClassId, semester, academicYear]);

  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

  const timetableGrid: Record<string, TimetableEntry> = {};
  for (const e of entries) {
    timetableGrid[`${e.dayOfWeek}-${e.period}`] = e;
  }

  /** 点击按钮新增：自由选择星期和节次 */
  const openAddFromButton = () => {
    setEditingEntry(null);
    setSelectedCell(null);
    form.resetFields();
    form.setFieldsValue({ dayOfWeek: undefined, period: undefined, courseId: undefined, classroom: "" });
    setModalVisible(true);
  };

  /** 点击空白格新增：星期和节次已确定 */
  const openAddFromCell = (dayOfWeek: number, period: number) => {
    setEditingEntry(null);
    setSelectedCell({ dayOfWeek, period });
    form.resetFields();
    form.setFieldsValue({ dayOfWeek, period, courseId: undefined, classroom: "" });
    setModalVisible(true);
  };

  /** 点击课程标签编辑 */
  const openEditModal = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setSelectedCell(null);
    form.setFieldsValue({
      courseId: entry.course.id,
      classroom: entry.classroom || "",
    });
    setModalVisible(true);
  };

  // 用 ref 保存最新状态，避免闭包过期
  const editRef = useRef(editingEntry);
  const cellRef = useRef(selectedCell);
  const classRef = useRef(selectedClassId);
  const semRef = useRef(semester);
  const yearRef = useRef(academicYear);
  editRef.current = editingEntry;
  cellRef.current = selectedCell;
  classRef.current = selectedClassId;
  semRef.current = semester;
  yearRef.current = academicYear;

  const handleSave = async () => {
    let values: { courseId: number; classroom?: string; dayOfWeek?: number; period?: number };
    try {
      values = await form.validateFields();
    } catch {
      return; // 表单校验失败，Ant Design 会自动提示
    }

    const entry = editRef.current;
    const cell = cellRef.current;
    const classId = classRef.current;
    const sem = semRef.current;
    const year = yearRef.current;

    if (!classId) {
      message.error("请先选择班级");
      return;
    }

    setSubmitting(true);

    try {
      if (entry) {
        // 编辑模式：直接用 PUT /:id 更新
        await api.put(`/timetables/${entry.id}`, {
          courseId: values.courseId,
          classroom: values.classroom || null,
        });
        message.success("修改成功");
      } else if (cell) {
        // 从空白格新增
        await api.post("/timetables/batch", {
          entries: [{
            classId,
            courseId: values.courseId,
            dayOfWeek: cell.dayOfWeek,
            period: cell.period,
            classroom: values.classroom || null,
            semester: sem,
            academicYear: year,
          }],
        });
        message.success("新增成功");
      } else {
        // 从按钮新增
        await api.post("/timetables/batch", {
          entries: [{
            classId,
            courseId: values.courseId,
            dayOfWeek: values.dayOfWeek,
            period: values.period,
            classroom: values.classroom || null,
            semester: sem,
            academicYear: year,
          }],
        });
        message.success("新增成功");
      }
      setModalVisible(false);
      form.resetFields();
      loadTimetable();
    } catch (err: any) {
      message.error(err.response?.data?.error || err.message || "操作失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingEntry) return;
    try {
      await api.delete(`/timetables/${editingEntry.id}`);
      message.success("删除成功");
      setModalVisible(false);
      form.resetFields();
      loadTimetable();
    } catch (err: any) {
      message.error(err.response?.data?.error || "删除失败");
    }
  };

  const isAdding = !editingEntry;

  return (
    <div>
      <Card
        title="课表管理"
        extra={
          <Space>
            <Select
              value={selectedClassId}
              onChange={setSelectedClassId}
              style={{ width: 160 }}
              options={classes.map((c) => ({ label: c.name, value: c.id }))}
              placeholder="选择班级"
            />
            <Select
              value={semester}
              onChange={setSemester}
              style={{ width: 120 }}
              options={[
                { label: "上学期", value: "first" },
                { label: "下学期", value: "second" },
              ]}
            />
            <Select
              value={academicYear}
              onChange={setAcademicYear}
              style={{ width: 140 }}
              options={[
                { label: "2025-2026", value: "2025-2026" },
                { label: "2026-2027", value: "2026-2027" },
                { label: "2027-2028", value: "2027-2028" },
              ]}
            />
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddFromButton}>
            新增排课
          </Button>
        </div>
        <Table
          loading={loading}
          dataSource={PERIODS.map((p) => {
            const row: Record<string, unknown> = { key: p, period: `第${p}节`, _period: p };
            for (let d = 1; d <= 7; d++) {
              row[`day${d}`] = timetableGrid[`${d}-${p}`] || null;
            }
            return row;
          })}
          columns={[
            { title: "", dataIndex: "period", key: "period", width: 80 },
            ...DAYS.filter(Boolean).map((day, i) => ({
              title: day,
              dataIndex: `day${i + 1}`,
              key: `day${i + 1}`,
              render: (entry: TimetableEntry | null, record: Record<string, unknown>) => {
                const period = (record as any)._period as number;
                if (entry) {
                  return (
                    <Tag
                      color="blue"
                      style={{ margin: 2, cursor: "pointer", padding: "4px 8px" }}
                      onClick={() => openEditModal(entry)}
                    >
                      <div style={{ fontWeight: 500 }}>{entry.course?.name}</div>
                      <div style={{ fontSize: 12, opacity: 0.85 }}>
                        {entry.course?.teacher?.name || ""}
                      </div>
                      {entry.classroom && (
                        <div style={{ fontSize: 11, opacity: 0.7 }}>{entry.classroom}</div>
                      )}
                    </Tag>
                  );
                }
                return (
                  <div
                    style={{
                      minHeight: 44,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onClick={() => openAddFromCell(i + 1, period)}
                  >
                    <PlusOutlined style={{ color: "#bbb", fontSize: 12 }} />
                  </div>
                );
              },
            })),
          ]}
          pagination={false}
          bordered
          size="small"
        />
      </Card>

      <Modal
        title={
          editingEntry
            ? `编辑排课 - ${DAYS[editingEntry.dayOfWeek]} 第${editingEntry.period}节`
            : selectedCell
            ? `新增排课 - ${DAYS[selectedCell.dayOfWeek]} 第${selectedCell.period}节`
            : "新增排课"
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              {editingEntry && (
                <Popconfirm title="确定删除这条排课？" onConfirm={handleDelete}>
                  <Button danger icon={<DeleteOutlined />}>删除</Button>
                </Popconfirm>
              )}
            </div>
            <Space>
              <Button onClick={() => { setModalVisible(false); form.resetFields(); }}>取消</Button>
              <Button type="primary" onClick={handleSave} loading={submitting}>
                {editingEntry ? "保存" : "新增"}
              </Button>
            </Space>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          {isAdding && (
            <Space style={{ display: "flex", gap: 16 }}>
              <Form.Item
                name="dayOfWeek"
                label="星期"
                style={{ width: 160 }}
                rules={[{ required: true, message: "请选择星期" }]}
              >
                <Select
                  disabled={!!selectedCell}
                  placeholder="选择星期"
                  options={DAYS.filter(Boolean).map((d, idx) => ({
                    label: d,
                    value: idx + 1,
                  }))}
                />
              </Form.Item>
              <Form.Item
                name="period"
                label="节次"
                style={{ width: 160 }}
                rules={[{ required: true, message: "请选择节次" }]}
              >
                <Select
                  disabled={!!selectedCell}
                  placeholder="选择节次"
                  options={PERIODS.map((p) => ({ label: `第${p}节`, value: p }))}
                />
              </Form.Item>
            </Space>
          )}
          {editingEntry && (
            <div style={{ marginBottom: 16, padding: "8px 12px", background: "#f5f5f5", borderRadius: 6, color: "#666" }}>
              {DAYS[editingEntry.dayOfWeek]} 第{editingEntry.period}节
            </div>
          )}
          <Form.Item
            name="courseId"
            label="课程"
            rules={[{ required: true, message: "请选择课程" }]}
          >
            <Select
              showSearch
              placeholder="选择课程"
              filterOption={(input, option) =>
                (option?.label as string)?.includes(input)
              }
              options={courses.map((c) => ({
                label: `${c.name} (${c.teacher?.name || "未分配教师"})`,
                value: c.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="classroom" label="教室">
            <Input placeholder="如 101教室" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
