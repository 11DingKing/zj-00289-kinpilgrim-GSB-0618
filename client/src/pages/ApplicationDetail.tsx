import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Card,
  Descriptions,
  Tag,
  Timeline,
  Row,
  Col,
  Divider,
  Empty,
  Spin,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Progress,
  Switch,
  InputNumber,
  Tooltip,
} from "antd";
import {
  UserOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  HomeOutlined,
  LinkOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  applicationApi,
  pilgrimageApi,
  villageApi,
  volunteerApi,
  kinshipApi,
  matchingApi,
} from "../api";
import type {
  Application,
  InvestigationStep,
  Pilgrimage,
  AncestralVillage,
  Volunteer,
  KinshipArchive,
  RelatedCluesResult,
  VolunteerMatchScore,
} from "../types";
import { STATUS_TEXT, STATUS_COLOR, STEP_STATUS_TEXT } from "../types";

const { TextArea } = Input;
const { Option } = Select;

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [pilgrimageModalVisible, setPilgrimageModalVisible] = useState(false);
  const [villages, setVillages] = useState<AncestralVillage[]>([]);
  const [recommendedVolunteers, setRecommendedVolunteers] = useState<
    VolunteerMatchScore[]
  >([]);
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [kinshipModalVisible, setKinshipModalVisible] = useState(false);
  const [relatedClues, setRelatedClues] = useState<RelatedCluesResult | null>(
    null,
  );
  const [kinshipArchives, setKinshipArchives] = useState<KinshipArchive[]>([]);
  const [form] = Form.useForm();
  const [kinshipForm] = Form.useForm();

  useEffect(() => {
    if (id) {
      loadDetail();
      loadOptions();
      loadRelatedClues();
      loadKinshipArchives();
    }
  }, [id]);

  const loadDetail = async () => {
    if (!id) return;
    setLoading(true);
    const res = await applicationApi.get(id);
    if (res.success) {
      setApplication(res.data);
    }
    setLoading(false);
  };

  const loadOptions = async () => {
    const villageRes = await villageApi.list();
    if (villageRes.success) setVillages(villageRes.data);
  };

  const loadRelatedClues = async () => {
    if (!id) return;
    const res = await matchingApi.getRelatedClues(id);
    if (res.success) {
      setRelatedClues(res.data);
    }
  };

  const loadKinshipArchives = async () => {
    if (!id) return;
    const res = await kinshipApi.list({ application_id: id });
    if (res.success) {
      setKinshipArchives(res.data);
    }
  };

  const loadRecommendedVolunteers = async () => {
    if (!id) return;
    const res = await matchingApi.recommendVolunteers(id);
    if (res.success) {
      setRecommendedVolunteers(res.data);
    }
  };

  const handleCreatePilgrimage = async (values: any) => {
    if (!id) return;
    const res = await pilgrimageApi.create({
      application_id: id,
      village_id: values.village_id,
      ancestral_hall: values.ancestral_hall,
      pilgrimage_date: values.pilgrimage_date.format("YYYY-MM-DD"),
      companion_name: values.companion_name,
      companion_phone: values.companion_phone,
    });
    if (res.success) {
      message.success("祭祖行程已创建");
      setPilgrimageModalVisible(false);
      form.resetFields();
      loadDetail();
    } else {
      message.error(res.message || "创建失败");
    }
  };

  const handleMatchVolunteer = async (volunteer_id: string) => {
    if (!id) return;
    const res = await applicationApi.matchVolunteer(id, volunteer_id);
    if (res.success) {
      message.success("志愿者匹配成功");
      setMatchModalVisible(false);
      loadDetail();
    } else {
      message.error(res.message || "匹配失败");
    }
  };

  const handleCreateKinship = async (values: any) => {
    if (!id) return;
    const res = await kinshipApi.create({
      application_id: id,
      village_id: values.village_id,
      confirmed_surname: values.confirmed_surname,
      relationship_type: values.relationship_type,
      ancestor_name: values.ancestor_name,
      generation_level: values.generation_level,
      confirmation_basis: values.confirmation_basis,
      dna_verified: values.dna_verified ? 1 : 0,
      archive_notes: values.archive_notes,
      confirmer_name: values.confirmer_name,
    });
    if (res.success) {
      message.success("认亲档案已创建");
      setKinshipModalVisible(false);
      kinshipForm.resetFields();
      loadDetail();
      loadKinshipArchives();
    } else {
      message.error(res.message || "创建失败");
    }
  };

  const getStepColor = (status: string) => {
    if (status === "completed") return "green";
    if (status === "in_progress") return "blue";
    return "gray";
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 70) return "#52c41a";
    if (score >= 40) return "#faad14";
    return "#999";
  };

  const handleOpenMatchModal = () => {
    loadRecommendedVolunteers();
    setMatchModalVisible(true);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!application) {
    return <Empty description="申请不存在" />;
  }

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
      <Card
        style={{ marginBottom: 24 }}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20 }}>
              {application.surname}氏寻根申请
            </span>
            <Tag
              color={
                STATUS_COLOR[application.status as keyof typeof STATUS_COLOR]
              }
            >
              {STATUS_TEXT[application.status as keyof typeof STATUS_TEXT]}
            </Tag>
          </div>
        }
        extra={
          <div style={{ display: "flex", gap: 8 }}>
            {application.status === "pending" && (
              <Button type="primary" onClick={handleOpenMatchModal}>
                匹配志愿者
              </Button>
            )}
            {(application.status === "investigating" ||
              application.status === "confirmed") && (
              <>
                <Button onClick={() => setKinshipModalVisible(true)}>
                  <SafetyCertificateOutlined /> 创建认亲档案
                </Button>
                <Button
                  type="primary"
                  onClick={() => setPilgrimageModalVisible(true)}
                >
                  登记祭祖行程
                </Button>
              </>
            )}
          </div>
        }
      >
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="申请人">
            {application.applicant_name}
          </Descriptions.Item>
          <Descriptions.Item label="联系电话">
            {application.applicant_phone || "未填写"}
          </Descriptions.Item>
          <Descriptions.Item label="姓氏">
            {application.surname}
          </Descriptions.Item>
          <Descriptions.Item label="离乡年代">
            {application.departure_era || "未知"}
          </Descriptions.Item>
          <Descriptions.Item label="祖籍省份" span={2}>
            <EnvironmentOutlined /> {application.origin_province}{" "}
            {application.origin_city} {application.origin_district}
          </Descriptions.Item>
          <Descriptions.Item label="已知世代">
            {application.generation_count || "未知"} 代
          </Descriptions.Item>
          <Descriptions.Item label="已知祖先">
            {application.known_ancestors || "未知"}
          </Descriptions.Item>
          <Descriptions.Item label="村落线索" span={2}>
            {application.village_clue || "暂无"}
          </Descriptions.Item>
          <Descriptions.Item label="宗祠线索" span={2}>
            {application.ancestral_hall_clue || "暂无"}
          </Descriptions.Item>
          <Descriptions.Item label="家族故事" span={2}>
            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
              {application.family_story || "暂无"}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="结对志愿者">
            {application.volunteer_name || "暂无"}
            {application.volunteer_phone && ` (${application.volunteer_phone})`}
          </Descriptions.Item>
          <Descriptions.Item label="申请时间">
            <ClockCircleOutlined /> {application.created_at}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col span={14}>
          <Card title="查访进度" className="timeline-custom">
            {application.steps && application.steps.length > 0 ? (
              <Timeline
                items={application.steps.map((step: InvestigationStep) => ({
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
                        <Tag color={getStepColor(step.status)}>
                          {STEP_STATUS_TEXT[step.status]}
                        </Tag>
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
                      <div
                        style={{ marginTop: 6, fontSize: 12, color: "#ccc" }}
                      >
                        更新于 {step.updated_at}
                      </div>
                    </div>
                  ),
                }))}
              />
            ) : (
              <Empty description="暂无查访记录" />
            )}
          </Card>
        </Col>

        <Col span={10}>
          <Card title="祭祖行程">
            {application.pilgrimage ? (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <Tag color="green">
                    {application.pilgrimage.status === "completed"
                      ? "已完成"
                      : "已预约"}
                  </Tag>
                </div>
                <p>
                  <strong>
                    <HomeOutlined /> 宗祠：
                  </strong>
                  {application.pilgrimage.ancestral_hall}
                </p>
                <p>
                  <strong>日期：</strong>
                  {application.pilgrimage.pilgrimage_date}
                </p>
                {application.pilgrimage.companion_name && (
                  <p>
                    <strong>随行结对人：</strong>
                    {application.pilgrimage.companion_name}
                  </p>
                )}
                {application.pilgrimage.memories && (
                  <>
                    <Divider orientation="left">祭祖留念</Divider>
                    <p style={{ lineHeight: 1.8, color: "#666" }}>
                      {application.pilgrimage.memories}
                    </p>
                  </>
                )}
                {application.pilgrimage.story && (
                  <>
                    <Divider orientation="left">寻根故事</Divider>
                    <p style={{ lineHeight: 1.8, color: "#666" }}>
                      {application.pilgrimage.story}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <Empty description="暂无祭祖行程" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card
            title={
              <span>
                <LinkOutlined /> 相关线索推荐
              </span>
            }
            extra={<Tag color="blue">基于姓氏、祖籍地、宗祠线索智能匹配</Tag>}
          >
            <Divider orientation="left" style={{ marginTop: 0 }}>
              <TeamOutlined /> 同宗/同乡寻根申请
            </Divider>
            {relatedClues && relatedClues.applications.length > 0 ? (
              <div style={{ maxHeight: 240, overflow: "auto" }}>
                {relatedClues.applications.map((app) => (
                  <Card
                    key={app.id}
                    size="small"
                    style={{ marginBottom: 8 }}
                    className="card-hover"
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <Link to={`/applications/${app.id}`}>
                          <strong>
                            {app.surname}氏 · {app.applicant_name}
                          </strong>
                        </Link>
                        <Tag color="default" style={{ marginLeft: 8 }}>
                          {STATUS_TEXT[app.status as keyof typeof STATUS_TEXT]}
                        </Tag>
                      </div>
                      <Tooltip title="匹配度">
                        <Progress
                          type="dashboard"
                          percent={app.match_score}
                          size={48}
                          strokeColor={getMatchScoreColor(app.match_score)}
                        />
                      </Tooltip>
                    </div>
                    <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                      {app.origin_province} {app.origin_city}
                      {app.village_clue && ` · ${app.village_clue}`}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Empty
                description="暂无相关申请"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}

            <Divider orientation="left">
              <HomeOutlined /> 相关宗祠村落
            </Divider>
            {relatedClues && relatedClues.villages.length > 0 ? (
              <div style={{ maxHeight: 200, overflow: "auto" }}>
                {relatedClues.villages.map((v) => (
                  <Card
                    key={v.id}
                    size="small"
                    style={{ marginBottom: 8 }}
                    className="card-hover"
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <strong>{v.name}</strong>
                        <Tag color="blue" style={{ marginLeft: 8 }}>
                          {v.surname}氏
                        </Tag>
                      </div>
                      <Tooltip title="匹配度">
                        <Progress
                          type="dashboard"
                          percent={v.match_score}
                          size={48}
                          strokeColor={getMatchScoreColor(v.match_score)}
                        />
                      </Tooltip>
                    </div>
                    <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                      {v.province} {v.city} {v.district}
                      {v.ancestral_hall_name && ` · ${v.ancestral_hall_name}`}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Empty
                description="暂无相关村落"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </Col>

        <Col span={12}>
          <Card
            title={
              <span>
                <SafetyCertificateOutlined /> 认亲档案
              </span>
            }
            extra={
              application.status !== "pending" && (
                <Button
                  size="small"
                  onClick={() => setKinshipModalVisible(true)}
                >
                  新建档案
                </Button>
              )
            }
          >
            {kinshipArchives.length > 0 ? (
              <div style={{ maxHeight: 480, overflow: "auto" }}>
                {kinshipArchives.map((archive) => (
                  <Card
                    key={archive.id}
                    size="small"
                    style={{ marginBottom: 12 }}
                    title={
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <strong>{archive.confirmed_surname}氏宗亲确认</strong>
                        {archive.dna_verified ? (
                          <Tag color="green">DNA验证</Tag>
                        ) : null}
                      </div>
                    }
                  >
                    <Descriptions column={1} size="small" bordered>
                      {archive.village_name && (
                        <Descriptions.Item label="确认村落">
                          <EnvironmentOutlined /> {archive.village_name}
                          {archive.ancestral_hall_name &&
                            ` · ${archive.ancestral_hall_name}`}
                        </Descriptions.Item>
                      )}
                      {archive.relationship_type && (
                        <Descriptions.Item label="宗亲关系">
                          {archive.relationship_type}
                        </Descriptions.Item>
                      )}
                      {archive.ancestor_name && (
                        <Descriptions.Item label="共祖名讳">
                          {archive.ancestor_name}
                        </Descriptions.Item>
                      )}
                      {archive.generation_level && (
                        <Descriptions.Item label="世代">
                          第 {archive.generation_level} 代
                        </Descriptions.Item>
                      )}
                      {archive.confirmation_basis && (
                        <Descriptions.Item label="确认依据">
                          <div style={{ whiteSpace: "pre-wrap" }}>
                            {archive.confirmation_basis}
                          </div>
                        </Descriptions.Item>
                      )}
                      {archive.archive_notes && (
                        <Descriptions.Item label="备注">
                          <div style={{ whiteSpace: "pre-wrap" }}>
                            {archive.archive_notes}
                          </div>
                        </Descriptions.Item>
                      )}
                      <Descriptions.Item label="确认人">
                        {archive.confirmer_name || "未记录"} ·{" "}
                        {archive.confirmed_at}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                ))}
              </div>
            ) : (
              <Empty
                description={
                  <span>
                    尚无认亲档案记录
                    <br />
                    宗亲确认后可在此存档备查
                  </span>
                }
              />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="登记祭祖行程"
        open={pilgrimageModalVisible}
        onCancel={() => setPilgrimageModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreatePilgrimage}>
          <Form.Item name="village_id" label="确认村落">
            <Select
              placeholder="选择已确认的宗祠村落"
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {villages.map((v) => (
                <Option key={v.id} value={v.id}>
                  {v.name} - {v.ancestral_hall_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="ancestral_hall"
            label="宗祠名称"
            rules={[{ required: true, message: "请输入宗祠名称" }]}
          >
            <Input placeholder="请输入宗祠名称" />
          </Form.Item>
          <Form.Item
            name="pilgrimage_date"
            label="祭祖日期"
            rules={[{ required: true, message: "请选择祭祖日期" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="companion_name" label="随行结对人">
            <Input placeholder="请输入随行志愿者姓名" />
          </Form.Item>
          <Form.Item name="companion_phone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Button
              onClick={() => setPilgrimageModalVisible(false)}
              style={{ marginRight: 8 }}
            >
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              确认登记
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="智能匹配结对志愿者"
        open={matchModalVisible}
        onCancel={() => setMatchModalVisible(false)}
        footer={null}
        width={600}
      >
        <div>
          <p style={{ marginBottom: 16, color: "#666" }}>
            <SearchOutlined /> 根据姓氏、祖籍地、专长等多维度智能推荐志愿者：
          </p>
          <div style={{ maxHeight: 400, overflow: "auto" }}>
            {recommendedVolunteers.length > 0 ? (
              recommendedVolunteers.map((v) => (
                <Card
                  key={v.id}
                  size="small"
                  style={{ marginBottom: 8, cursor: "pointer" }}
                  onClick={() => handleMatchVolunteer(v.id)}
                  className="card-hover"
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
                      <div
                        style={{ fontSize: 12, color: "#666", marginTop: 4 }}
                      >
                        <EnvironmentOutlined /> {v.province} {v.city}{" "}
                        {v.district}
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
                    <Progress
                      type="dashboard"
                      percent={v.match_score}
                      size={64}
                      strokeColor={getMatchScoreColor(v.match_score)}
                    />
                  </div>
                </Card>
              ))
            ) : (
              <Empty description="暂无推荐志愿者" />
            )}
          </div>
        </div>
      </Modal>

      <Modal
        title="创建认亲档案"
        open={kinshipModalVisible}
        onCancel={() => setKinshipModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={kinshipForm}
          layout="vertical"
          onFinish={handleCreateKinship}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="confirmed_surname"
                label="确认姓氏"
                rules={[{ required: true, message: "请输入确认姓氏" }]}
                initialValue={application?.surname}
              >
                <Input placeholder="请输入确认姓氏" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="village_id" label="确认村落">
                <Select
                  placeholder="选择宗祠村落"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {villages.map((v) => (
                    <Option key={v.id} value={v.id}>
                      {v.name} - {v.ancestral_hall_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="relationship_type" label="宗亲关系">
                <Input placeholder="如：同宗共祖、堂亲分支等" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ancestor_name" label="共祖名讳">
                <Input placeholder="请输入共同祖先名讳" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="generation_level" label="世代数">
                <InputNumber
                  min={1}
                  style={{ width: "100%" }}
                  placeholder="请输入世代数"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="dna_verified"
                label="DNA验证"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="confirmation_basis"
            label="确认依据"
            rules={[{ required: true, message: "请填写确认依据" }]}
          >
            <TextArea
              rows={3}
              placeholder="请详细描述确认依据，如族谱记载、碑文比对、老人证言等"
            />
          </Form.Item>
          <Form.Item name="archive_notes" label="备注">
            <TextArea rows={2} placeholder="可选补充说明" />
          </Form.Item>
          <Form.Item name="confirmer_name" label="确认人">
            <Input placeholder="请输入确认人姓名" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Button
              onClick={() => setKinshipModalVisible(false)}
              style={{ marginRight: 8 }}
            >
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              创建档案
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
