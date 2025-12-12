import axios from "axios";
import { setupRefreshTokenInterceptor } from "./refreshToken";

const axiosUser = axios.create({
  baseURL: import.meta.env.VITE_API_USER_BY_ID,
  withCredentials: true,
});

// Gắn token từ localStorage vào header Authorization
axiosUser.interceptors.request.use(
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
setupRefreshTokenInterceptor(axiosUser, "axiosUser");

export default axiosUser;