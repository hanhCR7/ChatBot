// src/components/HeaderBar.jsx
import { useState, useEffect, useRef } from "react";
import {
  Menu as MenuIcon,
  Sun,
  Moon,
  User,
  Settings as SettingsIcon,
  LogOut,
} from "lucide-react";
import useProfileUser from "@/hooks/useProfileUser";
import { useAuthApi } from "@/hooks/useAuthAPI";
import { useNavigate } from "react-router-dom";
import ProfileModal from "./ProfileUser";

export default function HeaderBar({ onToggleSidebar }) {
  const { getMe } = useProfileUser();
  const [user, setUser] = useState(null);
  const [openProfile, setOpenProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );
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

  useEffect(() => {
    const root = document.documentElement;
    darkMode ? root.classList.add("dark") : root.classList.remove("dark");
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
    navigate("/ChatBot/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full flex items-center justify-between h-14 px-4 border-b bg-card/80 backdrop-blur dark:bg-gray-900/80 dark:border-gray-700 shadow-sm">
      {/* Left */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <MenuIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
        )}
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
          JarVis AI
        </h1>
      </div>
      {/* Right */}
      <div className="flex items-center space-x-5">
        {/* Dark mode toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-yellow-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600" />
          )}
        </button>
        {/* Avatar + Dropdown */}
        <div className="relative" ref={menuRef}>
          <img
            src={
              user?.avatar ||
              `https://ui-avatars.com/api/?name=${user?.first_name || "U"}+${
                user?.last_name || "S"
              }&background=random&size=128`
            }
            alt="avatar"
            className="w-9 h-9 rounded-full cursor-pointer select-none border-2 border-gray-300 dark:border-gray-600 object-cover"
            onClick={() => setOpenMenu((prev) => !prev)}
          />

          {/* Dropdown menu */}
          {openMenu && (
            <div
              className="absolute right-0 mt-2 w-56 origin-top-right 
        bg-white dark:bg-gray-800 rounded-lg shadow-lg 
        py-1 text-sm text-gray-700 dark:text-gray-200 z-50"
            >
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <p className="font-semibold truncate">
                  {user ? `${user.username}` : "Loading..."}
                </p>
                <p className="text-xs truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => setOpenProfile(true)}
                className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <User className="w-4 h-4" /> Profile
              </button>

              <button className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                <SettingsIcon className="w-4 h-4" /> Settings
              </button>
              <hr className="my-1 border-gray-200 dark:border-gray-700" />
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
        {/* Modal render riêng biệt, không nằm trong avatar box */}
        <ProfileModal
          open={openProfile}
          onClose={() => setOpenProfile(false)}
          user={user}
        />
      </div>
    </header>
  );
}
