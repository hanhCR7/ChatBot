import axios from "axios";
import { setupRefreshTokenInterceptor } from "./refreshToken";

const axiosAdminRole = axios.create({
  baseURL: import.meta.env.VITE_API_ADMIN_ROLE_URL,
  withCredentials: true,
});

// Gắn token từ localStorage vào header Authorization
axiosAdminRole.interceptors.request.use(
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
setupRefreshTokenInterceptor(axiosAdminRole, "axiosAdminRole");

export default axiosAdminRole;
