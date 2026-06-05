import api from "./axios";

export const updateProfile = async (payload) => {
  const response = await api.patch("/user/update-profile", payload, {
    withCredentials: true,
  });
  return response.data;
};

export const updateAvatar = async (formData) => {
  const response = await api.patch("/user/update-avatar", formData, {
    withCredentials: true,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const sendEmailVerification = async () => {
  const response = await api.post(
    "/user/send-email-verification",
    {},
    { withCredentials: true }
  );
  return response.data;
};

export const changePassword = async (payload) => {
  const response = await api.post("/user/change-password", payload, {
    withCredentials: true,
  });
  return response.data;
};

export const sendPhoneOtp = async () => {
  const response = await api.post(
    "/user/send-phone-otp",
    {},
    { withCredentials: true }
  );
  return response.data;
};

export const verifyPhoneOtp = async (payload) => {
  const response = await api.post("/user/verify-phone-otp", payload, {
    withCredentials: true,
  });
  return response.data;
};

export const getUserDashboardData = async () => {
  const response = await api.get("/user/dashboard", {
    withCredentials: true,
  });
  return response.data;
};
