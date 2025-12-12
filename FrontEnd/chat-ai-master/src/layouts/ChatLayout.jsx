import { useState } from "react";
import { Outlet } from "react-router-dom";
import HeaderBar from "@/components/HeaderBar";
import SidebarChat from "@/components/SideBar";
import { motion } from "framer-motion";

export default function ChatLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* SIDEBAR */}
      <SidebarChat open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* MAIN */}
      <motion.div 
        className="flex-1 flex flex-col overflow-hidden min-w-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <HeaderBar onToggleSidebar={() => setSidebarOpen((o) => !o)} />
        <main className="flex-1 overflow-hidden relative min-h-0 will-change-contents">
          <Outlet /> {/* ChatWindow hoặc Welcome hiển thị ở đây */}
        </main>
      </motion.div>
    </div>
  );
}
