import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import NearbyVehicles from "../components/NearbyVehicles";
import { useAuth } from "../context/AuthContext";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Helper to format currency in INR (₹)
const formatINR = (val) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val || 0);
};

const statusStyle = (status) => {
  if (status === "Confirmed")
    return "text-blue-400 bg-blue-500/10 border-blue-500/25";
  if (status === "Completed")
    return "text-emerald-400 bg-emerald-500/10 border-emerald-500/25";
  if (status === "Cancelled")
    return "text-zinc-500 bg-zinc-800/80 border-zinc-700/50";
  return "text-zinc-400 bg-zinc-800/80 border-zinc-700/50";
};

// ─── Renter View ────────────────────────────────────────────────────────────
const RenterView = ({
  user,
  vehiclesRented,
  onCancelBooking,
  cancellingId,
  onRejectCancellation,
  rejectingId,
  onSelectBooking,
}) => {
  const navigate = useNavigate();
  const [tripFilter, setTripFilter] = useState("All");
  const [visibleTripsCount, setVisibleTripsCount] = useState(5);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const getTripState = (bk) => {
    if (bk.status === "Cancelled" || bk.status === "Rejected") return "Cancelled";
    if (bk.status === "Completed") return "Completed";
    
    const start = new Date(bk.startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(bk.endDate);
    end.setUTCHours(0, 0, 0, 0);
    
    if (start > today) return "Upcoming";
    if (end < today) return "Completed";
    return "Ongoing";
  };

  const filteredSortedTrips = [...vehiclesRented]
    .filter((bk) => {
      if (tripFilter === "All") return true;
      if (tripFilter === "Ongoing") return getTripState(bk) === "Ongoing";
      if (tripFilter === "Upcoming") return getTripState(bk) === "Upcoming";
      if (tripFilter === "Cancelled") return getTripState(bk) === "Cancelled";
      return true;
    })
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  const handleCardClick = (e, bk) => {
    if (e.target.closest("button")) return;
    onSelectBooking(bk);
  };

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
      value: vehiclesRented.filter((t) => t.status === "Confirmed").length,
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

  const accentMap = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  };

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
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-5 hover:border-zinc-800 transition duration-200 flex flex-col gap-3"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs text-zinc-500 font-medium">
                  {s.title}
                </span>
                <span
                  className={`p-2 rounded-xl border ${accentMap[s.accent]}`}
                >
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-zinc-100">{s.value}</h3>
                <p className="text-[11px] text-zinc-500 mt-1">{s.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 space-y-4">
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
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                        <img
                          className="object-cover w-full h-full"
                          src={bk.vehicle?.images?.[0]}
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-zinc-200">
                          {bk.vehicle?.brand} {bk.vehicle?.model}
                        </h4>
                        <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {bk.vehicle?.address}
                        </p>
                        <p className="text-xs text-zinc-600 mt-0.5">
                          {new Date(bk.startDate).toLocaleDateString()} →{" "}
                          {new Date(bk.endDate).toLocaleDateString()}
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
                      <span>
                        Due on pickup:{" "}
                        <span className="text-zinc-300 font-semibold">
                          {formatINR(bk.totalPrice - bk.amountPaid)}
                        </span>
                      </span>
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
                          No booking refund applicable (past cancellation
                          deadline)
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
                          <span>
                            Cancellation Reason: {bk.cancellationReason}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cancel button / Cancellation Request */}
                  {bk.status === "Confirmed" && (
                    <div className="ml-14 flex flex-col items-start gap-2">
                      {bk.cancellationRequestByHost?.isRequested ? (
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 w-full space-y-2">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-rose-300">
                                The host has requested you to cancel this booking
                              </p>
                              <p className="text-[11px] text-rose-400 mt-1">
                                Reason: <span className="font-semibold">{bk.cancellationRequestByHost.reason}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onCancelBooking(bk._id, "renter")}
                              disabled={cancellingId === bk._id || rejectingId === bk._id}
                              className="text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg transition shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50 flex-1"
                            >
                              {cancellingId === bk._id ? "Processing…" : "Accept (100% Refund)"}
                            </button>
                            <button
                              onClick={() => onRejectCancellation(bk._id)}
                              disabled={cancellingId === bk._id || rejectingId === bk._id}
                              className="text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition border border-zinc-700 cursor-pointer disabled:opacity-50 flex-1"
                            >
                              {rejectingId === bk._id ? "Rejecting…" : "Reject Cancellation"}
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
                </div>
              ))}
            </div>
          )}
          
          {(filteredSortedTrips.length > visibleTripsCount || visibleTripsCount > 5) && (
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

const HostView = ({
  user,
  vehiclesHosted,
  financials,
  onCancelBooking,
  cancellingId,
}) => {
  const navigate = useNavigate();
  const [visibleIncomingCount, setVisibleIncomingCount] = useState(5);

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

  const accentMap = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/25";
      case "Pending":
        return "text-amber-400 bg-amber-500/10 border-amber-500/25";
      case "Rejected":
        return "text-rose-400 bg-rose-500/10 border-rose-500/25";
      default:
        return "text-zinc-400 bg-zinc-800/80 border-zinc-700/50";
    }
  };

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
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-5 hover:border-zinc-800 transition duration-200 flex flex-col gap-3"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs text-zinc-500 font-medium">
                  {s.title}
                </span>
                <span
                  className={`p-2 rounded-xl border ${accentMap[s.accent]}`}
                >
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-zinc-100">{s.value}</h3>
                <p className="text-[11px] text-zinc-500 mt-1">{s.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Listings */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base text-zinc-200">
              My Listed Vehicles
            </h3>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/my-vehicles")}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                Manage Fleet <ChevronRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => navigate("/list-vehicle")}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                Add New <PlusCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {vehiclesHosted.length === 0 ? (
            <div className="border border-dashed border-zinc-800 rounded-2xl p-8 text-center text-zinc-500 text-sm">
              <Car className="w-8 h-8 text-zinc-650 mx-auto mb-2" />
              You haven't listed any vehicles yet. Click "List a Vehicle" to get
              started!
            </div>
          ) : (
            <div className="border border-zinc-900 bg-zinc-900/10 rounded-2xl overflow-hidden divide-y divide-zinc-900">
              {vehiclesHosted.map((v, i) => (
                <div
                  key={i}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-900/30 transition"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                      {v.images?.[0] ? (
                        <img
                          src={v.images[0]}
                          alt={v.model}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Car className="w-5 h-5 text-zinc-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-zinc-200">
                        {v.brand} {v.model} ({v.year})
                      </h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {v.category} · {v.type} · {v.transmission}
                      </p>
                      {v.status === "Draft" && (
                        <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" /> Awaiting
                          VIN & License details for approval
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-zinc-200">
                        {formatINR(v.pricePerDay)}/day
                      </p>
                      {v.licensePlate ? (
                        <p className="text-[10px] text-zinc-500 font-mono tracking-wider">
                          {v.licensePlate} ({v.issuingState})
                        </p>
                      ) : (
                        <p className="text-[10px] text-amber-500/80 font-mono font-medium">
                          Incomplete Details
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {v.status === "Draft" && (
                        <button
                          onClick={() =>
                            navigate("/list-vehicle", { state: { draft: v } })
                          }
                          className="px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 text-xs font-bold transition-all cursor-pointer"
                        >
                          Complete
                        </button>
                      )}
                      <span
                        className={`text-[11px] font-medium font-mono px-2.5 py-1 rounded-full border ${getStatusColor(v.status)}`}
                      >
                        {v.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Incoming Bookings Ledger / Requests */}
        <div className="space-y-4">
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
                {financials.rentalBookingsList?.slice(0, visibleIncomingCount).map((req, i) => {
                  const payout =
                    req.hostPayout ?? Math.round((req.totalPrice || 0) * 0.95);
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
                            disabled={cancellingId === req._id || req.cancellationRequestByHost?.isRequested}
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
                    </div>
                  );
                })}
              </div>
            )}
            
            {(financials.rentalBookingsList?.length > visibleIncomingCount || visibleIncomingCount > 5) && (
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
  const [activeMode, setActiveMode] = useState("renter");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    bookingId: null,
    mode: "renter",
    selectedReason: "",
    reason: "",
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
      const { cancelBooking, requestCancellation } = await import("../api/booking");

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
      toast.error(err?.response?.data?.message || "Failed to reject cancellation");
    } finally {
      setRejectingId(null);
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
                  {confirmModal.mode === "host" ? "Request Cancellation" : "Cancel Booking"}
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
                {confirmModal.mode === "host" ? "Send Request" : "Yes, Cancel Booking"}
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
                    {selectedBooking.status !== "Cancelled" && (
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
                    <p className="text-sm font-bold text-emerald-300">Have a safe journey!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
