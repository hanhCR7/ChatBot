// src/components/HeaderBar.jsx
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu as MenuIcon,
  Sun,
  Moon,
  User,
  Settings as SettingsIcon,
  LogOut,
  Sparkles,
} from "lucide-react";
import useProfileUser from "@/hooks/useProfileUser";
import { useAuthApi } from "@/hooks/useAuthAPI";
import { useNavigate } from "react-router-dom";
import ProfileModal from "./ProfileUser";
import SettingsModal from "./SettingsModal";

export default function HeaderBar({ onToggleSidebar }) {
  const { getMe } = useProfileUser();
  const [user, setUser] = useState(null);
  const [openProfile, setOpenProfile] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  // Khởi tạo dark mode theo localStorage or theo system
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("user_dark_mode");
    if (saved !== null) return saved === "true";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);
  const { logout } = useAuthApi();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await getMe();
        setUser(data);
      } catch (err) {
        console.error("Failed to fetch current user:", err);
      }
    })();
  }, []);
  
  // khi darkmode thay đổi, cập nhật class và save
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("user_dark_mode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(false);
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
    <header className="sticky top-0 z-40 w-full flex items-center justify-between h-16 px-4 md:px-6 border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl dark:border-gray-800 shadow-sm">
      {/* Left */}
      <div className="flex items-center gap-4">
        {onToggleSidebar && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleSidebar}
            className="lg:hidden p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <MenuIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </motion.button>
        )}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            JarVis AI
          </h1>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Dark mode toggle */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setDarkMode(!darkMode)}
          className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all relative overflow-hidden"
          title={darkMode ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
        >
          <AnimatePresence mode="wait">
            {darkMode ? (
              <motion.div
                key="sun"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Sun className="w-5 h-5 text-yellow-500" />
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Avatar + Dropdown */}
        <div className="relative" ref={menuRef}>
          <motion.img
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            src={
              user?.avatar ||
              `https://ui-avatars.com/api/?name=${user?.first_name || "U"}+${
                user?.last_name || "S"
              }&background=667eea&color=fff&size=128`
            }
            alt="avatar"
            className="w-10 h-10 rounded-full cursor-pointer select-none border-2 border-gray-300 dark:border-gray-700 object-cover shadow-md hover:shadow-lg transition-shadow"
            onClick={() => setOpenMenu((prev) => !prev)}
          />

          {/* Dropdown menu */}
          <AnimatePresence>
            {openMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-64 origin-top-right bg-white dark:bg-gray-800 rounded-xl shadow-xl py-2 text-sm text-gray-700 dark:text-gray-200 z-50 border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
                  <p className="font-semibold truncate text-gray-900 dark:text-white">
                    {user ? `${user.username}` : "Loading..."}
                  </p>
                  <p className="text-xs truncate text-gray-500 dark:text-gray-400 mt-0.5">
                    {user?.email}
                  </p>
                </div>

                {/* Menu Items */}
                <motion.button
                  whileHover={{ x: 4 }}
                  onClick={() => {
                    setOpenProfile(true);
                    setOpenMenu(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium">Hồ sơ</span>
                </motion.button>

                <motion.button
                  whileHover={{ x: 4 }}
                  onClick={() => {
                    setOpenSettings(true);
                    setOpenMenu(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <SettingsIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium">Cài đặt</span>
                </motion.button>

                <hr className="my-1 border-gray-200 dark:border-gray-700" />

                <motion.button
                  whileHover={{ x: 4 }}
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">Đăng xuất</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modals render riêng biệt, không nằm trong avatar box */}
        <ProfileModal
          open={openProfile}
          onClose={() => setOpenProfile(false)}
          user={user}
        />
        <SettingsModal
          open={openSettings}
          onClose={() => setOpenSettings(false)}
        />
      </div>
    </header>
  );
}
