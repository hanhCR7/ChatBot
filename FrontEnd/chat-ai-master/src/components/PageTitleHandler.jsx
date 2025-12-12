import { useLayoutEffect } from "react";
import { useSelector } from "react-redux";
import { matchPath, useLocation } from "react-router-dom";

const routeTitles = [
  { path: "/", title: "JarVis AI" },
  { path: "/login", title: "Đăng nhập" },
  { path: "/register", title: "Đăng ký" },
  { path: "/activate-account", title: "Kích hoạt tài khoản" },
  { path: "/forgot-password", title: "Quên mật khẩu" },
  { path: "/reset-password", title: "Đặt lại mật khẩu" },
  { path: "/chat/:chatId", title: "Chat" },

  // Image routes
  { path: "/images", title: "Quản lý hình ảnh" },

  // Admin routes
  { path: "/admin/dashboard", title: "Dashboard" },
  { path: "/admin/users", title: "Quản lý người dùng" },
  { path: "/admin/roles", title: "Quản lý vai trò" },
  { path: "/admin/permissions", title: "Quản lý quyền" },
  { path: "/admin/role-permissions", title: "Vai trò & quyền" },
  { path: "/admin/user-roles", title: "Người dùng & vai trò" },
  { path: "/admin/banned-keywords", title: "Từ khóa bị cấm" },
  { path: "/admin/violation-logs", title: "Nhật ký vi phạm" },
  { path: "/admin/logs", title: "Nhật ký hệ thống" },
  { path: "/admin/all-chat-users", title: "All Chat Of All User" },
  { path: "/admin/chat-users/:user_id", title: "All Message In Chat Of User" },
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
    if (matchedRoute?.path === "/chat/:chatId") {
      const match = matchPath(
        { path: "/chat/:chatId", end: true },
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
