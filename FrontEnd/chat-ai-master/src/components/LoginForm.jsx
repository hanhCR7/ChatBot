import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Mail, Lock, User, Key } from "lucide-react";
import { useAuthApi } from "../hooks/useAuthAPI";
import { useNavigate } from "react-router-dom";
import PasswordStrength from "./common/PasswordStrength";
import PasswordInput from "./common/PasswordInput";

export default function AuthForm({ setUserId, onNext }) {
  const [mode, setMode] = useState("login"); // login | signup
  const { login, signUp } = useAuthApi();
  const navigate = useNavigate();

  // State cho form login
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

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
      toast.error(err.response?.data?.detail || "Đăng nhập thất bại");
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
    <div className="max-w-md mx-auto p-8 bg-white rounded-2xl shadow-2xl space-y-6">
      {/* Switch mode */}
      <div className="flex justify-center gap-6 mb-6">
        <button
          className={`py-2 px-6 rounded-full font-semibold transition ${
            mode === "login"
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
          }`}
          onClick={() => setMode("login")}
        >
          Đăng nhập
        </button>
        <button
          className={`py-2 px-6 rounded-full font-semibold transition ${
            mode === "signup"
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
          }`}
          onClick={() => setMode("signup")}
        >
          Đăng ký
        </button>
      </div>
      {/* Form Login */}
      {mode === "login" && (
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative">
            <User className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tên đăng nhập"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <PasswordInput
              id="login-password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
                className="accent-blue-600"
              />
              Ghi nhớ đăng nhập
            </label>
            <button
              type="button"
              className="text-blue-600 hover:underline"
              onClick={() => navigate("/forgot-password")}
            >
              Quên mật khẩu?
            </button>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition duration-200"
          >
            Đăng nhập
          </button>
        </form>
      )}
      {/* Form Signup */}
      {mode === "signup" && (
        <form onSubmit={handleSignUp} className="space-y-5">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <User
                className="absolute left-3 top-3.5 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Họ"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="relative flex-1">
              <User
                className="absolute left-3 top-3.5 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Tên"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <input
              type="email"
              placeholder="Email"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="relative">
            <User className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tên đăng nhập"
              value={signupUsername}
              onChange={(e) => setSignupUsername(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="relative">
            <Key className="absolute left-3 top-3.5 text-gray-400" size={20} />
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
          <button
            type="submit"
            disabled={!isValidPassword}
            className={`w-full py-2 rounded-md ${
              isValidPassword
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Đăng ký
          </button>
        </form>
      )}
    </div>
  );
}
