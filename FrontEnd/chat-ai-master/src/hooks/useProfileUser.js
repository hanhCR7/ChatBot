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
      `api/user_service/user/${id}`,
      payload
    );
    return res.data;
  };
  

  return {
    getMe,
    getUpdateUser
  };
};

export default userProfileUser;
