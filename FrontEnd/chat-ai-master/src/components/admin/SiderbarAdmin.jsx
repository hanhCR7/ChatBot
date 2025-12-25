import { NavLink } from "react-router-dom";
import {
  Home,
  Users,
  ChartArea,
  Shield,
  Key,
  UserCheck,
  Link,
  ChevronLeft,
  ChevronRight,
  SunMoon,
  LogOut,
  HelpCircle,
  MinusSquare,
  WholeWord,
  ImageIcon,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";

const SidebarAdmin = ({ collapsed, setCollapsed }) => {
  const { t } = useTranslation();
  
  const menu = [
    { name: t("admin.dashboard"), path: "/admin/dashboard", icon: Home },
    { name: t("admin.users"), path: "/admin/users", icon: Users },
    { name: t("admin.roles"), path: "/admin/roles", icon: Shield },
    { name: t("admin.permissions"), path: "/admin/permissions", icon: Key },
    { name: t("admin.userRoles"), path: "/admin/user-roles", icon: UserCheck },
    {
      name: t("admin.rolePermissions"),
      path: "/admin/role-permissions",
      icon: Link,
    },
    {
      name: t("admin.bannedKeywords"),
      path: "/admin/banned-keywords",
      icon: WholeWord,
    },
    {
      name: t("admin.violationLogs"),
      path: "/admin/violation-logs",
      icon: ShieldAlert,
    },
    {
      name: t("admin.allLogs"),
      path: "/admin/log",
      icon: FileText,
    },
    { name: t("admin.allChat"), path: "/admin/all-chat-users", icon: ChartArea },
    {
      name: t("admin.allImages"),
      path: "/admin/all-image-users",
      icon: ImageIcon,
    },
  ];
  
  /* dark‑mode vẫn giữ local */
  const [dark, setDark] = useState(
    () => localStorage.getItem("admin_dark_mode") === "true"
  );
  useEffect(() => {
    dark
      ? document.documentElement.classList.add("dark")
      : document.documentElement.classList.remove("dark");
    localStorage.setItem("admin_dark_mode", dark);
  }, [dark]);

  return (
    <aside className="h-full w-full flex flex-col p-4 overflow-hidden">
      {/* Header với gradient */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200/50 dark:border-gray-800/50">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              {t("admin.adminPanel")}
            </motion.h1>
          )}
        </AnimatePresence>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </motion.button>
      </div>

      {/* Menu với animations */}
      <nav className="flex flex-col gap-2 flex-1 overflow-y-auto">
        <AnimatePresence>
          {!collapsed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs mb-2 pl-2 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider"
            >
              {t("admin.menu")}
            </motion.p>
          )}
        </AnimatePresence>
        {menu.map(({ name, path, icon: Icon }, index) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `group relative flex items-center rounded-xl text-sm font-medium transition-all duration-200
               ${collapsed ? "justify-center py-3" : "gap-3 px-4 py-3"}
               ${
                 isActive
                   ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                   : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400"
               }`
            }
            title={collapsed ? name : undefined}
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? "scale-110" : "group-hover:scale-110"
                  }`}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex-1"
                    >
                      {name}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom controls với gradient */}
      <div className="border-t border-gray-200/50 dark:border-gray-800/50 pt-4 space-y-2 mt-auto">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setDark(!dark)}
          className="flex items-center gap-3 text-sm w-full px-4 py-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all text-gray-700 dark:text-gray-300"
        >
          <SunMoon className="w-5 h-5" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                {dark ? t("admin.lightMode") : t("admin.darkMode")}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-3 text-sm w-full px-4 py-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all text-gray-700 dark:text-gray-300"
        >
          <HelpCircle className="w-5 h-5" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                {t("admin.help")}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            localStorage.clear();
            location.href = "/login";
          }}
          className="flex items-center gap-3 text-sm w-full px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/30 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                {t("admin.logout")}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </aside>
  );
};

export default SidebarAdmin;
