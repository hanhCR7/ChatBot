import axiosAdminUser from "@/utils/axiosAdminUser";
export const useActivateAccount = () => {
  const activateAccount = async (token) => {
    try {
      const response = await axiosAdminUser.get("/api/user_service/activate", {
        params: {token}
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi xác thực tài khoản:", error);
      throw (
        error.response?.data || {
          message: "Có lỗi xảy ra khi xác thực tài khoản",
        }
      );
    }
  };
  return { activateAccount };
};
