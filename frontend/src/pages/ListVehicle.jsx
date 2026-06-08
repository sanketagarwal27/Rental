import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import MapPicker from "../components/MapPicker";
import { uploadVehicle } from "../api/vehicle";
import {
  Car,
  MapPin,
  Camera,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  DollarSign,
  ShieldCheck,
  Info,
  Layers,
  X,
  ArrowLeft,
} from "lucide-react";

const STEPS = [
  { id: 1, name: "Specs & Category", desc: "Vehicle category, make & specs" },
  { id: 2, name: "Pricing & Location", desc: "Daily rate & pickup address" },
  { id: 3, name: "Images & Verification", desc: "Photos & document details" },
];

const VEHICLE_TYPES = {
  "2-Wheeler": ["Cruiser", "SportBike", "Scooter", "Adventure", "Commuter"],
  "4-Wheeler": ["Sedan", "SUV", "Hatchback", "Truck", "Premium", "Luxury", "Sports"],
};

const ListVehicle = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const draftData = location.state?.draft;

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
  useEffect(() => {
    if (currentStep === 3) {
      setIsSubmitEnabled(false);
      const timer = setTimeout(() => setIsSubmitEnabled(true), 500);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Form States
  const [formData, setFormData] = useState({
    vehicleId: draftData?._id || "",
    category: draftData?.category || "4-Wheeler",
    brand: draftData?.brand || "",
    model: draftData?.model || "",
    year: draftData?.year || new Date().getFullYear(),
    type: draftData?.type || "Sedan",
    transmission: draftData?.transmission || "Automatic",
    fuelType: draftData?.fuelType || "Petrol",
    seats: draftData?.seats || 5,
    odometer: draftData?.odometer || "",
    pricePerDay: draftData?.pricePerDay || "",
    address: draftData?.address || "",
    longitude: draftData?.location?.coordinates?.[0] || "",
    latitude: draftData?.location?.coordinates?.[1] || "",
    features: draftData?.features ? draftData.features.join(", ") : "",
    licensePlate: draftData?.licensePlate || "",
    issuingState: draftData?.issuingState || "",
    vinOrChassis: draftData?.vinOrChassis || "",
  });

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState(draftData?.images || []);
  const fileInputRef = useRef(null);

  const [showDraftWarningModal, setShowDraftWarningModal] = useState(false);

  const triggerAlert = (type, text) => {
    setMessage({ type, text });
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setMessage({ type: "", text: "" }), 6000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-set valid default type if category changes
      if (name === "category") {
        updated.type = VEHICLE_TYPES[value][0];
        updated.seats = value === "2-Wheeler" ? 2 : 5;
      }
      return updated;
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Limit to max 5 images
    const totalFiles = [...images, ...files].slice(0, 5);
    setImages(totalFiles);

    // Create previews
    const filePreviews = totalFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews(filePreviews);
  };

  const [geocodingLoading, setGeocodingLoading] = useState(false);

  const geocodeAddress = async () => {
    if (!formData.address.trim()) return;
    setGeocodingLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          formData.address,
        )}&limit=1`,
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setFormData((prev) => ({
          ...prev,
          latitude: parseFloat(lat).toFixed(6),
          longitude: parseFloat(lon).toFixed(6),
        }));
      } else {
        triggerAlert(
          "error",
          "Could not locate this address on the map. Please pin it manually.",
        );
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    } finally {
      setGeocodingLoading(false);
    }
  };

  const removeImage = (index) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);

    // Revoke old object URL for performance
    URL.revokeObjectURL(imagePreviews[index]);
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);
    setImagePreviews(updatedPreviews);
  };

  const validateStep = (step) => {
    if (step === 1) {
      return (
        formData.brand.trim() &&
        formData.model.trim() &&
        formData.year &&
        formData.seats
      );
    }
    if (step === 2) {
      return (
        formData.pricePerDay &&
        formData.address.trim() &&
        formData.latitude &&
        formData.longitude
      );
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    } else {
      triggerAlert(
        "error",
        "Please fill in all required fields before moving forward.",
      );
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep < 3) {
      return;
    }
    if (imagePreviews.length === 0) {
      return triggerAlert(
        "error",
        "Please upload at least one image of the vehicle.",
      );
    }

    setLoading(true);
    const data = new FormData();

    // Append files
    images.forEach((image) => {
      data.append("images", image);
    });

    // If editing and no new images selected, keep original images URL(s)
    if (images.length === 0 && draftData?.images) {
      draftData.images.forEach((img) => {
        data.append("images", img);
      });
    }

    // Append text fields
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== "") {
        data.append(key, formData[key]);
      }
    });

    try {
      const response = await uploadVehicle(data);
      if (response?.success) {
        if (response.data.status === "Draft") {
          setLoading(false);
          setShowDraftWarningModal(true);
        } else {
          triggerAlert(
            "success",
            `Vehicle listed successfully as ${response.data.status}! Redirecting...`,
          );
          setTimeout(() => {
            navigate("/dashboard");
          }, 2500);
        }
      }
    } catch (err) {
      triggerAlert(
        "error",
        err.response?.data?.message || "Failed to upload vehicle listing.",
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-transparent text-zinc-100 font-sans selection:bg-blue-600/30">
      <Sidebar />

      {/* Main Content Area */}
        <main className="flex-1 p-6 pb-32 sm:p-10 lg:p-12 overflow-y-auto custom-scrollbar">
          {!user?.isVerifiedEmail ? (
            <div className="h-full flex items-center justify-center">
              <div className="max-w-md w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
                <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                  <ShieldCheck className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-100 mb-2">Verification Required</h2>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    To maintain trust and security in our community, you must verify your email address before you can host a vehicle.
                  </p>
                </div>
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/20 w-full justify-center"
                >
                  Go to Profile to Verify <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-1.5 p-2 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
              List Your Vehicle
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Fill in the multi-step form to start renting out your vehicle and
              earning revenue.
            </p>
          </div>
        </div>

        {/* Helpful Info Tip Box */}
        <div className="mb-6 p-4 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-3 shadow-lg">
          <span className="text-base leading-none">💡</span>
          <div>
            <strong className="font-bold text-zinc-200">Pro Tip:</strong>{" "}
            Providing more accurate specs, features, and high-quality images
            builds guest trust and can lead to up to{" "}
            <span className="text-blue-400 font-bold">2x more bookings</span>.
          </div>
        </div>

        {/* Global Notifications */}
        {message.text && (
          <div
            className={`p-4 rounded-xl mb-6 flex items-center gap-3 border text-sm animate-fade-in ${
              message.type === "success"
                ? "bg-emerald-950/30 border-emerald-800/50 text-emerald-400"
                : "bg-rose-950/30 border-rose-800/50 text-rose-400"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        {/* Stepper Progress Bar */}
        <div className="flex items-center justify-between mb-10 bg-zinc-900/40 border border-zinc-800/60 p-5 rounded-2xl">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex-1 flex items-center">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm border transition-all ${
                    currentStep === step.id
                      ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                      : currentStep > step.id
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-zinc-950 border-zinc-800 text-zinc-500"
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="hidden sm:block">
                  <h4
                    className={`text-xs font-bold ${currentStep === step.id ? "text-zinc-200" : "text-zinc-500"}`}
                  >
                    {step.name}
                  </h4>
                  <p className="text-[9px] text-zinc-650 font-medium">
                    {step.desc}
                  </p>
                </div>
              </div>
              {idx < STEPS.length - 1 && (
                <div className="flex-1 h-[1px] bg-zinc-850 mx-4 hidden md:block" />
              )}
            </div>
          ))}
        </div>

        {/* Form Container */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-8 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Specs & Category */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-500" /> Vehicle
                  Classification
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    >
                      <option value="4-Wheeler">4-Wheeler (Car/Truck)</option>
                      <option value="2-Wheeler">
                        2-Wheeler (Bike/Scooter)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                      Vehicle Type
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    >
                      {VEHICLE_TYPES[formData.category].map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                      Brand / Manufacturer{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="brand"
                      required
                      placeholder="e.g. Honda, Tesla, BMW"
                      value={formData.brand}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                      Model <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="model"
                      required
                      placeholder="e.g. Civic, Model 3, M3"
                      value={formData.model}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                      Year <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="year"
                      required
                      min={1990}
                      max={new Date().getFullYear() + 1}
                      value={formData.year}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                      Transmission
                    </label>
                    <select
                      name="transmission"
                      value={formData.transmission}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    >
                      <option value="Automatic">Automatic</option>
                      <option value="Manual">Manual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                      Fuel Type
                    </label>
                    <select
                      name="fuelType"
                      value={formData.fuelType}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Electric">Electric</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                        Seats <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="seats"
                        required
                        min={1}
                        max={10}
                        value={formData.seats}
                        onChange={handleInputChange}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                        Odometer (km)
                      </label>
                      <input
                        type="number"
                        name="odometer"
                        placeholder="Optional"
                        value={formData.odometer}
                        onChange={handleInputChange}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Pricing & Location */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-500" /> Pricing &
                  Location Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                      Price Per Day (₹) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="text-sm font-bold text-zinc-500 absolute left-4 top-3.5 select-none">
                        ₹
                      </span>
                      <input
                        type="number"
                        name="pricePerDay"
                        required
                        min={0}
                        placeholder="0.00"
                        value={formData.pricePerDay}
                        onChange={handleInputChange}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                      Pickup Address <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="address"
                        required
                        placeholder="Street name, City, Zipcode, State"
                        value={formData.address}
                        onChange={handleInputChange}
                        onBlur={geocodeAddress}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                      />
                      <button
                        type="button"
                        onClick={geocodeAddress}
                        disabled={geocodingLoading || !formData.address.trim()}
                        className="px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-xs font-bold text-zinc-350 cursor-pointer disabled:opacity-50 transition-all shrink-0 flex items-center gap-1.5"
                      >
                        {geocodingLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "🔍 Locate"
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <MapPicker
                      lat={formData.latitude}
                      lng={formData.longitude}
                      onChange={(lat, lng) =>
                        setFormData((prev) => ({
                          ...prev,
                          latitude: lat,
                          longitude: lng,
                        }))
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                      Features / Amenities (Comma Separated)
                    </label>
                    <input
                      type="text"
                      name="features"
                      placeholder="e.g. GPS, Leather seats, Bluetooth, Backup camera"
                      value={formData.features}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Photos & Verification Info */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-500" /> Media & Document
                  Details
                </h3>

                {/* Upload Area */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Upload Photos (Max 5){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 rounded-2xl p-8 text-center cursor-pointer transition-all"
                  >
                    <Camera className="w-10 h-10 text-zinc-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-zinc-300">
                      Click to upload files
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Supports PNG, JPG (Min 1 image and Max 5 images)
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Previews grid */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {imagePreviews.map((preview, idx) => (
                      <div
                        key={idx}
                        className="relative group aspect-square rounded-xl overflow-hidden border border-zinc-800"
                      >
                        <img
                          src={preview}
                          alt="vehicle preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/60 hover:bg-black/80 text-zinc-300 transition-all cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Verification Box info */}
                <div className="border border-zinc-800 bg-zinc-950 p-5 rounded-2xl">
                  <div className="flex gap-3 items-start">
                    <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-zinc-200">
                        Registration & Documents Status
                      </h4>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                        To protect our users and maintain security, we require
                        vehicle verification. If you fill in all validation
                        documents below (License Plate, Issuing State, and VIN),
                        your listing will automatically submit for approval
                        review. Otherwise, it will save as a{" "}
                        <strong>Draft</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                        License Plate
                      </label>
                      <input
                        type="text"
                        name="licensePlate"
                        placeholder="e.g. 5XYZ99"
                        value={formData.licensePlate}
                        onChange={handleInputChange}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 uppercase transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                        Issuing State
                      </label>
                      <input
                        type="text"
                        name="issuingState"
                        maxLength={2}
                        placeholder="e.g. NY, CA, IN"
                        value={formData.issuingState}
                        onChange={handleInputChange}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 uppercase transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                        VIN / Chassis No
                      </label>
                      <input
                        type="text"
                        name="vinOrChassis"
                        placeholder="17-Digit Alpha-Num"
                        value={formData.vinOrChassis}
                        onChange={handleInputChange}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 uppercase transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Actions Buttons */}
            <div className="flex justify-between pt-4 border-t border-zinc-800">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1.5 px-5 py-3 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-sm font-semibold text-zinc-350 cursor-pointer transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              ) : (
                <div /> // Spacer
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !isSubmitEnabled}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading
                      Vehicle...
                    </>
                  ) : (
                    <>
                      Submit Listing <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
        </div>
        )}
      </main>

      {/* Draft Warning Modal */}
      {showDraftWarningModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl relative">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <Info className="w-6 h-6 text-amber-400" />
            </div>

            <h3 className="text-xl font-bold text-zinc-100">
              Draft Status Saved
            </h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              You have not entered the chassis and license details, so this
              listing will be saved as a{" "}
              <span className="text-amber-400 font-bold">Draft</span>. You can
              complete the details later to submit it for approval.
            </p>

            <div className="mt-6">
              <button
                onClick={() => {
                  setShowDraftWarningModal(false);
                  navigate("/dashboard");
                }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/20 cursor-pointer"
              >
                Ok, Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListVehicle;
