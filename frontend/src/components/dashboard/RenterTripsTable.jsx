import React, { useState } from "react";
import { formatINR, statusStyle } from "../../utils/dashboardUtils";
import {
  MapPin,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  PackageCheck,
  Car,
} from "lucide-react";

const RenterTripsTable = ({
  vehiclesRented,
  onSelectBooking,
  onPickedUp,
  pickingUpId,
  onCancelBooking,
  cancellingId,
  onRejectCancellation,
  rejectingId,
  onReturnAction,
  returnActionId,
}) => {
  const [tripFilter, setTripFilter] = useState("All Trips");
  const [visibleTripsCount, setVisibleTripsCount] = useState(5);

  const getTripState = (bk) => {
    if (bk.status === "Cancelled" || bk.status === "Rejected")
      return "Cancelled";
    if (bk.status === "Completed") return "Completed";
    if (bk.status === "Ongoing" || bk.status === "Return_Requested")
      return "Ongoing";
    // Confirmed bookings stay "Upcoming" until customer clicks Picked Up
    return "Upcoming";
  };

  const filteredSortedTrips = [...vehiclesRented]
    .filter((bk) => {
      if (tripFilter === "All") return true;
      if (tripFilter === "Ongoing") return getTripState(bk) === "Ongoing";
      if (tripFilter === "Upcoming") return getTripState(bk) === "Upcoming";
      if (tripFilter === "Completed") return getTripState(bk) === "Completed";
      if (tripFilter === "Cancelled") return getTripState(bk) === "Cancelled";
      return true;
    })
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  const handleCardClick = (e, bk) => {
    if (e.target.closest("button")) return;
    onSelectBooking(bk);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base text-zinc-200">
          My Rental Trips
        </h3>
        <select
          value={tripFilter}
          onChange={(e) => setTripFilter(e.target.value)}
          className="bg-zinc-800/80 border border-zinc-700/60 rounded-xl px-3 py-1.5 text-zinc-300 text-xs font-medium focus:outline-none focus:border-blue-500/60 transition cursor-pointer"
        >
          <option value="All">All Trips</option>
          <option value="Ongoing">Ongoing</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>
      {filteredSortedTrips.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-2xl p-8 text-center text-zinc-500 text-sm">
          <Car className="w-8 h-8 text-zinc-650 mx-auto mb-2" />
          You haven't booked any rental trips yet.
        </div>
      ) : (
        <div className="border border-zinc-900 bg-zinc-900/10 rounded-2xl overflow-hidden divide-y divide-zinc-900">
          {filteredSortedTrips.slice(0, visibleTripsCount).map((bk, i) => (
            <div
              key={i}
              onClick={(e) => handleCardClick(e, bk)}
              className="p-5 flex flex-col gap-3 hover:bg-zinc-900/40 transition cursor-pointer"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0 overflow-hidden">
                    {bk.vehicle?.images?.[0] ? (
                      <img
                        className="object-cover w-full h-full"
                        src={bk.vehicle?.images?.[0]}
                        alt="Vehicle"
                      />
                    ) : (
                      <Car className="w-5 h-5 text-zinc-500" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-zinc-200">
                      {bk.vehicle?.brand} {bk.vehicle?.model}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {bk.vehicle?.address}
                    </p>
                    {bk.pickupLocation &&
                      (bk.status === "Confirmed" ||
                        bk.status === "Ongoing") && (
                        <div className="mt-1.5 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg inline-flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-blue-300 font-medium">
                            Exact Pickup Location:{" "}
                            <span className="text-blue-200">
                              {bk.pickupLocation}
                            </span>
                          </p>
                        </div>
                      )}
                    <p className="text-xs text-zinc-600 mt-0.5">
                      {new Date(bk.startDate).toLocaleDateString('en-GB')} →{" "}
                      {new Date(bk.endDate).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                  <span className="font-semibold text-sm text-zinc-200">
                    {formatINR(bk.totalPrice)}
                  </span>
                  <span
                    className={`text-[11px] font-medium font-mono px-2.5 py-1 rounded-full border ${statusStyle(bk.status)}`}
                  >
                    {bk.status}
                  </span>
                </div>
              </div>

              {/* Payment breakdown */}
              {bk.amountPaid > 0 && (
                <div className="ml-14 text-[11px] text-zinc-500 flex flex-wrap gap-3">
                  <span>
                    Paid:{" "}
                    <span className="text-emerald-400 font-semibold">
                      {formatINR(bk.amountPaid)}
                    </span>
                  </span>
                  {bk.securityDepositHeld > 0 && (
                    <span>
                      Deposit hold:{" "}
                      <span className="text-amber-400 font-semibold">
                        {formatINR(bk.securityDepositHeld)}
                      </span>
                    </span>
                  )}
                  {bk.totalPrice - bk.amountPaid > 0 && (
                    <span>
                      Due:{" "}
                      <span className="text-zinc-300 font-semibold">
                        {formatINR(bk.totalPrice - bk.amountPaid)}
                      </span>
                    </span>
                  )}
                </div>
              )}

              {/* Refund info on cancellation */}
              {bk.status === "Cancelled" && (
                <div className="ml-14 text-[11px] space-y-1">
                  {bk.refundAmount > 0 ? (
                    <div className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Refund of {formatINR(bk.refundAmount)} processed
                    </div>
                  ) : (
                    <div className="text-zinc-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      No booking refund applicable (past cancellation deadline)
                    </div>
                  )}
                  {bk.securityDepositHeld > 0 && (
                    <div className="text-amber-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Security deposit hold of{" "}
                      {formatINR(bk.securityDepositHeld)} released
                    </div>
                  )}
                  {bk.cancellationReason && (
                    <div className="text-rose-450/90 flex items-start gap-1 mt-1.5">
                      <AlertCircle className="w-3 h-3 text-rose-450 shrink-0 mt-0.5" />
                      <span>Cancellation Reason: {bk.cancellationReason}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Trip completion info */}
              {bk.status === "Completed" && (
                <div className="ml-14 text-[11px] space-y-1 mt-1">
                  <div className="text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    Trip completed successfully
                  </div>
                  <div className="text-amber-400 flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3 h-3" />
                    Security deposit released:{" "}
                    {formatINR(
                      Math.max(
                        0,
                        (bk.securityDepositHeld || 0) - (bk.extraCharge || 0),
                      ),
                    )}
                  </div>
                  {bk.extraCharge > 0 && (
                    <div className="text-rose-400 flex flex-col items-start gap-0.5 font-medium">
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {bk.extraCharge <= (bk.securityDepositHeld || 0)
                          ? `Extra charges deducted from deposit: ${formatINR(bk.extraCharge)}`
                          : `Total extra charges: ${formatINR(bk.extraCharge)}`}
                      </div>
                      {bk.extraCharge > (bk.securityDepositHeld || 0) && (
                        <span className="ml-4 text-[10px] text-rose-400/80">
                          (Deposit deducted +{" "}
                          {formatINR(
                            bk.extraCharge - (bk.securityDepositHeld || 0),
                          )}{" "}
                          paid online)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons — Confirmed trips */}
              {bk.status === "Confirmed" && (
                <div className="ml-14 flex flex-col items-start gap-2">
                  {new Date().setUTCHours(0, 0, 0, 0) >= new Date(bk.startDate).setUTCHours(0, 0, 0, 0) ? (
                    <button
                      onClick={() =>
                        onPickedUp(bk._id, bk.totalPrice - bk.amountPaid)
                      }
                      disabled={pickingUpId === bk._id}
                      className="flex items-center gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                    >
                      <PackageCheck className="w-3.5 h-3.5" />
                      {pickingUpId === bk._id
                        ? "Processing…"
                        : `Pay ${formatINR(bk.totalPrice - bk.amountPaid)} and Pick Up`}
                    </button>
                  ) : (
                    <div className="text-xs font-medium text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                      Pickup unlocks at midnight on {new Date(bk.startDate).toLocaleDateString('en-GB')}
                    </div>
                  )}

                  {/* Cancellation request from host */}
                  {bk.cancellationRequestByHost?.isRequested ? (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 w-full space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-rose-300">
                            The host has requested you to cancel this booking
                          </p>
                          <p className="text-[11px] text-rose-400 mt-1">
                            Reason:{" "}
                            <span className="font-semibold">
                              {bk.cancellationRequestByHost.reason}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onCancelBooking(bk._id, "renter")}
                          disabled={
                            cancellingId === bk._id || rejectingId === bk._id
                          }
                          className="text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg transition shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50 flex-1"
                        >
                          {cancellingId === bk._id
                            ? "Processing…"
                            : "Accept (100% Refund)"}
                        </button>
                        <button
                          onClick={() => onRejectCancellation(bk._id)}
                          disabled={
                            cancellingId === bk._id || rejectingId === bk._id
                          }
                          className="text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition border border-zinc-700 cursor-pointer disabled:opacity-50 flex-1"
                        >
                          {rejectingId === bk._id
                            ? "Rejecting…"
                            : "Reject Cancellation"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => onCancelBooking(bk._id, "renter")}
                      disabled={cancellingId === bk._id}
                      className="text-xs text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg transition cursor-pointer disabled:opacity-50"
                    >
                      {cancellingId === bk._id
                        ? "Cancelling…"
                        : "Cancel Booking"}
                    </button>
                  )}
                </div>
              )}

              {/* Ongoing trip indicator for renter */}
              {bk.status === "Ongoing" && (
                <div className="ml-14">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Trip in progress — vehicle picked up
                  </span>
                </div>
              )}

              {/* Return Requested Action */}
              {bk.status === "Return_Requested" && (
                <div className="ml-14 flex flex-col items-start gap-2 mt-2">
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 w-full space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-amber-300">
                          Host has marked this vehicle as returned
                        </p>
                        {bk.returnRequest?.damages?.length > 0 ? (
                          <div className="text-[11px] text-amber-400/90 mt-1.5">
                            <p className="font-medium mb-1 border-b border-amber-500/20 pb-1">
                              Damages/Extra Charges reported:
                            </p>
                            <ul className="list-none space-y-1 mt-1">
                              {bk.returnRequest.damages.map((d, idx) => (
                                <li key={idx} className="flex justify-between">
                                  <span>{d.type}</span>
                                  <span className="font-mono">
                                    {formatINR(d.amount)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                            <div className="mt-2 pt-1 border-t border-amber-500/20 flex justify-between font-bold text-amber-300">
                              <span>Total Deduction:</span>
                              <span>
                                {formatINR(bk.returnRequest.totalExtraCharge)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-amber-400/80 mt-1">
                            No extra charges reported. Full security deposit
                            will be refunded.
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() =>
                          onReturnAction(
                            bk._id,
                            bk.returnRequest?.totalExtraCharge || 0,
                            bk.securityDepositHeld || 0,
                          )
                        }
                        disabled={returnActionId === bk._id}
                        className="text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg transition shadow-md shadow-amber-600/20 cursor-pointer disabled:opacity-50 w-full flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {returnActionId === bk._id
                          ? "Processing…"
                          : "Accept & Complete Trip"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {(filteredSortedTrips.length > visibleTripsCount ||
        visibleTripsCount > 5) && (
        <div className="flex justify-center pt-2 gap-4">
          {filteredSortedTrips.length > visibleTripsCount && (
            <button
              onClick={() => setVisibleTripsCount((prev) => prev + 5)}
              className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-900/50 hover:bg-zinc-800 px-6 py-2 rounded-full border border-zinc-800 transition cursor-pointer"
            >
              View More Trips
            </button>
          )}
          {visibleTripsCount > 5 && (
            <button
              onClick={() => setVisibleTripsCount(5)}
              className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-900/50 hover:bg-zinc-800 px-6 py-2 rounded-full border border-zinc-800 transition cursor-pointer"
            >
              Show Less
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RenterTripsTable;
