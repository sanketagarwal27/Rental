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
  updateUserProfile,
  sendEmailVerification,
  verifyEmail,
  sendPhoneOtp,
  verifyPhoneOtp,
  getUserDashboardData,
  forgotPassword,
  resetPassword,
} from "../controllers/user.controller.js";
import { 
  forgotPasswordLimiter, 
  emailVerificationLimiter, 
  phoneVerificationLimiter, 
  avatarUpdateLimiter,
  loginLimiter,
  registerLimiter
} from "../middlewares/limiter.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(registerLimiter, registerUser);

router.route("/login").post(loginLimiter, loginUser);

router.route("/forgot-password").post(forgotPasswordLimiter, forgotPassword);
router.route("/reset-password/:token").post(resetPassword);

// Email verification (public endpoint - accessed from email link)
router.route("/verify-email/:token").get(verifyEmail);

// Secured routes
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/current-user").get(verifyJwt, getCurrentUser);
router.route("/change-password").post(verifyJwt, changeCurrentPassword);
router.route("/update-profile").patch(verifyJwt, updateUserProfile);
router
  .route("/update-avatar")
  .patch(verifyJwt, avatarUpdateLimiter, upload.single("avatar"), updateUserAvatar);
router.route("/send-email-verification").post(verifyJwt, emailVerificationLimiter, sendEmailVerification);
router.route("/send-phone-otp").post(verifyJwt, phoneVerificationLimiter, sendPhoneOtp);
router.route("/verify-phone-otp").post(verifyJwt, phoneVerificationLimiter, verifyPhoneOtp);
router.route("/dashboard").get(verifyJwt, getUserDashboardData);

export default router;
