import api from "./axios";

export const getVehicleById = async (id) => {
  const response = await api.get(`/vehicle/${id}`, { withCredentials: true });
  return response.data;
};

export const fetchNearbyVehicles = (lat, lng, radius = 30, page = 1) => {
  return api.get("/vehicle/nearby", {
    params: { lat, lng, radius, page, limit: 12 },
  });
};

export const uploadVehicle = async (payload) => {
  const response = await api.post("/vehicle/upload", payload, {
    withCredentials: true,
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateVehicleAvailability = async (id, unavailableDates, isAvailable) => {
  const payload = {};
  if (unavailableDates !== undefined) payload.unavailableDates = unavailableDates;
  if (isAvailable !== undefined) payload.isAvailable = isAvailable;

  const response = await api.put(
    `/vehicle/${id}/availability`,
    payload,
    { withCredentials: true }
  );
  return response.data;
};

export const updateVehicleDetails = async (id, payload) => {
  const response = await api.patch(`/vehicle/${id}/details`, payload, {
    withCredentials: true,
  });
  return response.data;
};

export const searchVehicles = async ({ lat, lng, radius = 30, startDate, endDate, page = 1 }) => {
  const params = { lat, lng, radius, page };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const response = await api.get("/vehicle/search", { params, withCredentials: true });
  return response.data;
};

export const deleteVehicle = async (id) => {
  const response = await api.delete(`/vehicle/${id}`, { withCredentials: true });
  return response.data;
};
