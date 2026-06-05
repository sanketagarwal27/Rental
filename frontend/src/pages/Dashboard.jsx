import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import NearbyVehicles from "../components/NearbyVehicles";
import { useAuth } from "../context/AuthContext";
import { getUserDashboardData } from "../api/profile";
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

// ─── Renter View ────────────────────────────────────────────────────────────
const RenterView = ({ user, vehiclesRented }) => {
  const navigate = useNavigate();
  const totalSpent = vehiclesRented.reduce(
    (sum, trip) => sum + (trip.totalPrice || 0),
    0,
  );

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
      title: "Total Spent",
      value: formatINR(totalSpent),
      sub: "Lifetime spend",
      icon: DollarSign,
      accent: "emerald",
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
              onClick={() => {
                const searchEl = document.getElementById("search-section");
                searchEl?.scrollIntoView({ behavior: "smooth" });
              }}
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
          </div>
          {vehiclesRented.length === 0 ? (
            <div className="border border-dashed border-zinc-800 rounded-2xl p-8 text-center text-zinc-500 text-sm">
              <Car className="w-8 h-8 text-zinc-650 mx-auto mb-2" />
              You haven't booked any rental trips yet.
            </div>
          ) : (
            <div className="border border-zinc-900 bg-zinc-900/10 rounded-2xl overflow-hidden divide-y divide-zinc-900">
              {vehiclesRented.map((bk, i) => (
                <div
                  key={i}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-900/30 transition"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-zinc-200">
                        {bk.vehicle?.brand} {bk.vehicle?.model}
                      </h4>
                      <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {bk.vehicle?.address} ·{" "}
                        {new Date(bk.startDate).toLocaleDateString()} to{" "}
                        {new Date(bk.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end">
                    <span className="font-semibold text-sm text-zinc-200">
                      {formatINR(bk.totalPrice)}
                    </span>
                    <span
                      className={`text-[11px] font-medium font-mono px-2.5 py-1 rounded-full border ${
                        bk.status === "Confirmed"
                          ? "text-blue-400 bg-blue-500/10 border-blue-500/25"
                          : bk.status === "Completed"
                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
                            : "text-zinc-400 bg-zinc-800/80 border-zinc-700/50"
                      }`}
                    >
                      {bk.status}
                    </span>
                  </div>
                </div>
              ))}
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
                onClick: () => {
                  const searchEl = document.getElementById("search-section");
                  searchEl?.scrollIntoView({ behavior: "smooth" });
                },
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
      <div id="search-section" className="border-t border-zinc-900 pt-8">
        <NearbyVehicles />
      </div>
    </div>
  );
};

// ─── Host View ───────────────────────────────────────────────────────────────
const HostView = ({ user, vehiclesHosted, financials }) => {
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
      title: "Total Earned",
      value: formatINR(financials.totalEarned),
      sub: "Credited earnings",
      icon: DollarSign,
      accent: "emerald",
    },
    {
      title: "Pending",
      value: vehiclesHosted.filter((v) => v.status === "Pending")
        .length,
      sub: "Awaiting review",
      icon: Clock,
      accent: "amber",
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
                {financials.rentalBookingsList?.slice(0, 3).map((req, i) => (
                  <div
                    key={i}
                    className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-4 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-zinc-200">
                          {req.customer?.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {req.vehicle?.brand} {req.vehicle?.model}
                        </p>
                        <p className="text-[10px] text-zinc-650 mt-0.5">
                          {new Date(req.startDate).toLocaleDateString()} -{" "}
                          {new Date(req.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-medium border px-2 py-0.5 rounded-full shrink-0 ${
                          req.status === "Confirmed"
                            ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
                            : req.status === "Completed"
                              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                              : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                  </div>
                ))}
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
        <div className="flex-1 p-8 max-w-7xl w-full mx-auto flex flex-col">
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
            />
          ) : (
            <HostView
              user={user}
              vehiclesHosted={dashboardData?.vehiclesHosted || []}
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
    </div>
  );
};

export default Dashboard;
