// src/api/axiosLogin.js
import axios from "axios";

const axiosLogin = axios.create({
  baseURL: import.meta.env.VITE_API_LOGIN_URL,
  withCredentials: true,
});
axiosLogin.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token){
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error(error);
    return Promise.reject(error);
  }
);
export default axiosLogin;
