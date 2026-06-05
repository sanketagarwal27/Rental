import { useState, useEffect } from "react";
import { useLocation } from "../context/LocationContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { fetchNearbyVehicles } from "../api/vehicle";
import {
  Car,
  MapPin,
  Star,
  Fuel,
  Users,
  ChevronRight,
  LocateFixed,
  Loader2,
  WifiOff,
  SlidersHorizontal,
} from "lucide-react";

// Fuel icon colors
const fuelColors = {
  Electric: "text-emerald-400",
  Hybrid: "text-teal-400",
  Petrol: "text-amber-400",
  Diesel: "text-orange-400",
};

const VehicleCard = ({ vehicle }) => {
  const { user } = useAuth();
  const fuelColor = fuelColors[vehicle.fuelType] || "text-zinc-400";

  const handleBooking = () => {
    if (!user) {
      toast.error("Please login to proceed with booking");
      return;
    }
    if (!user.isVerifiedEmail || !user.isVerifiedPhone) {
      toast.error(
        "Verification Required: Your email and phone number must be verified in your Profile before booking.",
        { duration: 5000 },
      );
      return;
    }
    console.log("Booking...");
  };

  return (
    <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden hover:border-zinc-700 hover:bg-zinc-900/60 transition-all duration-200 group flex flex-col">
      {/* Image */}
      <div className="relative h-44 bg-zinc-900 overflow-hidden">
        {vehicle.images?.[0] ? (
          <img
            src={vehicle.images[0]}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-700">
            <Car className="w-16 h-16" />
          </div>
        )}
        {/* Type badge */}
        <span className="absolute top-3 left-3 text-[10px] font-semibold font-mono uppercase px-2 py-1 rounded-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-700/50 text-zinc-300">
          {vehicle.type}
        </span>
        {/* Rating */}
        {vehicle.totalReviews > 0 && (
          <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-700/50 text-amber-400">
            <Star className="w-3 h-3 fill-amber-400" />
            {vehicle.averageRating.toFixed(1)}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h4 className="font-bold text-zinc-100 text-sm leading-tight">
            {vehicle.brand} {vehicle.model}
          </h4>
          <p className="text-xs text-zinc-500 mt-0.5">{vehicle.year}</p>
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-1.5">
          <span
            className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-800/60 border border-zinc-700/40 ${fuelColor}`}
          >
            <Fuel className="w-3 h-3" /> {vehicle.fuelType}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-800/60 border border-zinc-700/40 text-zinc-400">
            <Users className="w-3 h-3" /> {vehicle.seats} seats
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-800/60 border border-zinc-700/40 text-zinc-400">
            {vehicle.transmission}
          </span>
        </div>

        {/* Location */}
        <p className="flex items-start gap-1 text-[11px] text-zinc-500 leading-tight">
          <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
          <span className="line-clamp-1">{vehicle.address}</span>
        </p>

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <div>
            <span className="text-base font-bold text-zinc-100">
              ₹{vehicle.pricePerDay.toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500"> /day</span>
          </div>
          <button
            onClick={handleBooking}
            className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-3 py-1.5 rounded-lg transition cursor-pointer"
          >
            Book <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const NearbyVehicles = () => {
  const { coords, locationStatus, locationError, requestLocation } =
    useLocation();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [radius, setRadius] = useState(30);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!coords) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchNearbyVehicles(
          coords.lat,
          coords.lng,
          radius,
          page,
        );
        const data = res.data?.data;
        setVehicles(data?.vehicles || []);
        setTotalPages(data?.totalPages || 1);
        setTotal(data?.total || 0);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch nearby vehicles.",
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [coords, radius, page]);

  // ── Location requesting / denied UI ─────────────────────────────────────
  if (locationStatus === "requesting") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm text-zinc-400">Detecting your location…</p>
      </div>
    );
  }

  if (locationStatus === "denied" || locationStatus === "unavailable") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
          <WifiOff className="w-8 h-8 text-red-400" />
        </div>
        <div>
          <h3 className="font-semibold text-zinc-200">
            Location Access Required
          </h3>
          <p className="text-sm text-zinc-500 mt-1 max-w-xs">
            {locationError ||
              "Please allow location access to see nearby vehicles."}
          </p>
        </div>
        <button
          onClick={requestLocation}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition cursor-pointer"
        >
          <LocateFixed className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  // ── Main content ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-base text-zinc-200 flex items-center gap-2">
            <LocateFixed className="w-4 h-4 text-blue-400" />
            Vehicles Near You
            {total > 0 && (
              <span className="text-xs font-normal text-zinc-500 ml-1">
                ({total} found)
              </span>
            )}
          </h3>
          {coords && (
            <p className="text-xs text-zinc-600 mt-0.5">Within {radius} km</p>
          )}
        </div>

        {/* Radius filter */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-zinc-500" />
          <span className="text-xs text-zinc-500">Radius:</span>
          {[10, 20, 30, 50].map((r) => (
            <button
              key={r}
              onClick={() => {
                setRadius(r);
                setPage(1);
              }}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition cursor-pointer ${
                radius === r
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              {r} km
            </button>
          ))}
        </div>
      </div>

      {/* Loading shimmer */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-zinc-900/30 border border-zinc-900 rounded-2xl overflow-hidden animate-pulse"
            >
              <div className="h-44 bg-zinc-800/60" />
              <div className="p-4 space-y-3">
                <div className="h-3 bg-zinc-800 rounded w-3/4" />
                <div className="h-2 bg-zinc-800 rounded w-1/4" />
                <div className="flex gap-2">
                  <div className="h-5 w-16 bg-zinc-800 rounded-full" />
                  <div className="h-5 w-14 bg-zinc-800 rounded-full" />
                </div>
                <div className="h-2 bg-zinc-800 rounded w-full" />
                <div className="flex justify-between items-center pt-1">
                  <div className="h-5 w-20 bg-zinc-800 rounded" />
                  <div className="h-7 w-16 bg-zinc-800 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-12 text-sm text-red-400 bg-red-500/5 rounded-2xl border border-red-500/10">
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && vehicles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
            <Car className="w-10 h-10 text-zinc-600" />
          </div>
          <div>
            <h4 className="font-semibold text-zinc-300">
              No vehicles found nearby
            </h4>
            <p className="text-sm text-zinc-500 mt-1">
              Try increasing the radius or check back later.
            </p>
          </div>
        </div>
      )}

      {/* Vehicle grid */}
      {!loading && !error && vehicles.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {vehicles.map((v) => (
              <VehicleCard key={v._id} vehicle={v} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                Previous
              </button>
              <span className="text-xs text-zinc-500 px-2">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NearbyVehicles;
