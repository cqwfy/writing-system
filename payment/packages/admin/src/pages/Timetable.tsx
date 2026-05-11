import { useState, useEffect } from "react";
import { Button, message, Select, Table, Tag, Space, Card } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import api from "../services/api";

interface TimetableEntry {
  id?: number;
  course: { id: number; name: string; teacher: { name: string } | null };
  dayOfWeek: number;
  period: number;
  classroom?: string;
}

const DAYS = ["", "周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function TimetablePage() {
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/classes/all").then((res) => {
      const list = res.data.data || [];
      setClasses(list);
      if (list.length > 0) setSelectedClassId(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    setLoading(true);
    api.get(`/timetables/class/${selectedClassId}`)
      .then((res) => setEntries(res.data.data || []))
      .finally(() => setLoading(false));
  }, [selectedClassId]);

  const timetableGrid: Record<string, TimetableEntry | null> = {};
  for (const e of entries) {
    timetableGrid[`${e.dayOfWeek}-${e.period}`] = e;
  }

  return (
    <div>
      <Card title="课表查看" extra={
        <Select
          value={selectedClassId}
          onChange={setSelectedClassId}
          style={{ width: 200 }}
          options={classes.map((c) => ({ label: c.name, value: c.id }))}
        />
      }>
        <Table
          loading={loading}
          dataSource={PERIODS.map((p) => {
            const row: Record<string, unknown> = { key: p, period: `第${p}节` };
            for (let d = 1; d <= 7; d++) {
              row[`day${d}`] = timetableGrid[`${d}-${p}`];
            }
            return row;
          })}
          columns={[
            { title: "", dataIndex: "period", key: "period", width: 80 },
            ...DAYS.filter(Boolean).map((day, i) => ({
              title: day,
              dataIndex: `day${i + 1}`,
              key: `day${i + 1}`,
              render: (entry: TimetableEntry | null) =>
                entry ? (
                  <Tag color="blue" style={{ margin: 2 }}>
                    {entry.course?.name}
                    <br />
                    <small>{entry.course?.teacher?.name || ""}</small>
                  </Tag>
                ) : null,
            })),
          ]}
          pagination={false}
          bordered
          size="small"
        />
      </Card>
    </div>
  );
}
