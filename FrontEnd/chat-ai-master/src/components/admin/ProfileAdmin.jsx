// src/components/admin/ProfileModal.jsx
import { useState } from "react";
import { X, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useProfileAdmin } from "@/hooks/admin/useProfileAdmin";
import useAuthApi from "@/hooks/useAuthAPI";
import PasswordInput from "../common/PasswordInput";
import { useNavigate } from "react-router-dom";
import { set } from "date-fns";
import { validate } from "uuid";
import SendEmailModal from "../SendEmailModal";

export default function ProfileModal({ open, onClose, admin }) {
  const { getUpdateAdmin } = useProfileAdmin();
  const { changePassword, validateOTPPassword,logout } = useAuthApi();
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
  });

  const [otpData, setOtpData] = useState({
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [step, setStep] = useState(1); // Step 1: Enter old password, Step 2: Enter OTP and new password
  const [loading, setLoading] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const handleChangeProfile = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

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
    try{
      setLoading(true);
      await changePassword({oldPassword: passwordData.oldPassword});
      toast.success("Mã OTP đã được gửi về mail của bạn. Vui lòng khiểm tra mail để tiếp tục đổi mật khẩu.");
      setStep(2);
    } catch(err){
      console.error(err);
      toast.error("Mật khẩu cũ không đúng hoặc có lỗi xảy ra. Vui lòng thử lại.");
    } finally{
      setLoading(false);
    }
  };
  const handleValidateOtpPassword = async ( )=> {
    if (passwordData.newPassword !== passwordData.confirmPassword){
      toast.error("Mật khẩu mới và mật khẩu xác nhận không khớp!");
      return;
    }
    try{
      setLoading(true);
      await validateOTPPassword({
        user_id: admin.id,
        otp: otpData.otp,
        new_password: passwordData.newPassword,
        confirm_password: passwordData.confirmPassword
      });
      toast.success("Đổi mật khẩu thành công!");
      await logout();
      navigate("/login");
    } catch(err){
      console.error(err);
      toast.error("Đổi mật khẩu thất bại! Vui lòng thử lại.");
    }finally{
      setLoading(false);
    }
  }

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
            { key: "email", label: "Send Email" },
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
              {step === 1 && (
                <>
                  <PasswordInput
                    id="oldPassword"
                    value={passwordData.oldPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        oldPassword: e.target.value,
                      })
                    }
                    placeholder="Old Password"
                  />
                  <Button
                    onClick={handleChangePasswordSubmit}
                    disabled={loading}
                    className="w-full mt-2"
                  >
                    {loading ? "Sending OTP..." : "Send OTP"}
                  </Button>
                </>
              )}

              {step === 2 && (
                <>
                  <input
                    type="text"
                    placeholder="OTP Code"
                    value={otpData.otp}
                    onChange={(e) =>
                      setOtpData({ ...otpData, otp: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <PasswordInput
                    id="newPassword"
                    value={otpData.newPassword}
                    onChange={(e) =>
                      setOtpData({ ...otpData, newPassword: e.target.value })
                    }
                    placeholder="New Password"
                  />
                  <PasswordInput
                    id="confirmPassword"
                    value={otpData.confirmPassword}
                    onChange={(e) =>
                      setOtpData({
                        ...otpData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Confirm Password"
                  />
                  <Button
                    onClick={handleValidateOtpPassword}
                    disabled={loading}
                    className="w-full mt-2"
                  >
                    {loading ? "Verifying..." : "Confirm Change"}
                  </Button>
                </>
              )}
            </div>
          )}

          {activeTab === "email" && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-2">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    Gửi Email
                  </h3>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Gửi email đến bất kỳ địa chỉ email nào. Bạn có thể sử dụng HTML để định dạng nội dung.
                </p>
              </div>
              <Button
                onClick={() => setEmailModalOpen(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Mail className="w-4 h-4 mr-2" />
                Mở Form Gửi Email
              </Button>
            </div>
          )}
        </div>
      </div>
      <SendEmailModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
      />
    </div>
  );
}
