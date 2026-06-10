import { Router } from "express";
import { verifyJwt, verifyAdmin } from "../middlewares/auth.middleware.js";
import { getDashboardStats, getAllUsers } from "../controllers/admin.controller.js";

const router = Router();

// Apply auth middlewares to all admin routes
router.use(verifyJwt, verifyAdmin);

router.route("/stats").get(getDashboardStats);
router.route("/users").get(getAllUsers);

export default router;
