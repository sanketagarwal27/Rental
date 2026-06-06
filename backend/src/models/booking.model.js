import mongoose, { Schema } from "mongoose";

const BookingSchema = new Schema(
  {
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    provider: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    // Platform commission (5% of totalPrice)
    platformFee: {
      type: Number,
      default: 0,
    },
    // Host payout after platform commission (95% of totalPrice)
    hostPayout: {
      type: Number,
      default: 0,
    },
    securityDepositHeld: {
      type: Number,
      default: 0,
    },
    pickupLocation: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Locked", "Pending", "Confirmed", "Completed", "Cancelled"],
      default: "Locked",
    },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "AdvancePaid", "FullyPaid", "Refunded", "PartialRefund", "NoRefund"],
      default: "Unpaid",
    },
    lockedUntil: {
      type: Date,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    cancellationReason: {
      type: String,
    },
  },
  { timestamps: true },
);

export const Booking = mongoose.model("Booking", BookingSchema);
