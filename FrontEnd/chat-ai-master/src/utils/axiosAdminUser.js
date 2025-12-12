import axios from "axios";
import { setupRefreshTokenInterceptor } from "./refreshToken";

const axiosAdminUser = axios.create({
  baseURL: import.meta.env.VITE_API_ADMIN_USER_URL,
  withCredentials: true,
});

// Gắn token từ localStorage vào header Authorization
axiosAdminUser.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Setup tự động refresh token khi access token hết hạn
setupRefreshTokenInterceptor(axiosAdminUser, "axiosAdminUser");

export default axiosAdminUser;
