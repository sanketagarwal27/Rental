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
        "Charge", // Charging the renter for the base booking cost
        "Security_Hold", // Authorizing/holding a security deposit upfront
        "Hold_Release", // Releasing the security deposit back to the renter
        "Overage_Fee", // Charging for extra mileage or late return
        "Refund", // Returning money to the renter on cancellation
        "Payout", // Sending the host their earned cut
      ],
    },
    amount: {
      type: Number,
      required: [true, "Transaction amount is required."],
      min: [0, "Amount cannot be negative."],
    },
    currency: {
      type: String,
      default: "USD",
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
      default: "Stripe",
    },
    gatewayPaymentIntentId: {
      type: String,
      trim: true,
    },
    paymentMethod: {
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
