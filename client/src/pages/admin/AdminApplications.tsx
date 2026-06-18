import { useEffect, useState } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Form,
  message,
  Drawer,
  Descriptions,
  Timeline,
  Popconfirm,
  Empty,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { applicationApi, volunteerApi } from "../../api";
import type { Application, Volunteer, InvestigationStep } from "../../types";
import { STATUS_TEXT, STATUS_COLOR, STEP_STATUS_TEXT } from "../../types";

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

export default function AdminApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("all");
  const [keyword, setKeyword] = useState("");
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentApp, setCurrentApp] = useState<Application | null>(null);
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [recommendedVolunteers, setRecommendedVolunteers] = useState<
    VolunteerMatchScore[]
  >([]);
  const [stepModalVisible, setStepModalVisible] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadApplications();
    loadVolunteers();
  }, [status, keyword]);

  const loadApplications = async () => {
    setLoading(true);
    const res = await applicationApi.list({
      status: status === "all" ? undefined : status,
      keyword: keyword || undefined,
    });
    if (res.success) {
      setApplications(res.data);
    }
    setLoading(false);
  };

  const loadVolunteers = async () => {
    const res = await volunteerApi.list({ status: "active" });
    if (res.success) {
      setVolunteers(res.data);
    }
  };

  const loadRecommendedVolunteers = async (applicationId: string) => {
    const res = await matchingApi.recommendVolunteers(applicationId);
    if (res.success) {
      setRecommendedVolunteers(res.data);
    }
  };

  const handleViewDetail = async (id: string) => {
    const res = await applicationApi.get(id);
    if (res.success) {
      setCurrentApp(res.data);
      setDetailVisible(true);
    }
  };

  const handleMatchVolunteer = async (volunteerId: string) => {
    if (!currentApp) return;
    const res = await applicationApi.matchVolunteer(currentApp.id, volunteerId);
    if (res.success) {
      message.success("志愿者匹配成功");
      setMatchModalVisible(false);
      loadApplications();
      handleViewDetail(currentApp.id);
    } else {
      message.error(res.message || "匹配失败");
    }
  };

  const handleUpdateStep = async (values: any) => {
    if (!currentApp || currentStepIndex === null) return;

    const res = await applicationApi.updateStatus(currentApp.id, {
      step_index: currentStepIndex,
      step_result: values.result,
      step_notes: values.notes,
    });

    if (res.success) {
      message.success("查访进度已更新");
      setStepModalVisible(false);
      form.resetFields();
      loadApplications();
      handleViewDetail(currentApp.id);
    } else {
      message.error(res.message || "更新失败");
    }
  };

  const handleBreak = async (id: string) => {
    const res = await applicationApi.updateStatus(id, { status: "broken" });
    if (res.success) {
      message.success("已标记为线索中断");
      loadApplications();
    } else {
      message.error(res.message || "操作失败");
    }
  };

  const columns = [
    {
      title: "申请人",
      dataIndex: "applicant_name",
      key: "applicant_name",
      width: 100,
    },
    {
      title: "姓氏",
      dataIndex: "surname",
      key: "surname",
      width: 60,
    },
    {
      title: "祖籍地",
      key: "origin",
      width: 180,
      render: (_: any, record: Application) => (
        <span>
          {record.origin_province} {record.origin_city}
        </span>
      ),
    },
    {
      title: "离乡年代",
      dataIndex: "departure_era",
      key: "departure_era",
      width: 100,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) => (
        <Tag color={STATUS_COLOR[status as keyof typeof STATUS_COLOR]}>
          {STATUS_TEXT[status as keyof typeof STATUS_TEXT]}
        </Tag>
      ),
    },
    {
      title: "结对志愿者",
      dataIndex: "volunteer_name",
      key: "volunteer_name",
      width: 100,
      render: (name: string) => name || "-",
    },
    {
      title: "申请时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
    },
    {
      title: "操作",
      key: "action",
      width: 200,
      render: (_: any, record: Application) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record.id)}
          >
            详情
          </Button>
          {record.status === "pending" && (
            <Button
              size="small"
              type="primary"
              onClick={() => {
                setCurrentApp(record);
                loadRecommendedVolunteers(record.id);
                setMatchModalVisible(true);
              }}
            >
              智能匹配
            </Button>
          )}
          {record.status === "investigating" && (
            <Popconfirm
              title="确认线索中断？"
              onConfirm={() => handleBreak(record.id)}
              okText="确认"
              cancelText="取消"
            >
              <Button size="small" danger icon={<CloseCircleOutlined />}>
                中断
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const getStepColor = (status: string) => {
    if (status === "completed") return "green";
    if (status === "in_progress") return "blue";
    return "gray";
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space size={16}>
          <Search
            placeholder="搜索申请人、线索..."
            allowClear
            onSearch={setKeyword}
            style={{ width: 280 }}
            enterButton={<SearchOutlined />}
          />
          <Select value={status} onChange={setStatus} style={{ width: 140 }}>
            <Option value="all">全部状态</Option>
            <Option value="pending">待匹配</Option>
            <Option value="investigating">查访中</Option>
            <Option value="confirmed">已确认</Option>
            <Option value="completed">已祭祖</Option>
            <Option value="broken">线索中断</Option>
          </Select>
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={applications}
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>

      <Drawer
        title="申请详情"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentApp && (
          <div>
            <Descriptions
              column={1}
              bordered
              size="small"
              style={{ marginBottom: 24 }}
            >
              <Descriptions.Item label="申请人">
                {currentApp.applicant_name}
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                {currentApp.applicant_phone || "未填写"}
              </Descriptions.Item>
              <Descriptions.Item label="姓氏">
                {currentApp.surname}
              </Descriptions.Item>
              <Descriptions.Item label="祖籍地">
                {currentApp.origin_province} {currentApp.origin_city}{" "}
                {currentApp.origin_district}
              </Descriptions.Item>
              <Descriptions.Item label="离乡年代">
                {currentApp.departure_era || "未知"}
              </Descriptions.Item>
              <Descriptions.Item label="村落线索">
                {currentApp.village_clue || "暂无"}
              </Descriptions.Item>
              <Descriptions.Item label="宗祠线索">
                {currentApp.ancestral_hall_clue || "暂无"}
              </Descriptions.Item>
              <Descriptions.Item label="已知祖先">
                {currentApp.known_ancestors || "暂无"}
              </Descriptions.Item>
              <Descriptions.Item label="结对志愿者">
                {currentApp.volunteer_name || "暂无"}
              </Descriptions.Item>
              <Descriptions.Item label="家族故事">
                <div style={{ whiteSpace: "pre-wrap" }}>
                  {currentApp.family_story || "暂无"}
                </div>
              </Descriptions.Item>
            </Descriptions>

            <h4 style={{ marginBottom: 16 }}>查访进度</h4>
            {currentApp.steps && currentApp.steps.length > 0 ? (
              <Timeline
                items={currentApp.steps.map((step: InvestigationStep) => ({
                  color: getStepColor(step.status),
                  children: (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <strong>{step.step_name}</strong>
                        <Space>
                          <Tag color={getStepColor(step.status)}>
                            {STEP_STATUS_TEXT[step.status]}
                          </Tag>
                          {currentApp.status === "investigating" &&
                            step.status !== "completed" && (
                              <Button
                                size="small"
                                onClick={() => {
                                  setCurrentStepIndex(step.step_index);
                                  setStepModalVisible(true);
                                }}
                              >
                                更新
                              </Button>
                            )}
                        </Space>
                      </div>
                      {step.result && (
                        <div
                          style={{
                            marginTop: 8,
                            padding: "8px 12px",
                            background: "#f5f5f5",
                            borderRadius: 4,
                          }}
                        >
                          {step.result}
                        </div>
                      )}
                      {step.notes && (
                        <div
                          style={{ marginTop: 6, fontSize: 12, color: "#999" }}
                        >
                          备注：{step.notes}
                        </div>
                      )}
                    </div>
                  ),
                }))}
              />
            ) : (
              <p style={{ color: "#999" }}>暂无查访记录</p>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        title="智能匹配结对志愿者"
        open={matchModalVisible}
        onCancel={() => setMatchModalVisible(false)}
        footer={null}
        width={600}
      >
        <p style={{ marginBottom: 16, color: "#666" }}>
          <SearchOutlined /> 根据姓氏、祖籍地、专长等多维度智能推荐：
        </p>
        <div style={{ maxHeight: 400, overflow: "auto" }}>
          {recommendedVolunteers.length > 0 ? (
            recommendedVolunteers.map((v) => (
              <Card
                key={v.id}
                size="small"
                style={{ marginBottom: 8, cursor: "pointer" }}
                onClick={() => handleMatchVolunteer(v.id)}
                hoverable
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <strong>{v.name}</strong>
                      {v.surnames && <Tag color="blue">{v.surnames}氏</Tag>}
                    </div>
                    <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                      <EnvironmentOutlined /> {v.province} {v.city} {v.district}
                    </div>
                    {v.skills && (
                      <div
                        style={{ fontSize: 12, color: "#888", marginTop: 2 }}
                      >
                        专长：{v.skills}
                      </div>
                    )}
                    {v.match_reasons && v.match_reasons.length > 0 && (
                      <div style={{ marginTop: 6 }}>
                        {v.match_reasons.map((r, i) => (
                          <Tag
                            key={i}
                            color="default"
                            style={{
                              fontSize: 11,
                              marginRight: 4,
                              marginBottom: 4,
                            }}
                          >
                            {r.reason} +{r.score}
                          </Tag>
                        ))}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      marginLeft: 16,
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: "bold",
                        color:
                          v.match_score >= 70
                            ? "#52c41a"
                            : v.match_score >= 40
                              ? "#faad14"
                              : "#999",
                      }}
                    >
                      {v.match_score}
                    </div>
                    <div style={{ fontSize: 10, color: "#999" }}>匹配度</div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Empty description="暂无推荐志愿者" />
          )}
        </div>
      </Modal>

      <Modal
        title="更新查访进度"
        open={stepModalVisible}
        onCancel={() => setStepModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdateStep}>
          <Form.Item
            name="result"
            label="查访结果"
            rules={[{ required: true, message: "请输入查访结果" }]}
          >
            <TextArea rows={4} placeholder="请输入这一步的查访结果" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <TextArea rows={2} placeholder="可选：补充说明" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Button
              onClick={() => setStepModalVisible(false)}
              style={{ marginRight: 8 }}
            >
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              确认更新
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
