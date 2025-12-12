import axios from "axios";
import { setupRefreshTokenInterceptor } from "./refreshToken";

const axiosAdminImg = axios.create({
  baseURL: import.meta.env.VITE_API_ADMIN_IMG_URL,
  withCredentials: true,
});

// Gắn token từ localStorage vào header Authorization
axiosAdminImg.interceptors.request.use(
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
setupRefreshTokenInterceptor(axiosAdminImg, "axiosAdminImg");

export default axiosAdminImg;
