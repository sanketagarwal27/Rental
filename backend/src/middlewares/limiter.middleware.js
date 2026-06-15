import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});

export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: "Too many registration attempts. Please try again later.",
  },
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message: {
    success: false,
    message: "Too many password reset requests. Try again later.",
  },
});

// Limit email verification sends (e.g. 3 attempts per 15 mins)
export const emailVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: "Too many email verification requests. Please check your inbox or try again in 15 minutes.",
  },
});

// Limit phone verification (OTP sends/verifications) (e.g. 5 attempts per 15 mins)
export const phoneVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many phone verification attempts. Please try again in 15 minutes.",
  },
});

// Limit avatar updates - higher limit as requested (e.g. 20 updates per 15 mins)
export const avatarUpdateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many avatar updates. Please wait a bit before uploading again.",
  },
});

// Limit booking attempts (5 attempts per 20 mins)
export const bookingLimiter = rateLimit({
  windowMs: 20 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many booking attempts. Please try again after 20 minutes.",
  },
});
