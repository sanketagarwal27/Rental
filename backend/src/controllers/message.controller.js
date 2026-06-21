import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import { io } from "../index.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { MESSAGE_PAGINATION_LIMIT } from "../constant.js";

// Save a message and emit it via Socket.io
export const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.user._id;

  if (!receiverId || !content) {
    throw new ApiError(400, "Receiver ID and content are required");
  }

  if (content.length > 2000) {
    throw new ApiError(400, "Message content cannot exceed 2000 characters");
  }

  // Verify receiver exists
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    throw new ApiError(404, "Receiver not found");
  }

  const newMessage = await Message.create({
    sender: senderId,
    receiver: receiverId,
    content,
  });

  // Emit to receiver's personal room
  io.to(receiverId.toString()).emit("receiveMessage", newMessage);

  // Also emit to the sender's room to update their own UI across multiple tabs
  io.to(senderId.toString()).emit("receiveMessage", newMessage);

  // If receiver is an admin, broadcast to all admins
  if (receiver.role === "Admin") {
    io.to("admin_room").emit("receiveMessage", newMessage);
  }

  return res.status(201).json({ success: true, message: "Message sent", data: newMessage });
});

// Fetch chat history between current user and another user (with pagination)
export const getMessages = asyncHandler(async (req, res) => {
  let { otherUserId } = req.params;
  const currentUserId = req.user._id;
  const { before, limit } = req.query;
  const messageLimit = Math.min(parseInt(limit) || MESSAGE_PAGINATION_LIMIT, 100);

  if (otherUserId === "support") {
    // Find the first admin user
    const admin = await User.findOne({ role: "Admin" });
    if (!admin) {
      throw new ApiError(404, "No support admin found");
    }
    otherUserId = admin._id.toString();
  }

  const query = {
    $or: [
      { sender: currentUserId, receiver: otherUserId },
      { sender: otherUserId, receiver: currentUserId },
    ],
  };

  // Cursor-based pagination: fetch messages before a given timestamp
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(messageLimit + 1); // Fetch one extra to check if there are more

  const hasMore = messages.length > messageLimit;
  if (hasMore) messages.pop();

  // Reverse to return in chronological order
  messages.reverse();

  return res.status(200).json({
    success: true,
    data: messages,
    receiverId: otherUserId,
    hasMore,
    nextCursor: hasMore ? messages[0]?.createdAt : null,
  });
});

// Admin only: Get a list of all users who have messaged the platform
export const getConversations = asyncHandler(async (req, res) => {
  const adminId = req.user._id;

  const messages = await Message.find({
    $or: [{ sender: adminId }, { receiver: adminId }],
  })
    .populate("sender", "name email avatar")
    .populate("receiver", "name email avatar")
    .sort({ createdAt: -1 });

  const unreadCounts = await Message.aggregate([
    { $match: { receiver: adminId, read: false } },
    { $group: { _id: "$sender", count: { $sum: 1 } } }
  ]);
  const unreadMap = {};
  unreadCounts.forEach((u) => { unreadMap[u._id.toString()] = u.count; });

  const conversations = [];
  const seenUsers = new Set();

  for (const msg of messages) {
    const otherUser =
      msg.sender._id.toString() === adminId.toString()
        ? msg.receiver
        : msg.sender;
    if (!otherUser) continue;

    const otherUserId = otherUser._id.toString();
    if (!seenUsers.has(otherUserId)) {
      seenUsers.add(otherUserId);
      conversations.push({
        user: otherUser,
        lastMessage: msg,
        unreadCount: unreadMap[otherUserId] || 0,
      });
    }
  }

  return res.status(200).json({ success: true, data: conversations });
});

// Get total unread messages count for the current user
export const getUnreadCount = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const count = await Message.countDocuments({ receiver: currentUserId, read: false });
  return res.status(200).json({ success: true, data: count });
});

// Mark messages from a specific user as read
export const markAsRead = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  let { otherUserId } = req.params;

  if (otherUserId === "support") {
    const admin = await User.findOne({ role: "Admin" });
    if (admin) otherUserId = admin._id.toString();
  }

  await Message.updateMany(
    { sender: otherUserId, receiver: currentUserId, read: false },
    { $set: { read: true } }
  );

  return res.status(200).json({ success: true, message: "Messages marked as read" });
});
