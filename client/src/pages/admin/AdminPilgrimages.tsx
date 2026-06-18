import { useEffect, useState } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Select,
  Modal,
  Form,
  Input,
  DatePicker,
  message,
  Drawer,
  Descriptions,
} from "antd";
import { EyeOutlined, CheckOutlined } from "@ant-design/icons";
import { pilgrimageApi, villageApi } from "../../api";
import type { Pilgrimage, AncestralVillage } from "../../types";

const { Option } = Select;
const { TextArea } = Input;

export default function AdminPilgrimages() {
  const [pilgrimages, setPilgrimages] = useState<Pilgrimage[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("all");
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentPilgrimage, setCurrentPilgrimage] = useState<Pilgrimage | null>(
    null,
  );
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [villages, setVillages] = useState<AncestralVillage[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    loadPilgrimages();
    loadVillages();
  }, [status]);

  const loadPilgrimages = async () => {
    setLoading(true);
    const res = await pilgrimageApi.list({
      status: status === "all" ? undefined : status,
    });
    if (res.success) {
      setPilgrimages(res.data);
    }
    setLoading(false);
  };

  const loadVillages = async () => {
    const res = await villageApi.list();
    if (res.success) {
      setVillages(res.data);
    }
  };

  const handleViewDetail = async (id: string) => {
    const res = await pilgrimageApi.get(id);
    if (res.success) {
      setCurrentPilgrimage(res.data);
      setDetailVisible(true);
    }
  };

  const handleComplete = (record: Pilgrimage) => {
    setCurrentPilgrimage(record);
    form.resetFields();
    setCompleteModalVisible(true);
  };

  const handleCompleteSubmit = async (values: any) => {
    if (!currentPilgrimage) return;

    const res = await pilgrimageApi.complete(currentPilgrimage.id, {
      memories: values.memories,
      story: values.story,
    });

    if (res.success) {
      message.success("祭祖行程已完成");
      setCompleteModalVisible(false);
      loadPilgrimages();
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
      render: (s: string) => s && <Tag color="default">{s}氏</Tag>,
    },
    {
      title: "宗祠",
      dataIndex: "ancestral_hall",
      key: "ancestral_hall",
      width: 180,
    },
    {
      title: "祭祖日期",
      dataIndex: "pilgrimage_date",
      key: "pilgrimage_date",
      width: 120,
    },
    {
      title: "随行结对人",
      dataIndex: "companion_name",
      key: "companion_name",
      width: 100,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 80,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          scheduled: "warning",
          completed: "success",
          cancelled: "default",
        };
        const textMap: Record<string, string> = {
          scheduled: "已预约",
          completed: "已完成",
          cancelled: "已取消",
        };
        return <Tag color={colorMap[status]}>{textMap[status]}</Tag>;
      },
    },
    {
      title: "操作",
      key: "action",
      width: 160,
      render: (_: any, record: Pilgrimage) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record.id)}
          >
            详情
          </Button>
          {record.status === "scheduled" && (
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => handleComplete(record)}
            >
              完成
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space size={16}>
          <Select value={status} onChange={setStatus} style={{ width: 140 }}>
            <Option value="all">全部状态</Option>
            <Option value="scheduled">已预约</Option>
            <Option value="completed">已完成</Option>
            <Option value="cancelled">已取消</Option>
          </Select>
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={pilgrimages}
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>

      <Drawer
        title="祭祖行程详情"
        width={500}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentPilgrimage && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="申请人">
                {currentPilgrimage.applicant_name} ({currentPilgrimage.surname}
                氏)
              </Descriptions.Item>
              <Descriptions.Item label="宗祠名称">
                {currentPilgrimage.ancestral_hall}
              </Descriptions.Item>
              <Descriptions.Item label="祭祖日期">
                {currentPilgrimage.pilgrimage_date}
              </Descriptions.Item>
              <Descriptions.Item label="随行结对人">
                {currentPilgrimage.companion_name || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="村落">
                {currentPilgrimage.village_name || "-"}
                {currentPilgrimage.province &&
                  ` (${currentPilgrimage.province} ${currentPilgrimage.city})`}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {currentPilgrimage.status === "completed" ? "已完成" : "已预约"}
              </Descriptions.Item>
            </Descriptions>

            {currentPilgrimage.story && (
              <div style={{ marginTop: 24 }}>
                <h4 style={{ marginBottom: 12 }}>寻根故事</h4>
                <div
                  style={{
                    padding: 16,
                    background: "#fafafa",
                    borderRadius: 8,
                    lineHeight: 1.8,
                  }}
                >
                  {currentPilgrimage.story}
                </div>
              </div>
            )}

            {currentPilgrimage.memories && (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ marginBottom: 12 }}>祭祖留念</h4>
                <div
                  style={{
                    padding: 16,
                    background: "#fff7e6",
                    borderRadius: 8,
                    lineHeight: 1.8,
                    fontStyle: "italic",
                    color: "#8B4513",
                  }}
                >
                  "{currentPilgrimage.memories}"
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        title="完成祭祖行程"
        open={completeModalVisible}
        onCancel={() => setCompleteModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCompleteSubmit}>
          <Form.Item
            name="memories"
            label="祭祖留念"
            style={{ marginBottom: 16 }}
          >
            <TextArea
              rows={3}
              placeholder="记录祭祖当天的感受、印象最深的时刻..."
            />
          </Form.Item>
          <Form.Item name="story" label="寻根故事">
            <TextArea
              rows={5}
              placeholder="讲述完整的寻根故事，分享给更多人..."
            />
          </Form.Item>
          <div style={{ textAlign: "right" }}>
            <Button
              onClick={() => setCompleteModalVisible(false)}
              style={{ marginRight: 8 }}
            >
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              确认完成
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
