import { User } from "../models/user.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { Booking } from "../models/booking.model.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getDashboardStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalVehicles = await Vehicle.countDocuments();
  const totalBookings = await Booking.countDocuments();

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalVehicles,
      totalBookings
    }
  });
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    data: users
  });
});
