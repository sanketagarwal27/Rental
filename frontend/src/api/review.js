import api from "./axios";

export const createReview = (bookingId, data) =>
  api.post(`/review/${bookingId}`, data);

export const getVehicleReviews = (vehicleId, page = 1, limit = 10) =>
  api.get(`/review/vehicle/${vehicleId}`, { params: { page, limit } });

export const getUserReviews = (userId, page = 1, limit = 10) =>
  api.get(`/review/user/${userId}`, { params: { page, limit } });

export const getMyReviews = (page = 1, limit = 10) =>
  api.get(`/review/my`, { params: { page, limit } });
