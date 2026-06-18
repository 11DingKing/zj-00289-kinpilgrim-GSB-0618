import { useState } from "react";
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Row,
  Col,
  Select,
  Steps,
  message,
  Divider,
} from "antd";
import {
  UserOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { applicationApi } from "../api";

const { TextArea } = Input;
const { Step } = Steps;
const { Option } = Select;

const provinces = [
  "福建省",
  "广东省",
  "浙江省",
  "江苏省",
  "江西省",
  "湖南省",
  "湖北省",
  "安徽省",
  "山东省",
  "河南省",
  "河北省",
  "山西省",
  "陕西省",
  "四川省",
  "云南省",
  "贵州省",
  "广西壮族自治区",
  "海南省",
  "台湾省",
];

export default function ApplyForm() {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const res = await applicationApi.create(values);

      if (res.success) {
        message.success("寻根申请已提交！我们会尽快为您匹配志愿者");
        setTimeout(() => {
          navigate(`/applications/${res.data.id}`);
        }, 1500);
      } else {
        message.error(res.message || "提交失败");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { title: "基本信息", icon: <UserOutlined /> },
    { title: "祖籍线索", icon: <EnvironmentOutlined /> },
    { title: "家族故事", icon: <FileTextOutlined /> },
  ];

  const next = () => {
    if (currentStep === 0) {
      form
        .validateFields(["applicant_name", "surname", "applicant_phone"])
        .then(() => setCurrentStep(currentStep + 1))
        .catch(() => {});
    } else if (currentStep === 1) {
      form
        .validateFields(["origin_province", "origin_city"])
        .then(() => setCurrentStep(currentStep + 1))
        .catch(() => {});
    }
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: "#8B4513",
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        发起寻根申请
      </h1>
      <p style={{ textAlign: "center", color: "#999", marginBottom: 32 }}>
        填写您的寻根信息，我们将为您匹配当地志愿者协助查访
      </p>

      <Card>
        <Steps
          current={currentStep}
          items={steps}
          style={{ marginBottom: 32 }}
        />

        <Form form={form} layout="vertical" size="large">
          {currentStep === 0 && (
            <div>
              <Divider orientation="left">基本信息</Divider>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="applicant_name"
                    label="申请人姓名"
                    rules={[{ required: true, message: "请输入申请人姓名" }]}
                  >
                    <Input
                      placeholder="请输入您的姓名"
                      prefix={<UserOutlined />}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="surname"
                    label="家族姓氏"
                    rules={[{ required: true, message: "请输入家族姓氏" }]}
                  >
                    <Input placeholder="请输入姓氏" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="applicant_phone"
                    label="联系电话"
                    rules={[{ required: true, message: "请输入联系电话" }]}
                  >
                    <Input placeholder="请输入联系电话" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="generation_count" label="已知世代数">
                    <InputNumber
                      min={1}
                      max={20}
                      style={{ width: "100%" }}
                      placeholder="已知的祖辈世代数"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          )}

          {currentStep === 1 && (
            <div>
              <Divider orientation="left">祖籍地线索</Divider>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="origin_province"
                    label="祖籍省份"
                    rules={[{ required: true, message: "请选择祖籍省份" }]}
                  >
                    <Select placeholder="请选择" showSearch>
                      {provinces.map((p) => (
                        <Option key={p} value={p}>
                          {p}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="origin_city" label="祖籍城市">
                    <Input placeholder="请输入" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="origin_district" label="祖籍区县">
                    <Input placeholder="请输入" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="village_clue" label="村落线索">
                    <TextArea
                      rows={3}
                      placeholder="记得的村名、地名、附近地标等"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="ancestral_hall_clue" label="宗祠线索">
                    <TextArea rows={3} placeholder="宗祠名称、堂号、对联等" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="departure_era" label="先辈离乡年代">
                    <Select placeholder="请选择">
                      <Option value="清代">清代</Option>
                      <Option value="清末民初">清末民初</Option>
                      <Option value="民国时期">民国时期</Option>
                      <Option value="1930年代">1930年代</Option>
                      <Option value="1940年代">1940年代</Option>
                      <Option value="1950年代以后">1950年代以后</Option>
                      <Option value="不确定">不确定</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="known_ancestors" label="已知先辈姓名">
                    <Input placeholder="记得的祖先名字，多位用逗号分隔" />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <Divider orientation="left">家族故事</Divider>
              <Form.Item name="family_story" label="家族迁徙与寻根故事">
                <TextArea
                  rows={8}
                  placeholder="请讲述您家族的迁徙故事、祖辈的口传记忆、以及您寻根的心愿..."
                  style={{ resize: "none" }}
                />
              </Form.Item>
              <p style={{ color: "#999", fontSize: 13 }}>
                💡
                提示：故事越详细，越有助于志愿者们为您查访。包括任何细节、传说、甚至方言词汇都可能是重要线索。
              </p>
            </div>
          )}

          <div style={{ marginTop: 32, textAlign: "right" }}>
            {currentStep > 0 && (
              <Button onClick={prev} style={{ marginRight: 8 }}>
                上一步
              </Button>
            )}
            {currentStep < 2 ? (
              <Button type="primary" onClick={next}>
                下一步
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={submitting}
              >
                提交申请
              </Button>
            )}
          </div>
        </Form>
      </Card>
    </div>
  );
}
