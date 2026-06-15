import React, { useState } from "react";
import { formatINR } from "../../utils/dashboardUtils";
import { ShieldCheck, AlertCircle, RotateCcw } from "lucide-react";

const IncomingBookingsTable = ({
  financials,
  onCancelBooking,
  cancellingId,
  onMarkReturned,
  returningId,
}) => {
  const [visibleIncomingCount, setVisibleIncomingCount] = useState(5);

  return (
    <div>
      <h3 className="font-semibold text-base text-zinc-200 mb-3">
        Incoming Bookings
      </h3>
      {financials.rentalBookingsList?.length === 0 ? (
        <div className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-6 text-center text-zinc-500 text-xs">
          No bookings received yet.
        </div>
      ) : (
        <div className="space-y-3">
          {financials.rentalBookingsList
            ?.slice(0, visibleIncomingCount)
            .map((req, i) => {
              const payout =
                (req.hostPayout ?? Math.round((req.totalPrice || 0) * 0.95)) -
                (req.extraCharge || 0);
              return (
                <div
                  key={i}
                  className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-zinc-200">
                        {req.customer?.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {req.vehicle?.brand} {req.vehicle?.model}
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">
                        {new Date(req.startDate).toLocaleDateString()} –{" "}
                        {new Date(req.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0 text-right">
                      <span
                        className={`text-[10px] font-mono font-medium border px-2 py-0.5 rounded-full ${
                          req.status === "Confirmed"
                            ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
                            : req.status === "Ongoing"
                              ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                              : req.status === "Completed"
                                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                : "text-zinc-400 bg-zinc-800/80 border-zinc-700/50"
                        }`}
                      >
                        {req.status}
                      </span>
                      <p className="text-xs font-semibold text-emerald-400">
                        {formatINR(payout)}
                      </p>
                    </div>
                  </div>
                  {req.status === "Confirmed" && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => onCancelBooking(req._id, "host")}
                        disabled={
                          cancellingId === req._id ||
                          req.cancellationRequestByHost?.isRequested
                        }
                        className="text-[11px] text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/10 px-2.5 py-1 rounded-lg transition cursor-pointer disabled:opacity-50 font-medium"
                      >
                        {req.cancellationRequestByHost?.isRequested
                          ? "Cancellation Requested"
                          : cancellingId === req._id
                            ? "Processing…"
                            : "Request Cancellation"}
                      </button>
                    </div>
                  )}
                  {req.status === "Ongoing" && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() =>
                          onMarkReturned(
                            req._id,
                            req.securityDepositHeld,
                            req.vehicle?.pricePerDay || 0,
                          )
                        }
                        disabled={returningId === req._id}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-violet-300 hover:text-white bg-violet-600/20 hover:bg-violet-600 border border-violet-500/30 hover:border-violet-500 px-2.5 py-1 rounded-lg transition cursor-pointer disabled:opacity-50"
                      >
                        <RotateCcw className="w-3 h-3" />
                        {returningId === req._id
                          ? "Processing…"
                          : "Mark as Returned"}
                      </button>
                    </div>
                  )}
                  {req.status === "Completed" && (
                    <div className="mt-2 pt-2 border-t border-zinc-900/60 text-[11px] space-y-1">
                      <div className="text-amber-400 flex items-center gap-1 font-medium">
                        <ShieldCheck className="w-3 h-3" />
                        Security deposit released:{" "}
                        {formatINR(
                          Math.max(
                            0,
                            (req.securityDepositHeld || 0) -
                              (req.extraCharge || 0),
                          ),
                        )}
                      </div>
                      {req.extraCharge > 0 && (
                        <div className="text-rose-400 flex flex-col items-start gap-0.5 font-medium">
                          <div className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {req.extraCharge <= (req.securityDepositHeld || 0) ? (
                              `Extra charges deducted from deposit: ${formatINR(req.extraCharge)}`
                            ) : (
                              `Total extra charges: ${formatINR(req.extraCharge)}`
                            )}
                          </div>
                          {req.extraCharge > (req.securityDepositHeld || 0) && (
                            <span className="ml-4 text-[10px] text-rose-400/80">
                              (Deposit deducted + {formatINR(req.extraCharge - (req.securityDepositHeld || 0))} paid online)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {(financials.rentalBookingsList?.length > visibleIncomingCount ||
        visibleIncomingCount > 5) && (
        <div className="flex justify-center pt-2 gap-4">
          {financials.rentalBookingsList?.length > visibleIncomingCount && (
            <button
              onClick={() => setVisibleIncomingCount((prev) => prev + 5)}
              className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-900/50 hover:bg-zinc-800 px-6 py-2 rounded-full border border-zinc-800 transition cursor-pointer"
            >
              View More Bookings
            </button>
          )}
          {visibleIncomingCount > 5 && (
            <button
              onClick={() => setVisibleIncomingCount(5)}
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

export default IncomingBookingsTable;
