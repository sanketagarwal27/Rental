import { useState, useEffect } from "react";
import axiosInstance from "../../api/axios";
import { toast } from "sonner";
import { Search, Eye, XCircle, Calendar, DollarSign, X } from "lucide-react";
import AdminOtpModal from "./AdminOtpModal";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const [selectedBooking, setSelectedBooking] = useState(null); // For view details modal
  const [cancelModal, setCancelModal] = useState({ open: false, booking: null });
  const [cancelData, setCancelData] = useState({ refundAmount: 0, hostPayout: 0, reason: "" });
  const [otpModalOpen, setOtpModalOpen] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/admin/bookings?page=${page}&limit=10&search=${search}`);
      if (res.data.success) {
        setBookings(res.data.data);
        setTotalPages(res.data.pagination.pages);
      }
    } catch (error) {
      toast.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page, search]);

  const handleCancelSubmit = (e) => {
    e.preventDefault();
    // Open OTP modal instead of direct API call
    setOtpModalOpen(true);
  };

  const executeCancel = async (otp) => {
    try {
      const payload = { ...cancelData, otp };
      const res = await axiosInstance.patch(`/admin/bookings/${cancelModal.booking._id}/cancel`, payload);
      if (res.data.success) {
        toast.success("Booking cancelled successfully");
        setOtpModalOpen(false);
        setCancelModal({ open: false, booking: null });
        fetchBookings();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel booking");
      throw error;
    }
  };

  const openCancelModal = (booking) => {
    setCancelData({
      refundAmount: booking.amountPaid || 0,
      hostPayout: 0,
      reason: "",
    });
    setCancelModal({ open: true, booking });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col h-[700px]">
      <div className="p-6 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold">Booking Management</h2>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search bookings..."
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
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Customer / Host</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {bookings.map((b) => (
                <tr key={b._id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden flex items-center justify-center">
                        {b.vehicle?.images?.[0] && <img src={b.vehicle.images[0]} alt="vehicle" className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <span className="font-medium text-sm block">{b.vehicle?.brand} {b.vehicle?.model}</span>
                        <span className="text-xs text-zinc-500">{b.vehicle?.licensePlate || "N/A"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <span className="text-zinc-300">C:</span> {b.customer?.name} <br/>
                      <span className="text-zinc-500">H:</span> {b.provider?.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-zinc-400 flex flex-col gap-1">
                      <span>{new Date(b.startDate).toLocaleDateString()}</span>
                      <span>{new Date(b.endDate).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-wider ${
                      b.status === "Completed" ? "bg-emerald-500/10 text-emerald-400" :
                      b.status === "Cancelled" ? "bg-red-500/10 text-red-400" :
                      b.status === "Confirmed" || b.status === "Ongoing" ? "bg-blue-500/10 text-blue-400" :
                      "bg-zinc-800 text-zinc-400"
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      {!["Completed", "Cancelled"].includes(b.status) && (
                        <button
                          onClick={() => openCancelModal(b)}
                          className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Force Cancel"
                        >
                          <XCircle size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-zinc-500">
                    No bookings found.
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

      {/* Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h3 className="text-lg font-bold">Booking Details: {selectedBooking._id}</h3>
              <button onClick={() => setSelectedBooking(null)} className="text-zinc-400 hover:text-white"><X size={20}/></button>
            </div>
            <div className="p-6 overflow-auto flex flex-col gap-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                  <h4 className="text-zinc-500 text-xs font-bold uppercase mb-2">Customer Info</h4>
                  <p className="text-sm"><strong>Name:</strong> {selectedBooking.customer?.name}</p>
                  <p className="text-sm"><strong>Email:</strong> {selectedBooking.customer?.email}</p>
                  <p className="text-sm"><strong>Phone:</strong> {selectedBooking.customer?.phone || "N/A"}</p>
                </div>
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                  <h4 className="text-zinc-500 text-xs font-bold uppercase mb-2">Host Info</h4>
                  <p className="text-sm"><strong>Name:</strong> {selectedBooking.provider?.name}</p>
                  <p className="text-sm"><strong>Email:</strong> {selectedBooking.provider?.email}</p>
                  <p className="text-sm"><strong>Phone:</strong> {selectedBooking.provider?.phone || "N/A"}</p>
                </div>
              </div>

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <h4 className="text-zinc-500 text-xs font-bold uppercase mb-2 flex items-center gap-2"><Calendar size={14}/> Trip Logistics</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-zinc-400">Start Date</p>
                    <p className="font-medium">{new Date(selectedBooking.startDate).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">End Date</p>
                    <p className="font-medium">{new Date(selectedBooking.endDate).toLocaleString()}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-zinc-400">Pickup Location</p>
                    <p className="font-medium">{selectedBooking.pickupLocation || "Not set yet"}</p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <h4 className="text-zinc-500 text-xs font-bold uppercase mb-2 flex items-center gap-2"><DollarSign size={14}/> Financials</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-zinc-400">Total Price</p>
                    <p className="font-bold text-lg">₹{selectedBooking.totalPrice}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Amount Paid</p>
                    <p className="font-bold text-lg text-emerald-500">₹{selectedBooking.amountPaid}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Platform Fee</p>
                    <p className="font-bold text-lg">₹{selectedBooking.platformFee}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Host Payout</p>
                    <p className="font-bold text-lg">₹{selectedBooking.hostPayout}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Deposit Held</p>
                    <p className="font-bold text-lg">₹{selectedBooking.securityDepositHeld}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Refund Issued</p>
                    <p className="font-bold text-lg text-red-400">₹{selectedBooking.refundAmount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Extra Charges</p>
                    <p className="font-bold text-lg">₹{selectedBooking.extraCharge}</p>
                  </div>
                </div>
                {selectedBooking.cancellationReason && (
                  <div className="mt-4 p-3 bg-red-500/10 text-red-400 rounded-lg text-sm border border-red-500/20">
                    <strong>Cancellation Reason:</strong> {selectedBooking.cancellationReason}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-red-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <form onSubmit={handleCancelSubmit}>
              <div className="p-6 border-b border-zinc-800">
                <h3 className="text-xl font-bold text-red-500 flex items-center gap-2">
                  <XCircle size={24} />
                  Force Cancel Booking
                </h3>
                <p className="text-sm text-zinc-400 mt-2">
                  You are about to cancel booking {cancelModal.booking?._id}. Please define the exact refund to the customer and payout to the host.
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Customer Refund Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={cancelData.refundAmount}
                    onChange={(e) => setCancelData({...cancelData, refundAmount: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 focus:border-red-500 focus:outline-none"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Total Paid by Customer: ₹{cancelModal.booking?.amountPaid}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Host Payout Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={cancelData.hostPayout}
                    onChange={(e) => setCancelData({...cancelData, hostPayout: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 focus:border-red-500 focus:outline-none"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Expected Standard Payout: ₹{cancelModal.booking?.hostPayout}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Cancellation Reason (Optional)</label>
                  <textarea
                    rows={3}
                    value={cancelData.reason}
                    onChange={(e) => setCancelData({...cancelData, reason: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 focus:border-red-500 focus:outline-none resize-none"
                    placeholder="Briefly explain why admin is cancelling..."
                  />
                </div>
              </div>
              <div className="p-4 bg-zinc-950/50 border-t border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCancelModal({open: false, booking: null})}
                  className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors shadow-lg shadow-red-600/20"
                >
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminOtpModal
        isOpen={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        onConfirm={executeCancel}
        title="Force Cancel Booking"
        description={`You are about to cancel booking ${cancelModal.booking?._id}. This involves financial transactions.`}
      />

    </div>
  );
}
