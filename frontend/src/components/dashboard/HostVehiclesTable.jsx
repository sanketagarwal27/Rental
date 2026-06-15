import React from "react";
import { useNavigate } from "react-router-dom";
import { formatINR, getStatusColor } from "../../utils/dashboardUtils";
import { ChevronRight, PlusCircle, Car, AlertCircle } from "lucide-react";

const HostVehiclesTable = ({ vehiclesHosted }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
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
          You haven't listed any vehicles yet. Click "List a Vehicle" to get started!
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
                      <AlertCircle className="w-3 h-3 shrink-0" /> Awaiting VIN & License details for approval
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
                      onClick={() => navigate("/list-vehicle", { state: { draft: v } })}
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
  );
};

export default HostVehiclesTable;
