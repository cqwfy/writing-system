import { useRef, useState, useEffect } from "react";
import { Button, message, Modal, Tag, Space, Form, Input, Select, Tabs, Popconfirm } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { ProTable } from "@ant-design/pro-components";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import api from "../services/api";

interface Building {
  id: number;
  name: string;
  buildingType: string;
  floorCount: number;
  rooms?: RoomRecord[];
}

interface RoomRecord {
  id: number;
  roomNumber: string;
  building: { id: number; name: string };
  capacity: number;
  occupied: number;
  status: string;
  students: { id: number; name: string; studentNo: string }[];
}

export function DormitoryPage() {
  const buildingActionRef = useRef<ActionType>();
  const roomActionRef = useRef<ActionType>();
  const [buildingModalVisible, setBuildingModalVisible] = useState(false);
  const [roomModalVisible, setRoomModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [buildings, setBuildings] = useState<{ id: number; name: string }[]>([]);
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
  const [studentsByClass, setStudentsByClass] = useState<Record<number, { id: number; name: string; studentNo: string }[]>>({});
  const [buildingForm] = Form.useForm();
  const [roomForm] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const watchedStudents: Array<{ classId?: number }> = Form.useWatch("students", assignForm) || [];

  useEffect(() => {
    api.get("/dormitories/buildings").then((res) => {
      setBuildings((res.data.data || []).map((b: any) => ({ id: b.id, name: b.name })));
    });
    api.get("/classes/all").then((res) => setClasses(res.data.data || []));
  }, []);

  const loadStudentsForClass = async (classId: number) => {
    if (studentsByClass[classId]) return;
    const res = await api.get(`/classes/${classId}/students`);
    setStudentsByClass((prev) => ({ ...prev, [classId]: res.data.data || [] }));
  };

  const handleCreateBuilding = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      await api.post("/dormitories/buildings", values);
      message.success("创建宿舍楼成功");
      setBuildingModalVisible(false);
      buildingForm.resetFields();
      buildingActionRef.current?.reload();
    } catch (err: any) {
      message.error(err.response?.data?.error || "创建失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      await api.post("/dormitories/rooms", values);
      message.success("创建房间成功");
      setRoomModalVisible(false);
      roomForm.resetFields();
      roomActionRef.current?.reload();
    } catch (err: any) {
      message.error(err.response?.data?.error || "创建失败");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStudents = async (values: Record<string, unknown>) => {
    if (!selectedRoomId) {
      message.error("请先选择房间");
      return;
    }
    setLoading(true);
    try {
      const students = (values as any).students || [];
      const studentIds = students.map((s: any) => s.studentId).filter((id: any) => id != null);
      if (studentIds.length === 0) {
        message.warning("请选择至少一名学生");
        return;
      }
      await api.put(`/dormitories/rooms/${selectedRoomId}/assign-batch`, { studentIds });
      message.success(`成功分配 ${studentIds.length} 名学生`);
      setAssignModalVisible(false);
      roomActionRef.current?.reload();
    } catch (err: any) {
      message.error(err.response?.data?.error || "分配失败");
    } finally {
      setLoading(false);
    }
  };

  const buildingColumns: ProColumns<Building>[] = [
    { title: "名称", dataIndex: "name", key: "name", width: 150 },
    { title: "类型", dataIndex: "buildingType", key: "buildingType", width: 80, render: (_, r) => r.buildingType === "male" ? <Tag color="blue">男</Tag> : <Tag color="pink">女</Tag> },
    { title: "楼层数", dataIndex: "floorCount", key: "floorCount", width: 80 },
  ];

  const roomColumns: ProColumns<RoomRecord>[] = [
    { title: "房间号", dataIndex: "roomNumber", key: "roomNumber", width: 120 },
    { title: "宿舍楼", dataIndex: ["building", "name"], key: "building", width: 150 },
    { title: "容量", dataIndex: "capacity", key: "capacity", width: 60 },
    { title: "已住", dataIndex: "occupied", key: "occupied", width: 60 },
    {
      title: "入住学生", dataIndex: "students", key: "students", width: 250,
      render: (_, r) => r.students?.length > 0
        ? r.students.map((s) => <Tag key={s.id}>{s.name}</Tag>)
        : <span style={{ color: "#999" }}>暂无</span>,
    },
    {
      title: "操作", key: "action", width: 160,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => {
            setSelectedRoomId(record.id);
            assignForm.resetFields();
            setAssignModalVisible(true);
          }}>分配学生</Button>
          {record.students?.map((s) => (
            <Popconfirm key={s.id} title={`移除 ${s.name}？`} onConfirm={async () => {
              await api.put(`/dormitories/rooms/${record.id}/remove`, { studentId: s.id });
              message.success("移除成功");
              roomActionRef.current?.reload();
            }}>
              <Button type="link" danger size="small">移除</Button>
            </Popconfirm>
          ))}
        </Space>
      ),
    },
  ];

  return (
    <Tabs defaultActiveKey="rooms" items={[
      {
        key: "rooms",
        label: "宿舍房间",
        children: (
          <div>
            <ProTable<RoomRecord>
              columns={roomColumns}
              request={async () => {
                const res = await api.get("/dormitories/rooms");
                const rooms = res.data.data || [];
                return { data: rooms, total: rooms.length, success: true };
              }}
              actionRef={roomActionRef}
              rowKey="id"
              search={false}
              headerTitle="房间列表"
              toolBarRender={() => [
                <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => {
                  roomForm.resetFields();
                  setRoomModalVisible(true);
                }}>新增房间</Button>,
              ]}
            />
            <Modal title="新增房间" open={roomModalVisible}
              onCancel={() => { setRoomModalVisible(false); roomForm.resetFields(); }}
              onOk={() => roomForm.submit()} confirmLoading={loading}
            >
              <Form form={roomForm} layout="vertical" onFinish={handleCreateRoom}>
                <Form.Item name="roomNumber" label="房间号" rules={[{ required: true }]}>
                  <Input placeholder="如 101" />
                </Form.Item>
                <Form.Item name="buildingId" label="宿舍楼" rules={[{ required: true }]}>
                  <Select placeholder="选择宿舍楼" options={buildings.map((b) => ({ label: b.name, value: b.id }))} />
                </Form.Item>
                <Form.Item name="capacity" label="容量" rules={[{ required: true }]}>
                  <Select placeholder="选择容量" options={[1,2,3,4,5,6,7,8].map((n) => ({ label: `${n}人间`, value: n }))} />
                </Form.Item>
              </Form>
            </Modal>
            <Modal title="分配学生" open={assignModalVisible}
              onCancel={() => setAssignModalVisible(false)}
              onOk={() => assignForm.submit()} confirmLoading={loading}
              width={560}
            >
              <Form form={assignForm} layout="vertical" onFinish={handleAssignStudents}>
                <Form.List name="students">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...rest }) => {
                        const rowValue = watchedStudents?.[name];
                        const studentOptions = (rowValue?.classId && studentsByClass[rowValue.classId] || []).map(
                          (s: { id: number; name: string; studentNo: string }) => ({ label: `${s.name} (${s.studentNo})`, value: s.id })
                        );
                        return (
                            <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                              <Form.Item {...rest} name={[name, "classId"]} rules={[{ required: true }]} style={{ width: 180 }}>
                                <Select
                                  placeholder="选择班级"
                                  options={classes.map((c) => ({ label: c.name, value: c.id }))}
                                  onChange={(classId) => {
                                    loadStudentsForClass(classId);
                                    assignForm.setFieldValue(["students", name, "studentId"], undefined);
                                  }}
                                />
                              </Form.Item>
                              <Form.Item {...rest} name={[name, "studentId"]} rules={[{ required: true }]} style={{ width: 190 }}>
                                <Select
                                  placeholder="选择学生"
                                  showSearch
                                  optionFilterProp="label"
                                  disabled={!rowValue?.classId}
                                  options={studentOptions}
                                />
                              </Form.Item>
                              <Button type="link" danger onClick={() => remove(name)}>删除</Button>
                            </Space>
                          );
                        })}
                        <Button type="dashed" onClick={() => add()} block>
                          + 添加学生
                        </Button>
                      </>
                  )}
                </Form.List>
              </Form>
            </Modal>
          </div>
        ),
      },
      {
        key: "buildings",
        label: "宿舍楼栋",
        children: (
          <div>
            <ProTable<Building>
              columns={buildingColumns}
              request={async () => {
                const res = await api.get("/dormitories/buildings");
                const buildings = res.data.data || [];
                return { data: buildings, total: buildings.length, success: true };
              }}
              actionRef={buildingActionRef}
              rowKey="id"
              search={false}
              headerTitle="楼栋列表"
              toolBarRender={() => [
                <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => {
                  buildingForm.resetFields();
                  setBuildingModalVisible(true);
                }}>新增宿舍楼</Button>,
              ]}
            />
            <Modal title="新增宿舍楼" open={buildingModalVisible}
              onCancel={() => { setBuildingModalVisible(false); buildingForm.resetFields(); }}
              onOk={() => buildingForm.submit()} confirmLoading={loading}
            >
              <Form form={buildingForm} layout="vertical" onFinish={handleCreateBuilding}>
                <Form.Item name="name" label="名称" rules={[{ required: true }]}>
                  <Input placeholder="如 男生宿舍楼A" />
                </Form.Item>
                <Space style={{ display: "flex", gap: 16 }}>
                  <Form.Item name="buildingType" label="类型" rules={[{ required: true }]} style={{ width: 160 }}>
                    <Select options={[{ label: "男生宿舍", value: "male" }, { label: "女生宿舍", value: "female" }]} />
                  </Form.Item>
                  <Form.Item name="floorCount" label="楼层数" rules={[{ required: true }]} style={{ width: 160 }}>
                    <Select options={[1,2,3,4,5,6,7,8,9,10].map((n) => ({ label: `${n}层`, value: n }))} style={{ width: "100%" }} />
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
