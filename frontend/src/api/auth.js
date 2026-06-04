import api from "./axios";

export const register = async (payload) => {
  const response = await api.post("/user/register", payload);
  return response.data;
};

export const login = async (payload) => {
  const response = await api.post("/user/login", payload, {
    withCredentials: true,
  });
  return response.data;
};

export const forgotPassword = async (payload) => {
  const response = await api.post("/user/forgot-password", payload);
  return response.data;
};

export const resetPassword = async (token, payload) => {
  const response = await api.post(`/user/reset-password/${token}`, payload);
  return response.data;
};

export const logout = async () => {
  const response = await api.post("/user/logout", {}, {
    withCredentials: true,
  });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get("/user/current-user", {
    withCredentials: true,
  });
  return response.data;
};
