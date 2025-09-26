import axios from "axios";
import axiosLogin from "./axiosLogin";
const axiosAdminRole = axios.create({
  baseURL: import.meta.env.VITE_API_ADMIN_ROLE_URL,
  withCredentials: true,
});
// Gắn token từ localStorage vào header Authorization
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

axiosAdminRole.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axiosLogin.post(
          "/api/identity_service/refresh-token"
        );
        const newAccessToken = res.data.access_token;

        localStorage.setItem("access_token", newAccessToken);
        axiosAdminRole.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return axiosAdminRole(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
export default axiosAdminRole;
