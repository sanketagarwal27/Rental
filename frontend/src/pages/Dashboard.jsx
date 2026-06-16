import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import NearbyVehicles from "../components/NearbyVehicles";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { getUserDashboardData } from "../api/profile";
import { cancelBooking } from "../api/booking";
import {
  Car,
  Calendar,
  DollarSign,
  Star,
  Bell,
  ShieldCheck,
  ShieldAlert,
  Shield,
  ChevronRight,
  ArrowUpRight,
  PlusCircle,
  TrendingUp,
  Clock,
  MapPin,
  Zap,
  Users,
  BarChart2,
  CheckCircle2,
  AlertCircle,
  Search,
  Loader2,
  PackageCheck,
  RotateCcw,
  CreditCard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import SupportChat from "../components/SupportChat";

import { formatINR } from "../utils/dashboardUtils";
import StatsCard from "../components/dashboard/StatsCard";
import RenterTripsTable from "../components/dashboard/RenterTripsTable";
import HostVehiclesTable from "../components/dashboard/HostVehiclesTable";
import IncomingBookingsTable from "../components/dashboard/IncomingBookingsTable";
import VehicleEarningsChart from "../components/dashboard/VehicleEarningsChart";

// ─── Renter View ────────────────────────────────────────────────────────────
const RenterView = ({
  user,
  vehiclesRented,
  onCancelBooking,
  cancellingId,
  onRejectCancellation,
  rejectingId,
  onSelectBooking,
  onPickedUp,
  pickingUpId,
  onReturnAction,
  returnActionId,
}) => {
  const navigate = useNavigate();

  const stats = [
    {
      title: "Total Trips Booked",
      value: vehiclesRented.length,
      sub: "All time rentals",
      icon: Calendar,
      accent: "blue",
    },
    {
      title: "Active Rentals",
      value: vehiclesRented.filter(
        (t) => t.status === "Confirmed" || t.status === "Ongoing",
      ).length,
      sub: "Upcoming or ongoing",
      icon: Car,
      accent: "amber",
    },
    {
      title: "Completed Trips",
      value: vehiclesRented.filter((t) => t.status === "Completed").length,
      sub: "Returned safely",
      icon: CheckCircle2,
      accent: "indigo",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-zinc-900 bg-gradient-to-r from-blue-600/10 via-blue-900/5 to-transparent p-8">
        <div className="relative z-10 max-w-xl space-y-3">
          <span className="text-xs font-semibold text-blue-400 tracking-wider uppercase font-mono bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
            Renter Dashboard
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 mt-4">
            Where are you headed, {user?.name?.split(" ")[0] || "Explorer"}?
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Browse hatchbacks, sedans, SUVs, motorcycles, and EVs — for every
            trip and every budget.
          </p>
          <div className="pt-2 flex gap-3">
            <button
              onClick={() => navigate("/search")}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              <Search className="w-4 h-4" /> Find a Vehicle
            </button>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-blue-500/5 to-transparent pointer-events-none" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s, i) => (
          <StatsCard key={i} {...s} />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 space-y-4">
          <RenterTripsTable
            vehiclesRented={vehiclesRented}
            onSelectBooking={onSelectBooking}
            onPickedUp={onPickedUp}
            pickingUpId={pickingUpId}
            onCancelBooking={onCancelBooking}
            cancellingId={cancellingId}
            onRejectCancellation={onRejectCancellation}
            rejectingId={rejectingId}
            onReturnAction={onReturnAction}
            returnActionId={returnActionId}
          />
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="font-semibold text-base text-zinc-200">
            Quick Actions
          </h3>
          <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-5 space-y-3">
            {[
              {
                icon: Calendar,
                label: "Browse Vehicles",
                sub: "Find cars or motorbikes near you",
                color: "text-amber-400",
                onClick: () => navigate("/search"),
              },
              {
                icon: Star,
                label: "Renting Support",
                sub: "Get help with active trips",
                color: "text-indigo-400",
                onClick: () => navigate("/dashboard/messages"),
              },
            ].map((action, i) => {
              const Icon = action.icon;
              return (
                <button
                  key={i}
                  onClick={action.onClick}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-900/40 border border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/80 transition cursor-pointer text-left"
                >
                  <div className={`p-2 rounded-lg bg-zinc-900 ${action.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      {action.label}
                    </p>
                    <p className="text-[11px] text-zinc-500">{action.sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600 ml-auto" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Nearby Vehicles — full width */}
      <div className="border-t border-zinc-900 pt-8">
        <NearbyVehicles />
      </div>
    </div>
  );
};

// ─── Host View ────────────────────────────────────────────────────────────
const HostView = ({
  user,
  vehiclesHosted,
  financials,
  onCancelBooking,
  cancellingId,
  onMarkReturned,
  returningId,
}) => {
  const navigate = useNavigate();

  const stats = [
    {
      title: "Listed Vehicles",
      value: vehiclesHosted.length,
      sub: `${vehiclesHosted.filter((v) => v.status === "Approved").length} approved listing(s)`,
      icon: Car,
      accent: "blue",
    },
    {
      title: "Total Bookings Received",
      value: financials.totalRentedOutCount || 0,
      sub: "Total guest bookings",
      icon: Users,
      accent: "indigo",
    },
    {
      title: "Your Net Earnings",
      value: formatINR(financials.totalEarned),
      sub: "After 5% platform fee",
      icon: DollarSign,
      accent: "emerald",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-zinc-900 bg-gradient-to-r from-emerald-600/10 via-emerald-900/5 to-transparent p-8">
        <div className="relative z-10 max-w-xl space-y-3">
          <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase font-mono bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            Host Dashboard
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 mt-4">
            Earn by sharing your vehicle
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            List your car, scooter, or SUV and start earning whenever it's not
            in use. You set the price and availability.
          </p>
          <div className="pt-2 flex gap-3">
            <button
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
              onClick={() => navigate("/list-vehicle")}
            >
              <PlusCircle className="w-4 h-4" /> List a Vehicle
            </button>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none" />
      </div>

      {/* Platform Commission Disclosure */}
      <div className="bg-amber-500/6 border border-amber-500/20 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-sm font-semibold text-amber-300">
            Platform Commission Policy
          </span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          A{" "}
          <span className="text-amber-300 font-semibold">
            5% platform commission
          </span>{" "}
          is deducted from your total booking amount. You receive{" "}
          <span className="text-emerald-400 font-semibold">95%</span> as your
          net payout, released upon trip completion. This fee covers payment
          processing, platform maintenance, and customer support.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {stats.map((s, i) => (
          <StatsCard key={i} {...s} />
        ))}
      </div>

      {/* Earnings Chart */}
      <div className="mt-8 mb-6">
        <VehicleEarningsChart rentals={financials.rentalBookingsList} />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Listings */}
        <div className="lg:col-span-2 space-y-4">
          <HostVehiclesTable vehiclesHosted={vehiclesHosted} />
        </div>

        {/* Incoming Bookings Ledger / Requests */}
        <div className="space-y-4">
          <IncomingBookingsTable
            financials={financials}
            onCancelBooking={onCancelBooking}
            cancellingId={cancellingId}
            onMarkReturned={onMarkReturned}
            returningId={returningId}
          />

          {/* Quick Tip */}
          <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-semibold">Hosting Tip</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Listings with detailed features and license plate uploads get
              verified quickly and receive{" "}
              <span className="text-zinc-200 font-medium">
                3× more guest requests
              </span>
              .
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              If your listing is{" "}
              <span className="text-white font-medium">rejected</span>, then try
              filling it again with{" "}
              <span className="text-white font-medium">correct</span> details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Dashboard ──────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [activeMode, setActiveMode] = useState("renter");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [pickingUpId, setPickingUpId] = useState(null);
  const [returningId, setReturningId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    bookingId: null,
    mode: "renter",
    selectedReason: "",
    reason: "",
  });
  const [pickupModal, setPickupModal] = useState({
    isOpen: false,
    bookingId: null,
    remainingAmount: 0,
  });

  const [returnPayModal, setReturnPayModal] = useState({
    isOpen: false,
    bookingId: null,
    paymentDue: 0,
  });

  const [returnActionId, setReturnActionId] = useState(null);
  const [returnModal, setReturnModal] = useState({
    isOpen: false,
    bookingId: null,
    depositHeld: 0,
    pricePerDay: 0,
    damages: [], // [{ type: "Scratch", amount: 500 }]
  });

  const onCancelBooking = (bookingId, mode) => {
    setConfirmModal({
      isOpen: true,
      bookingId,
      mode,
      selectedReason: "",
      reason: "",
    });
  };

  const handleConfirmCancellation = async () => {
    const { bookingId, mode, selectedReason, reason } = confirmModal;
    if (!bookingId) return;
    if (mode === "host") {
      if (!selectedReason) {
        const { toast } = await import("sonner");
        toast.error("Please select a reason for cancellation.");
        return;
      }
      if (selectedReason === "Other" && !reason.trim()) {
        const { toast } = await import("sonner");
        toast.error("Please specify your reason for cancellation.");
        return;
      }
    }
    try {
      setCancellingId(bookingId);
      setConfirmModal({
        isOpen: false,
        bookingId: null,
        mode: "renter",
        selectedReason: "",
        reason: "",
      });
      const { toast } = await import("sonner");
      const { cancelBooking, requestCancellation } =
        await import("../api/booking");

      const cancelReason =
        mode === "host"
          ? selectedReason === "Other"
            ? reason.trim()
            : selectedReason
          : "Cancelled by customer from dashboard";

      let res;
      if (mode === "host") {
        res = await requestCancellation(bookingId, cancelReason);
        toast.success(res.message || "Cancellation request sent.");
      } else {
        res = await cancelBooking(bookingId, cancelReason);
        toast.success(res.message || "Booking cancelled successfully.");
      }

      fetchDashboard();
    } catch (err) {
      const { toast } = await import("sonner");
      toast.error(
        err?.response?.data?.message ||
          "Could not cancel booking. Please try again.",
      );
    } finally {
      setCancellingId(null);
    }
  };

  const handleRejectCancellation = async (bookingId) => {
    try {
      setRejectingId(bookingId);
      const { toast } = await import("sonner");
      const { rejectCancellation } = await import("../api/booking");
      const res = await rejectCancellation(bookingId);
      toast.success(res.message || "Cancellation rejected");
      fetchDashboard();
    } catch (err) {
      const { toast } = await import("sonner");
      toast.error(
        err?.response?.data?.message || "Failed to reject cancellation",
      );
    } finally {
      setRejectingId(null);
    }
  };

  const onPickedUp = (bookingId, remainingAmount) => {
    setPickupModal({ isOpen: true, bookingId, remainingAmount });
  };

  const handleConfirmPickup = async () => {
    const { bookingId, remainingAmount } = pickupModal;
    if (!bookingId) return;

    // Close modal immediately — Razorpay opens its own UI
    setPickupModal({ isOpen: false, bookingId: null, remainingAmount: 0 });

    try {
      setPickingUpId(bookingId);
      const { toast } = await import("sonner");

      // Dynamically load Razorpay script if not already present
      await new Promise((resolve, reject) => {
        if (window.Razorpay) {
          resolve();
          return;
        }
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = resolve;
        s.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
        document.body.appendChild(s);
      });

      const { createPickupOrder, markPickedUp } =
        await import("../api/booking");

      // Create Razorpay order for the remaining 75%
      const orderRes = await createPickupOrder(bookingId);
      if (!orderRes?.success) throw new Error("Could not create payment order");

      const { orderId, amount, currency } = orderRes.data;

      // Open Razorpay checkout
      await new Promise((resolve) => {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount,
          currency,
          name: "RentWheels",
          description: `Remaining trip payment — ${formatINR(remainingAmount)}`,
          order_id: orderId,
          handler: async function (response) {
            try {
              const res = await markPickedUp(bookingId, {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              });
              toast.success(
                res.message || "Payment confirmed! Trip is now ongoing.",
              );
              fetchDashboard();
            } catch (err) {
              toast.error(
                err?.response?.data?.message ||
                  "Payment verified but pickup failed.",
              );
            } finally {
              resolve();
            }
          },
          modal: {
            ondismiss: function () {
              toast.info("Payment cancelled. Pickup not confirmed.");
              resolve();
            },
          },
          theme: { color: "#10B981" },
        };
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (response) {
          toast.error(response.error.description || "Payment failed.");
          resolve();
        });
        rzp.open();
      });
    } catch (err) {
      const { toast } = await import("sonner");
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Could not initiate pickup payment. Please try again.",
      );
    } finally {
      setPickingUpId(null);
    }
  };

  const handleReturnAction = async (bookingId, totalAmount, depositHeld) => {
    if (totalAmount <= depositHeld) {
      try {
        setReturnActionId(bookingId);
        const { toast } = await import("sonner");
        const { acceptReturn } = await import("../api/booking");
        const res = await acceptReturn(bookingId);
        toast.success(res.message || "Return completed successfully");
        fetchDashboard();
      } catch (err) {
        const { toast } = await import("sonner");
        toast.error(
          err?.response?.data?.message || "Failed to complete return",
        );
      } finally {
        setReturnActionId(null);
      }
    } else {
      setReturnPayModal({
        isOpen: true,
        bookingId,
        paymentDue: totalAmount - depositHeld,
      });
    }
  };

  const handleConfirmReturnPayment = async () => {
    const { bookingId, paymentDue } = returnPayModal;
    if (!bookingId) return;

    setReturnPayModal({ isOpen: false, bookingId: null, paymentDue: 0 });

    try {
      setReturnActionId(bookingId);
      const { toast } = await import("sonner");

      await new Promise((resolve, reject) => {
        if (window.Razorpay) {
          resolve();
          return;
        }
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = resolve;
        s.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
        document.body.appendChild(s);
      });

      const { createReturnPaymentOrder, payAndAcceptReturn } =
        await import("../api/booking");
      const orderRes = await createReturnPaymentOrder(bookingId);
      if (!orderRes?.success) throw new Error("Could not create payment order");

      const { orderId, amount, currency } = orderRes.data;

      await new Promise((resolve) => {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount,
          currency,
          name: "RentWheels",
          description: `Extra Return Charges — ${formatINR(paymentDue)}`,
          order_id: orderId,
          handler: async function (response) {
            try {
              const res = await payAndAcceptReturn(bookingId, {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              });
              toast.success(
                res.message || "Payment confirmed! Trip completed.",
              );
              fetchDashboard();
            } catch (err) {
              toast.error(
                err?.response?.data?.message ||
                  "Payment verified but completion failed.",
              );
            } finally {
              resolve();
            }
          },
          modal: {
            ondismiss: function () {
              toast.info("Payment cancelled.");
              resolve();
            },
          },
          theme: { color: "#F59E0B" },
        };
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (response) {
          toast.error(response.error.description || "Payment failed.");
          resolve();
        });
        rzp.open();
      });
    } catch (err) {
      const { toast } = await import("sonner");
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Could not initiate payment.",
      );
    } finally {
      setReturnActionId(null);
    }
  };

  const onMarkReturned = (bookingId, depositHeld, pricePerDay) => {
    setReturnModal({
      isOpen: true,
      bookingId,
      depositHeld,
      pricePerDay,
      damages: [],
    });
  };

  const handleConfirmReturn = async () => {
    const { bookingId, damages, depositHeld, pricePerDay } = returnModal;
    if (!bookingId) return;

    const totalExtraCharge = damages.reduce(
      (sum, d) => sum + (Number(d.amount) || 0),
      0,
    );
    const maxAllowedCharge = depositHeld + 2 * pricePerDay;

    if (totalExtraCharge > maxAllowedCharge) {
      const { toast } = await import("sonner");
      toast.error(
        `Extra charges cannot exceed maximum allowed limit of ₹${maxAllowedCharge}.`,
      );
      return;
    }

    try {
      setReturningId(bookingId);
      setReturnModal({
        isOpen: false,
        bookingId: null,
        depositHeld: 0,
        pricePerDay: 0,
        damages: [],
      });
      const { toast } = await import("sonner");
      const { markReturned } = await import("../api/booking");
      const res = await markReturned(bookingId, damages);
      toast.success(res.message || "Vehicle return requested successfully.");
      fetchDashboard();
    } catch (err) {
      const { toast } = await import("sonner");
      toast.error(
        err?.response?.data?.message ||
          "Could not process return. Please try again.",
      );
    } finally {
      setReturningId(null);
    }
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await getUserDashboardData();
      if (response?.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleBookingUpdate = async (data) => {
      const { toast } = await import("sonner");
      const msg = data.actionMessage || `Status changed to ${data.status.replace(/_/g, " ")}`;
      toast.success(`Booking update: ${msg}`);
      fetchDashboard();
    };
    socket.on("bookingUpdated", handleBookingUpdate);
    return () => {
      socket.off("bookingUpdated", handleBookingUpdate);
    };
  }, [socket]);

  return (
    <div className="flex min-h-screen bg-transparent text-zinc-100 font-sans selection:bg-blue-600/30">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Sticky Header */}
        <header className="h-20 border-b border-zinc-900 px-8 flex items-center justify-between sticky top-0 bg-zinc-950/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-200">
              Dashboard
            </h2>
            {/* Mode Switcher */}
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-1">
              <button
                onClick={() => setActiveMode("renter")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeMode === "renter"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Search className="w-4 h-4" />
                Renting
              </button>
              <button
                onClick={() => setActiveMode("host")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeMode === "host"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Car className="w-4 h-4" />
                Hosting
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {user?.isVerifiedEmail ? (
                <ShieldCheck className="w-5 h-5 text-blue-500" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-red-500" />
              )}
              <span className="text-xs text-zinc-400 font-medium font-mono uppercase bg-zinc-900 px-2 py-1 rounded">
                {user?.isVerifiedEmail ? "Verified" : "Not Verified"}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8 pb-32 lg:pb-8 max-w-7xl w-full mx-auto flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
              <p className="text-sm text-zinc-500 font-medium">
                Fetching dashboard details...
              </p>
            </div>
          ) : activeMode === "renter" ? (
            <RenterView
              user={user}
              vehiclesRented={dashboardData?.vehiclesRented || []}
              onCancelBooking={onCancelBooking}
              cancellingId={cancellingId}
              onRejectCancellation={handleRejectCancellation}
              rejectingId={rejectingId}
              onSelectBooking={setSelectedBooking}
              onPickedUp={onPickedUp}
              pickingUpId={pickingUpId}
              onReturnAction={handleReturnAction}
              returnActionId={returnActionId}
            />
          ) : (
            <HostView
              user={user}
              vehiclesHosted={dashboardData?.vehiclesHosted || []}
              onCancelBooking={onCancelBooking}
              cancellingId={cancellingId}
              financials={
                dashboardData?.financials || {
                  totalEarned: 0,
                  totalRentedOutCount: 0,
                  rentalBookingsList: [],
                }
              }
              onMarkReturned={onMarkReturned}
              returningId={returningId}
            />
          )}
        </div>
      </main>

      {/* Custom Cancellation Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-3 text-rose-400">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-zinc-100 text-base">
                  {confirmModal.mode === "host"
                    ? "Request Cancellation"
                    : "Cancel Booking"}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  {confirmModal.mode === "host"
                    ? "Provide a reason to the guest why they need to cancel this booking."
                    : "Are you sure you want to cancel your booking? Refund will be calculated based on how close you are to the start date."}
                </p>
              </div>
            </div>

            {confirmModal.mode === "host" && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                    Reason for Cancellation
                  </label>
                  <select
                    value={confirmModal.selectedReason}
                    onChange={(e) =>
                      setConfirmModal((prev) => ({
                        ...prev,
                        selectedReason: e.target.value,
                      }))
                    }
                    className="bg-zinc-800 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-zinc-150 text-sm focus:outline-none focus:border-rose-500/60 focus:bg-zinc-800 transition cursor-pointer"
                  >
                    <option value="" disabled>
                      Select a reason...
                    </option>
                    <option value="Vehicle broke down / needs urgent maintenance">
                      Vehicle broke down / needs urgent maintenance
                    </option>
                    <option value="Host personal emergency">
                      Host personal emergency
                    </option>
                    <option value="Vehicle was in an accident">
                      Vehicle was in an accident
                    </option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {confirmModal.selectedReason === "Other" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                      Specify Custom Reason
                    </label>
                    <textarea
                      value={confirmModal.reason}
                      onChange={(e) =>
                        setConfirmModal((prev) => ({
                          ...prev,
                          reason: e.target.value,
                        }))
                      }
                      placeholder="Write custom reason..."
                      rows={3}
                      className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-rose-500/60 focus:bg-zinc-800 transition resize-none"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() =>
                  setConfirmModal({
                    isOpen: false,
                    bookingId: null,
                    mode: "renter",
                    selectedReason: "",
                    reason: "",
                  })
                }
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs border border-zinc-700 transition cursor-pointer"
              >
                No, Keep Booking
              </button>
              <button
                onClick={handleConfirmCancellation}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition cursor-pointer flex items-center justify-center"
              >
                {confirmModal.mode === "host"
                  ? "Send Request"
                  : "Yes, Cancel Booking"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pickup Confirmation Modal */}
      {pickupModal.isOpen && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <PackageCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-100 text-base">
                  Pay & Confirm Pickup
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Pay the remaining balance securely via Razorpay to confirm
                  your pickup and start the trip.
                </p>
              </div>
            </div>
            {pickupModal.remainingAmount > 0 && (
              <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400">
                    Due via Razorpay (75%)
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">
                    Securely processed — no cash needed
                  </p>
                </div>
                <span className="text-xl font-bold text-emerald-300">
                  {formatINR(pickupModal.remainingAmount)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-[11px] text-zinc-500 bg-zinc-800/50 rounded-lg px-3 py-2">
              <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>
                Payment is verified by Razorpay. Your trip status changes to{" "}
                <span className="text-amber-400 font-semibold">Ongoing</span>{" "}
                only after successful payment.
              </span>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() =>
                  setPickupModal({
                    isOpen: false,
                    bookingId: null,
                    remainingAmount: 0,
                  })
                }
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs border border-zinc-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPickup}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <CreditCard className="w-3.5 h-3.5" />
                Pay {formatINR(pickupModal.remainingAmount)} via Razorpay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renter Return Pay Modal */}
      {returnPayModal.isOpen && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-100 text-base">
                  Pay Extra Return Charges
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  The damage/extra charges exceed your security deposit. Please
                  pay the remaining balance to complete the trip.
                </p>
              </div>
            </div>

            <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400">Due via Razorpay</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">
                  Securely processed
                </p>
              </div>
              <span className="text-xl font-bold text-amber-400">
                {formatINR(returnPayModal.paymentDue)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-zinc-500 bg-zinc-800/50 rounded-lg px-3 py-2">
              <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                Payment is verified by Razorpay. Your trip will be marked as
                Completed after payment.
              </span>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() =>
                  setReturnPayModal({
                    isOpen: false,
                    bookingId: null,
                    paymentDue: 0,
                  })
                }
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs border border-zinc-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReturnPayment}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <CreditCard className="w-3.5 h-3.5" />
                Pay {formatINR(returnPayModal.paymentDue)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Confirmation Modal */}
      {returnModal.isOpen && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <RotateCcw className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-100 text-base">
                  Confirm Vehicle Return
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Confirm the vehicle has been returned. Optionally enter any
                  damage or extra charges to deduct from the security deposit.
                </p>
              </div>
            </div>

            <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-zinc-500">
                  Security deposit held
                </p>
                <p className="text-xl font-bold text-amber-300 mt-0.5">
                  {formatINR(returnModal.depositHeld)}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                  Extra / Damage Charges
                </label>
                <button
                  onClick={() =>
                    setReturnModal((prev) => ({
                      ...prev,
                      damages: [
                        ...prev.damages,
                        { type: "Scratch", amount: "" },
                      ],
                    }))
                  }
                  className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded border border-zinc-700 transition cursor-pointer"
                >
                  + Add Charge
                </button>
              </div>

              {returnModal.damages.length === 0 ? (
                <p className="text-[11px] text-zinc-500 bg-zinc-800/30 p-3 rounded-xl border border-zinc-800/50">
                  No charges added. Full deposit of{" "}
                  <span className="text-amber-400 font-semibold">
                    {formatINR(returnModal.depositHeld)}
                  </span>{" "}
                  will be released to customer.
                </p>
              ) : (
                <div className="space-y-2">
                  {returnModal.damages.map((damage, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={damage.type}
                        onChange={(e) => {
                          const newDamages = [...returnModal.damages];
                          newDamages[idx].type = e.target.value;
                          setReturnModal((prev) => ({
                            ...prev,
                            damages: newDamages,
                          }));
                        }}
                        className="flex-1 bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-violet-500/60 cursor-pointer"
                      >
                        <option
                          value="Scratch"
                          className="bg-zinc-900 text-zinc-100"
                        >
                          Scratch
                        </option>
                        <option
                          value="Dent"
                          className="bg-zinc-900 text-zinc-100"
                        >
                          Dent
                        </option>
                        <option
                          value="Missing Fuel"
                          className="bg-zinc-900 text-zinc-100"
                        >
                          Missing Fuel
                        </option>
                        <option
                          value="Late Return"
                          className="bg-zinc-900 text-zinc-100"
                        >
                          Late Return
                        </option>
                        <option
                          value="Dirty Interior"
                          className="bg-zinc-900 text-zinc-100"
                        >
                          Dirty Interior
                        </option>
                        <option
                          value="Other"
                          className="bg-zinc-900 text-zinc-100"
                        >
                          Other
                        </option>
                      </select>
                      <div className="relative w-28">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={damage.amount}
                          onChange={(e) => {
                            const newDamages = [...returnModal.damages];
                            newDamages[idx].amount = e.target.value;
                            setReturnModal((prev) => ({
                              ...prev,
                              damages: newDamages,
                            }));
                          }}
                          placeholder="0"
                          className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl pl-7 pr-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-violet-500/60"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const newDamages = [...returnModal.damages];
                          newDamages.splice(idx, 1);
                          setReturnModal((prev) => ({
                            ...prev,
                            damages: newDamages,
                          }));
                        }}
                        className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                        title="Remove"
                      >
                        <span className="font-bold text-lg leading-none">
                          ×
                        </span>
                      </button>
                    </div>
                  ))}

                  {/* Summary */}
                  <div className="mt-2 p-3 bg-zinc-950/40 rounded-xl border border-zinc-800/50 space-y-1">
                    <p className="text-[11px] text-zinc-400 flex justify-between">
                      <span>Total Extra Charges:</span>
                      <span className="text-rose-400 font-semibold">
                        {formatINR(
                          returnModal.damages.reduce(
                            (sum, d) => sum + (Number(d.amount) || 0),
                            0,
                          ),
                        )}
                      </span>
                    </p>
                    <p className="text-[11px] text-zinc-400 flex justify-between">
                      <span>Maximum Allowed:</span>
                      <span className="text-zinc-300 font-semibold">
                        {formatINR(
                          returnModal.depositHeld + 2 * returnModal.pricePerDay,
                        )}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() =>
                  setReturnModal({
                    isOpen: false,
                    bookingId: null,
                    depositHeld: 0,
                    pricePerDay: 0,
                    damages: [],
                  })
                }
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs border border-zinc-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReturn}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto divide-y divide-zinc-800 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-5 flex justify-between items-center bg-zinc-950/20">
              <div>
                <h3 className="font-bold text-zinc-100 text-base">
                  Trip Details
                </h3>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  ID: {selectedBooking._id}
                </p>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:text-zinc-200 text-zinc-400 transition cursor-pointer text-xs font-semibold px-3"
              >
                Close
              </button>
            </div>

            {/* Vehicle Details */}
            {selectedBooking.vehicle && (
              <div className="p-5 space-y-4">
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Vehicle Info
                  </h4>
                  {selectedBooking.vehicle.images &&
                  selectedBooking.vehicle.images.length > 0 ? (
                    <div className="flex snap-x snap-mandatory overflow-x-auto gap-2 p-1 scrollbar-none bg-zinc-950/40 border border-zinc-800 rounded-xl">
                      {selectedBooking.vehicle.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`${selectedBooking.vehicle.brand} ${selectedBooking.vehicle.model} ${idx + 1}`}
                          className="snap-start w-[240px] h-36 object-cover rounded-lg shrink-0"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="w-full h-36 bg-zinc-800 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-500">
                      <Car className="w-10 h-10" />
                    </div>
                  )}

                  <div className="flex justify-between items-start mt-1">
                    <div>
                      <h5 className="font-bold text-sm text-zinc-200">
                        {selectedBooking.vehicle.brand}{" "}
                        {selectedBooking.vehicle.model} (
                        {selectedBooking.vehicle.year})
                      </h5>
                      <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-zinc-500" />{" "}
                        {selectedBooking.vehicle.address}
                      </p>
                    </div>
                    {selectedBooking.vehicle.licensePlate && (
                      <span className="text-[10px] font-mono font-bold bg-zinc-800 border border-zinc-700 text-zinc-400 px-2.5 py-1 rounded uppercase tracking-wider shrink-0">
                        {selectedBooking.vehicle.licensePlate}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-[10px] text-zinc-400">
                    <span className="bg-zinc-800 border border-zinc-750 px-2 py-0.5 rounded-full">
                      {selectedBooking.vehicle.type}
                    </span>
                    <span className="bg-zinc-800 border border-zinc-750 px-2 py-0.5 rounded-full">
                      {selectedBooking.vehicle.fuelType}
                    </span>
                    <span className="bg-zinc-800 border border-zinc-750 px-2 py-0.5 rounded-full">
                      {selectedBooking.vehicle.transmission}
                    </span>
                    <span className="bg-zinc-800 border border-zinc-750 px-2 py-0.5 rounded-full">
                      {selectedBooking.vehicle.seats} seats
                    </span>
                  </div>

                  {selectedBooking.vehicle.features &&
                    selectedBooking.vehicle.features.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">
                          Features
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {selectedBooking.vehicle.features.map((feat, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] bg-zinc-800 border border-zinc-700 text-zinc-350 px-1.5 py-0.5 rounded"
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

            {/* Booking Details */}
            <div className="p-5 space-y-4">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Booking Info
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-zinc-500 mb-0.5">Trip Starts</p>
                  <p className="font-semibold text-zinc-200">
                    {new Date(selectedBooking.startDate).toLocaleDateString(
                      "en-IN",
                      {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      },
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-0.5">Trip Ends</p>
                  <p className="font-semibold text-zinc-200">
                    {new Date(selectedBooking.endDate).toLocaleDateString(
                      "en-IN",
                      {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      },
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-0.5">Status</p>
                  <span
                    className={`inline-block text-[10px] font-mono font-medium border px-2 py-0.5 rounded-full ${statusStyle(selectedBooking.status)}`}
                  >
                    {selectedBooking.status}
                  </span>
                </div>
                <div>
                  <p className="text-zinc-500 mb-0.5">Booking Made</p>
                  <p className="text-zinc-450 font-mono text-[10px]">
                    {new Date(
                      selectedBooking.createdAt || Date.now(),
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-5 space-y-3 bg-zinc-950/10">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Payment Breakdown
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Total Price</span>
                  <span className="font-semibold text-zinc-200">
                    {formatINR(selectedBooking.totalPrice)}
                  </span>
                </div>
                {selectedBooking.amountPaid > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">
                        Advance token paid (25%)
                      </span>
                      <span className="font-semibold text-emerald-400">
                        {formatINR(selectedBooking.amountPaid)}
                      </span>
                    </div>
                    {selectedBooking.securityDepositHeld > 0 && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">
                          Security deposit hold (released on return)
                        </span>
                        <span className="font-semibold text-amber-400">
                          {formatINR(selectedBooking.securityDepositHeld)}
                        </span>
                      </div>
                    )}
                    {selectedBooking.status === "Confirmed" && (
                      <div className="flex justify-between border-t border-zinc-800 pt-2 font-medium">
                        <span className="text-zinc-300">
                          Remaining due on pickup (75%)
                        </span>
                        <span className="text-zinc-150 font-bold">
                          {formatINR(
                            selectedBooking.totalPrice -
                              selectedBooking.amountPaid,
                          )}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {selectedBooking.status === "Cancelled" && (
                  <div className="border-t border-zinc-800 pt-2 space-y-1 bg-rose-500/5 p-2.5 rounded-xl border border-rose-500/10">
                    <p className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider">
                      Cancellation Summary
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Reason:{" "}
                      <span className="text-zinc-300">
                        {selectedBooking.cancellationReason ||
                          "No reason provided"}
                      </span>
                    </p>
                    {selectedBooking.refundAmount > 0 ? (
                      <p className="text-[11px] text-emerald-400 font-medium">
                        Refund processed:{" "}
                        {formatINR(selectedBooking.refundAmount)}
                      </p>
                    ) : (
                      <p className="text-[11px] text-zinc-500 font-medium">
                        No booking refund applicable under policy.
                      </p>
                    )}
                    {selectedBooking.securityDepositHeld > 0 && (
                      <p className="text-[11px] text-amber-400 font-medium">
                        Security deposit hold released in full.
                      </p>
                    )}
                  </div>
                )}

                {selectedBooking.status === "Confirmed" && (
                  <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <p className="text-sm font-bold text-emerald-300">
                      Have a safe journey!
                    </p>
                  </div>
                )}
                {selectedBooking.status === "Ongoing" && (
                  <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <p className="text-sm font-bold text-amber-300">
                      Trip in progress — enjoy your ride!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Support Chat Widget */}
      <SupportChat isWidget={true} />
    </div>
  );
};

export default Dashboard;
