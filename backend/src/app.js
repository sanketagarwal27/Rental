import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

//Routes Import
import userRouter from "./routes/user.routes.js";
import vehicleRouter from "./routes/vehicle.routes.js";

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

//Routes Declaration
app.use("/api/user", userRouter);
app.use("/api/vehicle", vehicleRouter);

// Global error handler — must be after all routes
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: err.errors || [],
  });
});

export { app };
