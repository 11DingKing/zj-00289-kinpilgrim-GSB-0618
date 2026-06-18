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
  Popconfirm,
  Row,
  Col,
  InputNumber,
  Switch,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SafetyCertificateOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { kinshipApi, villageApi, applicationApi } from "../../api";
import type {
  KinshipArchive,
  AncestralVillage,
  Application,
} from "../../types";

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

export default function AdminKinship() {
  const [archives, setArchives] = useState<KinshipArchive[]>([]);
  const [loading, setLoading] = useState(false);
  const [surname, setSurname] = useState("");
  const [keyword, setKeyword] = useState("");
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentArchive, setCurrentArchive] = useState<KinshipArchive | null>(
    null,
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [villages, setVillages] = useState<AncestralVillage[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
    loadOptions();
  }, [surname, keyword]);

  const loadData = async () => {
    setLoading(true);
    const params: any = {};
    if (surname) params.surname = surname;
    const res = await kinshipApi.list(params);
    if (res.success) {
      let data = res.data;
      if (keyword) {
        const kw = keyword.toLowerCase();
        data = data.filter(
          (a) =>
            a.confirmed_surname.toLowerCase().includes(kw) ||
            a.applicant_name?.toLowerCase().includes(kw) ||
            a.village_name?.toLowerCase().includes(kw) ||
            a.confirmation_basis?.toLowerCase().includes(kw),
        );
      }
      setArchives(data);
    }
    setLoading(false);
  };

  const loadOptions = async () => {
    const [villageRes, appRes] = await Promise.all([
      villageApi.list(),
      applicationApi.list(),
    ]);
    if (villageRes.success) setVillages(villageRes.data);
    if (appRes.success) setApplications(appRes.data);
  };

  const handleViewDetail = async (id: string) => {
    const res = await kinshipApi.get(id);
    if (res.success) {
      setCurrentArchive(res.data);
      setDetailVisible(true);
    }
  };

  const handleAdd = () => {
    setEditMode(false);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (archive: KinshipArchive) => {
    setEditMode(true);
    setCurrentArchive(archive);
    form.setFieldsValue({
      application_id: archive.application_id,
      village_id: archive.village_id,
      confirmed_surname: archive.confirmed_surname,
      relationship_type: archive.relationship_type,
      ancestor_name: archive.ancestor_name,
      generation_level: archive.generation_level,
      confirmation_basis: archive.confirmation_basis,
      dna_verified: archive.dna_verified === 1,
      archive_notes: archive.archive_notes,
      confirmer_name: archive.confirmer_name,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    const res = await kinshipApi.delete(id);
    if (res.success) {
      message.success("认亲档案已删除");
      loadData();
    } else {
      message.error(res.message || "删除失败");
    }
  };

  const handleSubmit = async (values: any) => {
    if (editMode && currentArchive) {
      const res = await kinshipApi.update(currentArchive.id, {
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
        message.success("认亲档案已更新");
        setModalVisible(false);
        loadData();
      } else {
        message.error(res.message || "更新失败");
      }
    } else {
      const res = await kinshipApi.create({
        application_id: values.application_id,
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
        setModalVisible(false);
        form.resetFields();
        loadData();
      } else {
        message.error(res.message || "创建失败");
      }
    }
  };

  const columns = [
    {
      title: "寻根人",
      dataIndex: "applicant_name",
      key: "applicant_name",
      width: 100,
    },
    {
      title: "确认姓氏",
      dataIndex: "confirmed_surname",
      key: "confirmed_surname",
      width: 100,
      render: (s: string) => <Tag color="blue">{s}氏</Tag>,
    },
    {
      title: "确认村落",
      key: "village",
      width: 180,
      render: (_: any, record: KinshipArchive) =>
        record.village_name ? (
          <span>
            <EnvironmentOutlined /> {record.village_name}
          </span>
        ) : (
          "-"
        ),
    },
    {
      title: "宗亲关系",
      dataIndex: "relationship_type",
      key: "relationship_type",
      width: 120,
      render: (t: string) => t || "-",
    },
    {
      title: "共祖",
      dataIndex: "ancestor_name",
      key: "ancestor_name",
      width: 100,
      render: (n: string) => n || "-",
    },
    {
      title: "DNA验证",
      dataIndex: "dna_verified",
      key: "dna_verified",
      width: 90,
      render: (v: number) =>
        v === 1 ? <Tag color="green">已验证</Tag> : <Tag>未验证</Tag>,
    },
    {
      title: "确认人",
      dataIndex: "confirmer_name",
      key: "confirmer_name",
      width: 100,
      render: (n: string) => n || "-",
    },
    {
      title: "确认时间",
      dataIndex: "confirmed_at",
      key: "confirmed_at",
      width: 160,
    },
    {
      title: "操作",
      key: "action",
      width: 180,
      render: (_: any, record: KinshipArchive) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record.id)}
          >
            查看
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除该认亲档案？"
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
          <Search
            placeholder="搜索姓氏、寻根人、村落、依据..."
            allowClear
            onSearch={setKeyword}
            style={{ width: 280 }}
            enterButton={<SearchOutlined />}
          />
          <Input
            placeholder="按姓氏筛选"
            allowClear
            onChange={(e) => setSurname(e.target.value)}
            style={{ width: 150 }}
            prefix={<SafetyCertificateOutlined />}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建认亲档案
          </Button>
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={archives}
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>

      <Drawer
        title="认亲档案详情"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentArchive && (
          <div>
            <Descriptions
              column={1}
              bordered
              size="small"
              style={{ marginBottom: 24 }}
            >
              <Descriptions.Item label="寻根人">
                {currentArchive.applicant_name}
              </Descriptions.Item>
              <Descriptions.Item label="确认姓氏">
                <Tag color="blue">{currentArchive.confirmed_surname}氏</Tag>
              </Descriptions.Item>
              {currentArchive.village_name && (
                <Descriptions.Item label="确认村落">
                  <EnvironmentOutlined /> {currentArchive.village_name}
                  {currentArchive.ancestral_hall_name &&
                    ` · ${currentArchive.ancestral_hall_name}`}
                  <br />
                  <small style={{ color: "#999" }}>
                    {currentArchive.province} {currentArchive.city}{" "}
                    {currentArchive.district}
                  </small>
                </Descriptions.Item>
              )}
              {currentArchive.relationship_type && (
                <Descriptions.Item label="宗亲关系">
                  {currentArchive.relationship_type}
                </Descriptions.Item>
              )}
              {currentArchive.ancestor_name && (
                <Descriptions.Item label="共祖名讳">
                  {currentArchive.ancestor_name}
                </Descriptions.Item>
              )}
              {currentArchive.generation_level && (
                <Descriptions.Item label="世代">
                  第 {currentArchive.generation_level} 代
                </Descriptions.Item>
              )}
              <Descriptions.Item label="DNA验证">
                {currentArchive.dna_verified === 1 ? (
                  <Tag color="green">已验证</Tag>
                ) : (
                  <Tag>未验证</Tag>
                )}
              </Descriptions.Item>
              {currentArchive.confirmation_basis && (
                <Descriptions.Item label="确认依据">
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
                    {currentArchive.confirmation_basis}
                  </div>
                </Descriptions.Item>
              )}
              {currentArchive.archive_notes && (
                <Descriptions.Item label="备注">
                  <div style={{ whiteSpace: "pre-wrap" }}>
                    {currentArchive.archive_notes}
                  </div>
                </Descriptions.Item>
              )}
              {currentArchive.family_story && (
                <Descriptions.Item label="家族故事">
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
                    {currentArchive.family_story}
                  </div>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="确认人">
                {currentArchive.confirmer_name || "未记录"}
              </Descriptions.Item>
              <Descriptions.Item label="确认时间">
                {currentArchive.confirmed_at}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Drawer>

      <Modal
        title={editMode ? "编辑认亲档案" : "新建认亲档案"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!editMode && (
            <Form.Item
              name="application_id"
              label="关联寻根申请"
              rules={[{ required: true, message: "请选择关联的申请" }]}
            >
              <Select
                placeholder="选择寻根申请"
                showSearch
                optionFilterProp="children"
              >
                {applications.map((a) => (
                  <Option key={a.id} value={a.id}>
                    {a.surname}氏 · {a.applicant_name} (
                    {a.origin_province || ""})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="confirmed_surname"
                label="确认姓氏"
                rules={[{ required: true, message: "请输入确认姓氏" }]}
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
              onClick={() => setModalVisible(false)}
              style={{ marginRight: 8 }}
            >
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              {editMode ? "保存修改" : "创建档案"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
