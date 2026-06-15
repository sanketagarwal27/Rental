import { Router } from "express";
import { verifyJwt, verifyAdmin } from "../middlewares/auth.middleware.js";
import { 
  getDashboardStats, 
  requestAdminOtp,
  getUsersPaginated,
  toggleUserBlock,
  changeUserRole,
  getVehiclesPaginated,
  verifyVehicle,
  rejectVehicle,
  toggleVehicleBlock,
  getBookingsPaginated,
  adminCancelBooking
} from "../controllers/admin.controller.js";

const router = Router();

// Apply auth middlewares to all admin routes
router.use(verifyJwt, verifyAdmin);

router.route("/stats").get(getDashboardStats);

// User Management
router.route("/request-otp").post(requestAdminOtp);

router.route("/users").get(getUsersPaginated);
router.route("/users/:id/block").patch(toggleUserBlock);
router.route("/users/:id/role").patch(changeUserRole);

// Vehicle Management
router.route("/vehicles").get(getVehiclesPaginated);
router.route("/vehicles/:id/verify").patch(verifyVehicle);
router.route("/vehicles/:id/reject").patch(rejectVehicle);
router.route("/vehicles/:id/block").patch(toggleVehicleBlock);

// Booking Management
router.route("/bookings").get(getBookingsPaginated);
router.route("/bookings/:id/cancel").patch(adminCancelBooking);

export default router;
