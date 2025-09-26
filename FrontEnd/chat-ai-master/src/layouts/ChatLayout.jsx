import { useState } from "react";
import { Outlet } from "react-router-dom";
import HeaderBar from "@/components/HeaderBar";
import SidebarChat from "@/components/SideBar";

export default function ChatLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* SIDEBAR */}
      <SidebarChat open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <HeaderBar onToggleSidebar={() => setSidebarOpen((o) => !o)} />
        <main className="flex-1 overflow-hidden">
          <Outlet /> {/* ChatWindow hoặc Welcome hiển thị ở đây */}
        </main>
      </div>
    </div>
  );
}
