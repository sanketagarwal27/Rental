import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { bookingLimiter } from "../middlewares/limiter.middleware.js";
import {
  lockVehicle,
  createPaymentOrder,
  confirmBooking,
  cancelBooking,
  getMyBookings,
  requestCancellation,
  rejectCancellation,
  markPickedUp,
  markReturned,
  createPickupOrder,
  acceptReturn,
  createReturnPaymentOrder,
  payAndAcceptReturn,
} from "../controllers/booking.controller.js";

const router = Router();

// All booking routes require authentication
router.use(verifyJwt);

router.post("/lock", bookingLimiter, lockVehicle);
router.post("/payment-order/:bookingId", createPaymentOrder);
router.post("/confirm/:bookingId", confirmBooking);
router.post("/cancel/:bookingId", cancelBooking);
router.post("/request-cancel/:bookingId", requestCancellation);
router.post("/reject-cancel/:bookingId", rejectCancellation);
router.post("/pickup-order/:bookingId", createPickupOrder);
router.post("/pickup/:bookingId", markPickedUp);
router.post("/return/:bookingId", markReturned);
router.post("/accept-return/:bookingId", acceptReturn);
router.post("/return-payment-order/:bookingId", createReturnPaymentOrder);
router.post("/pay-return/:bookingId", payAndAcceptReturn);
router.get("/my", getMyBookings);

export default router;
