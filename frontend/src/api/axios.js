import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  withCredentials: true,
});

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    // If response is successful, just return it
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Auth endpoints should never trigger a refresh retry
    const skipRefresh = [
      "/user/login",
      "/user/register",
      "/user/refresh-token",
      "/user/forgot-password",
    ].some((path) => originalRequest.url?.includes(path));

    // Only attempt refresh for 401s that are NOT from auth endpoints
    // and haven't been retried yet
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !skipRefresh
    ) {
      originalRequest._retry = true;

      try {
        await api.post("/user/refresh-token", {}, { withCredentials: true });
        originalRequest.withCredentials = true;
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
