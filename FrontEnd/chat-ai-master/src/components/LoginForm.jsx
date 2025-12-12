import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Mail, Lock, User, Sparkles, HelpCircle } from "lucide-react";
import { useAuthApi } from "../hooks/useAuthAPI";
import { useNavigate } from "react-router-dom";
import PasswordStrength from "./common/PasswordStrength";
import PasswordInput from "./common/PasswordInput";
import ContactAdminModal from "./ContactAdminModal";

export default function AuthForm({ setUserId, onNext }) {
  const [mode, setMode] = useState("login"); // login | signup
  const { login, signUp } = useAuthApi();
  const navigate = useNavigate();

  // State cho form login
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // State cho form signup
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [isValidPassword, setIsValidPassword] = useState(false);

  useEffect(() => {
    const savedUsername = localStorage.getItem("remember_username");
    if (savedUsername) {
      setLoginUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  // Cập nhật document title khi đổi mode
  useEffect(() => {
    document.title = mode === "signup" ? "Đăng ký" : "Đăng nhập";
  }, [mode]);

  // Xử lý đăng nhập
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await login(loginUsername, loginPassword);
      setUserId(res.user_id);
      if (rememberMe) {
        localStorage.setItem("remember_username", loginUsername);
        localStorage.setItem("remember_password", loginPassword);
      } else {
        localStorage.removeItem("remember_username");
        localStorage.removeItem("remember_password");
      }
      toast.success(res.message);
      onNext();
    } catch (err) {
      const errorDetail = err.response?.data?.detail || "Đăng nhập thất bại";
      toast.error(errorDetail);
      
      // Nếu tài khoản bị chặn (403), hiển thị modal liên hệ admin
      if (err.response?.status === 403 && errorDetail.includes("vô hiệu hóa")) {
        // Lưu thông tin user để dùng trong modal
        setUserEmail(""); // Có thể lấy từ form hoặc để user nhập
        setShowContactModal(true);
      }
    }
  };
  
  // Xử lý đăng ký
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (
      !firstName ||
      !lastName ||
      !signupUsername ||
      !signupEmail ||
      !signupPassword
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin đăng ký.");
      return;
    }
    if (!isValidPassword) return;
    try {
      const res = await signUp({
        first_name: firstName,
        last_name: lastName,
        username: signupUsername,
        email: signupEmail,
        password: signupPassword,
      });
      toast.success(
        res.message ||
          "Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt."
      );
      // Reset form
      setFirstName("");
      setLastName("");
      setSignupUsername("");
      setSignupEmail("");
      setSignupPassword("");
      // Chuyển sang login
      setMode("login");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Đăng ký thất bại");
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md mx-auto p-8 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800"
    >
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
        JarVis AI
      </h1>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
        Trợ lý lập trình thông minh
      </p>

      {/* Switch mode */}
      <div className="flex justify-center gap-2 mb-8 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex-1 py-2.5 px-6 rounded-lg font-semibold transition-all ${
            mode === "login"
              ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
          onClick={() => setMode("login")}
        >
          Đăng nhập
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex-1 py-2.5 px-6 rounded-lg font-semibold transition-all ${
            mode === "signup"
              ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
          onClick={() => setMode("signup")}
        >
          Đăng ký
        </motion.button>
      </div>

      {/* Form Login */}
      <AnimatePresence mode="wait">
        {mode === "login" && (
          <motion.form
            key="login"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleLogin}
            className="space-y-5"
          >
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
              <input
                type="text"
                placeholder="Tên đăng nhập"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-all"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
              <PasswordInput
                id="login-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer select-none text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                Ghi nhớ đăng nhập
              </label>
              <button
                type="button"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                onClick={() => navigate("/forgot-password")}
              >
                Quên mật khẩu?
              </button>
            </div>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center gap-1 mx-auto transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                Tài khoản bị chặn? Liên hệ Admin
              </button>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              Đăng nhập
            </motion.button>
          </motion.form>
        )}

        {/* Form Signup */}
        {mode === "signup" && (
          <motion.form
            key="signup"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSignUp}
            className="space-y-5"
          >
            <div className="flex gap-3">
              <div className="relative flex-1">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Họ"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-all"
                  required
                />
              </div>
              <div className="relative flex-1">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Tên"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-all"
                  required
                />
              </div>
            </div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
              <input
                type="email"
                placeholder="Email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-all"
                required
              />
            </div>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
              <input
                type="text"
                placeholder="Tên đăng nhập"
                value={signupUsername}
                onChange={(e) => setSignupUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-all"
                required
              />
            </div>
            <div className="relative">
              <PasswordInput
                id="signup-password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
              />
              <PasswordStrength
                password={signupPassword}
                onValidChange={setIsValidPassword}
              />
            </div>
            <motion.button
              whileHover={{ scale: isValidPassword ? 1.02 : 1 }}
              whileTap={{ scale: isValidPassword ? 0.98 : 1 }}
              type="submit"
              disabled={!isValidPassword}
              className={`w-full py-3.5 rounded-xl font-bold transition-all ${
                isValidPassword
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
                  : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              }`}
            >
              Đăng ký
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Contact Admin Modal */}
      <ContactAdminModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        username={loginUsername}
        email={userEmail}
      />
    </motion.div>
  );
}
