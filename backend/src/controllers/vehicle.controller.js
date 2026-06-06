import { Vehicle } from "../models/vehicle.model.js";
import { Booking } from "../models/booking.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { cleanExpiredLocks, getDatesBetween } from "../utils/bookingUtils.js";

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
    provider: { $ne: req.user._id },
  };

  try {
    const [vehicles, total] = await Promise.all([
      Vehicle.find(geoQuery)
        .select(
          "brand model year type category fuelType transmission seats pricePerDay images address location averageRating totalReviews isAvailable",
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
        "Nearby vehicles fetched successfully.",
      ),
    );
  } catch (err) {
    // Never leak raw DB errors to the client
    throw new ApiError(
      500,
      "Could not fetch nearby vehicles. Please try again.",
    );
  }
});

export const uploadVehicle = asyncHandler(async (req, res) => {
  const {
    vehicleId, // optional vehicle ID to update an existing draft
    category,
    brand,
    model,
    year,
    type,
    transmission,
    fuelType,
    seats,
    vinOrChassis,
    licensePlate,
    issuingState,
    pricePerDay,
    features,
    odometer,
    longitude,
    latitude,
    address,
  } = req.body;

  if (!req.user.isVerifiedEmail || !req.user.isVerifiedPhone) {
    throw new ApiError(410, "Please verify your phone number and email");
  }

  if (
    [
      category,
      brand,
      model,
      year,
      type,
      transmission,
      fuelType,
      seats,
      pricePerDay,
      address,
    ].some((field) => field === undefined || String(field).trim() === "")
  ) {
    throw new ApiError(400, "All primary fields are required!");
  }

  // Handle image files from request
  const imageLocalPaths = req.files || [];
  const imageUrls = [];

  if (imageLocalPaths.length > 0) {
    for (const file of imageLocalPaths) {
      const response = await uploadOnCloudinary(file.path);
      if (response?.url) {
        imageUrls.push(response.url);
      }
    }
  }

  // Fallback to body images if no files were uploaded
  if (imageUrls.length === 0 && req.body.images) {
    if (Array.isArray(req.body.images)) {
      imageUrls.push(...req.body.images);
    } else if (typeof req.body.images === "string") {
      imageUrls.push(req.body.images);
    }
  }

  // Validate coordinates
  const lng = parseFloat(longitude);
  const lat = parseFloat(latitude);
  if (isNaN(lng) || isNaN(lat)) {
    throw new ApiError(400, "Valid location coordinates are required.");
  }

  // Check unique fields (excluding the current vehicle itself if updating)
  if (licensePlate && issuingState) {
    const query = {
      licensePlate: licensePlate.toUpperCase(),
      issuingState: issuingState.toUpperCase(),
      isDeleted: false,
      status: { $ne: "Rejected" },
    };
    if (vehicleId) query._id = { $ne: vehicleId };

    const existing = await Vehicle.findOne(query);
    if (existing) {
      throw new ApiError(
        409,
        "A vehicle with this license plate is already registered. Please fill in the details correctly",
      );
    }
  }

  if (vinOrChassis) {
    const query = {
      vinOrChassis: vinOrChassis.toUpperCase(),
      isDeleted: false,
    };
    if (vehicleId) query._id = { $ne: vehicleId };

    const existingVin = await Vehicle.findOne(query);
    if (existingVin) {
      throw new ApiError(
        409,
        "A vehicle with this VIN or Chassis number is already registered.",
      );
    }
  }

  // Parse list of features if passed as a JSON string or comma-separated string
  let featuresList = [];
  if (features) {
    if (Array.isArray(features)) {
      featuresList = features;
    } else {
      try {
        featuresList = JSON.parse(features);
      } catch (e) {
        featuresList = String(features)
          .split(",")
          .map((f) => f.trim());
      }
    }
  }

  // Check if we should update or create
  let vehicle;
  const statusVal =
    vinOrChassis && licensePlate && issuingState ? "Pending" : "Draft";

  if (vehicleId) {
    vehicle = await Vehicle.findOne({ _id: vehicleId, provider: req.user._id });
    if (!vehicle) {
      throw new ApiError(404, "Draft vehicle listing not found.");
    }

    // Update fields
    vehicle.category = category;
    vehicle.brand = brand;
    vehicle.model = model;
    vehicle.year = parseInt(year);
    vehicle.type = type;
    vehicle.transmission = transmission;
    vehicle.fuelType = fuelType;
    vehicle.seats = parseInt(seats);
    vehicle.vinOrChassis = vinOrChassis?.toUpperCase() || vehicle.vinOrChassis;
    vehicle.licensePlate = licensePlate?.toUpperCase() || vehicle.licensePlate;
    vehicle.issuingState = issuingState?.toUpperCase() || vehicle.issuingState;
    vehicle.pricePerDay = parseFloat(pricePerDay);
    if (imageUrls.length > 0) {
      vehicle.images = imageUrls;
    }
    vehicle.features = featuresList;
    vehicle.odometer = odometer ? parseInt(odometer) : vehicle.odometer;
    vehicle.location = {
      type: "Point",
      coordinates: [lng, lat],
    };
    vehicle.address = address;
    vehicle.status = statusVal;

    await vehicle.save();
  } else {
    if (imageUrls.length === 0) {
      throw new ApiError(400, "At least one image of the vehicle is required!");
    }
    vehicle = await Vehicle.create({
      provider: req.user?._id,
      category,
      brand,
      model,
      year: parseInt(year),
      type,
      transmission,
      fuelType,
      seats: parseInt(seats),
      vinOrChassis: vinOrChassis?.toUpperCase() || undefined,
      licensePlate: licensePlate?.toUpperCase() || undefined,
      issuingState: issuingState?.toUpperCase() || undefined,
      pricePerDay: parseFloat(pricePerDay),
      images: imageUrls,
      features: featuresList,
      odometer: odometer ? parseInt(odometer) : undefined,
      location: {
        type: "Point",
        coordinates: [lng, lat],
      },
      address,
      status: statusVal,
    });
  }

  if (!vehicle) {
    throw new ApiError(500, "Failed to save vehicle details.");
  }

  return res
    .status(vehicleId ? 200 : 201)
    .json(
      new ApiResponse(
        vehicleId ? 200 : 201,
        vehicle,
        `Vehicle details saved successfully as ${vehicle.status}!`,
      ),
    );
});

export const updateAvailability = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { unavailableDates, isAvailable } = req.body;

  const updateFields = {};
  if (Array.isArray(unavailableDates)) {
    // Guard: ensure no confirmed booking dates are removed
    const confirmedBookings = await Booking.find({
      vehicle: id,
      status: "Confirmed",
    });

    const activeBookedTimestamps = new Set();
    confirmedBookings.forEach((booking) => {
      const dates = getDatesBetween(booking.startDate, booking.endDate);
      dates.forEach((d) => {
        const dNorm = new Date(d);
        dNorm.setUTCHours(0, 0, 0, 0);
        activeBookedTimestamps.add(dNorm.getTime());
      });
    });

    if (activeBookedTimestamps.size > 0) {
      const newUnavailableTimestamps = new Set(
        unavailableDates.map((d) => {
          const dNorm = new Date(d);
          dNorm.setUTCHours(0, 0, 0, 0);
          return dNorm.getTime();
        })
      );

      for (const timestamp of activeBookedTimestamps) {
        if (!newUnavailableTimestamps.has(timestamp)) {
          throw new ApiError(
            403,
            "Cannot remove dates that are already booked by an active confirmed reservation."
          );
        }
      }
    }
    updateFields.unavailableDates = unavailableDates;
  }
  if (isAvailable !== undefined) {
    updateFields.isAvailable = isAvailable;
  }

  if (Object.keys(updateFields).length === 0) {
    throw new ApiError(400, "Please provide fields to update (unavailableDates or isAvailable).");
  }

  const vehicle = await Vehicle.findOneAndUpdate(
    { _id: id, provider: req.user._id },
    { $set: updateFields },
    { new: true },
  );

  if (!vehicle) {
    throw new ApiError(
      404,
      "Vehicle not found or you are not authorized to update its availability.",
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        vehicle,
        "Vehicle availability updated successfully.",
      ),
    );
});

export const searchVehicles = asyncHandler(async (req, res) => {
  // Clean up stale locks before querying so they don't interfere with availability
  await cleanExpiredLocks();

  const { lat, lng, radius = 30, startDate, endDate, page = 1, limit = 12 } = req.query;

  if (!lat || !lng) throw new ApiError(400, "Latitude and longitude are required.");

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  if (isNaN(latitude) || isNaN(longitude)) throw new ApiError(400, "Invalid coordinates.");

  const primaryRadius = parseFloat(radius);
  const altRadius = primaryRadius * 2;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Build date conflict check — exclude vehicles with any unavailableDate in the requested range
  let dateFilter = {};
  let start, end;
  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
    if (isNaN(start) || isNaN(end) || start > end) {
      throw new ApiError(400, "Invalid date range. startDate must be before endDate.");
    }
    dateFilter = {
      unavailableDates: {
        $not: {
          $elemMatch: { $gte: start, $lte: end },
        },
      },
    };
  }

  const baseQuery = {
    isDeleted: false,
    isAvailable: true,
    status: "Approved",
    provider: { $ne: req.user._id },
  };

  const primaryRadians = primaryRadius / 6378.1;
  const altRadians = altRadius / 6378.1;

  const geoFilterPrimary = {
    location: { $geoWithin: { $centerSphere: [[longitude, latitude], primaryRadians] } },
  };
  const geoFilterAlt = {
    location: { $geoWithin: { $centerSphere: [[longitude, latitude], altRadians] } },
  };

  const selectFields =
    "brand model year type category fuelType transmission seats pricePerDay images address location averageRating totalReviews isAvailable unavailableDates";

  try {
    // ── Primary: within radius AND fully available for dates ─────────────────
    const primaryQuery = { ...baseQuery, ...geoFilterPrimary, ...dateFilter };

    const [primaryVehicles, primaryTotal] = await Promise.all([
      Vehicle.find(primaryQuery)
        .select(selectFields)
        .populate("provider", "name avatar")
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Vehicle.countDocuments(primaryQuery),
    ]);

    const primaryIds = new Set(primaryVehicles.map((v) => v._id.toString()));

    // ── Alt 1: within 2× radius, fully available (excludes primary results) ──
    const altGeoVehicles = await Vehicle.find({ ...baseQuery, ...geoFilterAlt, ...dateFilter })
      .select(selectFields)
      .populate("provider", "name avatar")
      .limit(6)
      .lean();

    const altExtended = altGeoVehicles
      .filter((v) => !primaryIds.has(v._id.toString()))
      .map((v) => ({ ...v, _altReason: "slightly_further" }));

    // ── Alt 2: within primary radius but with date conflicts ─────────────────
    let altDateConflict = [];
    if (startDate && endDate) {
      const conflictVehicles = await Vehicle.find({
        ...baseQuery,
        ...geoFilterPrimary,
        unavailableDates: { $elemMatch: { $gte: start, $lte: end } },
      })
        .select(selectFields)
        .populate("provider", "name avatar")
        .limit(6)
        .lean();

      altDateConflict = conflictVehicles
        .filter((v) => !primaryIds.has(v._id.toString()))
        .map((v) => ({ ...v, _altReason: "date_conflict" }));
    }

    // Merge + de-duplicate alternatives
    const seenIds = new Set();
    const alternatives = [...altExtended, ...altDateConflict].filter((v) => {
      if (seenIds.has(v._id.toString())) return false;
      seenIds.add(v._id.toString());
      return true;
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          primary: {
            vehicles: primaryVehicles,
            total: primaryTotal,
            page: parseInt(page),
            totalPages: Math.ceil(primaryTotal / parseInt(limit)),
            radius: primaryRadius,
          },
          alternatives,
          searchParams: { lat: latitude, lng: longitude, radius: primaryRadius, startDate, endDate },
        },
        "Search results fetched successfully.",
      ),
    );
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, "Could not fetch search results. Please try again.");
  }
});

// ─── Get Single Vehicle by ID ─────────────────────────────────────────────────
export const getVehicleById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Clean expired locks so unavailableDates is accurate
  await cleanExpiredLocks();

  const vehicle = await Vehicle.findOne({
    _id: id,
    isDeleted: false,
    status: "Approved",
  })
    .select(
      "brand model year type category fuelType transmission seats pricePerDay images address location averageRating totalReviews isAvailable unavailableDates provider features licensePlate"
    )
    .populate("provider", "name avatar")
    .lean();

  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found or is not available.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, vehicle, "Vehicle fetched successfully."));
});

