import axiosLogin from "@/utils/axiosLogin";

export const useAuthApi = () => {
  const login = async (username, password) => {
    const res = await axiosLogin.post("api/identity_service/login", {
      username,
      password,
    });
    return res.data;
  };

  const validateOtp = async (user_id, otp) => {
    const res = await axiosLogin.post("api/identity_service/validate-otp", {
      user_id,
      otp,
    });
    return res.data;
  };

  const resendOtp = async (user_id) => {
    const res = await axiosLogin.post("api/identity_service/resend_otp", {
      user_id,
    });
    return res.data;
  };
  const signUp = async ({
    first_name,
    last_name,
    username,
    email,
    password,
  }) => {
    const res = await axiosLogin.post("api/identity_service/sign_up", {
      first_name,
      last_name,
      username,
      email,
      password,
    });
    return res.data;
  };
  const changePassword = async ({
    oldPassword,
    newPassword,
    confirmPassword,
  }) => {
    const res = await axiosLogin.put("api/identity_service/change-password", {
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    return res.data;
  };

  const resetPasswordRequest = async (email) => {
    const res = await axiosLogin.post(
      "/api/identity_service/reset-password-request",
      {
        email,
      }
    );
    return res.data;
  };

  const resetPassword = async ({ token, new_password, confirm_password }) => {
    const res = await axiosLogin.post("/api/identity_service/reset-password", {
      token,
      new_password,
      confirm_password,
    });
    return res.data;
  };
  const logout = async () => {
    const res = await axiosLogin.post("/api/identity_service/logout");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    return res.data;
  };
  return {
    login,
    validateOtp,
    resendOtp,
    signUp,
    changePassword,
    resetPasswordRequest,
    resetPassword,
    logout,
  };
};
export default useAuthApi;
