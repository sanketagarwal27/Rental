import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  lockVehicle,
  confirmBooking,
  cancelBooking,
  getMyBookings,
  requestCancellation,
  rejectCancellation
} from "../controllers/booking.controller.js";

const router = Router();

// All booking routes require authentication
router.use(verifyJwt);

router.post("/lock", lockVehicle);
router.post("/confirm/:bookingId", confirmBooking);
router.post("/cancel/:bookingId", cancelBooking);
router.post("/request-cancel/:bookingId", requestCancellation);
router.post("/reject-cancel/:bookingId", rejectCancellation);
router.get("/my", getMyBookings);

export default router;
