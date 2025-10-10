import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuthApi } from "../hooks/useAuthAPI";
import { decodeJwt } from "../utils/decodeJwt";
import { Key } from "lucide-react";

export default function OTPForm({ userId }) {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [counter, setCounter] = useState(60);
  const inputsRef = useRef([]);
  const { validateOtp, resendOtp } = useAuthApi();
  const navigate = useNavigate();

  useEffect(() => {
    if (counter > 0) {
      const timer = setTimeout(() => setCounter((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [counter]);

  const handleChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      inputsRef.current[index - 1]?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length < 6) {
      toast.error("Vui lòng nhập đầy đủ mã OTP!");
      return;
    }
    try {
      const res = await validateOtp(userId, otpValue);
      localStorage.setItem("access_token", res.access_token);
      localStorage.setItem("refresh_token", res.refresh_token);
      const decodedToken = decodeJwt(res.access_token);
      const role = decodedToken?.role;
      toast.success("Đăng nhập thành công!");
      navigate(role === "Admin" ? "/ChatBot/admin/dashboard" : "/ChatBot/");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xác thực OTP thất bại");
    }
  };

  const handleResend = async () => {
    try {
      await resendOtp(userId);
      setCounter(60);
      toast.success("Đã gửi lại mã OTP!");
    } catch {
      toast.error("Không thể gửi lại OTP");
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-white rounded-2xl shadow-2xl space-y-6">
      <h2 className="text-2xl font-bold text-center text-gray-800">
        Xác minh OTP
      </h2>
      <p className="text-center text-gray-500 text-sm">
        Mã OTP đã được gửi tới email của bạn
      </p>

      {/* Nhập mã OTP */}
      <form onSubmit={handleVerify} className="space-y-5">
        <div className="flex justify-center gap-3 mt-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              ref={(el) => (inputsRef.current[index] = el)}
              className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
            />
          ))}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition duration-200"
        >
          Xác minh
        </button>
      </form>

      {/* Gửi lại OTP */}
      <div className="text-center text-sm text-gray-600">
        {counter > 0 ? (
          <p>
            Gửi lại mã sau{" "}
            <span className="font-semibold text-blue-600">{counter}s</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="text-blue-600 hover:underline font-medium"
          >
            Gửi lại OTP
          </button>
        )}
      </div>
    </div>
  );
}
