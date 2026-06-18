import { useEffect, useState } from "react";
import { Row, Col, Card, Statistic, Button, List, Tag, Space } from "antd";
import {
  SearchOutlined,
  TeamOutlined,
  BankOutlined,
  HeartOutlined,
  ArrowRightOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { applicationApi, statisticsApi, villageApi } from "../api";
import type {
  Application,
  AncestralVillage,
  StatisticsOverview,
} from "../types";
import { STATUS_TEXT, STATUS_COLOR } from "../types";

export default function Home() {
  const [stats, setStats] = useState<StatisticsOverview | null>(null);
  const [recentApps, setRecentApps] = useState<Application[]>([]);
  const [villages, setVillages] = useState<AncestralVillage[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [statsRes, appsRes, villagesRes] = await Promise.all([
      statisticsApi.overview(),
      applicationApi.list({ status: "investigating" }),
      villageApi.list(),
    ]);

    if (statsRes.success) setStats(statsRes.data);
    if (appsRes.success) setRecentApps(appsRes.data.slice(0, 6));
    if (villagesRes.success) setVillages(villagesRes.data.slice(0, 6));
  };

  return (
    <div>
      <div className="hero-section">
        <h1 className="hero-title">寻根祭祖 · 共续血脉</h1>
        <p className="hero-subtitle">
          离乡几十年的老人，靠记忆找回村子；在祠堂跟祖先说一句——我回来了
          <br />
          让我们帮更多两岸青年牵线结对，一起完成这段寻根之旅
        </p>
        <Space size="large">
          <Button
            type="primary"
            size="large"
            style={{
              background: "#fff",
              color: "#8B4513",
              borderColor: "#fff",
            }}
          >
            <Link to="/apply">立即发起寻根</Link>
          </Button>
          <Button
            size="large"
            style={{ color: "#fff", borderColor: "#fff" }}
            ghost
          >
            <Link to="/applications">查看寻根进度</Link>
          </Button>
        </Space>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
        <Row gutter={[24, 24]} style={{ marginBottom: 48 }}>
          <Col span={6}>
            <Card className="card-hover">
              <Statistic
                title="累计寻根申请"
                value={stats?.totalApplications || 0}
                prefix={<FileTextOutlined style={{ color: "#8B4513" }} />}
                valueStyle={{ color: "#8B4513" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="card-hover">
              <Statistic
                title="结对志愿者"
                value={stats?.totalVolunteers || 0}
                prefix={<TeamOutlined style={{ color: "#52c41a" }} />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="card-hover">
              <Statistic
                title="宗祠村落资料"
                value={stats?.totalVillages || 0}
                prefix={<BankOutlined style={{ color: "#1890ff" }} />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="card-hover">
              <Statistic
                title="已成行祭祖"
                value={stats?.totalPilgrimages || 0}
                prefix={<HeartOutlined style={{ color: "#eb2f96" }} />}
                valueStyle={{ color: "#eb2f96" }}
              />
            </Card>
          </Col>
        </Row>

        <div style={{ marginBottom: 48 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <h2
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: "#8B4513",
                margin: 0,
              }}
            >
              <SearchOutlined /> 进行中的寻根
            </h2>
            <Link to="/applications">
              查看全部 <ArrowRightOutlined />
            </Link>
          </div>
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3 }}
            dataSource={recentApps}
            renderItem={(item) => (
              <List.Item>
                <Card
                  className="card-hover"
                  size="small"
                  title={`${item.surname}氏 · ${item.applicant_name}`}
                  extra={
                    <Tag
                      color={
                        STATUS_COLOR[item.status as keyof typeof STATUS_COLOR]
                      }
                    >
                      {STATUS_TEXT[item.status as keyof typeof STATUS_TEXT]}
                    </Tag>
                  }
                >
                  <p style={{ color: "#666", marginBottom: 8 }}>
                    {item.origin_province} {item.origin_city}
                  </p>
                  <p style={{ fontSize: 13, color: "#999", marginBottom: 12 }}>
                    {item.village_clue || "暂无村落线索"}
                  </p>
                  <Link to={`/applications/${item.id}`}>查看详情 →</Link>
                </Card>
              </List.Item>
            )}
          />
        </div>

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <h2
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: "#8B4513",
                margin: 0,
              }}
            >
              <BankOutlined /> 宗祠村落
            </h2>
            <Link to="/stories">
              更多故事 <ArrowRightOutlined />
            </Link>
          </div>
          <Row gutter={[16, 16]}>
            {villages.map((village) => (
              <Col span={8} key={village.id}>
                <Card
                  className="card-hover"
                  size="small"
                  title={village.name}
                  extra={<Tag color="default">{village.surname}氏</Tag>}
                >
                  <p style={{ color: "#666", fontSize: 13, marginBottom: 8 }}>
                    {village.province} {village.city} {village.district}
                  </p>
                  <p style={{ fontSize: 12, color: "#999" }}>
                    {village.ancestral_hall_name || "暂无宗祠名称"}
                  </p>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>
    </div>
  );
}
