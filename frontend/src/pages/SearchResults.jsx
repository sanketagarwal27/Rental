import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { searchVehicles } from "../api/vehicle";
import { lockVehicle } from "../api/booking";
import { getVehicleReviews } from "../api/review";
import { useLocation as useLocationCtx } from "../context/LocationContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import {
  Car,
  MapPin,
  Star,
  Fuel,
  Users,
  ChevronRight,
  Loader2,
  Search,
  SlidersHorizontal,
  Calendar,
  LocateFixed,
  AlertTriangle,
  ArrowLeft,
  Zap,
  Clock,
  X,
  RefreshCw,
  Lock,
} from "lucide-react";

// ── Fuel Colors ──────────────────────────────────────────────────────────────
const fuelColors = {
  Electric: "text-emerald-400",
  Hybrid: "text-teal-400",
  Petrol: "text-amber-400",
  Diesel: "text-orange-400",
};

// ── Vehicle Card ─────────────────────────────────────────────────────────────
const VehicleCard = ({
  vehicle,
  altBadge,
  onViewReviews,
  searchStartDate,
  searchEndDate,
  onLocking,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fuelColor = fuelColors[vehicle.fuelType] || "text-zinc-400";
  const [locking, setLocking] = useState(false);

  const handleBooking = async () => {
    if (!user) {
      toast.error("Please login to proceed with booking");
      return;
    }
    if (!user.isVerifiedEmail || !user.isVerifiedPhone) {
      toast.error("Please verify your email and phone before booking.", {
        duration: 5000,
      });
      return;
    }

    // No dates selected → go to the "check availability" / date picker flow
    if (!searchStartDate || !searchEndDate) {
      navigate(`/booking/${vehicle._id}`);
      return;
    }

    // Dates selected → lock the vehicle and proceed to booking summary
    try {
      setLocking(true);
      onLocking?.(true);
      const res = await lockVehicle(
        vehicle._id,
        searchStartDate,
        searchEndDate,
      );
      if (res?.success) {
        toast.success(
          "Vehicle reserved! You have 15 minutes to complete payment.",
        );
        navigate(`/booking/${vehicle._id}`, { state: res.data });
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Could not reserve vehicle. It may no longer be available.";
      toast.error(msg);
    } finally {
      setLocking(false);
      onLocking?.(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const floor = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      if (i <= floor) {
        stars.push(
          <Star
            key={i}
            className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0"
          />,
        );
      } else if (i === floor + 1 && rating % 1 >= 0.5) {
        stars.push(
          <Star
            key={i}
            className="w-3.5 h-3.5 text-amber-400 fill-amber-400 opacity-60 shrink-0"
          />,
        );
      } else {
        stars.push(
          <Star key={i} className="w-3.5 h-3.5 text-zinc-700 shrink-0" />,
        );
      }
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  const relevantBlockedDates = (vehicle.unavailableDates || []).filter((d) => {
    if (!searchStartDate || !searchEndDate) return false;
    const dateVal = new Date(d);
    const start = new Date(searchStartDate);
    const end = new Date(searchEndDate);
    return dateVal >= start && dateVal <= end;
  });

  return (
    <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden hover:border-zinc-700 hover:bg-zinc-900/70 transition-all duration-200 group flex flex-col relative">
      {/* Alt Reason Badge */}
      {altBadge && (
        <div
          className={`absolute top-3 left-3 z-10 flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm border ${
            altBadge === "slightly_further"
              ? "bg-blue-500/20 border-blue-500/30 text-blue-300"
              : "bg-amber-500/20 border-amber-500/30 text-amber-300"
          }`}
        >
          {altBadge === "slightly_further" ? (
            <>
              <MapPin className="w-2.5 h-2.5" /> Slightly further away
            </>
          ) : (
            <>
              <Clock className="w-2.5 h-2.5" /> Some dates unavailable
            </>
          )}
        </div>
      )}

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
        <span className="absolute top-3 right-3 text-[10px] font-semibold font-mono uppercase px-2 py-1 rounded-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-700/50 text-zinc-300">
          {vehicle.type}
        </span>
      </div>

      {/* Details */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h4 className="font-bold text-zinc-100 text-sm leading-tight">
            {vehicle.brand} {vehicle.model}
          </h4>
          <p className="text-xs text-zinc-500 mt-0.5">
            {vehicle.year} · {vehicle.category}
          </p>

          {/* Ratings & Reviews */}
          <div className="flex items-center gap-2 mt-1.5">
            {renderStars(vehicle.averageRating || 0)}
            {vehicle.totalReviews > 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewReviews?.(vehicle);
                }}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-medium underline cursor-pointer"
              >
                ({vehicle.totalReviews}{" "}
                {vehicle.totalReviews === 1 ? "review" : "reviews"})
              </button>
            ) : (
              <span className="text-[11px] text-zinc-500 font-normal">
                No reviews yet
              </span>
            )}
          </div>
        </div>

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

        <p className="flex items-start gap-1 text-[11px] text-zinc-500 leading-tight">
          <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
          <span className="line-clamp-1">{vehicle.address}</span>
        </p>

        {relevantBlockedDates.length > 0 && (
          <div className="text-[10px] text-rose-450 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 rounded-xl font-medium leading-normal w-fit">
            <span className="font-semibold block text-[9px] uppercase tracking-wider text-rose-500 mb-0.5">
              Conflicting Dates
            </span>
            {relevantBlockedDates
              .slice(0, 3)
              .map((d) =>
                new Date(d).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                }),
              )
              .join(", ")}
            {relevantBlockedDates.length > 3 &&
              ` (+${relevantBlockedDates.length - 3} more)`}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-1">
          <div>
            <span className="text-base font-bold text-zinc-100">
              ₹{vehicle.pricePerDay.toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500"> /day</span>
          </div>
          <button
            onClick={handleBooking}
            disabled={locking}
            className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-3 py-1.5 rounded-lg transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {locking ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : searchStartDate && searchEndDate ? (
              <>
                <Lock className="w-3 h-3" /> Book
              </>
            ) : (
              <>
                Check Availability <ChevronRight className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Skeleton Card ────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl overflow-hidden animate-pulse">
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
);

// ── Geocode helper (using Nominatim, free & open) ────────────────────────────
const geocodeLocation = async (locationText) => {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationText)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  const data = await res.json();
  if (!data || data.length === 0)
    throw new Error("Location not found. Try a different city name.");
  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    display: data[0].display_name,
  };
};


// ── Main SearchResults Page ───────────────────────────────────────────────────
const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { coords, requestLocation } = useLocationCtx();

  // ── Search form state ────────────────────────────────────────────────────
  const [locationText, setLocationText] = useState(
    searchParams.get("location") || "",
  );
  const [startDate, setStartDate] = useState(
    searchParams.get("startDate") || "",
  );
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");
  const [radius, setRadius] = useState(
    parseInt(searchParams.get("radius") || "30"),
  );

  // ── Filter states ────────────────────────────────────────────────────────
  const [sortByPrice, setSortByPrice] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedFuels, setSelectedFuels] = useState([]);
  const [selectedTransmissions, setSelectedTransmissions] = useState([]);

  // ── Results state ────────────────────────────────────────────────────────
  const [primaryVehicles, setPrimaryVehicles] = useState([]);
  const [alternatives, setAlternatives] = useState([]);
  const [totalPrimary, setTotalPrimary] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [resolvedCoords, setResolvedCoords] = useState(null);
  const [activeReviewVehicle, setActiveReviewVehicle] = useState(null);
  const [vehicleReviews, setVehicleReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  // ── Use My Location ──────────────────────────────────────────────────────
  const handleUseMyLocation = async () => {
    if (coords) {
      setResolvedCoords(coords);
      setLocationText("📍 Current location");
      return;
    }
    requestLocation();
  };

  // watch for coords update after requestLocation
  useEffect(() => {
    if (coords && locationText === "📍 Current location") {
      setResolvedCoords(coords);
    }
  }, [coords, locationText]);

  // ── Run Search ───────────────────────────────────────────────────────────
  const runSearch = useCallback(
    async (coordsToUse, pg = 1) => {
      if (!coordsToUse) return;
      setLoading(true);
      setError(null);
      setHasSearched(true);

      try {
        const result = await searchVehicles({
          lat: coordsToUse.lat,
          lng: coordsToUse.lng,
          radius,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          page: pg,
        });
        if (result?.success) {
          setPrimaryVehicles(result.data.primary.vehicles);
          setTotalPrimary(result.data.primary.total);
          setTotalPages(result.data.primary.totalPages);
          setAlternatives(result.data.alternatives || []);
          setPage(pg);
        }
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          "Failed to fetch results. Please try again.";
        setError(msg);
        setPrimaryVehicles([]);
        setAlternatives([]);
      } finally {
        setLoading(false);
      }
    },
    [radius, startDate, endDate],
  );

  // ── Handle form submit ───────────────────────────────────────────────────
  const handleSearch = async (e) => {
    e?.preventDefault();

    if (!locationText.trim()) {
      toast.error("Please enter a location or use your current location.");
      return;
    }
    if (startDate && endDate && startDate > endDate) {
      toast.error("Start date cannot be after end date.");
      return;
    }

    let coordsToUse = resolvedCoords;

    if (!coordsToUse || locationText !== "📍 Current location") {
      try {
        setGeocoding(true);
        const geo = await geocodeLocation(locationText);
        coordsToUse = { lat: geo.lat, lng: geo.lng };
        setResolvedCoords(coordsToUse);
      } catch (err) {
        toast.error(err.message || "Could not find that location.");
        setGeocoding(false);
        return;
      } finally {
        setGeocoding(false);
      }
    }

    // Update URL params
    const params = { location: locationText, radius: String(radius) };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    setSearchParams(params);

    runSearch(coordsToUse, 1);
  };

  // Run search on page change
  const handlePageChange = (newPage) => {
    if (resolvedCoords) runSearch(resolvedCoords, newPage);
  };

  // ── Auto-search if URL already has params ────────────────────────────────
  useEffect(() => {
    const locParam = searchParams.get("location");
    const sdParam = searchParams.get("startDate");
    const edParam = searchParams.get("endDate");
    const radParam = searchParams.get("radius");
    if (locParam) {
      setLocationText(locParam);
      if (sdParam) setStartDate(sdParam);
      if (edParam) setEndDate(edParam);
      if (radParam) setRadius(parseInt(radParam));
      // auto-geocode and search
      (async () => {
        try {
          setGeocoding(true);
          const geo = await geocodeLocation(locParam);
          const c = { lat: geo.lat, lng: geo.lng };
          setResolvedCoords(c);
          runSearch(c, 1);
        } catch (_) {
        } finally {
          setGeocoding(false);
        }
      })();
    }
  }, []); // eslint-disable-line

  // ── Filter Logics ────────────────────────────────────────────────────────
  const filterVehicle = (v) => {
    if (minRating > 0 && (v.averageRating || 0) < minRating) return false;
    if (selectedTypes.length > 0 && !selectedTypes.includes(v.type))
      return false;
    if (selectedFuels.length > 0 && !selectedFuels.includes(v.fuelType))
      return false;
    if (
      selectedTransmissions.length > 0 &&
      !selectedTransmissions.includes(v.transmission)
    )
      return false;
    return true;
  };

  const sortVehicles = (a, b) => {
    if (sortByPrice === "low-to-high") return a.pricePerDay - b.pricePerDay;
    if (sortByPrice === "high-to-low") return b.pricePerDay - a.pricePerDay;
    return 0;
  };

  const filteredPrimary = primaryVehicles
    .filter(filterVehicle)
    .sort(sortVehicles);
  const filteredAlternatives = alternatives
    .filter(filterVehicle)
    .sort(sortVehicles);

  const toggleFilter = (list, setList, val) => {
    setList((prev) =>
      prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val],
    );
  };

  const clearFilters = () => {
    setSortByPrice("");
    setMinRating(0);
    setSelectedTypes([]);
    setSelectedFuels([]);
    setSelectedTransmissions([]);
  };

  // Fetch real reviews when modal opens
  const handleViewReviews = async (vehicle) => {
    setActiveReviewVehicle(vehicle);
    setVehicleReviews([]);
    setReviewsLoading(true);
    try {
      const res = await getVehicleReviews(vehicle._id, 1, 20);
      setVehicleReviews(res.data?.data?.reviews || []);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const floor = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      if (i <= floor) {
        stars.push(
          <Star
            key={i}
            className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0"
          />,
        );
      } else if (i === floor + 1 && rating % 1 >= 0.5) {
        stars.push(
          <Star
            key={i}
            className="w-3.5 h-3.5 text-amber-400 fill-amber-400 opacity-60 shrink-0"
          />,
        );
      } else {
        stars.push(
          <Star key={i} className="w-3.5 h-3.5 text-zinc-700 shrink-0" />,
        );
      }
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  return (
    <div className="flex min-h-screen bg-transparent text-zinc-100 font-sans selection:bg-blue-600/30">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* ── Sticky Header ─────────────────────────────────────────────── */}
        <header className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-900 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            {/* Back + title row */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="p-2 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-zinc-100 tracking-tight">
                  Find a Vehicle
                </h1>
                <p className="text-xs text-zinc-500">
                  Search by location and travel dates
                </p>
              </div>
            </div>

            {/* ── Search Bar ─────────────────────────────────────────────── */}
            <form
              onSubmit={handleSearch}
              className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-3 flex flex-col lg:flex-row items-stretch lg:items-start gap-2 shadow-xl"
            >
              {/* Location input */}
              <label className="flex flex-1 items-center gap-2.5 bg-zinc-950/70 border border-zinc-800 rounded-xl px-3.5 py-2.5 cursor-text hover:border-zinc-700 transition">
                <MapPin size={15} className="text-blue-400 shrink-0" />
                <input
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  placeholder="City, district or landmark…"
                  className="bg-transparent outline-none w-full text-white placeholder:text-zinc-600 text-sm"
                />
                {locationText && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocationText("");
                      setResolvedCoords(null);
                    }}
                  >
                    <X className="w-3.5 h-3.5 text-zinc-600 hover:text-zinc-400" />
                  </button>
                )}
              </label>

              {/* Use My Location button */}
              <button
                type="button"
                onClick={handleUseMyLocation}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-zinc-950/70 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-400 hover:text-blue-400 hover:border-blue-500/40 transition cursor-pointer whitespace-nowrap"
              >
                <LocateFixed className="w-3.5 h-3.5" /> Use My Location
              </button>

              {/* Start date */}
              <div className="flex flex-col gap-1">
                <label className="flex items-center gap-2.5 bg-zinc-950/70 border border-zinc-800 rounded-xl px-3.5 py-2.5 cursor-pointer hover:border-zinc-700 transition">
                  <Calendar size={15} className="text-zinc-500 shrink-0" />
                  <input
                    type="date"
                    min={today}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent outline-none text-white w-32 text-sm [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    style={{ colorScheme: "dark" }}
                    placeholder="Pickup date"
                  />
                </label>
                <span className="text-[10px] text-zinc-500 font-medium px-1">
                  From date
                </span>
              </div>

              {/* End date */}
              <div className="flex flex-col gap-1">
                <label className="flex items-center gap-2.5 bg-zinc-950/70 border border-zinc-800 rounded-xl px-3.5 py-2.5 cursor-pointer hover:border-zinc-700 transition">
                  <Calendar size={15} className="text-zinc-500 shrink-0" />
                  <input
                    type="date"
                    min={startDate || today}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent outline-none text-white w-32 text-sm [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    style={{ colorScheme: "dark" }}
                    placeholder="Return date"
                  />
                </label>
                <span className="text-[10px] text-zinc-500 font-medium px-1">
                  To date
                </span>
              </div>

              {/* Radius selector */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 bg-zinc-950/70 border border-zinc-800 rounded-xl px-3.5 py-2.5">
                  <SlidersHorizontal
                    size={14}
                    className="text-zinc-500 shrink-0"
                  />
                  <select
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value))}
                    className="bg-transparent text-sm text-zinc-300 outline-none cursor-pointer"
                  >
                    {[10, 20, 30, 50, 100].map((r) => (
                      <option key={r} value={r} className="bg-zinc-900">
                        {r} km
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-[10px] text-zinc-500 font-medium px-1">
                  Search radius
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || geocoding}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition shadow-lg shadow-blue-600/20 cursor-pointer text-sm whitespace-nowrap"
              >
                {loading || geocoding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {geocoding
                  ? "Locating…"
                  : loading
                    ? "Searching…"
                    : "Search Fleet"}
              </button>
            </form>
          </div>
        </header>

        {/* ── Page Body ─────────────────────────────────────────────────── */}
        <div className="flex-1 p-6 pb-32 lg:pb-6 max-w-7xl w-full mx-auto space-y-10">
          {/* ── Initial / pre-search state ─────────────────────────────── */}
          {!hasSearched && !loading && (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-5">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600/20 to-purple-600/10 border border-blue-500/20 flex items-center justify-center">
                <Search className="w-9 h-9 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-zinc-200">
                  Start your search
                </h2>
                <p className="text-zinc-500 text-sm mt-2 max-w-sm">
                  Enter a city, locality or use your current location to find
                  available vehicles near you.
                </p>
              </div>
              <button
                onClick={handleUseMyLocation}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600/10 border border-blue-500/30 text-blue-400 hover:bg-blue-600/20 rounded-xl text-sm font-medium transition cursor-pointer"
              >
                <LocateFixed className="w-4 h-4" /> Use My Location
              </button>
            </div>
          )}

          {/* ── Loading skeletons ─────────────────────────────────────── */}
          {loading && (
            <div className="space-y-6">
              <div className="h-5 bg-zinc-800/60 rounded w-48 animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </div>
          )}

          {/* ── Error state ────────────────────────────────────────────── */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-8 h-8 text-rose-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-200">
                  Something went wrong
                </h3>
                <p className="text-sm text-zinc-500 mt-1 max-w-sm">{error}</p>
              </div>
              <button
                onClick={() =>
                  resolvedCoords && runSearch(resolvedCoords, page)
                }
                className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 rounded-xl text-sm font-medium transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
            </div>
          )}

          {/* ── Results state with filtering ───────────────────────────── */}
          {!loading && hasSearched && !error && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
              {/* ── Sidebar Filters ───────────────────────────────────────── */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 space-y-6 lg:sticky lg:top-28">
                <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                  <span className="font-bold text-sm text-zinc-200 uppercase tracking-wider">
                    Filters
                  </span>
                  {(sortByPrice ||
                    minRating > 0 ||
                    selectedTypes.length > 0 ||
                    selectedFuels.length > 0 ||
                    selectedTransmissions.length > 0) && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Price Sorting */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-zinc-400 block">
                    Sort By Price
                  </span>
                  <select
                    value={sortByPrice}
                    onChange={(e) => setSortByPrice(e.target.value)}
                    className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-300 outline-none cursor-pointer hover:border-zinc-700 transition"
                  >
                    <option value="" className="bg-zinc-900">
                      Best Match (Default)
                    </option>
                    <option value="low-to-high" className="bg-zinc-900">
                      Price: Low to High
                    </option>
                    <option value="high-to-low" className="bg-zinc-900">
                      Price: High to Low
                    </option>
                  </select>
                </div>

                {/* Minimum Star Rating */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-zinc-400 block">
                    Minimum Rating
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[0, 3, 4, 4.5].map((stars) => (
                      <button
                        key={stars}
                        type="button"
                        onClick={() => setMinRating(stars)}
                        className={`py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer flex items-center justify-center gap-0.5 ${
                          minRating === stars
                            ? "bg-blue-600/20 border-blue-500 text-blue-300"
                            : "bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        {stars === 0 ? (
                          "Any"
                        ) : (
                          <>
                            {stars}{" "}
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vehicle Type */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-zinc-400 block">
                    Vehicle Type
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Sedan",
                      "SUV",
                      "Hatchback",
                      "Truck",
                      "Premium",
                      "Luxury",
                      "Sports",
                      "Cruiser",
                      "SportBike",
                      "Scooter",
                      "Adventure",
                      "Commuter",
                    ].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() =>
                          toggleFilter(selectedTypes, setSelectedTypes, t)
                        }
                        className={`px-3 py-1.5 rounded-lg border text-xs transition cursor-pointer ${
                          selectedTypes.includes(t)
                            ? "bg-blue-600/20 border-blue-500 text-blue-300 font-semibold"
                            : "bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fuel Type */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-zinc-400 block">
                    Fuel Type
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {["Petrol", "Diesel", "Hybrid", "Electric"].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() =>
                          toggleFilter(selectedFuels, setSelectedFuels, f)
                        }
                        className={`py-1.5 rounded-lg border text-xs transition cursor-pointer ${
                          selectedFuels.includes(f)
                            ? "bg-blue-600/20 border-blue-500 text-blue-300 font-semibold"
                            : "bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transmission */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-zinc-400 block">
                    Transmission
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {["Automatic", "Manual"].map((tr) => (
                      <button
                        key={tr}
                        type="button"
                        onClick={() =>
                          toggleFilter(
                            selectedTransmissions,
                            setSelectedTransmissions,
                            tr,
                          )
                        }
                        className={`py-1.5 rounded-lg border text-xs transition cursor-pointer ${
                          selectedTransmissions.includes(tr)
                            ? "bg-blue-600/20 border-blue-500 text-blue-300 font-semibold"
                            : "bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        {tr}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Results Main Grid ─────────────────────────────────────── */}
              <div className="lg:col-span-3 space-y-10">
                {/* Primary Results */}
                <section>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-zinc-800/40 pb-3">
                    <div>
                      <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-400" />
                        Search Results
                        <span className="text-sm font-normal text-zinc-500 ml-1">
                          ({filteredPrimary.length} of {totalPrimary} shown
                          within {radius} km)
                        </span>
                      </h2>
                      {startDate && endDate && (
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Available: {new Date(startDate).toLocaleDateString()}{" "}
                          to {new Date(endDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {filteredPrimary.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                      {filteredPrimary.map((v) => (
                        <VehicleCard
                          key={v._id}
                          vehicle={v}
                          onViewReviews={handleViewReviews}
                          searchStartDate={startDate}
                          searchEndDate={endDate}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-14 text-center gap-3 bg-zinc-900/10 border border-zinc-900 rounded-2xl">
                      <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800/80">
                        <Car className="w-8 h-8 text-zinc-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-300 text-sm">
                          No vehicles match filters
                        </h3>
                        <p className="text-xs text-zinc-500 mt-1">
                          Try adjusting your filters or expanding the search
                          criteria.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-8">
                      <button
                        disabled={page === 1}
                        onClick={() => handlePageChange(page - 1)}
                        className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                      >
                        Previous
                      </button>
                      <span className="text-xs text-zinc-500 px-3">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        disabled={page === totalPages}
                        onClick={() => handlePageChange(page + 1)}
                        className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </section>

                {/* Alternative Options */}
                {filteredAlternatives.length > 0 && (
                  <section className="border-t border-zinc-800/60 pt-8">
                    <div className="mb-5">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                        </div>
                        <h2 className="text-base font-bold text-zinc-200">
                          Alternative Options
                        </h2>
                      </div>
                      <p className="text-xs text-zinc-500 ml-7">
                        Vehicles slightly outside your search radius or with
                        minor date conflicts — worth considering!
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                      {filteredAlternatives.map((v) => (
                        <VehicleCard
                          key={v._id}
                          vehicle={v}
                          altBadge={v._altReason}
                          onViewReviews={handleViewReviews}
                          searchStartDate={startDate}
                          searchEndDate={endDate}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Reviews Detail Modal ─────────────────────────────────────────── */}
      {activeReviewVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-zinc-100 text-base">
                  Reviews & Ratings
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {activeReviewVehicle.brand} {activeReviewVehicle.model}
                </p>
              </div>
              <button
                onClick={() => setActiveReviewVehicle(null)}
                className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center gap-4 bg-zinc-950/40 border border-zinc-800/40 p-4 rounded-xl">
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-amber-400">
                    {activeReviewVehicle.averageRating.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-medium mt-0.5">
                    out of 5.0
                  </div>
                </div>
                <div className="h-10 w-[1px] bg-zinc-800" />
                <div>
                  <div className="flex items-center gap-1">
                    {renderStars(activeReviewVehicle.averageRating)}
                  </div>
                  <div className="text-xs text-zinc-400 mt-1 font-medium">
                    {activeReviewVehicle.totalReviews} verified rental reviews
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {reviewsLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                  </div>
                ) : vehicleReviews.length > 0 ? (
                  vehicleReviews.map((rev) => (
                    <div
                      key={rev._id}
                      className="border-b border-zinc-800/40 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-zinc-200 text-xs">
                          {rev.reviewer?.name || "Anonymous"}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {renderStars(rev.rating)}
                      </div>
                      {rev.comment && (
                        <p className="text-xs text-zinc-450 mt-1.5 leading-relaxed font-sans italic">
                          "{rev.comment}"
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500 py-6 text-center">
                    No reviews yet for this vehicle.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
