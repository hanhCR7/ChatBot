import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActivateAccount } from "@/hooks/useActivateAccount";

export default function ActivateAccount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const { activateAccount } = useActivateAccount();
  const calledRef = useRef(false)
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if(calledRef.current) return;
    calledRef.current = true;
    const verify = async () => {
      try {
        const res = await activateAccount(token);
        if (res.status === "success") {
          setStatus("success");
          setMessage(res.message || "Xác thực thành công!");
        } else {
          setStatus("error");
          setMessage(res.message || "Token không hợp lệ.");
        }
      } catch (err) {
        setStatus("error");
        setMessage(err.message || "Có lỗi xảy ra khi xác thực.");
      }
    };

    if (token) verify();
    else {
      setStatus("error");
      setMessage("Token không tồn tại.");
    }
  }, [token]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl border shadow bg-card">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Đang xác thực tài khoản...</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
            <h2 className="text-xl font-semibold">Xác thực thành công!</h2>
            <p className="text-muted-foreground">{message}</p>
            <Button onClick={() => navigate("/login")} className="w-full mt-4">
              Đăng nhập ngay
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 mx-auto text-red-500" />
            <h2 className="text-xl font-semibold">Xác thực thất bại</h2>
            <p className="text-muted-foreground">{message}</p>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/")}
              >
                Về trang chủ
              </Button>
              <Button
                className="w-full"
                onClick={() => navigate("/resend-activation")}
              >
                Gửi lại email
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
