import { Review } from "../models/review.model.js";
import { Booking } from "../models/booking.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

// Create a review (two-way: renter→vehicle OR host→renter)
export const createReview = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { rating, comment, reviewType } = req.body;
  const reviewerId = req.user._id;

  if (!rating || !reviewType) {
    throw new ApiError(400, "Rating and review type are required.");
  }

  if (!["RenterToVehicle", "HostToRenter"].includes(reviewType)) {
    throw new ApiError(400, "Invalid review type.");
  }

  const booking = await Booking.findById(bookingId).populate("vehicle");
  if (!booking) {
    throw new ApiError(404, "Booking not found.");
  }

  if (booking.status !== "Completed") {
    throw new ApiError(400, "You can only review after a completed trip.");
  }

  // Validate reviewer permissions
  if (reviewType === "RenterToVehicle") {
    if (booking.customer.toString() !== reviewerId.toString()) {
      throw new ApiError(403, "Only the renter can write a vehicle review for this booking.");
    }
  } else if (reviewType === "HostToRenter") {
    if (booking.provider.toString() !== reviewerId.toString()) {
      throw new ApiError(403, "Only the host can write a renter review for this booking.");
    }
  }

  // Check if review already exists for this booking + reviewer + type
  const existingReview = await Review.findOne({
    booking: bookingId,
    reviewer: reviewerId,
    reviewType,
  });

  if (existingReview) {
    throw new ApiError(409, "You have already reviewed this booking.");
  }

  const reviewData = {
    booking: bookingId,
    reviewer: reviewerId,
    reviewType,
    rating,
    comment: comment || "",
  };

  if (reviewType === "RenterToVehicle") {
    reviewData.vehicle = booking.vehicle._id || booking.vehicle;
    reviewData.reviewee = booking.provider;
  } else {
    reviewData.reviewee = booking.customer;
  }

  const review = await Review.create(reviewData);

  return res
    .status(201)
    .json(new ApiResponse(201, review, "Review submitted successfully!"));
});

// Get paginated reviews for a vehicle
export const getVehicleReviews = asyncHandler(async (req, res) => {
  const { vehicleId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const reviews = await Review.find({
    vehicle: vehicleId,
    reviewType: "RenterToVehicle",
  })
    .populate("reviewer", "name avatar")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Review.countDocuments({
    vehicle: vehicleId,
    reviewType: "RenterToVehicle",
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        reviews,
        pagination: { total, page, pages: Math.ceil(total / limit) },
      },
      "Vehicle reviews fetched successfully.",
    ),
  );
});

// Get paginated reviews received by a user (HostToRenter)
export const getUserReviews = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const reviews = await Review.find({
    reviewee: userId,
    reviewType: "HostToRenter",
  })
    .populate("reviewer", "name avatar")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Review.countDocuments({
    reviewee: userId,
    reviewType: "HostToRenter",
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        reviews,
        pagination: { total, page, pages: Math.ceil(total / limit) },
      },
      "User reviews fetched successfully.",
    ),
  );
});

// Get reviews written by current user
export const getMyReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const reviews = await Review.find({ reviewer: req.user._id })
    .populate("vehicle", "brand model year images")
    .populate("reviewee", "name avatar")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Review.countDocuments({ reviewer: req.user._id });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        reviews,
        pagination: { total, page, pages: Math.ceil(total / limit) },
      },
      "Your reviews fetched successfully.",
    ),
  );
});
