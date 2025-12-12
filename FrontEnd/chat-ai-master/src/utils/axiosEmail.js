// src/utils/axiosEmail.js
import axios from "axios";

const axiosEmail = axios.create({
  baseURL: import.meta.env.VITE_API_EMAIL_URL || "http://localhost:8003",
  withCredentials: true,
});

axiosEmail.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error(error);
    return Promise.reject(error);
  }
);

export default axiosEmail;
