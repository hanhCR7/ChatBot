import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuthApi } from "../hooks/useAuthAPI";
import {decodeJwt} from "../utils/decodeJwt"; // Giả sử bạn có một hàm decode JWT
export default function OTPForm({ userId }) {
  const [otp, setOtp] = useState("");
  const [counter, setCounter] = useState(60);
  const { validateOtp, resendOtp } = useAuthApi();
  const navigate = useNavigate();

  useEffect(() => {
    if (counter > 0) {
      const timer = setTimeout(() => setCounter(counter - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [counter]);

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const res = await validateOtp(userId, otp);
      localStorage.setItem("access_token", res.access_token);
      localStorage.setItem("refresh_token", res.refresh_token);
      const decodedToken = decodeJwt(res.access_token);
      const role = decodedToken?.role
      toast.success("Đăng nhập thành công");
      if (role === "Admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Lỗi validate OTP:", err);
      console.error("Chi tiết:", err.response?.data);
      toast.error(err.response?.data?.detail || "Xác thực OTP thất bại");
    }
  };

  const handleResend = async () => {
    try {
      await resendOtp(userId);
      setCounter(60);
      toast.success("Đã gửi lại mã OTP");
    } catch (err) {
      toast.error("Không thể gửi lại OTP");
    }
  };

  return (
    <form onSubmit={handleVerify} className="p-6 bg-white rounded-2xl shadow-xl w-96 space-y-4">
      <h2 className="text-xl font-semibold text-center">Nhập mã OTP</h2>
      <input
        type="text"
        className="w-full p-3 border rounded-xl"
        placeholder="Nhập mã OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
      />
      <button className="w-full bg-green-600 text-white p-3 rounded-xl hover:bg-green-700">
        Xác minh
      </button>
      <div className="text-center mt-2">
        {counter > 0 ? (
          <p>Gửi lại OTP sau {counter}s</p>
        ) : (
          <button type="button" onClick={handleResend} className="text-blue-600 hover:underline">
            Gửi lại OTP
          </button>
        )}
      </div>
    </form>
  );
}
