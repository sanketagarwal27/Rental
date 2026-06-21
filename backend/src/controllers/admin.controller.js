import { User } from "../models/user.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { Booking } from "../models/booking.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import sendEmail from "../utils/sendEmail.js";

const verifyOtp = async (user, otp) => {
  if (!otp) throw new ApiError(400, "OTP is required for this action");
  if (!user.adminActionOtp || user.adminActionOtp !== otp || user.adminActionOtpExpires < Date.now()) {
    throw new ApiError(401, "Invalid or expired OTP");
  }
  // Clear OTP
  user.adminActionOtp = undefined;
  user.adminActionOtpExpires = undefined;
  await user.save({ validateBeforeSave: false });
};

export const getDashboardStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalVehicles = await Vehicle.countDocuments();
  const allBookings = await Booking.find()
    .populate("customer", "name")
    .populate("provider", "name")
    .sort({ updatedAt: -1 });

  let totalBookingsCount = allBookings.length;
  let completedBookingsCount = 0;
  let cancelledByAdmin = 0;
  let cancelledByHost = 0;
  let cancelledByCustomer = 0;
  const recentCancellations = [];

  // Filter out bookings that were cancelled before payment was ever made
  const validBookings = allBookings.filter(
    (b) => !(b.status === "Cancelled" && b.amountPaid === 0)
  );

  totalBookingsCount = validBookings.length;

  validBookings.forEach((b) => {
    if (b.status === "Completed") {
      completedBookingsCount++;
    } else if (b.status === "Cancelled") {
      const reason = b.cancellationReason || "";
      let cancelledByRole = "Customer"; // Default
      let cancelledByName = b.customer?.name || "Unknown";

      if (reason.toLowerCase().includes("cancelled by admin")) {
        cancelledByRole = "Admin";
        cancelledByName = "Admin";
        cancelledByAdmin++;
      } else if (
        reason.toLowerCase().includes("host requested cancellation") ||
        reason.toLowerCase().includes("cancelled by host")
      ) {
        cancelledByRole = "Host";
        cancelledByName = b.provider?.name || "Unknown Host";
        cancelledByHost++;
      } else if (reason.toLowerCase().includes("cancelled by customer")) {
        cancelledByRole = "Customer";
        cancelledByName = b.customer?.name || "Unknown Customer";
        cancelledByCustomer++;
      } else {
        // Fallback for older cancellations without specific string
        cancelledByRole = "Unknown/Customer";
        cancelledByCustomer++;
      }

      // We push up to 10 recent cancellations
      if (recentCancellations.length < 10) {
        recentCancellations.push({
          bookingId: b._id,
          cancelledBy: cancelledByRole,
          cancelledByName,
          reason,
          date: b.updatedAt,
        });
      }
    }
  });

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalVehicles,
      totalBookings: totalBookingsCount,
      bookingStats: {
        completed: completedBookingsCount,
        cancelledTotal: cancelledByAdmin + cancelledByHost + cancelledByCustomer,
        cancelledByAdmin,
        cancelledByHost,
        cancelledByCustomer,
      },
      recentCancellations,
    },
  });
});

export const requestAdminOtp = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.adminActionOtp = otp;
  user.adminActionOtpExpires = Date.now() + 5 * 60 * 1000; // 5 mins
  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user.email,
    subject: "Admin Action OTP",
    message: `Your OTP for the requested administrative action is: ${otp}. It will expire in 5 minutes.`
  });

  res.status(200).json({ success: true, message: "OTP sent to your email" });
});

export const getUsersPaginated = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const users = await User.find(query)
    .select("-password")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    data: users,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  });
});

export const toggleUserBlock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { otp } = req.body;
  
  const admin = await User.findById(req.user._id);
  await verifyOtp(admin, otp);

  const user = await User.findById(id);
  if (!user) throw new ApiError(404, "User not found");

  user.isBlocked = !user.isBlocked;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully`, data: user });
});

export const changeUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { otp } = req.body;

  const admin = await User.findById(req.user._id);
  await verifyOtp(admin, otp);

  const user = await User.findById(id);
  if (!user) throw new ApiError(404, "User not found");

  user.role = user.role === "Admin" ? "User" : "Admin";
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: `User role changed to ${user.role}`, data: user });
});

export const getVehiclesPaginated = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";

  const query = { isDeleted: false };
  if (search) {
    query.$or = [
      { brand: { $regex: search, $options: "i" } },
      { model: { $regex: search, $options: "i" } },
      { licensePlate: { $regex: search, $options: "i" } }
    ];
  }

  const vehicles = await Vehicle.find(query)
    .populate("provider", "name email")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Vehicle.countDocuments(query);

  res.status(200).json({
    success: true,
    data: vehicles,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  });
});

export const verifyVehicle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) throw new ApiError(404, "Vehicle not found");

  vehicle.status = "Approved";
  await vehicle.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: "Vehicle approved successfully", data: vehicle });
});

export const rejectVehicle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) throw new ApiError(404, "Vehicle not found");

  if (vehicle.status === "Rejected") {
    throw new ApiError(400, "Vehicle is already rejected");
  }

  vehicle.status = "Rejected";
  vehicle.rejectionReason = reason || "Vehicle does not meet platform requirements.";
  await vehicle.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: "Vehicle rejected", data: vehicle });
});

export const toggleVehicleBlock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { otp } = req.body;

  const admin = await User.findById(req.user._id);
  await verifyOtp(admin, otp);

  const vehicle = await Vehicle.findById(id);
  if (!vehicle) throw new ApiError(404, "Vehicle not found");

  vehicle.isBlocked = !vehicle.isBlocked;
  await vehicle.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: `Vehicle ${vehicle.isBlocked ? "blocked" : "unblocked"} successfully`, data: vehicle });
});

export const getBookingsPaginated = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";

  // For bookings, search is trickier. Let's find User IDs and Vehicle IDs matching search first.
  let query = {};
  
  if (search) {
    const users = await User.find({ $or: [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }] }).select("_id");
    const vehicles = await Vehicle.find({ $or: [{ brand: { $regex: search, $options: "i" } }, { model: { $regex: search, $options: "i" } }, { licensePlate: { $regex: search, $options: "i" } }] }).select("_id");
    
    const userIds = users.map(u => u._id);
    const vehicleIds = vehicles.map(v => v._id);

    query.$or = [
      { customer: { $in: userIds } },
      { provider: { $in: userIds } },
      { vehicle: { $in: vehicleIds } },
    ];

    // If search looks like a status, also search status
    const validStatuses = ["Locked", "Pending", "Confirmed", "Ongoing", "Return_Requested", "Completed", "Cancelled"];
    if (validStatuses.some(status => status.toLowerCase().includes(search.toLowerCase()))) {
      query.$or.push({ status: { $regex: search, $options: "i" } });
    }
  }

  // Do not include bookings that were cancelled before payment (amountPaid = 0)
  query.$nor = [{ status: "Cancelled", amountPaid: 0 }];

  const bookings = await Booking.find(query)
    .populate("customer", "name email avatar phone")
    .populate("provider", "name email avatar phone")
    .populate("vehicle", "brand model year type images licensePlate")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Booking.countDocuments(query);

  res.status(200).json({
    success: true,
    data: bookings,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  });
});

export const adminCancelBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { refundAmount, hostPayout, reason, otp } = req.body;

  const admin = await User.findById(req.user._id).select("+adminActionOtp +adminActionOtpExpires");
  await verifyOtp(admin, otp);

  const booking = await Booking.findById(id);
  if (!booking) throw new ApiError(404, "Booking not found");

  if (["Completed", "Cancelled"].includes(booking.status)) {
    throw new ApiError(400, "Booking is already completed or cancelled");
  }

  // Release blocked dates from the vehicle
  const vehicle = await Vehicle.findById(booking.vehicle);
  if (vehicle) {
    const { getDatesBetween } = await import("../utils/bookingUtils.js");
    const bookedDates = getDatesBetween(booking.startDate, booking.endDate);
    vehicle.unavailableDates = vehicle.unavailableDates.filter(
      (d) => !bookedDates.some((bd) => bd.getTime() === new Date(d).getTime())
    );
    await vehicle.save({ validateBeforeSave: false });
  }

  booking.status = "Cancelled";
  booking.refundAmount = refundAmount || 0;
  booking.hostPayout = hostPayout || 0;
  booking.cancellationReason = reason ? `Cancelled by Admin: ${reason}` : "Cancelled by Admin";
  
  if (booking.refundAmount > 0) {
    booking.paymentStatus = booking.refundAmount === booking.amountPaid ? "Refunded" : "PartialRefund";
  } else {
    booking.paymentStatus = "NoRefund";
  }

  await booking.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: "Booking forcefully cancelled", data: booking });
});

export const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate("customer", "name email avatar phone")
    .populate("provider", "name email avatar phone")
    .populate("vehicle", "brand model year type images licensePlate");

  if (!booking) throw new ApiError(404, "Booking not found");

  res.status(200).json({ success: true, data: booking });
});
