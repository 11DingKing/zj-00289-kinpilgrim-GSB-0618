import { useEffect, useState } from "react";
import {
  Card,
  List,
  Tag,
  Empty,
  Spin,
  Row,
  Col,
  Statistic,
  Input,
  Select,
  Tabs,
  Modal,
  Descriptions,
  Divider,
  Button,
  Space,
} from "antd";
import {
  HeartOutlined,
  EnvironmentOutlined,
  BankOutlined,
  TeamOutlined,
  SearchOutlined,
  CalendarOutlined,
  ArrowLeftOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { storiesApi } from "../api";
import type {
  StoryWallItem,
  RegionStoryGroup,
  VillageStoryStat,
  StoryWallStats,
} from "../types";

const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

export default function PilgrimageStories() {
  const [stories, setStories] = useState<StoryWallItem[]>([]);
  const [regionGroups, setRegionGroups] = useState<RegionStoryGroup[]>([]);
  const [villageStats, setVillageStats] = useState<VillageStoryStat[]>([]);
  const [stats, setStats] = useState<StoryWallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [selectedSurname, setSelectedSurname] = useState<string>("");
  const [keyword, setKeyword] = useState<string>("");
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentStory, setCurrentStory] = useState<StoryWallItem | null>(null);
  const [activeTab, setActiveTab] = useState("wall");

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (activeTab === "wall") {
      loadStories();
    }
  }, [selectedProvince, selectedSurname, keyword, activeTab]);

  const loadAllData = async () => {
    setLoading(true);
    const [storiesRes, regionRes, villageRes, statsRes] = await Promise.all([
      storiesApi.getWall(),
      storiesApi.getByRegion(),
      storiesApi.getByVillage(20),
      storiesApi.getStats(),
    ]);

    if (storiesRes.success) setStories(storiesRes.data);
    if (regionRes.success) setRegionGroups(regionRes.data);
    if (villageRes.success) setVillageStats(villageRes.data);
    if (statsRes.success) setStats(statsRes.data);
    setLoading(false);
  };

  const loadStories = async () => {
    const params: any = {};
    if (selectedProvince !== "all") params.province = selectedProvince;
    if (selectedSurname) params.surname = selectedSurname;
    if (keyword) params.keyword = keyword;

    const res = await storiesApi.getWall(params);
    if (res.success) {
      setStories(res.data);
    }
  };

  const handleViewDetail = async (id: string) => {
    const res = await storiesApi.getDetail(id);
    if (res.success) {
      setCurrentStory(res.data);
      setDetailModalVisible(true);
    }
  };

  const allProvinces = ["all", ...regionGroups.map((r) => r.province)];
  const allSurnames = Array.from(
    new Set(regionGroups.flatMap((r) => r.cities.flatMap((c) => c.surnames))),
  ).filter(Boolean);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
          borderRadius: 12,
          padding: "40px 32px",
          marginBottom: 32,
          color: "#fff",
        }}
      >
        <h1
          style={{
            fontSize: 32,
            fontWeight: 700,
            margin: 0,
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <HeartOutlined /> 寻根故事墙
        </h1>
        <p style={{ fontSize: 16, opacity: 0.9, margin: 0, marginBottom: 32 }}>
          每一段寻根的旅程，都是一段动人的故事 —— 按祖籍地追寻血脉的印记
        </p>
        <Row gutter={[24, 16]}>
          <Col span={6}>
            <div
              style={{
                background: "rgba(255,255,255,0.15)",
                borderRadius: 8,
                padding: "16px 20px",
              }}
            >
              <Statistic
                title={
                  <span style={{ color: "#fff", opacity: 0.8 }}>寻根故事</span>
                }
                value={stats?.totalStories || 0}
                valueStyle={{ color: "#fff" }}
                prefix={<HeartOutlined style={{ color: "#fff" }} />}
              />
            </div>
          </Col>
          <Col span={6}>
            <div
              style={{
                background: "rgba(255,255,255,0.15)",
                borderRadius: 8,
                padding: "16px 20px",
              }}
            >
              <Statistic
                title={
                  <span style={{ color: "#fff", opacity: 0.8 }}>祭祖村落</span>
                }
                value={stats?.totalVillages || 0}
                valueStyle={{ color: "#fff" }}
                prefix={<HomeOutlined style={{ color: "#fff" }} />}
              />
            </div>
          </Col>
          <Col span={6}>
            <div
              style={{
                background: "rgba(255,255,255,0.15)",
                borderRadius: 8,
                padding: "16px 20px",
              }}
            >
              <Statistic
                title={
                  <span style={{ color: "#fff", opacity: 0.8 }}>涉及姓氏</span>
                }
                value={stats?.totalSurnames || 0}
                valueStyle={{ color: "#fff" }}
                prefix={<TeamOutlined style={{ color: "#fff" }} />}
              />
            </div>
          </Col>
          <Col span={6}>
            <div
              style={{
                background: "rgba(255,255,255,0.15)",
                borderRadius: 8,
                padding: "16px 20px",
              }}
            >
              <Statistic
                title={
                  <span style={{ color: "#fff", opacity: 0.8 }}>覆盖省份</span>
                }
                value={regionGroups.length}
                valueStyle={{ color: "#fff" }}
                prefix={<EnvironmentOutlined style={{ color: "#fff" }} />}
              />
            </div>
          </Col>
        </Row>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="📖 故事墙" key="wall" />
          <TabPane tab="🗺️ 按地区" key="region" />
          <TabPane tab="🏘️ 按村落" key="village" />
        </Tabs>

        {activeTab === "wall" && (
          <div>
            <Space style={{ marginBottom: 24, marginTop: 16 }} wrap>
              <Select
                value={selectedProvince}
                onChange={setSelectedProvince}
                style={{ width: 180 }}
                placeholder="选择省份"
                allowClear
              >
                <Option value="all">全部省份</Option>
                {regionGroups.map((r) => (
                  <Option key={r.province} value={r.province}>
                    {r.province} ({r.total}个故事)
                  </Option>
                ))}
              </Select>
              <Select
                value={selectedSurname}
                onChange={setSelectedSurname}
                style={{ width: 150 }}
                placeholder="选择姓氏"
                allowClear
                showSearch
              >
                {allSurnames.map((s) => (
                  <Option key={s} value={s}>
                    {s}氏
                  </Option>
                ))}
              </Select>
              <Search
                placeholder="搜索故事、村落、姓氏..."
                allowClear
                onSearch={setKeyword}
                style={{ width: 280 }}
                enterButton={<SearchOutlined />}
              />
            </Space>

            {stories.length === 0 ? (
              <Empty description="暂无符合条件的寻根故事" />
            ) : (
              <List
                grid={{ gutter: 24, xs: 1, sm: 1, md: 2, lg: 3, xl: 3 }}
                dataSource={stories}
                renderItem={(item) => (
                  <List.Item key={item.id}>
                    <Card
                      className="card-hover"
                      hoverable
                      onClick={() => handleViewDetail(item.id)}
                      title={
                        <div style={{ fontSize: 16 }}>
                          {item.surname}氏 · {item.applicant_name}的寻根之旅
                        </div>
                      }
                      extra={
                        <Space>
                          <Tag color="success">已祭祖</Tag>
                          {item.province && (
                            <Tag color="blue">
                              <EnvironmentOutlined /> {item.province}
                            </Tag>
                          )}
                        </Space>
                      }
                      style={{ height: "100%" }}
                    >
                      <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
                        <Col span={24}>
                          <small style={{ color: "#999" }}>
                            <BankOutlined /> 宗祠：{item.ancestral_hall}
                          </small>
                        </Col>
                        <Col span={24}>
                          <small style={{ color: "#999" }}>
                            <CalendarOutlined /> 祭祖日期：
                            {item.pilgrimage_date}
                          </small>
                        </Col>
                        {item.village_name && (
                          <Col span={24}>
                            <small style={{ color: "#999" }}>
                              <HomeOutlined /> 村落：{item.village_name}
                            </small>
                          </Col>
                        )}
                      </Row>

                      {item.story && (
                        <div
                          style={{
                            background: "#faf8f5",
                            padding: 12,
                            borderRadius: 8,
                            marginBottom: 12,
                          }}
                        >
                          <p
                            style={{
                              lineHeight: 1.8,
                              color: "#555",
                              display: "-webkit-box",
                              WebkitLineClamp: 4,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              marginBottom: 0,
                              fontSize: 13,
                            }}
                          >
                            {item.story}
                          </p>
                        </div>
                      )}

                      {item.memories && (
                        <p
                          style={{
                            fontSize: 13,
                            color: "#8B4513",
                            fontStyle: "italic",
                            marginBottom: 0,
                            paddingLeft: 8,
                            borderLeft: "3px solid #8B4513",
                          }}
                        >
                          "
                          {item.memories.length > 60
                            ? item.memories.substring(0, 60) + "..."
                            : item.memories}
                          "
                        </p>
                      )}
                    </Card>
                  </List.Item>
                )}
              />
            )}
          </div>
        )}

        {activeTab === "region" && (
          <div style={{ marginTop: 16 }}>
            {regionGroups.length === 0 ? (
              <Empty description="暂无地区数据" />
            ) : (
              <Row gutter={[24, 24]}>
                {regionGroups.map((region) => (
                  <Col span={12} key={region.province}>
                    <Card
                      className="card-hover"
                      title={
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <EnvironmentOutlined style={{ color: "#8B4513" }} />
                          <span style={{ fontSize: 18 }}>
                            {region.province}
                          </span>
                          <Tag color="gold" style={{ marginLeft: 8 }}>
                            {region.total} 个故事
                          </Tag>
                        </div>
                      }
                      size="small"
                    >
                      <div style={{ marginBottom: 8 }}>
                        <small style={{ color: "#666" }}>主要姓氏：</small>
                        {Array.from(
                          new Set(region.cities.flatMap((c) => c.surnames)),
                        )
                          .slice(0, 8)
                          .map((s, i) => (
                            <Tag key={i} color="blue" style={{ marginLeft: 4 }}>
                              {s}氏
                            </Tag>
                          ))}
                      </div>
                      <Divider style={{ margin: "8px 0" }} />
                      <List
                        size="small"
                        dataSource={region.cities}
                        renderItem={(city) => (
                          <List.Item
                            onClick={() => {
                              setSelectedProvince(region.province);
                              setActiveTab("wall");
                            }}
                            style={{ cursor: "pointer" }}
                            className="card-hover"
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                width: "100%",
                              }}
                            >
                              <span>
                                <HomeOutlined /> {city.city}
                              </span>
                              <Space>
                                {city.surnames.slice(0, 3).map((s, i) => (
                                  <Tag key={i}>{s}氏</Tag>
                                ))}
                                <Tag color="green">{city.count}个故事</Tag>
                              </Space>
                            </div>
                          </List.Item>
                        )}
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </div>
        )}

        {activeTab === "village" && (
          <div style={{ marginTop: 16 }}>
            {villageStats.length === 0 ? (
              <Empty description="暂无村落数据" />
            ) : (
              <List
                grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }}
                dataSource={villageStats}
                renderItem={(v) => (
                  <List.Item key={v.village_id}>
                    <Card
                      className="card-hover"
                      hoverable
                      title={
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <HomeOutlined style={{ color: "#8B4513" }} />
                          <strong>{v.village_name}</strong>
                          <Tag color="blue">{v.surname}氏</Tag>
                        </div>
                      }
                      extra={<Tag color="gold">{v.pilgrimage_count}次祭祖</Tag>}
                    >
                      <p style={{ color: "#666", marginBottom: 8 }}>
                        <EnvironmentOutlined /> {v.province} {v.city}{" "}
                        {v.district}
                      </p>
                      {v.ancestral_hall_name && (
                        <p style={{ color: "#888", marginBottom: 8 }}>
                          <BankOutlined /> {v.ancestral_hall_name}
                        </p>
                      )}
                      <p
                        style={{ fontSize: 12, color: "#999", marginBottom: 0 }}
                      >
                        <CalendarOutlined /> 最近祭祖：
                        {v.latest_pilgrimage || "暂无记录"}
                      </p>
                    </Card>
                  </List.Item>
                )}
              />
            )}
          </div>
        )}
      </Card>

      <Modal
        title={
          currentStory && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <HeartOutlined style={{ color: "#8B4513" }} />
              <span>
                {currentStory.surname}氏 · {currentStory.applicant_name}
                的寻根故事
              </span>
            </div>
          )
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            <ArrowLeftOutlined /> 返回故事墙
          </Button>,
        ]}
        width={800}
      >
        {currentStory && (
          <div>
            <Descriptions
              column={2}
              bordered
              size="small"
              style={{ marginBottom: 24 }}
            >
              <Descriptions.Item label="寻根人">
                {currentStory.applicant_name}
              </Descriptions.Item>
              <Descriptions.Item label="姓氏">
                {currentStory.surname}氏
              </Descriptions.Item>
              <Descriptions.Item label="祖籍地" span={2}>
                <EnvironmentOutlined /> {currentStory.province}{" "}
                {currentStory.city} {currentStory.district}
              </Descriptions.Item>
              <Descriptions.Item label="宗祠">
                <BankOutlined /> {currentStory.ancestral_hall}
              </Descriptions.Item>
              <Descriptions.Item label="祭祖日期">
                <CalendarOutlined /> {currentStory.pilgrimage_date}
              </Descriptions.Item>
              {currentStory.village_name && (
                <Descriptions.Item label="村落" span={2}>
                  <HomeOutlined /> {currentStory.village_name}
                  {currentStory.ancestral_hall_name &&
                    ` · ${currentStory.ancestral_hall_name}`}
                </Descriptions.Item>
              )}
              {currentStory.origin_province && (
                <Descriptions.Item label="记忆祖籍" span={2}>
                  {currentStory.origin_province} {currentStory.origin_city}{" "}
                  {currentStory.origin_district}
                </Descriptions.Item>
              )}
              {currentStory.village_clue && (
                <Descriptions.Item label="村落线索">
                  {currentStory.village_clue}
                </Descriptions.Item>
              )}
              {currentStory.known_ancestors && (
                <Descriptions.Item label="已知祖先">
                  {currentStory.known_ancestors}
                </Descriptions.Item>
              )}
              {currentStory.departure_era && (
                <Descriptions.Item label="离乡年代">
                  {currentStory.departure_era}
                </Descriptions.Item>
              )}
              {currentStory.companion_name && (
                <Descriptions.Item label="同行人">
                  {currentStory.companion_name}
                </Descriptions.Item>
              )}
            </Descriptions>

            {currentStory.family_story && (
              <>
                <Divider orientation="left">家族记忆</Divider>
                <div
                  style={{
                    background: "#faf8f5",
                    padding: 16,
                    borderRadius: 8,
                    lineHeight: 2,
                    color: "#555",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {currentStory.family_story}
                </div>
              </>
            )}

            {currentStory.story && (
              <>
                <Divider orientation="left">
                  <HeartOutlined style={{ color: "#8B4513" }} /> 寻根故事
                </Divider>
                <div
                  style={{
                    background: "linear-gradient(to bottom, #fff9f0, #fff)",
                    padding: 20,
                    borderRadius: 8,
                    lineHeight: 2,
                    color: "#444",
                    whiteSpace: "pre-wrap",
                    fontSize: 15,
                  }}
                >
                  {currentStory.story}
                </div>
              </>
            )}

            {currentStory.memories && (
              <>
                <Divider orientation="left">祭祖感言</Divider>
                <blockquote
                  style={{
                    borderLeft: "4px solid #8B4513",
                    padding: "12px 20px",
                    margin: 0,
                    background: "#fef5e7",
                    color: "#8B4513",
                    fontStyle: "italic",
                    fontSize: 16,
                    lineHeight: 1.8,
                  }}
                >
                  "{currentStory.memories}"
                </blockquote>
              </>
            )}

            {currentStory.relatedStories &&
              currentStory.relatedStories.length > 0 && (
                <>
                  <Divider orientation="left">
                    <TeamOutlined /> 相关故事
                  </Divider>
                  <List
                    size="small"
                    dataSource={currentStory.relatedStories}
                    renderItem={(related) => (
                      <List.Item
                        onClick={() => handleViewDetail(related.id)}
                        style={{ cursor: "pointer" }}
                        className="card-hover"
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            width: "100%",
                          }}
                        >
                          <span>
                            <strong>
                              {related.surname}氏 · {related.applicant_name}
                            </strong>
                            <Tag color="default" style={{ marginLeft: 8 }}>
                              {related.village_name || "同姓氏"}
                            </Tag>
                          </span>
                          <small style={{ color: "#999" }}>
                            {related.pilgrimage_date}
                          </small>
                        </div>
                      </List.Item>
                    )}
                  />
                </>
              )}
          </div>
        )}
      </Modal>
    </div>
  );
}
