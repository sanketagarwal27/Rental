import { Router } from "express";
import {
  sendMessage,
  getMessages,
  getConversations,
} from "../controllers/message.controller.js";
import { verifyJwt, verifyAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(verifyJwt);

// Send a message
router.post("/send", sendMessage);

// Admin route: get all conversations (MUST be before /:otherUserId to avoid param matching)
router.get("/admin/conversations", verifyAdmin, getConversations);

// Get messages between current user and another user
router.get("/:otherUserId", getMessages);

export default router;
