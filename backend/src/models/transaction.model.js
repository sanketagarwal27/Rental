import mongoose, { Schema } from "mongoose";

const TransactionSchema = new Schema(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Transaction must be linked to a booking ID."],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Transaction must belong to a user account."],
    },
    type: {
      type: String,
      required: true,
      enum: [
        "Advance_Charge",   // 25% token charge at booking confirmation
        "Security_Hold",    // Security deposit hold (not charged, just held)
        "Hold_Release",     // Security deposit hold released on cancellation
        "Refund",           // Refund of advance on cancellation
        "Platform_Fee",     // 5% commission charged to the platform owner's account
        "Charge",           // Full/remaining charge (legacy / future use)
        "Overage_Fee",      // Extra mileage / late return fee
        "Payout",           // Host earning payout (95% of total after commission)
      ],
    },
    amount: {
      type: Number,
      required: [true, "Transaction amount is required."],
      min: [0, "Amount cannot be negative."],
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["Pending", "Succeeded", "Failed", "Requires_Action"],
      default: "Pending",
    },
    gateway: {
      type: String,
      default: "Simulated",
    },
    gatewayPaymentIntentId: {
      type: String,
      trim: true,
    },
    paymentMethod: {
      type: String,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
    },
    failureReason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

TransactionSchema.index({ user: 1, createdAt: -1 });
TransactionSchema.index({ booking: 1 });
export const Transaction = mongoose.model("Transaction", TransactionSchema);
