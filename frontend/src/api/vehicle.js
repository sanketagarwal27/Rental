import axiosInstance from "./axios";

/**
 * Fetch vehicles near the given coordinates.
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radius - Radius in km (default 30)
 * @param {number} page - Page number (default 1)
 */
export const fetchNearbyVehicles = (lat, lng, radius = 30, page = 1) => {
  return axiosInstance.get("/vehicle/nearby", {
    params: { lat, lng, radius, page, limit: 12 },
  });
};
