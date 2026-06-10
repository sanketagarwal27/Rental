import api from "./axios";

export const getAdminStats = async () => {
  const response = await api.get("/admin/stats", {
    withCredentials: true,
  });
  return response.data;
};

export const getAllUsers = async () => {
  const response = await api.get("/admin/users", {
    withCredentials: true,
  });
  return response.data;
};
