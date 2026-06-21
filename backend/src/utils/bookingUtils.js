import { Booking } from "../models/booking.model.js";
import { Vehicle } from "../models/vehicle.model.js";

/**
 * Returns an array of Date objects for every calendar day from start to end (inclusive).
 * Dates are normalised to midnight UTC to avoid timezone skew.
 */
export const getDatesBetween = (start, end) => {
  const dates = [];
  const current = new Date(start);
  current.setUTCHours(0, 0, 0, 0);
  const endNorm = new Date(end);
  endNorm.setUTCHours(0, 0, 0, 0);
  while (current <= endNorm) {
    dates.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
};

/**
 * Calculates the refund percentage based on how many days remain before the trip start.
 *
 * Policy:
 *   ≥ 7 days  → 100% refund
 *   3–6 days  →  50% refund
 *   1–2 days  →  25% refund
 *   0 days / past → 0% refund
 *
 * @param {Date} startDate  – The booking start date
 * @returns {{ pct: number, label: string }}
 */
export const getRefundPolicy = (startDate) => {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0, 0);
  const daysUntilStart = Math.ceil((start - now) / (1000 * 60 * 60 * 24));

  if (daysUntilStart >= 7)  return { pct: 100, daysUntilStart, label: "Full refund (7+ days before start)" };
  if (daysUntilStart >= 3)  return { pct: 50,  daysUntilStart, label: "50% refund (3–6 days before start)" };
  if (daysUntilStart >= 1)  return { pct: 25,  daysUntilStart, label: "25% refund (1–2 days before start)" };
  return                           { pct: 0,   daysUntilStart, label: "No refund (same day or after start)" };
};

/**
 * Finds all Locked bookings whose 15-minute lock window has expired and cancels them,
 * removing the temporarily blocked dates from the vehicle document.
 */
export const cleanExpiredLocks = async () => {
  const now = new Date();
  const expired = await Booking.find({
    status: "Locked",
    lockedUntil: { $lt: now },
  });

  for (const booking of expired) {
    const start = new Date(booking.startDate);
    const end   = new Date(booking.endDate);
    const datesToRemove = getDatesBetween(start, end);

    // Remove the temporarily blocked dates from the vehicle
    await Vehicle.findByIdAndUpdate(booking.vehicle, {
      $pull: {
        unavailableDates: { $in: datesToRemove },
      },
    });

    await booking.deleteOne();
  }
};
