import { useLayoutEffect } from "react";
import { useSelector } from "react-redux";
import { matchPath, useLocation } from "react-router-dom";

const routeTitles = [
  { path: "/ChatBot/", title: "JarVis AI" },
  { path: "/ChatBot/login", title: "Đăng nhập" },
  { path: "/ChatBot/activate-account", title: "Kích hoạt tài khoản" },
  { path: "/ChatBot/forgot-password", title: "Quên mật khẩu" },
  { path: "/ChatBot/reset-password", title: "Đặt lại mật khẩu" },
  { path: "/ChatBot/chat/:chatId", title: "Chat" },

  // Image routes
  { path: "/ChatBot/images", title: "Quản lý hình ảnh" },

  // Admin routes
  { path: "/ChatBot/admin/dashboard", title: "Dashboard" },
  { path: "/ChatBot/admin/users", title: "Quản lý người dùng" },
  { path: "/ChatBot/admin/roles", title: "Quản lý vai trò" },
  { path: "/ChatBot/admin/permissions", title: "Quản lý quyền" },
  { path: "/ChatBot/admin/role-permissions", title: "Vai trò & quyền" },
  { path: "/ChatBot/admin/user-roles", title: "Người dùng & vai trò" },
  { path: "/ChatBot/admin/banned-keywords", title: "Từ khóa bị cấm" },
  { path: "/ChatBot/admin/violation-logs", title: "Nhật ký vi phạm" },
  { path: "/ChatBot/admin/all-chat-users", title: "All Chat Of All User" },
  { path: "/ChatBot/admin/chat-users/:user_id", title: "All Message In Chat Of User" },
];

export default function usePageTitle() {
  const location = useLocation();
  const chats = useSelector((s) => s.chat.data) ?? [];

  useLayoutEffect(() => {
    let matchedRoute = routeTitles.find((r) =>
      matchPath({ path: r.path, end: true }, location.pathname)
    );

    let title = matchedRoute?.title || "Trang không tồn tại";

    // Nếu route là ChatDetail → lấy title từ Redux
    if (matchedRoute?.path === "/ChatBot/chat/:chatId") {
      const match = matchPath(
        { path: "/ChatBot/chat/:chatId", end: true },
        location.pathname
      );
      const chatId = match?.params?.chatId;
      if (chatId) {
        const chat = chats.find((c) => c.id.toString() === chatId.toString());
        title = chat?.title || "Chat";
      }
    }

    document.title = title;
  }, [location.pathname, chats]);

  return null;
}
