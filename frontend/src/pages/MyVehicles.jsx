import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getUserDashboardData } from "../api/profile";
import { updateVehicleAvailability } from "../api/vehicle";
import { toast } from "sonner";
import { 
  Car, 
  Search, 
  SlidersHorizontal, 
  ArrowLeft, 
  DollarSign, 
  Star, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Eye, 
  ChevronRight, 
  Loader2,
  RefreshCw,
  Calendar,
  X,
  Plus
} from "lucide-react";

// Helper to format currency in INR (₹)
const formatINR = (val) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(val || 0);
};

const MyVehicles = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  
  // Filters & Sorting states
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Recent");
  const [searchTerm, setSearchTerm] = useState("");

  // Availability Modal states
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  const [selectedVehicleForAvailability, setSelectedVehicleForAvailability] = useState(null);
  const [unavailableDatesList, setUnavailableDatesList] = useState([]);
  const [newDateInput, setNewDateInput] = useState("");
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await getUserDashboardData();
      if (response?.success) {
        setVehicles(response.data.vehiclesHosted || []);
        setBookings(response.data.financials?.rentalBookingsList || []);
      }
    } catch (err) {
      console.error("Failed to fetch vehicles list:", err);
    } finally {
      setLoading(false);
    }
  };

  const openAvailabilityModal = (vehicle) => {
    setSelectedVehicleForAvailability(vehicle);
    // Convert existing ISO dates to YYYY-MM-DD for the UI
    const existingDates = (vehicle.unavailableDates || []).map(d => new Date(d).toISOString().split('T')[0]);
    setUnavailableDatesList(existingDates);
    setNewDateInput("");
    setAvailabilityModalOpen(true);
  };

  const closeAvailabilityModal = () => {
    setAvailabilityModalOpen(false);
    setSelectedVehicleForAvailability(null);
    setUnavailableDatesList([]);
  };

  const handleAddUnavailableDate = () => {
    if (!newDateInput) return;
    if (unavailableDatesList.includes(newDateInput)) {
      toast.error("This date is already marked as unavailable");
      return;
    }
    setUnavailableDatesList([...unavailableDatesList, newDateInput].sort());
    setNewDateInput("");
  };

  const handleRemoveUnavailableDate = (dateToRemove) => {
    setUnavailableDatesList(unavailableDatesList.filter(d => d !== dateToRemove));
  };

  const handleSaveAvailability = async () => {
    if (!selectedVehicleForAvailability) return;
    try {
      setAvailabilityLoading(true);
      await updateVehicleAvailability(selectedVehicleForAvailability._id, unavailableDatesList);
      toast.success("Availability updated successfully");
      closeAvailabilityModal();
      fetchData(); // refresh the list
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update availability");
    } finally {
      setAvailabilityLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate stats
  const totalRevenue = bookings
    .filter(b => ["Confirmed", "Completed"].includes(b.status))
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  // Calculate revenue per vehicle
  const getVehicleRevenue = (vehicleId) => {
    return bookings
      .filter(b => b.vehicle?._id === vehicleId && ["Confirmed", "Completed"].includes(b.status))
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  };

  // Get status color helper
  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "Pending":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "Rejected":
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      default:
        return "text-zinc-400 bg-zinc-800/80 border-zinc-700/50";
    }
  };

  // Filter & Sort Logic
  const filteredVehicles = vehicles
    .filter(v => {
      const matchesStatus = statusFilter === "All" || v.status === statusFilter;
      const matchesSearch = 
        v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.licensePlate && v.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "Recent") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortBy === "Revenue-High") {
        return getVehicleRevenue(b._id) - getVehicleRevenue(a._id);
      }
      if (sortBy === "Revenue-Low") {
        return getVehicleRevenue(a._id) - getVehicleRevenue(b._id);
      }
      if (sortBy === "Rating-High") {
        return (b.averageRating || 0) - (a.averageRating || 0);
      }
      if (sortBy === "Rating-Low") {
        return (a.averageRating || 0) - (b.averageRating || 0);
      }
      return 0;
    });

  return (
    <div className="flex min-h-screen bg-transparent text-zinc-100 font-sans selection:bg-blue-600/30">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto max-w-6xl mx-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate("/dashboard")}
            className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
              My Fleet Manager
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              View stats, monitor reviews, edit draft vehicles, and track individual earnings.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
            <p className="text-sm text-zinc-500 font-medium">Loading fleet assets...</p>
          </div>
        ) : (
          <div className="space-y-6 flex-1 flex flex-col">
            {/* Summary Statistics Panel */}
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/10 backdrop-blur-md flex flex-col sm:flex-row justify-between gap-6 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800/60">
              <div className="flex-1 min-w-[120px] pb-4 sm:pb-0 sm:px-6 first:pl-0">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">Total Fleet Size</span>
                <span className="text-2xl font-extrabold block mt-2 text-zinc-100">{vehicles.length}</span>
                <span className="text-[10px] text-zinc-500 block mt-1">Active, drafts & reviews</span>
              </div>
              <div className="flex-1 min-w-[120px] pt-4 sm:pt-0 sm:px-6">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">Fleet Earnings</span>
                <span className="text-2xl font-extrabold block mt-2 text-emerald-400">{formatINR(totalRevenue)}</span>
                <span className="text-[10px] text-zinc-500 block mt-1">From guest bookings</span>
              </div>
              <div className="flex-1 min-w-[120px] pt-4 sm:pt-0 sm:px-6">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">Avg Fleet Rating</span>
                <span className="text-2xl font-extrabold block mt-2 text-amber-450 flex items-center gap-1.5">
                  <Star className="w-5 h-5 fill-amber-400 stroke-none" /> 
                  {vehicles.length > 0 ? (vehicles.reduce((sum, v) => sum + (v.averageRating || 0), 0) / vehicles.length).toFixed(1) : "0.0"}
                </span>
                <span className="text-[10px] text-zinc-500 block mt-1">Across all reviews</span>
              </div>
              <div className="flex-1 min-w-[120px] pt-4 sm:pt-0 sm:px-6 last:pr-0">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">Awaiting Review</span>
                <span className="text-2xl font-extrabold block mt-2 text-blue-400">
                  {vehicles.filter(v => v.status === "Pending").length}
                </span>
                <span className="text-[10px] text-zinc-500 block mt-1">Pending approval</span>
              </div>
            </div>

            {/* Filter controls Bar */}
            <div className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-3.5" />
                <input
                  type="text"
                  placeholder="Search brand, model, or license plate..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800/85 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-zinc-650 text-zinc-200"
                />
              </div>

              {/* Selectors */}
              <div className="flex flex-wrap gap-2">
                {/* Status selector */}
                <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-xl">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-zinc-950 text-xs text-zinc-200 outline-none border-none cursor-pointer pr-4 font-semibold focus:ring-0"
                  >
                    <option value="All" className="bg-zinc-900 text-zinc-200">All Statuses</option>
                    <option value="Approved" className="bg-zinc-900 text-zinc-200">Approved</option>
                    <option value="Draft" className="bg-zinc-900 text-zinc-200">Draft</option>
                    <option value="Pending" className="bg-zinc-900 text-zinc-200">Pending Approval</option>
                    <option value="Rejected" className="bg-zinc-900 text-zinc-200">Rejected</option>
                  </select>
                </div>

                {/* Sort selector */}
                <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-xl">
                  <TrendingUp className="w-3.5 h-3.5 text-zinc-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-zinc-950 text-xs text-zinc-200 outline-none border-none cursor-pointer pr-4 font-semibold focus:ring-0"
                  >
                    <option value="Recent" className="bg-zinc-900 text-zinc-200">Recently Added</option>
                    <option value="Revenue-High" className="bg-zinc-900 text-zinc-200">Highest Revenue</option>
                    <option value="Revenue-Low" className="bg-zinc-900 text-zinc-200">Lowest Revenue</option>
                    <option value="Rating-High" className="bg-zinc-900 text-zinc-200">Highest Rating</option>
                    <option value="Rating-Low" className="bg-zinc-900 text-zinc-200">Lowest Rating</option>
                  </select>
                </div>

                {/* Refresh */}
                <button 
                  onClick={fetchData}
                  className="p-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl transition cursor-pointer"
                  title="Reload fleet"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Listings Grid */}
            {filteredVehicles.length === 0 ? (
              <div className="flex-1 border border-dashed border-zinc-800 rounded-3xl p-12 text-center text-zinc-500">
                <Car className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <h3 className="text-zinc-300 font-bold text-base">No listings match your selection</h3>
                <p className="text-xs text-zinc-650 mt-1">Try resetting your status filters or search parameters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredVehicles.map((v) => {
                  const rev = getVehicleRevenue(v._id);
                  return (
                    <div 
                      key={v._id} 
                      className="p-5 border border-zinc-800 rounded-2xl bg-zinc-900/20 hover:border-zinc-800/80 hover:bg-zinc-900/30 transition-all flex flex-col justify-between gap-4"
                    >
                      <div className="flex gap-4">
                        {/* Vehicle Image */}
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-zinc-800 shrink-0">
                          {v.images?.[0] ? (
                            <img src={v.images[0]} alt={v.model} className="w-full h-full object-cover" />
                          ) : (
                            <Car className="w-6 h-6 text-zinc-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${getStatusColor(v.status)}`}>
                              {v.status}
                            </span>
                            {v.licensePlate && (
                              <span className="text-[10px] font-mono text-zinc-500 uppercase bg-zinc-950 px-2 py-0.5 border border-zinc-800 rounded">
                                {v.licensePlate}
                              </span>
                            )}
                          </div>
                          <h4 className="font-extrabold text-zinc-200 mt-2 truncate text-base">
                            {v.brand} {v.model} ({v.year})
                          </h4>
                          <p className="text-xs text-zinc-500 mt-0.5 truncate">{v.category} · {v.type} · {v.transmission} · {v.fuelType}</p>
                        </div>
                      </div>

                      {/* Stats / Details */}
                      <div className="grid grid-cols-3 gap-2 border-y border-zinc-900/60 py-3 bg-zinc-950/20 px-3 rounded-xl border-zinc-800">
                        <div className="text-center">
                          <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Rate</span>
                          <span className="text-xs font-bold text-zinc-300 block mt-1">{formatINR(v.pricePerDay)}/d</span>
                        </div>
                        <div className="text-center border-x border-zinc-800">
                          <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Rating</span>
                          <span className="text-xs font-bold text-amber-400 block mt-1 flex items-center justify-center gap-0.5">
                            <Star className="w-3.5 h-3.5 fill-amber-400 stroke-none" /> {v.averageRating?.toFixed(1) || "0.0"}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Revenue</span>
                          <span className="text-xs font-extrabold text-emerald-400 block mt-1">{formatINR(rev)}</span>
                        </div>
                      </div>

                      {/* Warnings / Complete listing */}
                      {v.status === "Draft" && (
                        <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-[11px] text-amber-400 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <strong>Draft Status:</strong> Incomplete registration details. Please provide VIN/Chassis and License documents to submit for approval.
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex justify-end gap-2 pt-1">
                        {v.status === "Draft" ? (
                          <button
                            onClick={() => navigate("/list-vehicle", { state: { draft: v } })}
                            className="flex items-center gap-1 px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition shadow-md shadow-blue-600/10 cursor-pointer"
                          >
                            Complete Details <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-zinc-600 font-medium self-center">
                              Awaiting requests...
                            </span>
                            <button
                              onClick={() => openAvailabilityModal(v)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg transition cursor-pointer"
                            >
                              <Calendar className="w-3.5 h-3.5 text-blue-400" /> Manage Availability
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Availability Modal */}
        {availabilityModalOpen && selectedVehicleForAvailability && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-zinc-800/80">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" /> Manage Availability
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    {selectedVehicleForAvailability.brand} {selectedVehicleForAvailability.model} ({selectedVehicleForAvailability.year})
                  </p>
                </div>
                <button
                  onClick={closeAvailabilityModal}
                  className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-xl transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Mark Date as Unavailable
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={newDateInput}
                      onChange={(e) => setNewDateInput(e.target.value)}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-zinc-200 color-scheme-dark"
                      style={{ colorScheme: "dark" }}
                    />
                    <button
                      onClick={handleAddUnavailableDate}
                      disabled={!newDateInput}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                    Unavailable Dates ({unavailableDatesList.length})
                  </h4>
                  {unavailableDatesList.length === 0 ? (
                    <div className="text-center p-4 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
                      <p className="text-sm text-zinc-500">No dates marked as unavailable.</p>
                      <p className="text-xs text-zinc-600 mt-1">Your vehicle is available every day.</p>
                    </div>
                  ) : (
                    <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                      {unavailableDatesList.map(date => (
                        <div key={date} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                            <span className="text-sm font-medium text-zinc-300">
                              {new Date(date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveUnavailableDate(date)}
                            className="p-1.5 bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 rounded-lg transition cursor-pointer"
                            title="Remove date"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-zinc-800/80 bg-zinc-950/50 flex justify-end gap-3">
                <button
                  onClick={closeAvailabilityModal}
                  className="px-5 py-2.5 text-sm font-semibold text-zinc-300 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAvailability}
                  disabled={availabilityLoading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition cursor-pointer"
                >
                  {availabilityLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : (
                    <><CheckCircle className="w-4 h-4" /> Save Changes</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default MyVehicles;
