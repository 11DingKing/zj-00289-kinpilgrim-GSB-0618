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
  message,
  Popconfirm,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { villageApi } from "../../api";
import type { AncestralVillage } from "../../types";

export default function AdminVillages() {
  const [villages, setVillages] = useState<AncestralVillage[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVillage, setEditingVillage] = useState<AncestralVillage | null>(
    null,
  );
  const [form] = Form.useForm();
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    loadVillages();
  }, [keyword]);

  const loadVillages = async () => {
    setLoading(true);
    const res = await villageApi.list({ keyword: keyword || undefined });
    if (res.success) {
      setVillages(res.data);
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setEditingVillage(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: AncestralVillage) => {
    setEditingVillage(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    const res = await villageApi.delete(id);
    if (res.success) {
      message.success("删除成功");
      loadVillages();
    } else {
      message.error(res.message || "删除失败");
    }
  };

  const handleSubmit = async (values: any) => {
    let res;
    if (editingVillage) {
      res = await villageApi.update(editingVillage.id, values);
    } else {
      res = await villageApi.create(values);
    }

    if (res.success) {
      message.success(editingVillage ? "更新成功" : "添加成功");
      setModalVisible(false);
      loadVillages();
    } else {
      message.error(res.message || "操作失败");
    }
  };

  const columns = [
    {
      title: "村名",
      dataIndex: "name",
      key: "name",
      width: 120,
    },
    {
      title: "姓氏",
      dataIndex: "surname",
      key: "surname",
      width: 60,
      render: (surname: string) => <Tag color="default">{surname}氏</Tag>,
    },
    {
      title: "地址",
      key: "address",
      width: 200,
      render: (_: any, record: AncestralVillage) => (
        <span>
          {record.province} {record.city} {record.district}
        </span>
      ),
    },
    {
      title: "宗祠名称",
      dataIndex: "ancestral_hall_name",
      key: "ancestral_hall_name",
      width: 180,
    },
    {
      title: "简介",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "操作",
      key: "action",
      width: 140,
      render: (_: any, record: AncestralVillage) => (
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
            placeholder="搜索村名、宗祠..."
            allowClear
            onSearch={setKeyword}
            style={{ width: 280 }}
            enterButton
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加宗祠村落
          </Button>
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={villages}
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>

      <Modal
        title={editingVillage ? "编辑宗祠村落" : "添加宗祠村落"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Space size={16}>
            <Form.Item
              name="name"
              label="村名"
              rules={[{ required: true }]}
              style={{ flex: 1, marginBottom: 0 }}
            >
              <Input placeholder="请输入村名" />
            </Form.Item>
            <Form.Item
              name="surname"
              label="姓氏"
              rules={[{ required: true }]}
              style={{ flex: 1, marginBottom: 0 }}
            >
              <Input placeholder="主要姓氏" />
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
            name="ancestral_hall_name"
            label="宗祠名称"
            style={{ marginBottom: 0 }}
          >
            <Input placeholder="如：颍川陈氏宗祠" />
          </Form.Item>
          <Form.Item
            name="description"
            label="村落简介"
            style={{ marginBottom: 0 }}
          >
            <Input.TextArea rows={3} placeholder="村落历史、族谱等简介" />
          </Form.Item>
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
