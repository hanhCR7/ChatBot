import axios from "axios";
import { setupRefreshTokenInterceptor } from "./refreshToken";

const axiosUploadFile = axios.create({
  baseURL: import.meta.env.VITE_API_CHAT_URL,
  withCredentials: true,
});

// Gắn token từ localStorage vào header Authorization
axiosUploadFile.interceptors.request.use(
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
setupRefreshTokenInterceptor(axiosUploadFile, "axiosUploadFile");

export default axiosUploadFile;
