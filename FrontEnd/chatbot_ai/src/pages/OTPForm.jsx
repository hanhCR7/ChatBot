import { useState } from "react";

export default function OtpForm({ userId, onLoginSuccess }) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:9001/api/identity_service/validate-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, otp }),
      });

      const data = await res.json();
      if (res.ok) {
        // ✅ Sửa ở đây: lưu đúng access_token
        localStorage.setItem("token", data.access_token);
        onLoginSuccess();
      } else {
        alert(data.detail || "OTP không đúng");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleVerifyOtp} className="max-w-md mx-auto mt-10 space-y-4">
      <h1 className="text-xl font-bold text-center">Xác thực OTP</h1>
      <p className="text-center text-sm text-gray-500">Nhập mã gồm 6 số được gửi về email của bạn</p>
      <input
        type="text"
        pattern="\d*"
        inputMode="numeric"
        maxLength={6}
        value={otp}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, "");
          setOtp(value);
        }}
        className="w-full border p-2 rounded text-center text-lg tracking-widest"
        placeholder="••••••"
        required
      />
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? "Đang xác thực..." : "Xác nhận"}
      </button>
    </form>
  );
}
