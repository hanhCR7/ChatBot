import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import useProfileUser from "@/hooks/useProfileUser";
import useAuthApi from "@/hooks/useAuthAPI";
import PasswordInput from "./common/PasswordInput";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";

function ProfileModalContent({ open, onClose, user }) {
  const { getUpdateUser, validateOtpUpdate } = useProfileUser();
  const { changePassword, validateOTPPassword, logout } = useAuthApi();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("info");
  // NHập otp để thay đổi mật khẩu
  const [step, setStep] = useState(1); // Step 1: Enter old password, Step 2: Enter OTP and new password
  const [loading, setLoading] = useState(false);
  // Nhập otp để thay đổi thông tin cá nhân
  const [editStep, setEditStep] = useState(1); //step 1: edit form, step: enter otp
  const [editOtp, setEditOtp] = useState(""); // form edit profile
  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    username: user?.username || "",
    email: user?.email || "",
    status: user?.status || "Active",
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

  const handleChangeProfile = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      await getUpdateUser(user.id, formData);
      toast.success("OTP đã được gửi về mail của bạn! Vui lòng kiểm tra.");
      setEditStep(2);
    } catch (err) {
      console.error(err);
      toast.error("Cập nhật thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const handleValidateOtpUpdate = async () => {
    try{
      setLoading(true);
      await validateOtpUpdate(user.id, editOtp);
      toast.success("Cập nhật người dùng thành công!");
      onClose();
    } catch(err){
      console.error(err);
      toast.error("Xác thực OTP thất bại. Vui lòng thử lại!")
    }
    finally{
      setLoading(false);
    }
  }
  const handleChangePasswordSubmit = async () => {
    try {
      setLoading(true);
      await changePassword({ oldPassword: passwordData.oldPassword });
      toast.success(
        "Mã OTP đã được gửi về mail của bạn. Vui lòng khiểm tra mail để tiếp tục đổi mật khẩu."
      );
      setStep(2);
    } catch (err) {
      console.error(err);
      toast.error(
        "Mật khẩu cũ không đúng hoặc có lỗi xảy ra. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };
  const handleValidateOtpPassword = async () => {
    if (otpData.newPassword !== otpData.confirmPassword) {
      toast.error("Mật khẩu mới và mật khẩu xác nhận không khớp!");
      return;
    }
    try {
      setLoading(true);
      await validateOTPPassword({
        user_id: user.id,
        otp: otpData.otp,
        new_password: otpData.newPassword,
        confirm_password: otpData.confirmPassword,
      });
      toast.success("Đổi mật khẩu thành công!");
      await logout();
      navigate("/ChatBot/login");
    } catch (err) {
      console.error(err);
      toast.error("Đổi mật khẩu thất bại! Vui lòng thử lại.");
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
              user?.avatar ||
              `https://ui-avatars.com/api/?name=${user?.first_name || "A"}+${
                user?.last_name || "U"
              }&background=random&size=128`
            }
            alt="avatar"
            className="w-20 h-20 rounded-full border-4 border-gray-200 dark:border-gray-700"
          />
          <h2 className="mt-3 text-lg font-semibold text-gray-800 dark:text-white">
            {user?.first_name} {user?.last_name}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {user?.email}
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
                {user?.username}
              </p>
              <p>
                <span className="font-semibold">Email:</span> {user?.email}
              </p>
              <p>
                <span className="font-semibold">Name:</span> {user?.first_name}{" "}
                {user?.last_name}
              </p>
              <p>
                <span className="font-semibold">Status:</span> {user?.status}
              </p>
            </div>
          )}

          {activeTab === "edit" && (
            <div className="space-y-4">
              {editStep === 1 && (
                <>
                  {["first_name", "last_name", "username", "email"].map(
                    (field) => (
                      <input
                        key={field}
                        type={field === "email" ? "email" : "text"}
                        name={field}
                        value={formData[field]}
                        onChange={handleChangeProfile}
                        placeholder={field.replace("_", " ").toUpperCase()}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )
                  )}
                  <Button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="w-full mt-2"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              )}

              {editStep === 2 && (
                <>
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={editOtp}
                    onChange={(e) => setEditOtp(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    onClick={handleValidateOtpUpdate}
                    disabled={loading}
                    className="w-full mt-2"
                  >
                    {loading ? "Verifying..." : "Confirm Update"}
                  </Button>
                </>
              )}
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
        </div>
      </div>
    </div>
  );
}
export default function ProfileModal(props) {
  return createPortal(<ProfileModalContent {...props} />, document.body);
}
