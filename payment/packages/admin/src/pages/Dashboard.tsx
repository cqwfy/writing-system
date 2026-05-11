import { Card, Col, Row, Statistic } from "antd";
import { TeamOutlined, UserOutlined, BookOutlined, BankOutlined } from "@ant-design/icons";

export function DashboardPage() {
  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic title="在校学生" value={500} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="教师人数" value={30} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="班级数量" value={9} prefix={<BankOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="课程数量" value={12} prefix={<BookOutlined />} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
