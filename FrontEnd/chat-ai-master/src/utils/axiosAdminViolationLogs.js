import axios from "axios";
import { setupRefreshTokenInterceptor } from "./refreshToken";

const axiosAdminViolationLogs = axios.create({
  baseURL: import.meta.env.VITE_API_CHATBOT_URL || import.meta.env.VITE_API_URL || "http://localhost:8000",
  withCredentials: true,
});

// Gắn token từ localStorage vào header Authorization
axiosAdminViolationLogs.interceptors.request.use(
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
setupRefreshTokenInterceptor(axiosAdminViolationLogs, "axiosAdminViolationLogs");

export default axiosAdminViolationLogs;
