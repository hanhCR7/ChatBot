// src/components/admin/HeaderAdmin.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Menu as MenuIcon,
  Sun,
  Moon,
  User,
  Settings as SettingsIcon,
  LogOut,
  Bell,
  Search,
  AlertTriangle,
  UserPlus,
  ShieldAlert,
  X,
  FileText,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useProfileAdmin } from "@/hooks/admin/useProfileAdmin";
import useAuthApi from "@/hooks/useAuthAPI";
import { useNavigate } from "react-router-dom";
import ProfileModal from "./ProfileAdmin";
import useAdminUserApi from "@/hooks/admin/useAdminUserAPI";
import useAdminLogs from "@/hooks/admin/useAdminLogs";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

export default function HeaderAdmin({ onToggleSidebar }) {
  const { getAdmin } = useProfileAdmin();
  const { getAllUser } = useAdminUserApi();
  const { getAllLog } = useAdminLogs();
  const [admin, setAdmin] = useState(null);
  const [openProfile, setOpenProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );
  const [openMenu, setOpenMenu] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef(null);
  const notificationRef = useRef(null);
  const { logout } = useAuthApi();
  const navigate = useNavigate();

  const hasFetchedAdminRef = useRef(false);
  
  useEffect(() => {
    // Chỉ fetch một lần khi component mount
    if (hasFetchedAdminRef.current) return;
    
    (async () => {
      try {
        hasFetchedAdminRef.current = true;
        const data = await getAdmin();
        setAdmin(data);
      } catch (err) {
        console.error("Failed to fetch current user:", err);
        hasFetchedAdminRef.current = false; // Reset để có thể retry
      }
    })();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    darkMode ? root.classList.add("dark") : root.classList.remove("dark");
    localStorage.setItem("admin_dark_mode", darkMode);
  }, [darkMode]);

  const isFetchingRef = useRef(false);
  const getAllUserRef = useRef(getAllUser);
  const getAllLogRef = useRef(getAllLog);
  
  // Cập nhật ref khi function thay đổi
  useEffect(() => {
    getAllUserRef.current = getAllUser;
    getAllLogRef.current = getAllLog;
  }, [getAllUser, getAllLog]);
  
  // Fetch notifications - memoized để tránh re-render liên tục
  const fetchNotifications = useCallback(async () => {
    // Tránh gọi API nếu đang fetch
    if (isFetchingRef.current) return;
    
    try {
      isFetchingRef.current = true;
      const [usersRes, logsRes] = await Promise.all([
        getAllUserRef.current().catch(() => []),
        getAllLogRef.current(1, 10).catch(() => ({ logs: [] })),
      ]);

      const users = Array.isArray(usersRes) ? usersRes : [];
      const logs = logsRes?.logs || [];

      const now = dayjs();
      const last24Hours = now.subtract(24, "hour");

      // Tất cả logs trong 24h (không chỉ vi phạm)
      const recentLogs = logs.filter((log) => {
        const logTime = dayjs(log.created_at || log.timestamp);
        return logTime.isAfter(last24Hours);
      });

      // Violations trong 24h (logs có level)
      const recentViolations = logs.filter((log) => {
        const logTime = dayjs(log.created_at || log.timestamp);
        return logTime.isAfter(last24Hours) && log.level !== undefined && log.level !== null;
      });

      // Users mới trong 24h
      const newUsers = users.filter((user) => {
        const userTime = dayjs(user.created_at);
        return userTime.isAfter(last24Hours);
      });

      // Violations nghiêm trọng (level >= 3)
      const criticalViolations = recentViolations.filter(
        (log) => log.level >= 3
      );

      const notificationList = [];

      // Thêm thông báo logs mới (tất cả logs, không chỉ vi phạm)
      if (recentLogs.length > 0) {
        notificationList.push({
          id: "new-logs",
          type: "log",
          title: `${recentLogs.length} log mới`,
          message: `Có ${recentLogs.length} hoạt động mới trong 24h qua`,
          icon: Activity,
          color: "purple",
          timestamp: now.toISOString(),
          link: "/admin/log",
        });
      }

      // Thêm thông báo violations nghiêm trọng
      if (criticalViolations.length > 0) {
        notificationList.push({
          id: "critical-violations",
          type: "critical",
          title: `${criticalViolations.length} vi phạm nghiêm trọng`,
          message: `Có ${criticalViolations.length} vi phạm mức độ cao trong 24h qua`,
          icon: ShieldAlert,
          color: "red",
          timestamp: now.toISOString(),
          link: "/admin/violation-logs",
        });
      }

      // Thêm thông báo violations mới
      if (recentViolations.length > 0) {
        notificationList.push({
          id: "new-violations",
          type: "violation",
          title: `${recentViolations.length} vi phạm mới`,
          message: `Có ${recentViolations.length} vi phạm trong 24h qua`,
          icon: AlertTriangle,
          color: "orange",
          timestamp: now.toISOString(),
          link: "/admin/violation-logs",
        });
      }

      // Thêm thông báo users mới
      if (newUsers.length > 0) {
        notificationList.push({
          id: "new-users",
          type: "user",
          title: `${newUsers.length} người dùng mới`,
          message: `Có ${newUsers.length} người dùng đăng ký trong 24h qua`,
          icon: UserPlus,
          color: "blue",
          timestamp: now.toISOString(),
          link: "/admin/users",
        });
      }

      setNotifications(notificationList);
      setUnreadCount(notificationList.length);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      isFetchingRef.current = false;
    }
  }, []); // Empty deps - chỉ chạy khi component mount

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications mỗi 5 phút (thay vì liên tục)
    const interval = setInterval(() => {
      fetchNotifications();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []); // Chỉ chạy một lần khi mount

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target)
      ) {
        setOpenNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="w-full">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Burger menu & Title */}
        <div className="flex items-center gap-4">
          {onToggleSidebar && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <MenuIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </motion.button>
          )}
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:block"
          >
            Admin Dashboard
          </motion.h1>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setOpenNotifications(!openNotifications);
                if (!openNotifications) {
                  setUnreadCount(0);
                }
              }}
              className="relative p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </motion.span>
              )}
            </motion.button>

            {/* Notification Dropdown */}
            <AnimatePresence>
              {openNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl z-50 border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      Thông báo
                    </h3>
                    <button
                      onClick={() => setOpenNotifications(false)}
                      className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Không có thông báo mới</p>
                      </div>
                    ) : (
                      notifications.map((notif, index) => {
                        const Icon = notif.icon;
                        return (
                          <motion.div
                            key={notif.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => {
                              if (notif.link) {
                                navigate(notif.link);
                                setOpenNotifications(false);
                              }
                            }}
                            className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                              notif.type === "critical"
                                ? "bg-red-50/50 dark:bg-red-900/10"
                                : ""
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`p-2 rounded-lg ${
                                  notif.color === "red"
                                    ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                    : notif.color === "orange"
                                    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                                    : notif.color === "purple"
                                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                  {notif.title}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {notif.message}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  {dayjs(notif.timestamp).fromNow()}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
                      <button
                        onClick={() => {
                          navigate("/admin/violation-logs");
                          setOpenNotifications(false);
                        }}
                        className="w-full text-center text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        Xem tất cả logs
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dark Mode Toggle */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all shadow-sm"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </motion.button>

          {/* Avatar & Menu */}
          <div className="relative" ref={menuRef}>
            <motion.img
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              src={
                admin?.avatar ||
                `https://ui-avatars.com/api/?name=${admin?.first_name || "A"}+${
                  admin?.last_name || "U"
                }&background=random&size=128`
              }
              alt="avatar"
              className="w-10 h-10 rounded-full cursor-pointer select-none border-2 border-blue-500 dark:border-purple-500 shadow-lg hover:shadow-xl transition-shadow"
              onClick={() => setOpenMenu((prev) => !prev)}
            />

            {/* Dropdown menu với animation */}
            <AnimatePresence>
              {openMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl py-2 text-sm text-gray-700 dark:text-gray-200 z-50 border border-gray-200/50 dark:border-gray-700/50"
                >
                  <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-t-2xl">
                    <p className="font-bold text-gray-900 dark:text-white truncate">
                      {admin ? `${admin.username}` : "Loading..."}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">
                      {admin?.email}
                    </p>
                  </div>
                  
                  <div className="py-1">
                    <motion.button
                      whileHover={{ x: 4 }}
                      onClick={() => {
                        setOpenProfile(true);
                        setOpenMenu(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="font-medium">Profile</span>
                    </motion.button>

                    <ProfileModal
                      open={openProfile}
                      onClose={() => setOpenProfile(false)}
                      admin={admin}
                    />

                    <motion.button
                      whileHover={{ x: 4 }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                        <SettingsIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <span className="font-medium">Settings</span>
                    </motion.button>
                  </div>
                  
                  <hr className="my-1 border-gray-200/50 dark:border-gray-700/50" />
                  
                  <motion.button
                    whileHover={{ x: 4 }}
                    onClick={handleLogout}
                    className="w-full px-4 py-3 flex items-center gap-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                  >
                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Logout</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
