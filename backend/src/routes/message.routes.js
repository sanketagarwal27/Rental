import { Router } from "express";
import {
  sendMessage,
  getMessages,
  getConversations,
  getUnreadCount,
  markAsRead,
} from "../controllers/message.controller.js";
import { verifyJwt, verifyAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(verifyJwt);

// Send a message
router.post("/send", sendMessage);

// Admin route: get all conversations (MUST be before /:otherUserId to avoid param matching)
router.get("/admin/conversations", verifyAdmin, getConversations);

// Get total unread count
router.get("/unread-count", getUnreadCount);

// Mark messages from a specific user as read
router.post("/mark-read/:otherUserId", markAsRead);

// Get messages between current user and another user
router.get("/:otherUserId", getMessages);

export default router;
