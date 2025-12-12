import axiosEmail from "@/utils/axiosEmail";

export const useEmailAPI = () => {
  /**
   * Gửi email tùy chỉnh
   */
  const sendCustomEmail = async ({ recipient, subject, body }) => {
    try {
      const response = await axiosEmail.post("/api/email_service/send-email/", {
        recipient,
        subject,
        body,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi gửi email:", error);
      throw error.response?.data || { message: "Không thể gửi email" };
    }
  };

  /**
   * Gửi lại email kích hoạt tài khoản
   */
  const resendActivationEmail = async (email) => {
    try {
      const response = await axiosEmail.post(
        "/api/email_service/resend-activation-email/",
        {
          email,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi gửi lại email kích hoạt:", error);
      throw error.response?.data || { message: "Không thể gửi lại email kích hoạt" };
    }
  };

  /**
   * Gửi email đặt lại mật khẩu
   */
  const sendPasswordResetEmail = async ({ email, resetLink }) => {
    try {
      const response = await axiosEmail.post(
        "/api/email_service/send-password-reset-email/",
        {
          email,
          reset_link: resetLink,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi gửi email đặt lại mật khẩu:", error);
      throw error.response?.data || { message: "Không thể gửi email đặt lại mật khẩu" };
    }
  };

  return {
    sendCustomEmail,
    resendActivationEmail,
    sendPasswordResetEmail,
  };
};

export default useEmailAPI;
