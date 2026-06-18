import { useEffect, useState } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Modal,
  Form,
  Select,
  message,
  Popconfirm,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { volunteerApi } from "../../api";
import type { Volunteer } from "../../types";

const { Option } = Select;

export default function AdminVolunteers() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(
    null,
  );
  const [form] = Form.useForm();
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    loadVolunteers();
  }, [keyword]);

  const loadVolunteers = async () => {
    setLoading(true);
    const res = await volunteerApi.list({ keyword: keyword || undefined });
    if (res.success) {
      setVolunteers(res.data);
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setEditingVolunteer(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Volunteer) => {
    setEditingVolunteer(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    const res = await volunteerApi.delete(id);
    if (res.success) {
      message.success("删除成功");
      loadVolunteers();
    } else {
      message.error(res.message || "删除失败");
    }
  };

  const handleSubmit = async (values: any) => {
    let res;
    if (editingVolunteer) {
      res = await volunteerApi.update(editingVolunteer.id, values);
    } else {
      res = await volunteerApi.create(values);
    }

    if (res.success) {
      message.success(editingVolunteer ? "更新成功" : "添加成功");
      setModalVisible(false);
      loadVolunteers();
    } else {
      message.error(res.message || "操作失败");
    }
  };

  const columns = [
    {
      title: "姓名",
      dataIndex: "name",
      key: "name",
      width: 100,
    },
    {
      title: "电话",
      dataIndex: "phone",
      key: "phone",
      width: 120,
    },
    {
      title: "地区",
      key: "region",
      width: 180,
      render: (_: any, record: Volunteer) => (
        <span>
          {record.province} {record.city} {record.district}
        </span>
      ),
    },
    {
      title: "熟悉姓氏",
      dataIndex: "surnames",
      key: "surnames",
      width: 100,
      render: (surnames: string) =>
        surnames
          ? surnames.split(",").map((s) => (
              <Tag key={s} color="blue">
                {s}氏
              </Tag>
            ))
          : "-",
    },
    {
      title: "专长技能",
      dataIndex: "skills",
      key: "skills",
      render: (skills: string) => skills || "-",
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 80,
      render: (status: string) => (
        <Tag color={status === "active" ? "green" : "default"}>
          {status === "active" ? "活跃" : "停用"}
        </Tag>
      ),
    },
    {
      title: "操作",
      key: "action",
      width: 140,
      render: (_: any, record: Volunteer) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space size={16}>
          <Input.Search
            placeholder="搜索志愿者姓名、技能..."
            allowClear
            onSearch={setKeyword}
            style={{ width: 280 }}
            enterButton
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加志愿者
          </Button>
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={volunteers}
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>

      <Modal
        title={editingVolunteer ? "编辑志愿者" : "添加志愿者"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Space direction="vertical" style={{ width: "100%" }} size={[8, 8]}>
            <Space size={16}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true }]}
                style={{ flex: 1, marginBottom: 0 }}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
              <Form.Item
                name="phone"
                label="电话"
                style={{ flex: 1, marginBottom: 0 }}
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Space>
            <Space size={16}>
              <Form.Item
                name="province"
                label="省份"
                rules={[{ required: true }]}
                style={{ flex: 1, marginBottom: 0 }}
              >
                <Input placeholder="省份" />
              </Form.Item>
              <Form.Item
                name="city"
                label="城市"
                rules={[{ required: true }]}
                style={{ flex: 1, marginBottom: 0 }}
              >
                <Input placeholder="城市" />
              </Form.Item>
              <Form.Item
                name="district"
                label="区县"
                style={{ flex: 1, marginBottom: 0 }}
              >
                <Input placeholder="区县" />
              </Form.Item>
            </Space>
            <Form.Item
              name="surnames"
              label="熟悉姓氏"
              style={{ marginBottom: 0 }}
            >
              <Input placeholder="多个姓氏用逗号分隔，如：陈,林,黄" />
            </Form.Item>
            <Form.Item
              name="skills"
              label="专长技能"
              style={{ marginBottom: 0 }}
            >
              <Input.TextArea
                rows={2}
                placeholder="如：族谱研究、地方史、方言等"
              />
            </Form.Item>
            {editingVolunteer && (
              <Form.Item name="status" label="状态" style={{ marginBottom: 0 }}>
                <Select>
                  <Option value="active">活跃</Option>
                  <Option value="inactive">停用</Option>
                </Select>
              </Form.Item>
            )}
          </Space>
          <div style={{ textAlign: "right", marginTop: 24 }}>
            <Button
              onClick={() => setModalVisible(false)}
              style={{ marginRight: 8 }}
            >
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              确认
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
