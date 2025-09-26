import { useState } from "react";
import { toast } from "sonner"; // hoặc react-toastify
import { Mail } from "lucide-react";
import { useAuthApi } from "../hooks/useAuthAPI";

export default function ForgotPassword() {
  const { resetPasswordRequest } = useAuthApi();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

   const handleRequest = async (e) => {
     e.preventDefault();
     if (!email) return toast.error("Vui lòng nhập email.");

     try {
       setLoading(true);
       const res = await resetPasswordRequest(email);
       toast.success(res.message || "Đã gửi email đặt lại mật khẩu!");
       setEmail("");
     } catch (err) {
       toast.error(
         err.response?.data?.detail ||
           err.message ||
           "Lỗi gửi yêu cầu đặt lại mật khẩu."
       );
     } finally {
       setLoading(false);
     }
   };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <form onSubmit={handleRequest} className="space-y-5">
          <h2 className="text-3xl font-bold text-center mb-4">Quên mật khẩu</h2>
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <input
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className={`w-full py-3 rounded-xl font-semibold text-white transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            disabled={loading}
          >
            {loading ? "Đang gửi..." : "Gửi yêu cầu"}
          </button>
        </form>
      </div>
    </div>
  );
}
