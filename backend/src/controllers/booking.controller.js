import { Booking } from "../models/booking.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { Transaction } from "../models/transaction.model.js";
import { minDeposit } from "../constant.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import {
  getDatesBetween,
  getRefundPolicy,
  cleanExpiredLocks,
} from "../utils/bookingUtils.js";
import Razorpay from "razorpay";
import crypto from "crypto";

const notifyBookingUpdate = (req, booking, actionMessage = null) => {
  const io = req.app.get("io");
  if (io && booking) {
    if (booking.status === "Locked") return;
    const payload = {
      bookingId: booking._id,
      status: booking.status,
      actionMessage,
    };

    const isUnpaidCancelled =
      booking.status === "Cancelled" && booking.paymentStatus === "Unpaid";

    if (booking.customer) {
      io.to(booking.customer.toString()).emit("bookingUpdated", payload);
    }

    if (booking.provider && !isUnpaidCancelled) {
      io.to(booking.provider.toString()).emit("bookingUpdated", payload);
    }
  }
};

// ─── Lock Vehicle (initiates 15-min hold) ────────────────────────────────────
export const lockVehicle = asyncHandler(async (req, res) => {
  const { vehicleId, startDate, endDate } = req.body;

  if (!vehicleId || !startDate || !endDate) {
    throw new ApiError(400, "vehicleId, startDate, and endDate are required.");
  }
  if (!req.user.isVerifiedEmail) {
    throw new ApiError(
      410,
      "Please go to profile and verify your email before booking.",
    );
  }

  // Clean up any stale locks before checking availability
  await cleanExpiredLocks();

  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);

  if (isNaN(start) || isNaN(end) || start > end) {
    throw new ApiError(
      400,
      "Invalid date range. End date must be after start date.",
    );
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (start < today) {
    throw new ApiError(400, "Start date cannot be in the past.");
  }

  // Fetch the vehicle (must be approved, available, not the owner's)
  const vehicle = await Vehicle.findOne({
    _id: vehicleId,
    isAvailable: true,
    isDeleted: false,
    status: "Approved",
    provider: { $ne: req.user._id },
  });

  if (!vehicle) {
    throw new ApiError(
      404,
      "Vehicle not found or is not available for booking.",
    );
  }

  // Check for date conflicts in unavailableDates
  const bookedDates = getDatesBetween(start, end);
  const hasConflict = vehicle.unavailableDates.some((d) => {
    const dNorm = new Date(d);
    dNorm.setUTCHours(0, 0, 0, 0);
    return bookedDates.some((bd) => bd.getTime() === dNorm.getTime());
  });

  if (hasConflict) {
    throw new ApiError(
      409,
      "Some or all selected dates are no longer available. Please choose different dates.",
    );
  }

  // Pricing calculations
  const days = bookedDates.length;
  const totalPrice = days * vehicle.pricePerDay;
  const advanceAmount = Math.round(totalPrice * 0.25); // 25% token upfront
  // Security deposit based on vehicle type
  const depositConfig = minDeposit[vehicle.type] || [3000, 20]; // fallback
  const securityDeposit = Math.round(
    Math.max(depositConfig[0], (depositConfig[1] * totalPrice) / 100),
  );
  let securityDepositReason = "";
  if (depositConfig[0] > (depositConfig[1] * totalPrice) / 100) {
    securityDepositReason = `Charging ₹${depositConfig[0]} fixed as security of ${vehicle.type} vehicle`;
  } else {
    securityDepositReason = `Charging ${depositConfig[1]}% of total booking as security of ${vehicle.type} vehicle`;
  }

  const remainingOnArrival = totalPrice - advanceAmount;

  // Platform commission split
  const PLATFORM_COMMISSION_PCT = 5;
  const platformFee = Math.round(totalPrice * (PLATFORM_COMMISSION_PCT / 100));
  const hostPayout = totalPrice - platformFee;

  const lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

  // Temporarily block dates by adding them to unavailableDates
  await Vehicle.findByIdAndUpdate(vehicleId, {
    $push: { unavailableDates: { $each: bookedDates } },
  });

  // Create the Locked booking record
  const booking = await Booking.create({
    vehicle: vehicleId,
    provider: vehicle.provider,
    customer: req.user._id,
    startDate: start,
    endDate: end,
    totalPrice,
    amountPaid: 0,
    platformFee,
    hostPayout,
    securityDepositHeld: securityDeposit,
    pickupLocation: vehicle.address,
    status: "Locked",
    paymentStatus: "Unpaid",
    lockedUntil,
  });

  notifyBookingUpdate(req, booking);

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        bookingId: booking._id,
        lockedUntil,
        startDate: start,
        endDate: end,
        days,
        totalPrice,
        advanceAmount,
        securityDeposit,
        securityDepositReason,
        remainingOnArrival,
        platformFee,
        hostPayout,
        pickupLocation: vehicle.address,
        vehicle: {
          _id: vehicle._id,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          type: vehicle.type,
          fuelType: vehicle.fuelType,
          transmission: vehicle.transmission,
          seats: vehicle.seats,
          pricePerDay: vehicle.pricePerDay,
          images: vehicle.images,
          address: vehicle.address,
          averageRating: vehicle.averageRating,
          totalReviews: vehicle.totalReviews,
          features: vehicle.features || [],
          licensePlate: vehicle.licensePlate,
        },
      },
      "Vehicle reserved for 15 minutes. Please complete payment to confirm your booking.",
    ),
  );
});

// ─── Create Payment Order (Razorpay) ─────────────────────────────────────────
export const createPaymentOrder = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const booking = await Booking.findOne({
    _id: bookingId,
    customer: req.user._id,
    status: "Locked",
  });

  if (!booking) {
    throw new ApiError(
      404,
      "Booking not found, already confirmed, or does not belong to you.",
    );
  }

  // Check if the 15-min lock has expired
  if (booking.lockedUntil < new Date()) {
    await cleanExpiredLocks();
    throw new ApiError(
      410,
      "Your 15-minute reservation window has expired. Please search again and rebook.",
    );
  }

  const advanceAmount = Math.round(booking.totalPrice * 0.25);
  const totalPayable = advanceAmount + booking.securityDepositHeld;

  if (totalPayable > 500000) {
    throw new ApiError(
      400,
      "Transaction amount cannot be ₹5,00,000 or greater per Razorpay's limit. Please decrease the amount.",
    );
  }

  // Initialize Razorpay
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_API_KEY,
    key_secret: process.env.RAZORPAY_API_SECRET,
  });

  // Create Order
  const options = {
    amount: totalPayable * 100, // amount in the smallest currency unit (paise)
    currency: "INR",
    receipt: bookingId.toString(),
  };

  try {
    const order = await razorpay.orders.create(options);
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
        },
        "Payment order created successfully.",
      ),
    );
  } catch (error) {
    throw new ApiError(
      500,
      "Could not create Razorpay order. Try decreasing the amount",
    );
  }
});

// ─── Confirm Booking (simulate payment capture) ───────────────────────────────
export const confirmBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
    req.body;

  const booking = await Booking.findOne({
    _id: bookingId,
    customer: req.user._id,
    status: "Locked",
  }).populate("vehicle", "brand model images address");

  if (!booking) {
    throw new ApiError(
      404,
      "Booking not found, already confirmed, or does not belong to you.",
    );
  }

  // Check if the 15-min lock has expired
  if (booking.lockedUntil < new Date()) {
    await cleanExpiredLocks();
    throw new ApiError(
      410,
      "Your 15-minute reservation window has expired. Please search again and rebook.",
    );
  }

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    throw new ApiError(400, "Payment details are missing.");
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Invalid payment signature.");
  }

  const advanceAmount = Math.round(booking.totalPrice * 0.25);

  // Confirm the booking
  booking.status = "Confirmed";
  booking.paymentStatus = "AdvancePaid";
  booking.amountPaid = advanceAmount;
  await booking.save();

  // ── Transaction log ────────────────────────────────────────────────────────
  // 1. Advance charge from customer
  await Transaction.create({
    booking: booking._id,
    user: req.user._id,
    type: "Advance_Charge",
    amount: advanceAmount,
    currency: "INR",
    status: "Succeeded",
    gateway: "Razorpay",
    gatewayPaymentIntentId: razorpay_payment_id,
    note: `25% advance token for booking ${booking._id}`,
  });

  // 2. Security deposit hold
  await Transaction.create({
    booking: booking._id,
    user: req.user._id,
    type: "Security_Hold",
    amount: booking.securityDepositHeld,
    currency: "INR",
    status: "Succeeded",
    gateway: "Razorpay",
    gatewayPaymentIntentId: `${razorpay_payment_id}_HOLD`,
    note: `Security deposit hold — released upon safe return of vehicle`,
  });

  // 3. Platform fee (5% of TOTAL trip cost — deducted from the advance received online)
  await Transaction.create({
    booking: booking._id,
    user: booking.provider, // logged against the provider so the host's ledger shows it
    type: "Platform_Fee",
    amount: booking.platformFee,
    currency: "INR",
    status: "Succeeded",
    gateway: "Razorpay",
    gatewayPaymentIntentId: `${razorpay_payment_id}_FEE`,
    note: `5% platform commission on total trip cost of ₹${booking.totalPrice} = ₹${booking.platformFee}`,
  });

  // 4. Host payout (95% of total — pending until trip completion)
  //    Platform now collects both advance (25%) and remaining (75%) via Razorpay,
  //    so the full hostPayout is disbursed by the platform on trip completion.
  await Transaction.create({
    booking: booking._id,
    user: booking.provider,
    type: "Payout",
    amount: booking.hostPayout, // 95% of totalPrice
    currency: "INR",
    status: "Pending", // Released when host marks trip as Completed
    gateway: "Razorpay",
    gatewayPaymentIntentId: `${razorpay_payment_id}_PAY`,
    note: `Host net earnings ₹${booking.hostPayout} (95% of ₹${booking.totalPrice} after 5% platform fee). Platform collects 25% advance now + 75% remaining via Razorpay at pickup, then disburses full amount on trip completion.`,
  });

  notifyBookingUpdate(req, booking);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        bookingId: booking._id,
        status: "Confirmed",
        amountPaid: advanceAmount,
        securityDepositHeld: booking.securityDepositHeld,
        remainingOnArrival: booking.totalPrice - advanceAmount,
        platformFee: booking.platformFee,
        hostPayout: booking.hostPayout,
        pickupLocation: booking.pickupLocation,
        startDate: booking.startDate,
        endDate: booking.endDate,
        vehicle: booking.vehicle,
      },
      "Booking confirmed! Remaining 75% payment and security deposit are due on arrival at the pickup location.",
    ),
  );
});

// ─── Cancel Booking (tiered refund based on days to start) ───────────────────
export const cancelBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { reason } = req.body;

  const booking = await Booking.findById(bookingId).populate("vehicle");

  if (!booking) {
    throw new ApiError(404, "Booking not found.");
  }

  const isCustomer = booking.customer.toString() === req.user._id.toString();
  const isHost =
    booking.vehicle &&
    booking.vehicle.provider.toString() === req.user._id.toString();

  if (!isCustomer && !isHost) {
    throw new ApiError(403, "You are not authorized to cancel this booking.");
  }

  if (!["Locked", "Confirmed"].includes(booking.status)) {
    throw new ApiError(
      400,
      "Booking cannot be cancelled in its current state.",
    );
  }

  if (isHost && booking.status === "Confirmed") {
    throw new ApiError(
      403,
      "Hosts cannot directly cancel a confirmed booking. Please use 'Request Cancellation' instead.",
    );
  }

  // Remove the blocked dates from the vehicle
  const start = new Date(booking.startDate);
  const end = new Date(booking.endDate);
  const datesToRemove = getDatesBetween(start, end);
  await Vehicle.findByIdAndUpdate(booking.vehicle._id, {
    $pull: { unavailableDates: { $in: datesToRemove } },
  });

  // If the booking was never confirmed (still Locked), delete it completely
  // so it doesn't clutter analytics or user history.
  if (booking.status === "Locked") {
    await booking.deleteOne();
    return res.status(200).json(
      new ApiResponse(200, null, "Booking cancelled successfully."),
    );
  }

  // ── Calculate refund: Host cancellation is always 100% refund ─────────────
  let refundPct = 0;
  let label = "";

  if (isHost) {
    refundPct = 100;
    label = "Host cancelled: 100% refund";
  } else if (booking.cancellationRequestByHost?.isRequested) {
    refundPct = 100;
    label = "Host requested cancellation: 100% refund";
  } else {
    const policy = getRefundPolicy(booking.startDate);
    refundPct = policy.pct;
    label = policy.label;
  }

  const refundAmount = Math.round((booking.amountPaid * refundPct) / 100);
  const transactions = [];

  // Create refund transaction (only if customer had paid anything)
  if (booking.amountPaid > 0) {
    transactions.push(
      Transaction.create({
        booking: booking._id,
        user: booking.customer, // refunded to the renter
        type: "Refund",
        amount: refundAmount,
        currency: "INR",
        status: "Succeeded",
        gateway: "Simulated",
        gatewayPaymentIntentId: `SIM-${booking._id}-REF`,
        note: isHost
          ? `Host cancelled booking. Full refund: ₹${refundAmount} of ₹${booking.amountPaid} paid.`
          : `${label}. Refund: ₹${refundAmount} of ₹${booking.amountPaid} paid.`,
      }),
    );

    // Always release the security deposit hold
    if (booking.securityDepositHeld > 0) {
      transactions.push(
        Transaction.create({
          booking: booking._id,
          user: booking.customer, // hold released for renter
          type: "Hold_Release",
          amount: booking.securityDepositHeld,
          currency: "INR",
          status: "Succeeded",
          gateway: "Simulated",
          gatewayPaymentIntentId: `SIM-${booking._id}-HOLDR`,
          note: `Security deposit hold of ₹${booking.securityDepositHeld} released — booking cancelled.`,
        }),
      );
    }
  }

  await Promise.all(transactions);

  // For Confirmed bookings: void the pending Payout and reverse the Platform_Fee
  // (host should not bear commission cost on a trip that never happened)
  if (booking.status === "Confirmed") {
    // Void the pending payout
    await Transaction.findOneAndUpdate(
      { booking: booking._id, type: "Payout", status: "Pending" },
      {
        status: "Cancelled",
        note: `Payout voided — booking cancelled before trip started.`,
      },
    );

    // Reverse the platform fee
    const platformFeeDoc = await Transaction.findOne({
      booking: booking._id,
      type: "Platform_Fee",
    });
    if (platformFeeDoc) {
      await Transaction.create({
        booking: booking._id,
        user: booking.provider,
        type: "Platform_Fee_Reversal",
        amount: platformFeeDoc.amount,
        currency: "INR",
        status: "Succeeded",
        gateway: "Simulated",
        gatewayPaymentIntentId: `SIM-${booking._id}-FEEVER`,
        note: `Platform fee of ₹${platformFeeDoc.amount} reversed — booking cancelled before trip started.`,
      });
    }
  }

  // Determine paymentStatus based on refund
  let paymentStatus = "Unpaid";
  if (booking.amountPaid > 0) {
    if (refundPct === 100) paymentStatus = "Refunded";
    else if (refundPct > 0) paymentStatus = "PartialRefund";
    else paymentStatus = "NoRefund";
  }

  booking.status = "Cancelled";
  booking.paymentStatus = paymentStatus;
  booking.refundAmount = refundAmount;
  if (booking.cancellationRequestByHost?.isRequested) {
    booking.cancellationReason = `Host requested cancellation: ${booking.cancellationRequestByHost.reason}`;
  } else {
    booking.cancellationReason =
      reason || (isHost ? "Cancelled by host" : "Cancelled by customer");
  }
  await booking.save();

  notifyBookingUpdate(req, booking);

  const refundMsg =
    refundAmount > 0
      ? `₹${refundAmount.toLocaleString("en-IN")} will be refunded within 5–7 business days.`
      : "No refund applies as per the cancellation policy (same day or past start date).";

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        bookingId: booking._id,
        refundAmount,
        refundPct,
        refundPolicy: label,
        message: isHost
          ? `Booking cancelled successfully by host. ${refundMsg}`
          : `Booking cancelled successfully by customer. ${refundMsg}`,
      },
      isHost ? "Booking cancelled by host." : "Booking cancelled by customer.",
    ),
  );
});

// ─── Get My Bookings ──────────────────────────────────────────────────────────
export const getMyBookings = asyncHandler(async (req, res) => {
  // Prune expired locks before returning bookings
  await cleanExpiredLocks();

  const bookings = await Booking.find({
    customer: req.user._id,
    status: { $ne: "Locked" },
    $nor: [{ status: "Cancelled", amountPaid: 0 }],
  })
    .populate(
      "vehicle",
      "brand model type category fuelType images address pricePerDay",
    )
    .populate("provider", "name avatar phone email")
    .sort({ createdAt: -1 })
    .lean();

  const transactions = await Transaction.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .lean();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { bookings, transactions },
        "Bookings and transactions fetched successfully.",
      ),
    );
});

// ─── Request Cancellation (Host) ──────────────────────────────────────────────────────────
export const requestCancellation = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { reason } = req.body;

  const booking = await Booking.findById(bookingId).populate("vehicle");

  if (!booking) {
    throw new ApiError(404, "Booking not found.");
  }

  if (booking.vehicle.provider.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You can only request cancellation for your own vehicles.",
    );
  }

  if (booking.status !== "Confirmed" && booking.status !== "Pending") {
    throw new ApiError(
      400,
      "Can only request cancellation for confirmed or pending bookings.",
    );
  }

  if (booking.cancellationRequestByHost?.isRequested) {
    throw new ApiError(400, "Cancellation request already sent.");
  }

  if (!reason || !reason.trim()) {
    throw new ApiError(400, "Reason is required for cancellation request.");
  }

  booking.cancellationRequestByHost = {
    isRequested: true,
    reason: reason.trim(),
    requestedAt: new Date(),
  };

  await booking.save();

  notifyBookingUpdate(req, booking, "Cancellation Requested");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { bookingId: booking._id },
        "Cancellation request sent to the renter.",
      ),
    );
});

// ─── Reject Cancellation (Renter) ─────────────────────────────────────────────────────────
export const rejectCancellation = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new ApiError(404, "Booking not found.");
  }

  if (booking.customer.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "Only the renter can reject a cancellation request.",
    );
  }

  if (!booking.cancellationRequestByHost?.isRequested) {
    throw new ApiError(
      400,
      "No cancellation request pending for this booking.",
    );
  }

  booking.cancellationRequestByHost = undefined;
  await booking.save();

  notifyBookingUpdate(req, booking, "Cancellation Rejected");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { bookingId: booking._id },
        "Cancellation request rejected.",
      ),
    );
});

// ─── Create Pickup Payment Order (Razorpay) ───────────────────────────────────
export const createPickupOrder = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const booking = await Booking.findOne({
    _id: bookingId,
    customer: req.user._id,
    status: "Confirmed",
  });

  if (!booking) {
    throw new ApiError(
      404,
      "Booking not found, not confirmed, or does not belong to you.",
    );
  }

  // Date check to enforce pickup is only allowed from midnight (IST) of start date
  const getISTDateString = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(d));
  
  const todayIST = getISTDateString(new Date());
  const tripStartIST = getISTDateString(booking.startDate);

  if (todayIST < tripStartIST) {
    throw new ApiError(
      400,
      "You cannot pick up the vehicle before the trip start date.",
    );
  }

  const remainingAmount = booking.totalPrice - booking.amountPaid;

  if (remainingAmount <= 0) {
    throw new ApiError(400, "No remaining balance due for this booking.");
  }

  if (remainingAmount > 500000) {
    throw new ApiError(
      400,
      "Transaction amount cannot be ₹5,00,000 or greater per Razorpay's limit. Please decrease the amount.",
    );
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_API_KEY,
    key_secret: process.env.RAZORPAY_API_SECRET,
  });

  const options = {
    amount: remainingAmount * 100, // paise
    currency: "INR",
    receipt: `${bookingId}-pickup`,
  };

  try {
    const order = await razorpay.orders.create(options);
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          remainingAmount,
        },
        "Pickup payment order created successfully.",
      ),
    );
  } catch {
    throw new ApiError(500, "Could not create pickup payment order.");
  }
});

// ─── Mark Picked Up — verify Razorpay payment (Customer) ─────────────────────
export const markPickedUp = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
    req.body;

  const booking = await Booking.findOne({
    _id: bookingId,
    customer: req.user._id,
    status: "Confirmed",
  });

  if (!booking) {
    throw new ApiError(
      404,
      "Booking not found, not confirmed, or does not belong to you.",
    );
  }

  // Date check to enforce pickup is only allowed from midnight (IST) of start date
  const getISTDateString = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(d));
  
  const todayIST = getISTDateString(new Date());
  const tripStartIST = getISTDateString(booking.startDate);

  if (todayIST < tripStartIST) {
    throw new ApiError(
      400,
      "You cannot pick up the vehicle before the trip start date.",
    );
  }

  // Verify Razorpay signature
  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    throw new ApiError(400, "Payment details are missing.");
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Invalid payment signature. Pickup not confirmed.");
  }

  const remainingAmount = booking.totalPrice - booking.amountPaid;

  // Transition to Ongoing
  booking.status = "Ongoing";
  booking.paymentStatus = "FullyPaid";
  booking.amountPaid = booking.totalPrice;
  booking.pickedUpAt = new Date();
  await booking.save();

  // Record the remaining 75% payment via Razorpay
  await Transaction.create({
    booking: booking._id,
    user: req.user._id,
    type: "Remaining_Charge",
    amount: remainingAmount,
    currency: "INR",
    status: "Succeeded",
    gateway: "Razorpay",
    gatewayPaymentIntentId: razorpay_payment_id,
    note: `Remaining 75% of ₹${remainingAmount} paid via Razorpay at vehicle pickup. Platform now holds full trip amount and will disburse ₹${booking.hostPayout} to host on trip completion.`,
  });

  notifyBookingUpdate(req, booking);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        bookingId: booking._id,
        status: "Ongoing",
        amountPaid: booking.totalPrice,
        pickedUpAt: booking.pickedUpAt,
      },
      "Payment confirmed! Vehicle pickup confirmed. Your trip is now ongoing. Have a safe journey!",
    ),
  );
});

// ─── Mark Returned (Host) ────────────────────────────────────────────────────
export const markReturned = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { damages = [] } = req.body;

  const booking = await Booking.findOne({
    _id: bookingId,
    provider: req.user._id,
    status: "Ongoing",
  }).populate("vehicle");

  if (!booking) {
    throw new ApiError(
      404,
      "Booking not found, not ongoing, or does not belong to your vehicle.",
    );
  }

  const totalExtraCharge = damages.reduce(
    (sum, d) => sum + (Number(d.amount) || 0),
    0,
  );

  if (totalExtraCharge === 0) {
    // Clean return: complete immediately
    booking.status = "Completed";
    booking.returnedAt = new Date();
    booking.extraCharge = 0;
    await booking.save();

    // Free up vehicle dates
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    const datesToRemove = getDatesBetween(start, end);
    await Vehicle.findByIdAndUpdate(booking.vehicle._id, {
      $pull: { unavailableDates: { $in: datesToRemove } },
    });

    // Release security deposit
    await Transaction.create({
      booking: booking._id,
      user: booking.customer,
      type: "Hold_Release",
      amount: booking.securityDepositHeld,
      currency: "INR",
      status: "Succeeded",
      gateway: "Simulated",
      gatewayPaymentIntentId: `SIM-${booking._id}-HOLDR`,
      note: `Full security deposit of ₹${booking.securityDepositHeld} released — vehicle returned safely`,
    });

    // Mark host payout as Succeeded
    await Transaction.findOneAndUpdate(
      { booking: booking._id, type: "Payout", status: "Pending" },
      { status: "Succeeded", note: `Host payout released on trip completion` },
    );

    notifyBookingUpdate(req, booking);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          bookingId: booking._id,
          status: "Completed",
          returnedAt: booking.returnedAt,
          extraCharge: 0,
          depositRefund: booking.securityDepositHeld,
        },
        "Trip completed successfully! Full security deposit released to customer.",
      ),
    );
  } else {
    // Return with charges: pending customer approval
    booking.status = "Return_Requested";
    booking.returnRequest = {
      isRequested: true,
      damages,
      totalExtraCharge,
      requestedAt: new Date(),
    };
    await booking.save();

    notifyBookingUpdate(req, booking, "Return Requested (with damages)");

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          bookingId: booking._id,
          status: "Return_Requested",
          totalExtraCharge,
        },
        "Return requested. The customer must approve the extra charges to complete the trip.",
      ),
    );
  }
});

// ─── Accept Return (Customer - when charge <= deposit) ──────────────────────
export const acceptReturn = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const booking = await Booking.findOne({
    _id: bookingId,
    customer: req.user._id,
    status: "Return_Requested",
  });

  if (!booking || !booking.returnRequest?.isRequested) {
    throw new ApiError(404, "Return request not found or not pending.");
  }

  const { totalExtraCharge } = booking.returnRequest;

  if (totalExtraCharge > booking.securityDepositHeld) {
    throw new ApiError(
      400,
      "Extra charges exceed your security deposit. Please pay the remaining balance to complete the return.",
    );
  }

  const deduction = totalExtraCharge;
  const depositRefund = booking.securityDepositHeld - deduction;

  booking.status = "Completed";
  booking.returnedAt = new Date();
  booking.extraCharge = deduction;
  booking.hostPayout += deduction;
  booking.returnRequest = undefined;
  await booking.save();

  // Free up vehicle dates
  const start = new Date(booking.startDate);
  const end = new Date(booking.endDate);
  const datesToRemove = getDatesBetween(start, end);
  await Vehicle.findByIdAndUpdate(booking.vehicle, {
    $pull: { unavailableDates: { $in: datesToRemove } },
  });

  const transactions = [];

  if (deduction > 0) {
    transactions.push(
      Transaction.create({
        booking: booking._id,
        user: booking.customer,
        type: "Deposit_Deduction",
        amount: deduction,
        currency: "INR",
        status: "Succeeded",
        gateway: "Simulated",
        gatewayPaymentIntentId: `SIM-${booking._id}-DED`,
        note: `Damage/extra charge of ₹${deduction} deducted from security deposit`,
      }),
    );
  }

  if (depositRefund > 0) {
    transactions.push(
      Transaction.create({
        booking: booking._id,
        user: booking.customer,
        type: "Deposit_Refund",
        amount: depositRefund,
        currency: "INR",
        status: "Succeeded",
        gateway: "Simulated",
        gatewayPaymentIntentId: `SIM-${booking._id}-DEPREF`,
        note: `Security deposit refund of ₹${depositRefund} after ₹${deduction} deduction`,
      }),
    );
  }

  await Transaction.findOneAndUpdate(
    { booking: booking._id, type: "Payout", status: "Pending" },
    {
      status: "Succeeded",
      amount: booking.hostPayout,
      note: `Host payout released on trip completion (includes ₹${deduction} extra charges)`,
    },
  );

  await Promise.all(transactions);

  notifyBookingUpdate(req, booking);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        bookingId: booking._id,
        status: "Completed",
        returnedAt: booking.returnedAt,
      },
      `Return accepted. ₹${deduction} deducted from security deposit.`,
    ),
  );
});

// ─── Create Return Payment Order (Customer - when charge > deposit) ─────────
export const createReturnPaymentOrder = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const booking = await Booking.findOne({
    _id: bookingId,
    customer: req.user._id,
    status: "Return_Requested",
  });

  if (!booking || !booking.returnRequest?.isRequested) {
    throw new ApiError(404, "Return request not found or not pending.");
  }

  const remainingAmount =
    booking.returnRequest.totalExtraCharge - booking.securityDepositHeld;

  if (remainingAmount <= 0) {
    throw new ApiError(
      400,
      "No additional payment required. Please just accept the return.",
    );
  }

  if (remainingAmount > 500000) {
    throw new ApiError(
      400,
      "Transaction amount cannot be ₹5,00,000 or greater per Razorpay's limit. Please decrease the amount.",
    );
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_API_KEY,
    key_secret: process.env.RAZORPAY_API_SECRET,
  });

  const options = {
    amount: remainingAmount * 100,
    currency: "INR",
    receipt: `${bookingId}-return`,
  };

  try {
    const order = await razorpay.orders.create(options);
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          remainingAmount,
        },
        "Return payment order created.",
      ),
    );
  } catch (err) {
    throw new ApiError(
      500,
      "Could not create Razorpay order for return. Try decreasing the amount",
    );
  }
});

// ─── Pay & Accept Return (Customer - when charge > deposit) ─────────────────
export const payAndAcceptReturn = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
    req.body;

  const booking = await Booking.findOne({
    _id: bookingId,
    customer: req.user._id,
    status: "Return_Requested",
  });

  if (!booking || !booking.returnRequest?.isRequested) {
    throw new ApiError(404, "Return request not found or not pending.");
  }

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    throw new ApiError(400, "Payment details are missing.");
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Invalid payment signature.");
  }

  const remainingAmount =
    booking.returnRequest.totalExtraCharge - booking.securityDepositHeld;

  const totalExtra = booking.returnRequest.totalExtraCharge;

  booking.status = "Completed";
  booking.returnedAt = new Date();
  booking.extraCharge = totalExtra;
  booking.hostPayout += totalExtra;
  booking.amountPaid += remainingAmount;
  booking.returnRequest = undefined;
  await booking.save();

  // Free up vehicle dates
  const start = new Date(booking.startDate);
  const end = new Date(booking.endDate);
  const datesToRemove = getDatesBetween(start, end);
  await Vehicle.findByIdAndUpdate(booking.vehicle, {
    $pull: { unavailableDates: { $in: datesToRemove } },
  });

  // Deduct entire deposit
  await Transaction.create({
    booking: booking._id,
    user: booking.customer,
    type: "Deposit_Deduction",
    amount: booking.securityDepositHeld,
    currency: "INR",
    status: "Succeeded",
    gateway: "Simulated",
    gatewayPaymentIntentId: `SIM-${booking._id}-DED`,
    note: `Full security deposit of ₹${booking.securityDepositHeld} deducted for damages`,
  });

  // Record overage payment
  await Transaction.create({
    booking: booking._id,
    user: booking.customer,
    type: "Overage_Fee",
    amount: remainingAmount,
    currency: "INR",
    status: "Succeeded",
    gateway: "Razorpay",
    gatewayPaymentIntentId: razorpay_payment_id,
    note: `Extra damage charge of ₹${remainingAmount} paid via Razorpay`,
  });

  await Transaction.findOneAndUpdate(
    { booking: booking._id, type: "Payout", status: "Pending" },
    {
      status: "Succeeded",
      amount: booking.hostPayout,
      note: `Host payout released on trip completion (includes ₹${totalExtra} extra charges)`,
    },
  );

  notifyBookingUpdate(req, booking);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        bookingId: booking._id,
        status: "Completed",
        returnedAt: booking.returnedAt,
      },
      "Return accepted and extra charges paid successfully.",
    ),
  );
});
