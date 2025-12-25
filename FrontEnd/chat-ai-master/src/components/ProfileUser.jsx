import { useState, useEffect } from "react";
import { X, Mail, Camera } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import useProfileUser from "@/hooks/useProfileUser";
import useAuthApi from "@/hooks/useAuthAPI";
import PasswordInput from "./common/PasswordInput";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import SendEmailModal from "./SendEmailModal";

function ProfileModalContent({ open, onClose, user, onUserUpdate }) {
  const { getUpdateUser } = useProfileUser();
  const { changePassword, validateOTPPassword, logout } = useAuthApi();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("info");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    username: user?.username || "",
    email: user?.email || "",
    status: user?.status || "Active",
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
  });

  const [otpData, setOtpData] = useState({
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        username: user.username || "",
        email: user.email || "",
        status: user.status || "Active",
      });
    }
  }, [user]);

  const handleChangeProfile = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const updatedUser = await getUpdateUser(user.id, formData);
      toast.success(t("messages.success.profileUpdated"));
      // Call callback to update user in parent component
      if (onUserUpdate && updatedUser?.user) {
        onUserUpdate(updatedUser.user);
      }
      onClose();
      // Reload page to reflect changes if callback not provided
      if (!onUserUpdate) {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.detail || t("messages.error.updateFailed");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePasswordSubmit = async () => {
    try {
      setLoading(true);
      await changePassword({ oldPassword: passwordData.oldPassword });
      toast.success(t("messages.success.otpSent"));
      setStep(2);
    } catch (err) {
      console.error(err);
      toast.error(t("messages.error.updateFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleValidateOtpPassword = async () => {
    if (otpData.newPassword !== otpData.confirmPassword) {
      toast.error(t("messages.error.passwordMismatch"));
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
      toast.success(t("messages.success.passwordChanged"));
      await logout();
      navigate("/login");
    } catch (err) {
      console.error(err);
      toast.error(t("messages.error.updateFailed"));
    } finally {
      setLoading(false);
    }
  };

  const resetPasswordForm = () => {
    setStep(1);
    setPasswordData({ oldPassword: "" });
    setOtpData({ otp: "", newPassword: "", confirmPassword: "" });
  };


  if (!open) return (
    <>
      <SendEmailModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
      />
    </>
  );

  return (
    <>
      {createPortal(
        <AnimatePresence>
          <div 
            key="profile-modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-4" 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{ position: 'relative', margin: 'auto' }}
            >
              {/* Close button */}
              <button
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header with title */}
              <div className="px-8 pt-8 pb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {activeTab === "info" && t("profile.info")}
                  {activeTab === "edit" && t("profile.editProfile")}
                  {activeTab === "password" && t("profile.changePassword")}
                  {activeTab === "email" && t("profile.sendEmail")}
                </h2>
              </div>

              {/* Tabs */}
              <div className="flex border-b dark:border-gray-700 px-8">
              {[
                { key: "info", label: t("profile.info") },
                { key: "edit", label: t("profile.edit") },
                { key: "password", label: t("profile.password") },
                { key: "email", label: t("profile.email") },
              ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveTab(tab.key);
                      if (tab.key === "password") resetPasswordForm();
                    }}
                    className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === tab.key
                        ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border-transparent"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-8 py-6">
                {activeTab === "info" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        {t("auth.username")}
                      </label>
                      <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                        {user?.username || "N/A"}
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        {t("auth.email")}
                      </label>
                      <p className="text-lg font-bold text-gray-900 dark:text-white mt-1 break-all">
                        {user?.email || "N/A"}
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        {t("profile.displayName")}
                      </label>
                      <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                        {user?.first_name} {user?.last_name}
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        {t("profile.status")}
                      </label>
                      <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            user?.status === "Active"
                              ? "bg-green-500 text-white"
                              : "bg-red-500 text-white"
                          }`}
                        >
                          {user?.status === "Active" ? t("profile.active") : t("profile.inactive")}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "edit" && (
                  <div className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <img
                          src={
                            user?.avatar ||
                            `https://ui-avatars.com/api/?name=${user?.first_name || "U"}+${
                              user?.last_name || "U"
                            }&background=6366f1&color=fff&size=128&bold=true`
                          }
                          alt="avatar"
                          className="w-24 h-24 rounded-full border-2 border-gray-200 dark:border-gray-700"
                        />
                        <button className="absolute bottom-0 right-0 w-8 h-8 bg-gray-700 dark:bg-gray-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors">
                          <Camera className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t("profile.displayName")}
                        </label>
                        <input
                          type="text"
                          value={`${formData.first_name} ${formData.last_name}`.trim()}
                          onChange={(e) => {
                            const parts = e.target.value.split(' ');
                            setFormData({
                              ...formData,
                              first_name: parts[0] || '',
                              last_name: parts.slice(1).join(' ') || '',
                            });
                          }}
                          placeholder={t("profile.displayName")}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t("auth.username")}
                        </label>
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleChangeProfile}
                          placeholder={t("auth.username")}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t("auth.email")}
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChangeProfile}
                          placeholder={t("auth.email")}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t("profile.profileHelp")}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                      <Button
                        onClick={onClose}
                        variant="outline"
                        className="px-6 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {t("common.cancel")}
                      </Button>
                      <Button
                        onClick={handleSaveProfile}
                        disabled={loading}
                        className="px-6 py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium"
                      >
                        {loading ? t("common.loading") : t("profile.save")}
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === "password" && (
                  <div className="space-y-5">
                    {step === 1 && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t("profile.oldPassword")} <span className="text-red-500">*</span>
                          </label>
                          <PasswordInput
                            id="oldPassword"
                            value={passwordData.oldPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                oldPassword: e.target.value,
                              })
                            }
                            placeholder={t("profile.oldPassword")}
                          />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                          <Button
                            onClick={onClose}
                            variant="outline"
                            className="px-6 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            {t("common.cancel")}
                          </Button>
                          <Button
                            onClick={handleChangePasswordSubmit}
                            disabled={loading || !passwordData.oldPassword}
                            className="px-6 py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium"
                          >
                            {loading ? t("common.loading") : t("profile.sendOtp")}
                          </Button>
                        </div>
                      </>
                    )}

                    {step === 2 && (
                      <>
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="text-sm text-green-800 dark:text-green-300">
                            {t("messages.success.otpSent")}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t("profile.otp")} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder={t("profile.enterOtp")}
                            value={otpData.otp}
                            onChange={(e) =>
                              setOtpData({ ...otpData, otp: e.target.value })
                            }
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t("profile.newPassword")} <span className="text-red-500">*</span>
                          </label>
                          <PasswordInput
                            id="newPassword"
                            value={otpData.newPassword}
                            onChange={(e) =>
                              setOtpData({ ...otpData, newPassword: e.target.value })
                            }
                            placeholder={t("profile.newPassword")}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t("profile.confirmPassword")} <span className="text-red-500">*</span>
                          </label>
                          <PasswordInput
                            id="confirmPassword"
                            value={otpData.confirmPassword}
                            onChange={(e) =>
                              setOtpData({
                                ...otpData,
                                confirmPassword: e.target.value,
                              })
                            }
                            placeholder={t("profile.confirmPassword")}
                          />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                          <Button
                            onClick={resetPasswordForm}
                            variant="outline"
                            className="px-6 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                            disabled={loading}
                          >
                            {t("common.back")}
                          </Button>
                          <Button
                            onClick={handleValidateOtpPassword}
                            disabled={
                              loading ||
                              !otpData.otp ||
                              !otpData.newPassword ||
                              !otpData.confirmPassword
                            }
                            className="px-6 py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium"
                          >
                            {loading ? t("common.loading") : t("profile.changePassword")}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeTab === "email" && (
                  <div className="space-y-5">
                    <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-3 mb-3">
                        <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                          {t("email.sendEmail")}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {t("email.htmlSupported")}
                      </p>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                      <Button
                        onClick={onClose}
                        variant="outline"
                        className="px-6 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {t("common.cancel")}
                      </Button>
                      <Button
                        onClick={() => setEmailModalOpen(true)}
                        className="px-6 py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium"
                      >
                        <Mail className="w-5 h-5 mr-2 inline" />
                        {t("email.openForm")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
      <SendEmailModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
      />
    </>
  );
}

export default function ProfileModal(props) {
  return <ProfileModalContent {...props} />;
}
