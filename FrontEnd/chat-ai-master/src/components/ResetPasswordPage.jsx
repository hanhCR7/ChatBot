import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuthApi } from "../hooks/useAuthAPI";
import PasswordInput from "../components/common/PasswordInput";
import PasswordStrength from "../components/common/PasswordStrength";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { resetPassword } = useAuthApi();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isValidPassword, setIsValidPassword] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!token) {
      setError("Token không hợp lệ hoặc đã hết hạn.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (!isValidPassword) return;
    try {
      const res = await resetPassword({
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setMessage(res.message || "Đặt lại mật khẩu thành công!");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      const detail = err.response?.data?.detail || "Lỗi đặt lại mật khẩu.";
      setError(detail);
    }
  };
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-6">
          Đặt lại mật khẩu
        </h2>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        {message && <p className="text-green-600 text-sm mb-4">{message}</p>}

        <form onSubmit={handleReset} className="space-y-5">
          <div>
            <label className="block text-sm font-medium">Mật khẩu mới</label>
            <PasswordInput
              id="reset-new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới"
            />
            <PasswordStrength password={newPassword} onValidChange={setIsValidPassword}/>
          </div>

          <div>
            <label className="block text-sm font-medium">
              Xác nhận mật khẩu
            </label>
            <PasswordInput
              id="reset-confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
            />
          </div>
          <button
            type="submit"
            disabled={!isValidPassword}
            className={`w-full py-2 rounded-md ${
              isValidPassword
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Đặt lại mật khẩu
          </button>
        </form>
      </div>
    </div>
  );
}
