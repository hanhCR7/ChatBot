import { useState } from "react";
import { Outlet } from "react-router-dom";
import SidebarAdmin from "../components/admin/SiderbarAdmin";
import HeaderAdmin from "../components/admin/HeaderAdmin";

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false); // ← toggle thu gọn

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Bọc sidebar: width phụ thuộc collapsed */}
      <div
        className={`shrink-0 hidden md:block transition-all duration-300
          ${collapsed ? "w-20" : "w-64"}`}
      >
        <SidebarAdmin collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <HeaderAdmin onToggleSidebar={() => setCollapsed(!collapsed)} />
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
