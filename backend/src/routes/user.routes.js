import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserAvatar,
  getUserDashboardData,
  forgotPassword,
  resetPassword,
} from "../controllers/user.controller.js";
import { forgotPasswordLimiter } from "../middlewares/limiter.middleware.js";

const router = Router();

router.route("/register").post(registerUser);

router.route("/login").post(loginUser);

router.route("/forgot-password").post(forgotPasswordLimiter, forgotPassword);
router.route("/reset-password/:token").post(resetPassword);

// Secured routes
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/current-user").get(verifyJwt, getCurrentUser);
router.route("/change-password").post(verifyJwt, changeCurrentPassword);

export default router;
