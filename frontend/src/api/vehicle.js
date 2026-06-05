import api from "./axios";
import axiosInstance from "./axios";

export const fetchNearbyVehicles = (lat, lng, radius = 30, page = 1) => {
  return axiosInstance.get("/vehicle/nearby", {
    params: { lat, lng, radius, page, limit: 12 },
  });
};

export const uploadVehicle = async (payload) => {
  const response = await api.post("/vehicle/upload", payload, {
    withCredentials: true,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const updateVehicleAvailability = async (id, unavailableDates) => {
  const response = await api.put(
    `/vehicle/${id}/availability`,
    { unavailableDates },
    { withCredentials: true }
  );
  return response.data;
};
