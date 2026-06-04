import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getNearbyVehicles } from "../controllers/vehicle.controller.js";

const router = Router();

// All vehicle routes require authentication
router.route("/nearby").get(verifyJwt, getNearbyVehicles);

export default router;
