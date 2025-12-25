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
    try {
      const res = await axiosUser.put(
        `/api/user_service/user/update-info/${id}`,
        payload
      );
      return res.data;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  };

  return {
    getMe,
    getUpdateUser
  };
};

export default userProfileUser;
