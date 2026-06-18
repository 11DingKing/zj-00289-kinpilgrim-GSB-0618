import { useEffect, useState } from "react";
import {
  Card,
  List,
  Tag,
  Input,
  Select,
  Row,
  Col,
  Pagination,
  Empty,
  Space,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { applicationApi } from "../api";
import type { Application } from "../types";
import { STATUS_TEXT, STATUS_COLOR } from "../types";

const { Search } = Input;
const { Option } = Select;

export default function ApplicationList() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("all");
  const [surname, setSurname] = useState("");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    loadApplications();
  }, [status, surname, keyword]);

  const loadApplications = async () => {
    setLoading(true);
    const res = await applicationApi.list({
      status: status === "all" ? undefined : status,
      surname: surname || undefined,
      keyword: keyword || undefined,
    });
    if (res.success) {
      setApplications(res.data);
    }
    setLoading(false);
  };

  const statusOptions = [
    { value: "all", label: "全部状态" },
    { value: "pending", label: "待匹配" },
    { value: "investigating", label: "查访中" },
    { value: "confirmed", label: "已确认" },
    { value: "completed", label: "已祭祖" },
    { value: "broken", label: "线索中断" },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: "#8B4513",
          marginBottom: 24,
        }}
      >
        寻根进度
      </h1>

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={8}>
            <Search
              placeholder="搜索申请人、线索..."
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={setKeyword}
              style={{ width: "100%" }}
            />
          </Col>
          <Col span={4}>
            <Select
              value={status}
              onChange={setStatus}
              style={{ width: "100%" }}
              options={statusOptions}
            />
          </Col>
          <Col span={4}>
            <Input
              placeholder="输入姓氏"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              allowClear
            />
          </Col>
        </Row>
      </Card>

      <List
        loading={loading}
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3 }}
        dataSource={applications}
        locale={{ emptyText: <Empty description="暂无寻根申请" /> }}
        renderItem={(item) => (
          <List.Item key={item.id}>
            <Card
              className="card-hover"
              title={
                <Space>
                  <span>{item.surname}氏寻根</span>
                  <Tag
                    color={
                      STATUS_COLOR[item.status as keyof typeof STATUS_COLOR]
                    }
                  >
                    {STATUS_TEXT[item.status as keyof typeof STATUS_TEXT]}
                  </Tag>
                </Space>
              }
              extra={<small style={{ color: "#999" }}>{item.created_at}</small>}
            >
              <p style={{ marginBottom: 8 }}>
                <strong>申请人：</strong>
                {item.applicant_name}
              </p>
              <p style={{ marginBottom: 8 }}>
                <strong>祖籍地：</strong>
                {item.origin_province} {item.origin_city} {item.origin_district}
              </p>
              <p style={{ marginBottom: 8 }}>
                <strong>离乡年代：</strong>
                {item.departure_era || "未知"}
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "#666",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  marginBottom: 12,
                }}
              >
                {item.family_story}
              </p>
              {item.volunteer_name && (
                <Tag color="green">结对志愿者：{item.volunteer_name}</Tag>
              )}
              <div style={{ marginTop: 12, textAlign: "right" }}>
                <Link to={`/applications/${item.id}`}>查看详情 →</Link>
              </div>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
}
