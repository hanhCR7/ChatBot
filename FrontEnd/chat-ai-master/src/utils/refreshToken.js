import axiosLogin from "./axiosLogin";

// Biến để tránh nhiều request refresh token cùng lúc
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Refresh access token bằng refresh token
 * @returns {Promise<string>} New access token
 */
export const refreshAccessToken = async () => {
  // Nếu đang refresh, đợi kết quả
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const response = await axiosLogin.post(
      "/api/identity_service/refresh-token",
      {},
      {
        withCredentials: true, // Đảm bảo gửi cookie (refresh token)
      }
    );

    const newAccessToken = response.data.access_token;

    // Lưu token mới
    localStorage.setItem("access_token", newAccessToken);

    // Cập nhật token cho tất cả các axios instances
    processQueue(null, newAccessToken);
    isRefreshing = false;

    return newAccessToken;
  } catch (error) {
    // Refresh token cũng hết hạn hoặc không hợp lệ
    processQueue(error, null);
    isRefreshing = false;

    // Xóa token và redirect về login
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    // Chỉ redirect nếu đang ở trang không phải login
    if (!window.location.pathname.includes("/login")) {
      window.location.href = "/ChatBot/login";
    }

    throw error;
  }
};

/**
 * Setup interceptor cho axios instance để tự động refresh token
 * @param {AxiosInstance} axiosInstance - Axios instance cần setup
 * @param {string} instanceName - Tên instance để debug
 */
export const setupRefreshTokenInterceptor = (axiosInstance, instanceName = "axios") => {
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Chỉ xử lý lỗi 401 (Unauthorized)
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Refresh token
          const newAccessToken = await refreshAccessToken();

          // Cập nhật header cho request gốc
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          axiosInstance.defaults.headers.Authorization = `Bearer ${newAccessToken}`;

          // Retry request gốc
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // Refresh token thất bại, đã được xử lý trong refreshAccessToken
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
};

