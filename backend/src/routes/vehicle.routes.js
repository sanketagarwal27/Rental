import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getNearbyVehicles, uploadVehicle, updateAvailability } from "../controllers/vehicle.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// All vehicle routes require authentication
router.route("/nearby").get(verifyJwt, getNearbyVehicles);
router.route("/upload").post(verifyJwt, upload.array("images", 5), uploadVehicle);
router.route("/:id/availability").put(verifyJwt, updateAvailability);

export default router;
