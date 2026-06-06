import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getNearbyVehicles, uploadVehicle, updateAvailability, searchVehicles, getVehicleById } from "../controllers/vehicle.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// All vehicle routes require authentication
router.route("/nearby").get(verifyJwt, getNearbyVehicles);
router.route("/search").get(verifyJwt, searchVehicles);
router.route("/upload").post(verifyJwt, upload.array("images", 5), uploadVehicle);
router.route("/:id/availability").put(verifyJwt, updateAvailability);
router.route("/:id").get(verifyJwt, getVehicleById);

export default router;
