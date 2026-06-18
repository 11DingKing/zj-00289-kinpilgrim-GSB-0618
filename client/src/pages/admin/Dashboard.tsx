import { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, Table, Progress, Tag, List } from "antd";
import {
  FileTextOutlined,
  TeamOutlined,
  BankOutlined,
  HeartOutlined,
  RiseOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { statisticsApi } from "../../api";
import type { StatisticsOverview, RegionStat, SurnameStat } from "../../types";
import { STATUS_TEXT } from "../../types";

export default function Dashboard() {
  const [overview, setOverview] = useState<StatisticsOverview | null>(null);
  const [regionStats, setRegionStats] = useState<RegionStat[]>([]);
  const [surnameStats, setSurnameStats] = useState<SurnameStat[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [overviewRes, regionRes, surnameRes] = await Promise.all([
      statisticsApi.overview(),
      statisticsApi.byRegion("province"),
      statisticsApi.bySurname(),
    ]);

    if (overviewRes.success) setOverview(overviewRes.data);
    if (regionRes.success) setRegionStats(regionRes.data);
    if (surnameRes.success) setSurnameStats(surnameRes.data);
  };

  const statusList = overview
    ? [
        {
          key: "pending",
          label: STATUS_TEXT.pending,
          value: overview.statusBreakdown.pending,
          color: "default",
        },
        {
          key: "investigating",
          label: STATUS_TEXT.investigating,
          value: overview.statusBreakdown.investigating,
          color: "processing",
        },
        {
          key: "confirmed",
          label: STATUS_TEXT.confirmed,
          value: overview.statusBreakdown.confirmed,
          color: "warning",
        },
        {
          key: "completed",
          label: STATUS_TEXT.completed,
          value: overview.statusBreakdown.completed,
          color: "success",
        },
        {
          key: "broken",
          label: STATUS_TEXT.broken,
          value: overview.statusBreakdown.broken,
          color: "error",
        },
      ]
    : [];

  const columns = [
    {
      title: "地区",
      dataIndex: "region",
      key: "region",
    },
    {
      title: "申请数",
      dataIndex: "total",
      key: "total",
      width: 80,
    },
    {
      title: "结对成功率",
      key: "matchRate",
      width: 200,
      render: (_: any, record: RegionStat) => (
        <Progress percent={record.matchRate} size="small" />
      ),
    },
    {
      title: "已成行",
      dataIndex: "completed",
      key: "completed",
      width: 80,
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="寻根申请总数"
              value={overview?.totalApplications || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#8B4513" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="结对志愿者"
              value={overview?.totalVolunteers || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="宗祠村落"
              value={overview?.totalVillages || 0}
              prefix={<BankOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已成行祭祖"
              value={overview?.totalPilgrimages || 0}
              prefix={<HeartOutlined />}
              valueStyle={{ color: "#eb2f96" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="申请状态分布" extra={<RiseOutlined />}>
            <List
              dataSource={statusList}
              renderItem={(item) => (
                <List.Item>
                  <span>{item.label}</span>
                  <Tag color={item.color}>{item.value} 件</Tag>
                </List.Item>
              )}
            />
            <div
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: "1px solid #f0f0f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span>整体结对率</span>
                <span style={{ fontWeight: "bold", color: "#52c41a" }}>
                  {overview?.matchRate || 0}%
                </span>
              </div>
              <Progress
                percent={overview?.matchRate || 0}
                strokeColor="#52c41a"
              />
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="姓氏排行榜" extra={<BarChartOutlined />}>
            <List
              dataSource={surnameStats.slice(0, 6)}
              renderItem={(item, index) => (
                <List.Item>
                  <span>
                    <Tag
                      color={index < 3 ? "gold" : "default"}
                      style={{ marginRight: 8 }}
                    >
                      {index + 1}
                    </Tag>
                    {item.surname}氏
                  </span>
                  <span style={{ color: "#999" }}>{item.total} 件申请</span>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card title="按祖籍地统计">
        <Table
          dataSource={regionStats}
          columns={columns}
          rowKey="region"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
}
