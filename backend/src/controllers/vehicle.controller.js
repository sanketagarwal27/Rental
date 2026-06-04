import { Vehicle } from "../models/vehicle.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

/**
 * GET /api/vehicle/nearby?lat=&lng=&radius=&page=&limit=
 * Returns vehicles within `radius` km of the given coordinates.
 * Uses $geoWithin + $centerSphere (no sort restriction, unlike $nearSphere).
 * Requires authentication.
 */
export const getNearbyVehicles = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 30, page = 1, limit = 12 } = req.query;

  if (!lat || !lng) {
    throw new ApiError(400, "Latitude and longitude are required.");
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    throw new ApiError(400, "Invalid latitude or longitude.");
  }

  const radiusInRadians = parseFloat(radius) / 6378.1; // km ÷ Earth's radius
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // $geoWithin + $centerSphere works without requiring a sort index
  const geoQuery = {
    isDeleted: false,
    isAvailable: true,
    status: "Approved",
    location: {
      $geoWithin: {
        $centerSphere: [[longitude, latitude], radiusInRadians],
      },
    },
  };

  try {
    const [vehicles, total] = await Promise.all([
      Vehicle.find(geoQuery)
        .select(
          "brand model year type category fuelType transmission seats pricePerDay images address location averageRating totalReviews isAvailable"
        )
        .populate("provider", "name avatar")
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Vehicle.countDocuments(geoQuery),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          vehicles,
          total,
          page: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          radius: parseFloat(radius),
        },
        "Nearby vehicles fetched successfully."
      )
    );
  } catch (err) {
    // Never leak raw DB errors to the client
    throw new ApiError(500, "Could not fetch nearby vehicles. Please try again.");
  }
});
