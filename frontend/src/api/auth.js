import api from "./axios";

export const register = async (payload) => {
  const response = await api.post("/user/register", payload);
  return response.data;
};

export const login = async (payload) => {
  const response = await api.post("/user/login", payload);
  return response.data;
};
