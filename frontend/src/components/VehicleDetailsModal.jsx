import React from "react";
import { X, Car, Info, MapPin, Tag, FileText, CheckCircle } from "lucide-react";

export default function VehicleDetailsModal({ vehicle, onClose }) {
  if (!vehicle) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Car className="w-5 h-5 text-zinc-400" />
            Vehicle Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-full sm:w-1/3 aspect-video sm:aspect-square bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 shrink-0">
              {vehicle.images?.[0] ? (
                <img
                  src={vehicle.images[0]}
                  alt={vehicle.model}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-500">
                  <Car size={40} />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-2xl font-black text-white">
                  {vehicle.brand} {vehicle.model}
                </h3>
                <p className="text-zinc-400 font-medium mt-1">
                  {vehicle.year} • {vehicle.category}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">
                    Status
                  </p>
                  <p className="text-sm font-semibold text-zinc-200">
                    {vehicle.status}
                  </p>
                </div>
                <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">
                    Price per day
                  </p>
                  <p className="text-sm font-semibold text-zinc-200">
                    ₹{vehicle.pricePerDay}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-2 border-b border-zinc-800 pb-2">
                <Info className="w-4 h-4 text-zinc-500" /> Specifications
              </h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li className="flex justify-between">
                  <span className="text-zinc-500">Type:</span>{" "}
                  <span className="font-medium text-zinc-300">
                    {vehicle.type}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-zinc-500">Transmission:</span>{" "}
                  <span className="font-medium text-zinc-300">
                    {vehicle.transmission}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-zinc-500">Fuel Type:</span>{" "}
                  <span className="font-medium text-zinc-300">
                    {vehicle.fuelType}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-zinc-500">Seats:</span>{" "}
                  <span className="font-medium text-zinc-300">
                    {vehicle.seats}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-zinc-500">Odometer:</span>{" "}
                  <span className="font-medium text-zinc-300">
                    {vehicle.odometer || "N/A"}
                  </span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-2 border-b border-zinc-800 pb-2">
                <FileText className="w-4 h-4 text-zinc-500" /> Registration
              </h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li className="flex justify-between">
                  <span className="text-zinc-500">License Plate:</span>{" "}
                  <span className="font-medium text-zinc-300">
                    {vehicle.licensePlate || "N/A"}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-zinc-500">State:</span>{" "}
                  <span className="font-medium text-zinc-300">
                    {vehicle.issuingState || "N/A"}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-zinc-500">VIN/Chassis:</span>{" "}
                  <span className="font-medium text-zinc-300">
                    {vehicle.vinOrChassis || "N/A"}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {vehicle.features?.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-2 border-b border-zinc-800 pb-2">
                <Tag className="w-4 h-4 text-zinc-500" /> Features
              </h4>
              <div className="flex flex-wrap gap-2">
                {vehicle.features.map((feature, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-medium text-zinc-300 flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
