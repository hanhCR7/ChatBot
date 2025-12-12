import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Shield, Clock, RefreshCw, CheckCircle2, Loader2 } from "lucide-react";
import { useAuthApi } from "../hooks/useAuthAPI";
import { decodeJwt } from "../utils/decodeJwt";

export default function OTPForm({ userId }) {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [counter, setCounter] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
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
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
    }
    // Handle arrow keys
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
    }
    if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const digits = pastedText.replace(/\D/g, "").slice(0, 6).split("");
    if (digits.length === 0) return;
    
    const newOtp = Array(6).fill("");
    digits.forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit;
    });
    setOtp(newOtp);
    const lastIndex = Math.min(digits.length - 1, 5);
    inputsRef.current[lastIndex]?.focus();
    setFocusedIndex(lastIndex);
  };

  const handleFocus = (index) => {
    setFocusedIndex(index);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length < 6) {
      toast.error("Vui lòng nhập đầy đủ mã OTP!");
      // Focus vào ô trống đầu tiên
      const firstEmptyIndex = otp.findIndex((digit) => !digit);
      if (firstEmptyIndex !== -1) {
        inputsRef.current[firstEmptyIndex]?.focus();
        setFocusedIndex(firstEmptyIndex);
      }
      return;
    }
    setIsVerifying(true);
    try {
      const res = await validateOtp(userId, otpValue);
      localStorage.setItem("access_token", res.access_token);
      localStorage.setItem("refresh_token", res.refresh_token);
      const decodedToken = decodeJwt(res.access_token);
      const role = decodedToken?.role;
      toast.success("Đăng nhập thành công!");
      // Delay để hiển thị success state
      setTimeout(() => {
        navigate(role === "Admin" ? "/admin/dashboard" : "/");
      }, 500);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xác thực OTP thất bại");
      // Clear OTP và focus lại
      setOtp(Array(6).fill(""));
      inputsRef.current[0]?.focus();
      setFocusedIndex(0);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await resendOtp(userId);
      setCounter(60);
      setOtp(Array(6).fill(""));
      inputsRef.current[0]?.focus();
      setFocusedIndex(0);
      toast.success("Đã gửi lại mã OTP!");
    } catch {
      toast.error("Không thể gửi lại OTP");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 space-y-8"
    >
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg"
        >
          <Shield className="w-10 h-10 text-white" />
        </motion.div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Xác minh OTP
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" />
            Mã OTP đã được gửi tới email của bạn
          </p>
        </div>
      </div>

      {/* OTP Input */}
      <form onSubmit={handleVerify} className="space-y-6">
        <div className="flex justify-center gap-3">
          {otp.map((digit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index, type: "spring", stiffness: 200 }}
            >
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={index === 0 ? handlePaste : undefined}
                onFocus={() => handleFocus(index)}
                ref={(el) => (inputsRef.current[index] = el)}
                aria-label={`OTP digit ${index + 1}`}
                className={`w-14 h-14 text-center text-2xl font-bold border-2 rounded-xl transition-all duration-300 focus:outline-none ${
                  focusedIndex === index
                    ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-105"
                    : digit
                    ? "border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20"
                    : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600"
                } text-gray-900 dark:text-white`}
              />
            </motion.div>
          ))}
        </div>

        {/* Verify Button */}
        <motion.button
          type="submit"
          disabled={isVerifying || otp.join("").length < 6}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Đang xác minh...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Xác minh</span>
            </>
          )}
        </motion.button>
      </form>

      {/* Resend OTP */}
      <div className="text-center">
        <AnimatePresence mode="wait">
          {counter > 0 ? (
            <motion.div
              key="countdown"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400"
            >
              <Clock className="w-4 h-4" />
              <p>
                Gửi lại mã sau{" "}
                <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                  {counter}s
                </span>
              </p>
            </motion.div>
          ) : (
            <motion.button
              key="resend"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              type="button"
              onClick={handleResend}
              disabled={isResending}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Gửi lại OTP</span>
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-center text-gray-500 dark:text-gray-500">
        Bạn có thể dán mã OTP từ clipboard (Ctrl+V / Cmd+V)
      </p>
    </motion.div>
  );
}
