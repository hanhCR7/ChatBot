import axiosUser from "@/utils/axiosUser";

const userProfileUser= () => {
  const getMe = async () => {
    try {
      const response = await axiosUser.get(
        `/api/user_service/me`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      throw error;
    }
  };
  const getUpdateUser = async (id, payload) => {
    const res = await axiosUser.put(
      `api/user_service/user/update-info/${id}`,
      payload
    );
    return res.data;
  };
  const validateOtpUpdate = async (userId, otp) => {
    const res = await axiosUser.post(`api/user_service/user/validate-otp/${userId}`, { "otp_code": otp })
    return res.data;
  }

  return {
    getMe,
    getUpdateUser,
    validateOtpUpdate
  };
};

export default userProfileUser;
