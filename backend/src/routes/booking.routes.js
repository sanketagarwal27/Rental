import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  lockVehicle,
  confirmBooking,
  cancelBooking,
  getMyBookings,
} from "../controllers/booking.controller.js";

const router = Router();

// All booking routes require authentication
router.use(verifyJwt);

router.post("/lock", lockVehicle);
router.post("/confirm/:bookingId", confirmBooking);
router.post("/cancel/:bookingId", cancelBooking);
router.get("/my", getMyBookings);

export default router;
