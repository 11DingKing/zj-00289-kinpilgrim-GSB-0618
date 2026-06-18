import { Routes, Route, Link, useLocation } from "react-router-dom";
import { Layout, Menu, Button } from "antd";
import {
  HomeOutlined,
  FileSearchOutlined,
  TeamOutlined,
  BankOutlined,
  BarChartOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import Home from "./pages/Home";
import ApplicationList from "./pages/ApplicationList";
import ApplicationDetail from "./pages/ApplicationDetail";
import ApplyForm from "./pages/ApplyForm";
import PilgrimageStories from "./pages/PilgrimageStories";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import AdminApplications from "./pages/admin/AdminApplications";
import AdminVolunteers from "./pages/admin/AdminVolunteers";
import AdminVillages from "./pages/admin/AdminVillages";
import AdminPilgrimages from "./pages/admin/AdminPilgrimages";

const { Header, Content, Footer } = Layout;

function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <Routes>
        <Route path="/admin/*" element={<AdminLayout />} />
      </Routes>
    );
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          background: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <Link
            to="/"
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              color: "#8B4513",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <BankOutlined />
            寻根祭祖
          </Link>
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            style={{ borderBottom: "none", minWidth: 400 }}
            items={[
              {
                key: "/",
                icon: <HomeOutlined />,
                label: <Link to="/">首页</Link>,
              },
              {
                key: "/applications",
                icon: <FileSearchOutlined />,
                label: <Link to="/applications">寻根进度</Link>,
              },
              {
                key: "/stories",
                icon: <TeamOutlined />,
                label: <Link to="/stories">祭祖故事</Link>,
              },
              {
                key: "/admin",
                icon: <BarChartOutlined />,
                label: <Link to="/admin">管理后台</Link>,
              },
            ]}
          />
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />}>
          <Link to="/apply" style={{ color: "#fff" }}>
            发起寻根
          </Link>
        </Button>
      </Header>

      <Content>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/applications" element={<ApplicationList />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
          <Route path="/apply" element={<ApplyForm />} />
          <Route path="/stories" element={<PilgrimageStories />} />
        </Routes>
      </Content>

      <Footer
        style={{ textAlign: "center", background: "#8B4513", color: "#fff" }}
      >
        寻根祭祖平台 ©2025 - 连接两岸，共续血脉
      </Footer>
    </Layout>
  );
}

export default App;
