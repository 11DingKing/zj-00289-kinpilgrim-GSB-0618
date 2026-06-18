import { Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  FileSearchOutlined,
  TeamOutlined,
  BankOutlined,
  HeartOutlined,
  HomeOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import Dashboard from "./Dashboard";
import AdminApplications from "./AdminApplications";
import AdminVolunteers from "./AdminVolunteers";
import AdminVillages from "./AdminVillages";
import AdminPilgrimages from "./AdminPilgrimages";
import AdminKinship from "./AdminKinship";

const { Sider, Content, Header } = Layout;

export default function AdminLayout() {
  const location = useLocation();
  const selectedKey = location.pathname.replace("/admin", "") || "/";

  const menuItems = [
    {
      key: "/",
      icon: <DashboardOutlined />,
      label: <Link to="/admin">数据概览</Link>,
    },
    {
      key: "/applications",
      icon: <FileSearchOutlined />,
      label: <Link to="/admin/applications">寻根申请</Link>,
    },
    {
      key: "/volunteers",
      icon: <TeamOutlined />,
      label: <Link to="/admin/volunteers">志愿者库</Link>,
    },
    {
      key: "/villages",
      icon: <BankOutlined />,
      label: <Link to="/admin/villages">宗祠村落</Link>,
    },
    {
      key: "/pilgrimages",
      icon: <HeartOutlined />,
      label: <Link to="/admin/pilgrimages">祭祖行程</Link>,
    },
    {
      key: "/kinship",
      icon: <SafetyCertificateOutlined />,
      label: <Link to="/admin/kinship">认亲档案</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={220} style={{ background: "#001529" }}>
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 18,
            fontWeight: "bold",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <BankOutlined style={{ marginRight: 8 }} />
          寻根管理后台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey === "/" ? "/" : selectedKey]}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: "#fff",
            padding: "0 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 500 }}>管理后台</span>
          <Link to="/">
            <HomeOutlined /> 返回首页
          </Link>
        </Header>
        <Content style={{ margin: "24px", background: "#f0f2f5" }}>
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="applications" element={<AdminApplications />} />
            <Route path="volunteers" element={<AdminVolunteers />} />
            <Route path="villages" element={<AdminVillages />} />
            <Route path="pilgrimages" element={<AdminPilgrimages />} />
            <Route path="kinship" element={<AdminKinship />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}
