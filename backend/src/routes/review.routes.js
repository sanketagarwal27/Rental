import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  createReview,
  getVehicleReviews,
  getUserReviews,
  getMyReviews,
} from "../controllers/review.controller.js";

const router = Router();

// All routes require authentication
router.use(verifyJwt);

// Get reviews written by current user
router.get("/my", getMyReviews);

// Get reviews for a specific vehicle
router.get("/vehicle/:vehicleId", getVehicleReviews);

// Get reviews for a specific user (HostToRenter type)
router.get("/user/:userId", getUserReviews);

// Create a review for a completed booking
router.post("/:bookingId", createReview);

export default router;
