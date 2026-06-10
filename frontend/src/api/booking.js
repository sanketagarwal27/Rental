import api from "./axios";

/**
 * Lock a vehicle for 15 minutes and get back pricing + bookingId.
 * @param {string} vehicleId
 * @param {string} startDate  ISO date string (YYYY-MM-DD)
 * @param {string} endDate    ISO date string (YYYY-MM-DD)
 */
export const lockVehicle = async (vehicleId, startDate, endDate) => {
  const response = await api.post(
    "/booking/lock",
    { vehicleId, startDate, endDate },
    { withCredentials: true }
  );
  return response.data;
};

/**
 * Create a Razorpay payment order for a Locked booking.
 * @param {string} bookingId
 */
export const createPaymentOrder = async (bookingId) => {
  const response = await api.post(
    `/booking/payment-order/${bookingId}`,
    {},
    { withCredentials: true }
  );
  return response.data;
};

/**
 * Confirm a Locked booking (verify Razorpay signature).
 * @param {string} bookingId
 * @param {object} paymentData - { razorpay_payment_id, razorpay_order_id, razorpay_signature }
 */
export const confirmBooking = async (bookingId, paymentData) => {
  const response = await api.post(
    `/booking/confirm/${bookingId}`,
    paymentData,
    { withCredentials: true }
  );
  return response.data;
};

/**
 * Cancel a Locked or Confirmed booking (tiered refund applies).
 * @param {string} bookingId
 * @param {string} [reason]
 */
export const cancelBooking = async (bookingId, reason = "") => {
  const response = await api.post(
    `/booking/cancel/${bookingId}`,
    { reason },
    { withCredentials: true }
  );
  return response.data;
};

export const requestCancellation = async (bookingId, reason) => {
  const response = await api.post(
    `/booking/request-cancel/${bookingId}`,
    { reason },
    { withCredentials: true }
  );
  return response.data;
};

export const rejectCancellation = async (bookingId) => {
  const response = await api.post(
    `/booking/reject-cancel/${bookingId}`,
    {},
    { withCredentials: true }
  );
  return response.data;
};

/**
 * Fetch all bookings and transactions for the logged-in user.
 */
export const getMyBookings = async () => {
  const response = await api.get("/booking/my", { withCredentials: true });
  return response.data;
};

/**
 * Create a Razorpay payment order for the remaining 75% at vehicle pickup.
 * @param {string} bookingId
 */
export const createPickupOrder = async (bookingId) => {
  const response = await api.post(
    `/booking/pickup-order/${bookingId}`,
    {},
    { withCredentials: true }
  );
  return response.data;
};

/**
 * Customer confirms vehicle pickup after paying remaining 75% via Razorpay.
 * Transitions booking: Confirmed → Ongoing
 * @param {string} bookingId
 * @param {object} paymentData - { razorpay_payment_id, razorpay_order_id, razorpay_signature }
 */
export const markPickedUp = async (bookingId, paymentData) => {
  const response = await api.post(
    `/booking/pickup/${bookingId}`,
    paymentData,
    { withCredentials: true }
  );
  return response.data;
};

/**
 * Host confirms the vehicle has been returned.
 * Transitions booking: Ongoing → Completed
 * @param {string} bookingId
 * @param {number} [extraCharge=0] - Damage/overage fee to deduct from security deposit
 */
export const markReturned = async (bookingId, extraCharge = 0) => {
  const response = await api.post(
    `/booking/return/${bookingId}`,
    { extraCharge },
    { withCredentials: true }
  );
  return response.data;
};
