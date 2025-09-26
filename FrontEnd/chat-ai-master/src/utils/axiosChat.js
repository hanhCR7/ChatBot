import axios from 'axios';
import axiosLogin from './axiosLogin';
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_CHAT_URL,
  withCredentials: true,
});
console.log("Axios Base URL:", import.meta.env.VITE_API_CHAT_URL);

// Gắn token từ localStorage vào header Authorization
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});
// Xử lý lỗi phản hồi từ server
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axiosLogin.post("/api/user_service/refresh-token");
        const newAccessToken = res.data.access_token;

        localStorage.setItem("access_token", newAccessToken);
        instance.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return instance(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default instance;