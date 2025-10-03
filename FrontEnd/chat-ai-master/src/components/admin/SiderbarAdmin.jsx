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
  icons,
} from "lucide-react";
import { useState, useEffect } from "react";

const menu = [
  { name: "Dashboard", path: "/ChatBot/admin/dashboard", icon: Home },
  { name: "Users", path: "/ChatBot/admin/users", icon: Users },
  { name: "Roles", path: "/ChatBot/admin/roles", icon: Shield },
  { name: "Permissions", path: "/ChatBot/admin/permissions", icon: Key },
  { name: "User Roles", path: "/ChatBot/admin/user-roles", icon: UserCheck },
  {
    name: "Role Permissions",
    path: "/ChatBot/admin/role-permissions",
    icon: Link,
  },
  {
    name: "Banned Keywords",
    path: "/ChatBot/admin/banned-keywords",
    icon: WholeWord,
  },
  {
    name: "Violation Logs",
    path: "/ChatBot/admin/violation-logs",
    icon: MinusSquare,
  },
  { name: "All Chat", path: "/ChatBot/admin/all-chat-users", icon: ChartArea },
  {
    name: "All Tmage",
    path: "/ChatBot/admin/all-image-users",
    icon: ImageIcon,
  },
];

const SidebarAdmin = ({ collapsed, setCollapsed }) => {
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
    /* w-full vì thẻ bọc bên ngoài đã quyết định width */
    <aside className="h-full w-full bg-white dark:bg-gray-900 shadow-md flex flex-col p-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        {!collapsed && (
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            TailAdmin
          </h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Menu */}
      <nav className="flex flex-col gap-1 flex-1">
        {!collapsed && (
          <p className="text-xs mb-1 pl-2 text-gray-500 dark:text-gray-400">
            MENU
          </p>
        )}
        {menu.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `group relative flex items-center rounded-lg text-sm transition
               ${collapsed ? "justify-center py-2" : "gap-2 px-3 py-2"}
               ${
                 isActive
                   ? "bg-gray-200 dark:bg-gray-700 font-semibold"
                   : "hover:bg-gray-100 dark:hover:bg-gray-800"
               }`
            }
            title={collapsed ? name : undefined} /* tooltip native */
          >
            <Icon className="w-5 h-5" />
            {!collapsed && name}
          </NavLink>
        ))}
      </nav>

      {/* Bottom controls */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-1">
        <button
          onClick={() => setDark(!dark)}
          className="flex items-center gap-2 text-sm w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <SunMoon className="w-5 h-5" />
          {!collapsed && (dark ? "Light Mode" : "Dark Mode")}
        </button>
        <button className="flex items-center gap-2 text-sm w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <HelpCircle className="w-5 h-5" /> {!collapsed && "Help"}
        </button>
        <button
          onClick={() => {
            localStorage.clear();
            location.href = "/login";
          }}
          className="flex items-center gap-2 text-sm w-full px-3 py-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-800 text-red-600 dark:text-red-400"
        >
          <LogOut className="w-5 h-5" /> {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
};

export default SidebarAdmin;
