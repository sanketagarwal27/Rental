import { useState, useEffect } from "react";
import axiosInstance from "../../api/axios";
import { toast } from "sonner";
import { Search, Ban, CheckCircle, Car } from "lucide-react";
import AdminOtpModal from "./AdminOtpModal";
import VehicleDetailsModal from "../VehicleDetailsModal";

export default function AdminVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedVehicleForDetails, setSelectedVehicleForDetails] = useState(null);

  const [otpModal, setOtpModal] = useState({ open: false, id: null, isBlocked: false });

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/admin/vehicles?page=${page}&limit=10&search=${search}`);
      if (res.data.success) {
        setVehicles(res.data.data);
        setTotalPages(res.data.pagination.pages);
      }
    } catch (error) {
      toast.error("Failed to fetch vehicles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [page, search]);

  const toggleBlock = (id, isBlocked) => {
    setOtpModal({ open: true, id, isBlocked });
  };

  const executeBlock = async (otp) => {
    try {
      const { id, isBlocked } = otpModal;
      const res = await axiosInstance.patch(`/admin/vehicles/${id}/block`, { otp });
      if (res.data.success) {
        toast.success(res.data.message);
        setVehicles((prev) => prev.map((v) => (v._id === id ? { ...v, isBlocked: !isBlocked } : v)));
        setOtpModal({ open: false });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to block/unblock vehicle");
      throw error;
    }
  };

  const verifyVehicle = async (id) => {
    try {
      const res = await axiosInstance.patch(`/admin/vehicles/${id}/verify`);
      if (res.data.success) {
        toast.success(res.data.message);
        setVehicles((prev) =>
          prev.map((v) => (v._id === id ? { ...v, status: "Approved" } : v))
        );
      }
    } catch (error) {
      toast.error("Failed to verify vehicle");
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col h-[700px]">
      <div className="p-6 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold">Vehicle Management</h2>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search brand, model..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50 sticky top-0 z-10 shadow-sm">
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">License</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Provider</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {vehicles.map((v) => (
                <tr 
                  key={v._id} 
                  onClick={() => setSelectedVehicleForDetails(v)}
                  className="hover:bg-zinc-800/30 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden flex items-center justify-center text-zinc-500">
                        {v.images?.[0] ? (
                          <img src={v.images[0]} alt={v.model} className="w-full h-full object-cover" />
                        ) : (
                          <Car size={20} />
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-sm block">{v.brand} {v.model}</span>
                        <span className="text-xs text-zinc-500">{v.year} • {v.type}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400 font-mono">
                    {v.licensePlate || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                    {v.provider?.name || "Unknown"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${v.status === "Approved" ? "bg-emerald-500/10 text-emerald-400" : v.status === "Pending" ? "bg-amber-500/10 text-amber-400" : "bg-zinc-800 text-zinc-400"}`}>
                        {v.status}
                      </span>
                      {v.isBlocked && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-red-500/10 text-red-500">
                          Blocked
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex justify-end gap-2">
                      {v.status !== "Approved" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); verifyVehicle(v._id); }}
                          className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                          title="Verify / Approve Vehicle"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleBlock(v._id, v.isBlocked); }}
                        className={`p-2 rounded-lg transition-colors ${
                          v.isBlocked ? "text-red-500 bg-red-500/10 hover:bg-red-500/20" : "text-zinc-400 hover:text-red-400 hover:bg-red-400/10"
                        }`}
                        title={v.isBlocked ? "Unblock Vehicle" : "Block Vehicle"}
                      >
                        {v.isBlocked ? <CheckCircle size={18} /> : <Ban size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-zinc-500">
                    No vehicles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
        <span className="text-sm text-zinc-500">Page {page} of {totalPages || 1}</span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-sm bg-zinc-800 text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
            className="px-3 py-1.5 rounded-lg text-sm bg-zinc-800 text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition"
          >
            Next
          </button>
        </div>
      </div>

      {otpModal.open && (
        <AdminOtpModal
          isOpen={otpModal.open}
          onClose={() => setOtpModal({ ...otpModal, open: false })}
          onConfirm={executeBlock}
          title={otpModal.isBlocked ? "Unblock Vehicle" : "Block Vehicle"}
          description={`You are about to ${otpModal.isBlocked ? "unblock" : "block"} this vehicle.`}
        />
      )}

      {/* Vehicle Details Modal */}
      <VehicleDetailsModal
        vehicle={selectedVehicleForDetails}
        onClose={() => setSelectedVehicleForDetails(null)}
      />
    </div>
  );
}
