import { BrowserRouter, Routes, Route } from "react-router-dom";
import ChatLayout from "@/layouts/ChatLayout";
import PrivateRoute from "@/components/PrivateRoute";
import AuthPage from "@/components/AuthPage";
import ChatDetail from "@/components/ChatDetail";
import NotFound from "@/components/NotFound";
import Welcome from "@/components/Welcome";
import AdminLayout from "../layouts/AdminLayout";
import Dashboard from "@/components/admin/Dashboard";
import UserManagement from "@/components/admin/UserManagement";
import RoleManagement from "@/components/admin/RoleManagement";
import PermissionManagement from "@/components/admin/PermissionManagement";
import RolePermissionManagement from "@/components/admin/RolePermissionManagement";
import UserRoleManagement from "@/components/admin/UserRoleManagement";
import BannedKeywordsTable from "@/components/admin/BannedKeywordsTable";
import ViolationLogManagement from "@/components/admin/ViolationLogManagement";
import AllLogsManagement from "@/components/admin/AllLogsManagement";
import ForgotPasswordPage from "@/components/ForgotPassword";
import ResetPasswordPage from "@/components/ResetPasswordPage";
import PageTitleHandler from "@/components/PageTitleHandler";
import ActivateAccount from "@/components/ActivateAccount";
import ResendActivationEmail from "@/components/ResendActivationEmail";
import ImageDetail from "@/components/ImageDetail";
import AdminAllChatUsers from "@/components/admin/AdminAllChatUsers";
import AdminChatUserDetail from "@/components/admin/AdminChatUserDetail";
import ImageManagement from "@/components/admin/ImageManagement";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
export default function Router() {
  return (
    <BrowserRouter basename="/ChatBot">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        pauseOnFocusLoss
      />
      {/* Cập nhật page title tự động */}
      <PageTitleHandler />
      <Routes>
        <Route
          path="/"
          element={
            <PrivateRoute>
              <ChatLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Welcome />} />
          <Route path="chat/:chatId" element={<ChatDetail />} />
          <Route path="images" element={<ImageDetail />} />
        </Route>
        <Route path="/admin/" element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="roles" element={<RoleManagement />} />
          <Route path="permissions" element={<PermissionManagement />} />
          <Route
            path="role-permissions"
            element={<RolePermissionManagement />}
          />
          <Route path="user-roles" element={<UserRoleManagement />} />
          <Route path="banned-keywords" element={<BannedKeywordsTable />} />
          <Route path="violation-logs" element={<ViolationLogManagement />} />
          <Route path="log" element={<AllLogsManagement />} />
          <Route path="all-chat-users" element={<AdminAllChatUsers />} />
          <Route path="chat-users/:user_id" element={<AdminChatUserDetail />} />
          <Route path="all-image-users" element={<ImageManagement />} />
        </Route>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/activate-account" element={<ActivateAccount />} />
        <Route path="/resend-activation" element={<ResendActivationEmail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
