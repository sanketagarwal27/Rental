import mongoose, { Schema } from "mongoose";

const MessageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User", // This will be the Admin if sender is User, and User if sender is Admin
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: [2000, "Message cannot exceed 2000 characters."],
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

export const Message = mongoose.model("Message", MessageSchema);
