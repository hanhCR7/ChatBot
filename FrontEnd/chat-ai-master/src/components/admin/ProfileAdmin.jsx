// src/components/admin/ProfileModal.jsx
import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useProfileAdmin } from "@/hooks/admin/useProfileAdmin";
import useAuthApi from "@/hooks/useAuthAPI";
import PasswordInput from "../common/PasswordInput";
import { useNavigate } from "react-router-dom";

export default function ProfileModal({ open, onClose, admin }) {
  const { getUpdateAdmin } = useProfileAdmin();
  const { changePassword, logout } = useAuthApi();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("info");

  // form edit profile
  const [formData, setFormData] = useState({
    first_name: admin?.first_name || "",
    last_name: admin?.last_name || "",
    username: admin?.username || "",
    email: admin?.email || "",
    status: admin?.status || "Active",
  });

  // form change password
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });


  const [loading, setLoading] = useState(false);

  const handleChangeProfile = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleChangePassword = (e) =>
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      await getUpdateAdmin(admin.id, formData);
      toast.success("Cập nhật hồ sơ thành công!");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Cập nhật thất bại!");
    } finally {
      setLoading(false);
    }
  };
  const handleChangePasswordSubmit = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("Mật khẩu mới và xác nhận không khớp!");
      return;
    }
    try {
      setLoading(true);
      await changePassword(passwordData);
      toast.success("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
      await logout();
      navigate("/login");
      setPasswordData({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err) {
      console.error(err);
      toast.error("Đổi mật khẩu thất bại!");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg relative overflow-hidden">
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header with avatar */}
        <div className="flex flex-col items-center py-6 border-b dark:border-gray-700">
          <img
            src={
              admin?.avatar ||
              `https://ui-avatars.com/api/?name=${admin?.first_name || "A"}+${
                admin?.last_name || "U"
              }&background=random&size=128`
            }
            alt="avatar"
            className="w-20 h-20 rounded-full border-4 border-gray-200 dark:border-gray-700"
          />
          <h2 className="mt-3 text-lg font-semibold text-gray-800 dark:text-white">
            {admin?.first_name} {admin?.last_name}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {admin?.email}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b dark:border-gray-700">
          {[
            { key: "info", label: "Profile Info" },
            { key: "edit", label: "Edit Profile" },
            { key: "password", label: "Change Password" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.key
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6">
          {activeTab === "info" && (
            <div className="space-y-3 text-gray-700 dark:text-gray-200">
              <p>
                <span className="font-semibold">Username:</span>{" "}
                {admin?.username}
              </p>
              <p>
                <span className="font-semibold">Email:</span> {admin?.email}
              </p>
              <p>
                <span className="font-semibold">Name:</span> {admin?.first_name}{" "}
                {admin?.last_name}
              </p>
              <p>
                <span className="font-semibold">Status:</span> {admin?.status}
              </p>
            </div>
          )}

          {activeTab === "edit" && (
            <div className="space-y-4">
              {["first_name", "last_name", "username", "email"].map((field) => (
                <input
                  key={field}
                  type={field === "email" ? "email" : "text"}
                  name={field}
                  value={formData[field]}
                  onChange={handleChangeProfile}
                  placeholder={field.replace("_", " ").toUpperCase()}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ))}
              <select
                name="status"
                value={formData.status}
                onChange={handleChangeProfile}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <Button
                onClick={handleSaveProfile}
                disabled={loading}
                className="w-full mt-2"
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}

          {activeTab === "password" && (
            <div className="space-y-4">
              {[
                { name: "oldPassword", placeholder: "Old Password" },
                { name: "newPassword", placeholder: "New Password" },
                { name: "confirmPassword", placeholder: "Confirm Password" },
              ].map((field) => (
                <PasswordInput
                  key={field.name}
                  id={field.name}
                  value={passwordData[field.name]}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      [field.name]: e.target.value,
                    })
                  }
                  placeholder={field.placeholder}
                />
              ))}
              <Button
                onClick={handleChangePasswordSubmit}
                disabled={loading}
                className="w-full mt-2"
              >
                {loading ? "Changing..." : "Change Password"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
