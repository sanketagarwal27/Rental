import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  confirmBooking,
  cancelBooking,
  lockVehicle,
  createPaymentOrder,
} from "../api/booking";
import { getVehicleById } from "../api/vehicle";
import { toast } from "sonner";
import {
  Car,
  Calendar,
  MapPin,
  Clock,
  CreditCard,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Shield,
  AlertTriangle,
  ArrowLeft,
  Fuel,
  Users,
  Zap,
  Lock,
  Info,
  RotateCcw,
  RefreshCw,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatINR = (val) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val || 0);

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-GB");

const getRefundLabel = (startDate) => {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0, 0);
  const days = Math.ceil((start - now) / 86400000);
  if (days >= 7)
    return {
      pct: 100,
      label: "Full refund if cancelled",
      color: "text-emerald-400",
    };
  if (days >= 3)
    return {
      pct: 50,
      label: "50% refund if cancelled",
      color: "text-amber-400",
    };
  if (days >= 1)
    return {
      pct: 25,
      label: "25% refund if cancelled",
      color: "text-orange-400",
    };
  return { pct: 0, label: "No refund if cancelled", color: "text-rose-400" };
};

// ── Countdown Timer ───────────────────────────────────────────────────────────
const CountdownTimer = ({ lockedUntil, onExpire }) => {
  const [ms, setMs] = useState(() =>
    Math.max(0, new Date(lockedUntil) - Date.now()),
  );

  useEffect(() => {
    if (ms <= 0) {
      onExpire();
      return;
    }
    const id = setInterval(() => {
      setMs((prev) => {
        const next = Math.max(0, prev - 1000);
        if (next === 0) {
          clearInterval(id);
          onExpire();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]); // eslint-disable-line

  const mins = String(Math.floor(ms / 60000)).padStart(2, "0");
  const secs = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  const urgent = ms < 3 * 60 * 1000; // < 3 min

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border font-mono font-bold text-sm ${
        urgent
          ? "bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse"
          : "bg-amber-500/10 border-amber-500/30 text-amber-400"
      }`}
    >
      <Clock className="w-4 h-4 shrink-0" />
      {mins}:{secs} remaining
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const BookingPage = () => {
  const { vehicleId } = useParams();
  const routerLocation = useLocation();
  const navigate = useNavigate();

  // Data passed from SearchResults via navigate state
  const initialData = routerLocation.state || null;

  // Steps: "select-dates" | "summary" | "payment" | "confirmed" | "expired" | "cancelled"
  const [step, setStep] = useState(initialData ? "summary" : "select-dates");
  const [bookingData, setBookingData] = useState(initialData);

  // Date selection state (for "Check Availability" flow)
  const [pickStart, setPickStart] = useState("");
  const [pickEnd, setPickEnd] = useState("");
  const [locking, setLocking] = useState(false);

  // Availability / Vehicle Info states
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [vehicleLoading, setVehicleLoading] = useState(true);
  const [vehicleError, setVehicleError] = useState(null);
  const [dateConflict, setDateConflict] = useState(null); // array of conflicting date strings or null

  // Payment form state
  const [paying, setPaying] = useState(false);

  // Confirmation result
  const [confirmResult, setConfirmResult] = useState(null);

  // ── Load Razorpay Script ───────────────────────────────────────────────────
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  const [cancelling, setCancelling] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  // Fetch vehicle details on mount (only if starting in select-dates step)
  useEffect(() => {
    if (step !== "select-dates" || !vehicleId) {
      setVehicleLoading(false);
      return;
    }
    setVehicleLoading(true);
    getVehicleById(vehicleId)
      .then((res) => {
        if (res?.success) {
          setVehicleInfo(res.data);
        } else {
          setVehicleError("Vehicle not found or unavailable.");
        }
      })
      .catch(() => {
        setVehicleError("Vehicle not found or unavailable.");
      })
      .finally(() => {
        setVehicleLoading(false);
      });
  }, [vehicleId, step]);

  // Check conflicts client-side when dates change
  const checkConflict = (start, end) => {
    if (!start || !end || !vehicleInfo) return;
    const unavailable = (vehicleInfo.unavailableDates || []).map((d) => {
      const dt = new Date(d);
      dt.setUTCHours(0, 0, 0, 0);
      return dt.getTime();
    });
    const conflicts = [];
    let cur = new Date(start);
    cur.setUTCHours(0, 0, 0, 0);
    const endDt = new Date(end);
    endDt.setUTCHours(0, 0, 0, 0);

    let limit = 0;
    while (cur <= endDt && limit < 100) {
      if (unavailable.includes(cur.getTime())) {
        conflicts.push(
          cur.toLocaleDateString("en-GB"),
        );
      }
      cur.setDate(cur.getDate() + 1);
      limit++;
    }
    setDateConflict(conflicts.length > 0 ? conflicts : null);
  };

  useEffect(() => {
    if (pickStart && pickEnd) {
      if (pickStart > pickEnd) {
        setDateConflict(["Start date must be before end date."]);
      } else {
        checkConflict(pickStart, pickEnd);
      }
    } else {
      setDateConflict(null);
    }
  }, [pickStart, pickEnd, vehicleInfo]);

  // ── Lock vehicle (check availability flow) ────────────────────────────────
  const handleLockAndBook = async () => {
    if (!pickStart || !pickEnd) {
      toast.error("Please select both start and end dates.");
      return;
    }
    if (pickStart > pickEnd) {
      toast.error("Start date must be before end date.");
      return;
    }
    try {
      setLocking(true);
      const res = await lockVehicle(vehicleId, pickStart, pickEnd);
      if (res?.success) {
        setBookingData(res.data);
        setStep("summary");
        toast.success("Vehicle reserved! Complete payment within 15 minutes.");
      }
    } catch (err) {
      if (err?.response?.status === 409) {
        setDateConflict([
          "These dates are no longer available — someone else may have just booked them. Try refreshing to see unavailable dates",
        ]);
      } else {
        toast.error(
          err?.response?.data?.message ||
            "Could not reserve vehicle. Please try again.",
        );
      }
    } finally {
      setLocking(false);
    }
  };

  // ── Payment with Razorpay ──────────────────────────────────────────────────
  const handlePay = async () => {
    if (!bookingData?.bookingId) return;
    try {
      setPaying(true);

      const orderRes = await createPaymentOrder(bookingData.bookingId);
      if (!orderRes?.success) throw new Error("Could not create order");

      const { orderId, amount, currency } = orderRes.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        name: "RentWheels",
        description: "Vehicle Booking Payment",
        order_id: orderId,
        handler: async function (response) {
          try {
            const confirmRes = await confirmBooking(bookingData.bookingId, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (confirmRes?.success) {
              setConfirmResult(confirmRes.data);
              setStep("confirmed");
              toast.success("Payment successful! Booking confirmed 🎉");
            }
          } catch (err) {
            toast.error(
              err?.response?.data?.message || "Payment verification failed.",
            );
            setPaying(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
            toast.info("Payment cancelled.");
          },
        },
        theme: {
          color: "#3B82F6",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        toast.error(response.error.description || "Payment failed");
        setPaying(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err.message ||
          "Payment initialization failed.",
      );
      setPaying(false);
    }
  };

  // ── Cancel booking ────────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!bookingData?.bookingId) return;
    try {
      setCancelling(true);
      const res = await cancelBooking(
        bookingData.bookingId,
        "Cancelled by customer before payment",
      );
      toast.info(res.message || "Booking cancelled.");
      setStep("cancelled");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Could not cancel. Please try again.",
      );
    } finally {
      setCancelling(false);
    }
  };

  const vehicle = bookingData?.vehicle;
  const refundInfo = bookingData?.startDate
    ? getRefundLabel(bookingData.startDate)
    : null;

  // ─────────────────────────────────────────────────────────────────────────
  // EXPIRED screen
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "expired") {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-zinc-100">
        <div className="max-w-md w-full text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
            <Clock className="w-8 h-8 text-rose-400" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">
            Reservation Expired
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Your 15-minute reservation window has ended. The vehicle is now
            available for others. Please search again to rebook.
          </p>
          <button
            onClick={() => navigate("/search")}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition cursor-pointer"
          >
            Search Again
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CANCELLED screen
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "cancelled") {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-zinc-100">
        <div className="max-w-md w-full text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full bg-zinc-700/30 border border-zinc-700 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-zinc-400" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">
            Booking Cancelled
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Your reservation has been cancelled and any blocked dates have been
            freed up.
          </p>
          <button
            onClick={() => navigate("/search")}
            className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-semibold text-sm transition cursor-pointer"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CONFIRMED screen
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "confirmed" && confirmResult) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Success banner */}
          <div className="rounded-2xl bg-gradient-to-br from-emerald-600/20 via-emerald-900/10 to-transparent border border-emerald-500/30 p-8 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-100">
              Booking Confirmed!
            </h1>
            <p className="text-zinc-400 text-sm">
              Booking ID:{" "}
              <span className="font-mono text-zinc-300">
                {confirmResult.bookingId}
              </span>
            </p>
          </div>

          {/* Payment summary */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-zinc-200 text-sm uppercase tracking-wider">
              Payment Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Advance token paid (25%)</span>
                <span className="text-emerald-400 font-semibold">
                  {formatINR(confirmResult.amountPaid)} ✓
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">
                  Security deposit (on hold)
                </span>
                <span className="text-amber-400 font-semibold">
                  {formatINR(confirmResult.securityDepositHeld)} 🔒
                </span>
              </div>
              <div className="flex justify-between text-sm border-t border-zinc-800 pt-3">
                <span className="text-zinc-300 font-medium">
                  Remaining on arrival
                </span>
                <span className="text-zinc-100 font-bold">
                  {formatINR(confirmResult.remainingOnArrival)}
                </span>
              </div>
            </div>
          </div>

          {/* Trip info */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-3">
            <h2 className="font-semibold text-zinc-200 text-sm uppercase tracking-wider">
              Trip Details
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-zinc-500 text-xs mb-0.5">Pickup Date</p>
                <p className="text-zinc-200 font-medium">
                  {formatDate(confirmResult.startDate)}
                </p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs mb-0.5">Return Date</p>
                <p className="text-zinc-200 font-medium">
                  {formatDate(confirmResult.endDate)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm text-zinc-400 pt-1">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-zinc-500" />
              <span>{confirmResult.pickupLocation}</span>
            </div>
          </div>

          {/* Arrival note */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-blue-300 font-semibold text-sm">
              <Info className="w-4 h-4" /> What to bring on arrival
            </div>
            <ul className="text-zinc-400 text-sm space-y-1.5 list-disc list-inside">
              <li>Valid government-issued photo ID</li>
              <li>Driving licence (relevant category)</li>
              <li>
                Remaining payment:{" "}
                <span className="text-zinc-200 font-semibold">
                  {formatINR(confirmResult.remainingOnArrival)}
                </span>
              </li>
              <li>Security deposit will be captured / released on return</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition cursor-pointer"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate("/search")}
              className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-semibold text-sm transition cursor-pointer"
            >
              Search More
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SELECT DATES screen (Check Availability flow)
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "select-dates") {
    if (vehicleLoading) {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
          <p className="text-sm text-zinc-500 font-medium">
            Checking vehicle details...
          </p>
        </div>
      );
    }

    if (vehicleError || !vehicleInfo) {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h1 className="text-xl font-bold">Unavailable</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              {vehicleError || "Could not load vehicle details."}
            </p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-sm font-medium transition cursor-pointer"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-zinc-100">
                Check Availability
              </h1>
              <p className="text-xs text-zinc-500">
                Select your rental dates to check availability and reserve.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Left panel: Vehicle Card & Unavailable Dates */}
            <div className="md:col-span-2 space-y-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                {vehicleInfo.images && vehicleInfo.images.length > 0 ? (
                  <div className="flex snap-x snap-mandatory overflow-x-auto gap-2 p-2 scrollbar-none bg-zinc-950/40 border-b border-zinc-800">
                    {vehicleInfo.images.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`${vehicleInfo.brand} ${vehicleInfo.model} ${index + 1}`}
                        className="snap-start w-[280px] h-44 object-cover rounded-xl shrink-0"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="w-full h-44 bg-zinc-800 flex items-center justify-center">
                    <Car className="w-12 h-12 text-zinc-700" />
                  </div>
                )}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-zinc-100">
                      {vehicleInfo.brand} {vehicleInfo.model}
                    </h3>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-xs text-zinc-500">
                        {vehicleInfo.year} · {vehicleInfo.type}
                      </p>
                      {vehicleInfo.licensePlate && (
                        <span className="text-[10px] font-mono font-bold bg-zinc-800/80 border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded tracking-wide uppercase">
                          {vehicleInfo.licensePlate}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1 bg-zinc-800/60 border border-zinc-700/40 px-2 py-0.5 rounded-full">
                      <Fuel className="w-3 h-3" /> {vehicleInfo.fuelType}
                    </span>
                    <span className="flex items-center gap-1 bg-zinc-800/60 border border-zinc-700/40 px-2 py-0.5 rounded-full">
                      <Users className="w-3 h-3" /> {vehicleInfo.seats} seats
                    </span>
                    <span className="bg-zinc-800/60 border border-zinc-700/40 px-2 py-0.5 rounded-full">
                      {vehicleInfo.transmission}
                    </span>
                  </div>
                  <p className="flex items-start gap-1.5 text-xs text-zinc-500">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-650" />
                    {vehicleInfo.address}
                  </p>

                  {/* Amenities (Features) */}
                  {vehicleInfo.features && vehicleInfo.features.length > 0 && (
                    <div className="border-t border-zinc-800/60 pt-3 space-y-1.5">
                      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                        Features & Amenities
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {vehicleInfo.features.map((feat, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-zinc-800/40 border border-zinc-700 text-zinc-300 px-2 py-0.5 rounded"
                          >
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-zinc-800/60 pt-3 flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Price per day</span>
                    <span className="text-sm font-bold text-blue-400">
                      {formatINR(vehicleInfo.pricePerDay)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Unavailable dates calendar/list */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Already Booked Dates
                </h3>
                {vehicleInfo.unavailableDates?.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-zinc-500">
                      This vehicle is not available on these dates:
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {vehicleInfo.unavailableDates.map((dateStr, idx) => {
                        const d = new Date(dateStr);
                        return (
                          <span
                            key={idx}
                            className="text-[10px] font-mono bg-zinc-800/50 border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded-md"
                          >
                            {d.toLocaleDateString("en-GB")}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-emerald-400 font-medium">
                    All dates are available!
                  </p>
                )}
              </div>
            </div>

            {/* Right panel: Date selection form & conflicts */}
            <div className="md:col-span-3 space-y-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-5">
                <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                  Select Rental Dates
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Pickup Date
                    </label>
                    <input
                      type="date"
                      min={today}
                      value={pickStart}
                      onChange={(e) => setPickStart(e.target.value)}
                      className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-3 text-zinc-100 text-sm focus:outline-none focus:border-blue-500/60 focus:bg-zinc-800 transition cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Return Date
                    </label>
                    <input
                      type="date"
                      min={pickStart || today}
                      value={pickEnd}
                      onChange={(e) => setPickEnd(e.target.value)}
                      className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-3 text-zinc-100 text-sm focus:outline-none focus:border-blue-500/60 focus:bg-zinc-800 transition cursor-pointer"
                    />
                  </div>
                </div>

                {/* Inline error / conflict list */}
                {dateConflict && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      Availability Conflict
                    </div>
                    {dateConflict.length === 1 &&
                    (dateConflict[0].includes(" ") ||
                      dateConflict[0].includes("—")) ? (
                      <p className="text-xs text-rose-400">{dateConflict[0]}</p>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs text-rose-400">
                          The vehicle is already booked on the following dates:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {dateConflict.map((dStr, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-mono bg-rose-500/20 border border-rose-500/30 text-rose-350 px-2 py-0.5 rounded"
                            >
                              {dStr}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleLockAndBook}
                  disabled={locking || !pickStart || !pickEnd || !!dateConflict}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-blue-900/20"
                >
                  {locking ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Checking…
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> Reserve & Continue
                    </>
                  )}
                </button>
              </div>

              <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-5 text-xs text-zinc-400 leading-relaxed space-y-1">
                <p className="font-semibold text-blue-300">
                  Reservation Hold Policy
                </p>
                <p>
                  • Clicking "Reserve & Continue" will lock this vehicle for 15
                  minutes.
                </p>
                <p>
                  • During this time, other users won't be able to reserve or
                  book these dates.
                </p>
                <p>
                  • Complete the 25% token payment in the next step to confirm
                  your booking.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SUMMARY + PAYMENT screens
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="p-2 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition cursor-pointer disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-zinc-100">
              {step === "summary" ? "Booking Summary" : "Payment"}
            </h1>
            <p className="text-xs text-zinc-500">
              {step === "summary"
                ? "Review your booking details before payment"
                : "Complete your secure simulated payment"}
            </p>
          </div>
          {/* Countdown timer */}
          {bookingData?.lockedUntil && (
            <CountdownTimer
              lockedUntil={bookingData.lockedUntil}
              onExpire={() => setStep("expired")}
            />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ── Left panel: Vehicle + Trip info ─────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Vehicle card */}
            {vehicle && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                {vehicle.images && vehicle.images.length > 0 ? (
                  <div className="flex snap-x snap-mandatory overflow-x-auto gap-2 p-2 scrollbar-none bg-zinc-950/40 border-b border-zinc-800">
                    {vehicle.images.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`${vehicle.brand} ${vehicle.model} ${index + 1}`}
                        className="snap-start w-[280px] h-44 object-cover rounded-xl shrink-0"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="w-full h-44 bg-zinc-800 flex items-center justify-center">
                    <Car className="w-12 h-12 text-zinc-700" />
                  </div>
                )}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-zinc-100">
                      {vehicle.brand} {vehicle.model}
                    </h3>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-xs text-zinc-500">
                        {vehicle.year} · {vehicle.type}
                      </p>
                      {vehicle.licensePlate && (
                        <span className="text-[10px] font-mono font-bold bg-zinc-800/80 border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded tracking-wide uppercase">
                          {vehicle.licensePlate}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1 bg-zinc-800/60 border border-zinc-700/40 px-2 py-0.5 rounded-full">
                      <Fuel className="w-3 h-3" /> {vehicle.fuelType}
                    </span>
                    <span className="flex items-center gap-1 bg-zinc-800/60 border border-zinc-700/40 px-2 py-0.5 rounded-full">
                      <Users className="w-3 h-3" /> {vehicle.seats} seats
                    </span>
                    <span className="bg-zinc-800/60 border border-zinc-700/40 px-2 py-0.5 rounded-full">
                      {vehicle.transmission}
                    </span>
                  </div>
                  <p className="flex items-start gap-1.5 text-xs text-zinc-500">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-600" />
                    {vehicle.address}
                  </p>

                  {/* Amenities (Features) */}
                  {vehicle.features && vehicle.features.length > 0 && (
                    <div className="border-t border-zinc-800/60 pt-3 space-y-1.5">
                      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                        Features & Amenities
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {vehicle.features.map((feat, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-zinc-800/40 border border-zinc-700 text-zinc-300 px-2 py-0.5 rounded"
                          >
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Trip dates */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Trip Details
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-zinc-800/40 rounded-xl p-3">
                  <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">
                    Pickup
                  </p>
                  <p className="font-semibold text-zinc-200 text-xs leading-snug">
                    {bookingData?.startDate
                      ? formatDate(bookingData.startDate)
                      : "—"}
                  </p>
                </div>
                <div className="bg-zinc-800/40 rounded-xl p-3">
                  <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">
                    Return
                  </p>
                  <p className="font-semibold text-zinc-200 text-xs leading-snug">
                    {bookingData?.endDate
                      ? formatDate(bookingData.endDate)
                      : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-800 pt-3">
                <span>Duration</span>
                <span className="font-semibold text-zinc-200">
                  {bookingData?.days} {bookingData?.days === 1 ? "day" : "days"}
                </span>
              </div>
              <div className="flex items-start gap-1.5 text-xs text-zinc-400">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-500" />
                <span>{bookingData?.pickupLocation}</span>
              </div>
            </div>

            {/* Cancellation policy */}
            {refundInfo && bookingData?.startDate && (
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 space-y-2">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Cancellation Policy
                </h3>
                <p className={`text-sm font-medium ${refundInfo.color}`}>
                  {refundInfo.label}
                </p>
                <div className="text-[11px] text-zinc-500 space-y-0.5">
                  <p>• 7+ days before: Full refund</p>
                  <p>• 3–6 days before: 50% refund</p>
                  <p>• 1–2 days before: 25% refund</p>
                  <p>• Same day or after: No refund</p>
                  <p className="text-zinc-600 mt-1">
                    Security deposit is used in case of any damage to the
                    vehicle or else returned as a whole.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Right panel: Price breakdown + Payment ───────────────────── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Price breakdown */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
              <h3 className="font-semibold text-zinc-200 text-sm uppercase tracking-wider">
                Price Breakdown
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>
                    {formatINR(vehicle?.pricePerDay)} × {bookingData?.days}{" "}
                    {bookingData?.days === 1 ? "day" : "days"}
                  </span>
                  <span className="text-zinc-200">
                    {formatINR(bookingData?.totalPrice)}
                  </span>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-4 space-y-3">
                {/* Pay now */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">
                      Pay Now (25% token)
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Confirms your booking
                    </p>
                  </div>
                  <span className="text-lg font-bold text-blue-400">
                    {formatINR(bookingData?.advanceAmount)}
                  </span>
                </div>

                {/* Security deposit hold */}
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-zinc-200">
                        Security Deposit (hold)
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {bookingData?.securityDepositReason ||
                          "Held on card, not charged"}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-amber-400">
                    {formatINR(bookingData?.securityDeposit)}
                  </span>
                </div>

                {/* On arrival */}
                <div className="bg-zinc-800/40 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-zinc-300">
                      Due on pickup (75%)
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Remaining rental
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-zinc-300">
                    {formatINR(bookingData?.remainingOnArrival)}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Summary CTA or Payment form ─────────────────────────────── */}
            {step === "summary" ? (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                  <Lock className="w-4 h-4" />
                  Vehicle locked — pay within your 15-min window
                </div>
                <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-4 text-[12px] text-zinc-400 space-y-1.5 leading-relaxed">
                  <p className="font-semibold text-blue-300 text-sm">
                    What happens at pickup
                  </p>
                  <p>• Show your booking confirmation & ID</p>
                  <p>
                    • Pay remaining{" "}
                    <strong className="text-zinc-200">
                      {formatINR(bookingData?.remainingOnArrival)}
                    </strong>
                  </p>
                  <p>
                    • Security deposit of{" "}
                    <strong className="text-zinc-200">
                      {formatINR(bookingData?.securityDeposit)}
                    </strong>{" "}
                    will be held and released upon safe return
                  </p>
                </div>
                <button
                  onClick={() => setStep("payment")}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-blue-900/30"
                >
                  <CreditCard className="w-4 h-4" />
                  Proceed to Pay{" "}
                  {formatINR(
                    bookingData?.advanceAmount + bookingData?.securityDeposit,
                  )}
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="w-full py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 text-sm font-medium transition cursor-pointer disabled:opacity-50"
                >
                  {cancelling ? "Cancelling…" : "Cancel & Release"}
                </button>
              </div>
            ) : (
              /* Payment form */
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-zinc-200 text-sm uppercase tracking-wider">
                    Complete Payment
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 bg-zinc-800/60 border border-zinc-700/40 px-2.5 py-1 rounded-full">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    Secure Checkout
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-400 space-y-1.5 leading-relaxed">
                  <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> Mock Payment
                    Environment
                  </p>
                  <p>
                    This is a simulated payment gateway for demonstration
                    purposes. No real charges will be made.
                  </p>
                </div>

                {bookingData?.startDate && bookingData?.endDate && (
                  <div className="bg-zinc-850/50 border border-zinc-800/60 rounded-xl p-3 flex justify-between text-xs">
                    <div>
                      <p className="text-zinc-500 text-[9px] uppercase tracking-wider mb-0.5">
                        Pickup Date
                      </p>
                      <p className="font-semibold text-zinc-300">
                        {formatDate(bookingData.startDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-zinc-500 text-[9px] uppercase tracking-wider mb-0.5">
                        Return Date
                      </p>
                      <p className="font-semibold text-zinc-300">
                        {formatDate(bookingData.endDate)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-950/20 border border-zinc-800 p-3 rounded-xl justify-center">
                  <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>
                    Your payment is secure. We use Razorpay with 256-bit SSL
                    encryption.
                  </span>
                </div>

                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-900/30 text-sm"
                >
                  {paying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Processing…
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> Pay{" "}
                      {formatINR(
                        bookingData?.advanceAmount +
                          bookingData?.securityDeposit,
                      )}{" "}
                      with Razorpay
                    </>
                  )}
                </button>

                <button
                  onClick={() => setStep("summary")}
                  disabled={paying}
                  className="w-full text-xs text-zinc-500 hover:text-zinc-300 transition cursor-pointer py-1"
                >
                  ← Back to summary
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
