import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";

//Routes Import
import userRouter from "./routes/user.routes.js";
import vehicleRouter from "./routes/vehicle.routes.js";
import bookingRouter from "./routes/booking.routes.js";
import adminRouter from "./routes/admin.routes.js";
import messageRouter from "./routes/message.routes.js";
import reviewRouter from "./routes/review.routes.js";

const app = express();

// Security headers
app.use(helmet());

// Request logging
app.use(morgan("dev"));

const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, "") : "";
app.use(cors({ origin: [frontendUrl, frontendUrl + "/"], credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

//Routes Declaration
app.use("/api/user", userRouter);
app.use("/api/vehicle", vehicleRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/admin", adminRouter);
app.use("/api/message", messageRouter);
app.use("/api/review", reviewRouter);

// Global error handler — must be after all routes
app.use((err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Handle MongoDB Duplicate Key (E11000) errors
  if (err.code === 11000) {
    statusCode = 400;
    const keyPattern = err.keyPattern || {};
    const keys = Object.keys(keyPattern);
    if (keys.includes("licensePlate") && keys.includes("issuingState")) {
      message = "A vehicle with this license plate and issuing state already exists.";
    } else if (keys.includes("vinOrChassis")) {
      message = "A vehicle with this VIN/Chassis number already exists.";
    } else if (keys.includes("email")) {
      message = "An account with this email address already exists.";
    } else {
      message = `Duplicate value entered for field(s): ${keys.join(", ")}. Please use another value.`;
    }
  }

  // Handle Multer file size/type errors
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    message = "File size exceeds the 5MB limit.";
  }

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: err.errors || [],
  });
});

export { app };
