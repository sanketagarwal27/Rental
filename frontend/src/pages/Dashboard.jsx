import { useState } from "react";
import Sidebar from "../components/Sidebar";
import NearbyVehicles from "../components/NearbyVehicles";
import { useAuth } from "../context/AuthContext";
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
} from "lucide-react";

// ─── Renter View ────────────────────────────────────────────────────────────
const RenterView = ({ user }) => {
  //Mock Data
  const stats = [
    {
      title: "Total Trips",
      value: "14",
      sub: "+3 this month",
      icon: Calendar,
      accent: "blue",
    },
    {
      title: "Active Rentals",
      value: "2",
      sub: "Next return: Sat",
      icon: Car,
      accent: "amber",
    },
    {
      title: "Total Spent",
      value: "₹52,400",
      sub: "Lifetime",
      icon: DollarSign,
      accent: "emerald",
    },
    {
      title: "Avg. Rating Given",
      value: "4.8",
      sub: "Across all trips",
      icon: Star,
      accent: "indigo",
    },
  ];

  const accentMap = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  };

  const recentBookings = [
    {
      id: "BK-8902",
      vehicle: "Honda City (Sedan)",
      dates: "Jun 12 – Jun 15, 2026",
      location: "Mumbai, MH",
      status: "Confirmed",
      amount: "₹5,400",
      statusClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    },
    {
      id: "BK-8741",
      vehicle: "Maruti Swift (Hatchback)",
      dates: "May 28 – May 30, 2026",
      location: "Pune, MH",
      status: "Completed",
      amount: "₹2,700",
      statusClass: "text-zinc-400 bg-zinc-800/80 border-zinc-700/50",
    },
    {
      id: "BK-8600",
      vehicle: "Royal Enfield Classic 350",
      dates: "May 10 – May 11, 2026",
      location: "Goa",
      status: "Completed",
      amount: "₹1,800",
      statusClass: "text-zinc-400 bg-zinc-800/80 border-zinc-700/50",
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
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 cursor-pointer">
              <Search className="w-4 h-4" /> Find a Vehicle
            </button>
            <button className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-medium text-sm px-4 py-2.5 rounded-xl transition-all cursor-pointer">
              <Clock className="w-4 h-4" /> My Bookings
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
              Recent Bookings
            </h3>
            <button className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer">
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="border border-zinc-900 bg-zinc-900/10 rounded-2xl overflow-hidden divide-y divide-zinc-900">
            {recentBookings.map((bk, i) => (
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
                      {bk.vehicle}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {bk.location} · {bk.dates}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end">
                  <span className="font-semibold text-sm text-zinc-200">
                    {bk.amount}
                  </span>
                  <span
                    className={`text-[11px] font-medium font-mono px-2.5 py-1 rounded-full border ${bk.statusClass}`}
                  >
                    {bk.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="font-semibold text-base text-zinc-200">Quick Actions</h3>
          <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-5 space-y-3">
            {[
              { icon: Calendar, label: "My Bookings", sub: "Upcoming & past trips", color: "text-amber-400" },
              { icon: Star, label: "Leave a Review", sub: "Rate your last trip", color: "text-indigo-400" },
              { icon: Zap, label: "Browse EVs", sub: "Eco-friendly options", color: "text-emerald-400" },
            ].map((action, i) => {
              const Icon = action.icon;
              return (
                <button key={i} className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-900/40 border border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/80 transition cursor-pointer text-left">
                  <div className={`p-2 rounded-lg bg-zinc-900 ${action.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{action.label}</p>
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

// ─── Host View ───────────────────────────────────────────────────────────────
const HostView = ({ user }) => {
  //Mock Data
  const stats = [
    {
      title: "Listed Vehicles",
      value: "3",
      sub: "2 active, 1 paused",
      icon: Car,
      accent: "blue",
    },
    {
      title: "Total Bookings",
      value: "28",
      sub: "+5 this month",
      icon: Users,
      accent: "indigo",
    },
    {
      title: "Total Earned",
      value: "₹84,200",
      sub: "Lifetime earnings",
      icon: DollarSign,
      accent: "emerald",
    },
    {
      title: "Avg. Host Rating",
      value: "4.9",
      sub: "Out of 5.0",
      icon: Star,
      accent: "amber",
    },
  ];

  const accentMap = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  };

  const myListings = [
    {
      name: "Hyundai i20 (2022)",
      type: "Hatchback · Petrol",
      status: "Active",
      rate: "₹1,200/day",
      bookings: 14,
      statusClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    },
    {
      name: "Toyota Fortuner (2021)",
      type: "SUV · Diesel",
      status: "Active",
      rate: "₹4,500/day",
      bookings: 9,
      statusClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    },
    {
      name: "Honda Activa 6G",
      type: "Scooter · Petrol",
      status: "Paused",
      rate: "₹400/day",
      bookings: 5,
      statusClass: "text-amber-400 bg-amber-500/10 border-amber-500/25",
    },
  ];

  const pendingRequests = [
    {
      renter: "Rahul M.",
      vehicle: "Hyundai i20",
      dates: "Jun 8 – Jun 10",
      status: "Pending",
    },
    {
      renter: "Priya S.",
      vehicle: "Toyota Fortuner",
      dates: "Jun 15 – Jun 18",
      status: "Pending",
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
            <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/20 cursor-pointer">
              <PlusCircle className="w-4 h-4" /> List a Vehicle
            </button>
            <button className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-medium text-sm px-4 py-2.5 rounded-xl transition-all cursor-pointer">
              <BarChart2 className="w-4 h-4" /> View Earnings
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
              My Listings
            </h3>
            <button className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer">
              Manage All <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="border border-zinc-900 bg-zinc-900/10 rounded-2xl overflow-hidden divide-y divide-zinc-900">
            {myListings.map((v, i) => (
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
                      {v.name}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-0.5">{v.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-zinc-200">
                      {v.rate}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {v.bookings} bookings
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-medium font-mono px-2.5 py-1 rounded-full border ${v.statusClass}`}
                  >
                    {v.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Requests & Tips */}
        <div className="space-y-4">
          {/* Pending Booking Requests */}
          <div>
            <h3 className="font-semibold text-base text-zinc-200 mb-3">
              Booking Requests
            </h3>
            <div className="space-y-3">
              {pendingRequests.map((req, i) => (
                <div
                  key={i}
                  className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-zinc-200">
                        {req.renter}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {req.vehicle} · {req.dates}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full shrink-0">
                      {req.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 py-1.5 rounded-lg transition cursor-pointer">
                      <CheckCircle2 className="w-3 h-3" /> Accept
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1 text-[11px] font-medium text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 py-1.5 rounded-lg transition cursor-pointer">
                      <AlertCircle className="w-3 h-3" /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Tip */}
          <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-semibold">Hosting Tip</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Listings with clear photos and competitive pricing get{" "}
              <span className="text-zinc-200 font-medium">
                3× more bookings
              </span>
              . Update your availability calendar regularly.
            </p>
            <button className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer mt-1">
              Optimize my listing <ArrowUpRight className="w-3 h-3" />
            </button>
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

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-600/30">
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
            <button className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-xl transition relative cursor-pointer">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
            </button>
            <div className="w-px h-6 bg-zinc-900" />
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
        <div className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {activeMode === "renter" ? (
            <RenterView user={user} />
          ) : (
            <HostView user={user} />
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
