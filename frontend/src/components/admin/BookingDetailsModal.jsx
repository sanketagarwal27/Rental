import React from "react";
import { X, Calendar, DollarSign } from "lucide-react";

const BookingDetailsModal = ({ selectedBooking, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
          <h3 className="text-lg font-bold flex items-center gap-3">
            Booking: {selectedBooking._id.slice(-6).toUpperCase()}
            <span className="text-xs px-2 py-1 bg-zinc-800 text-zinc-300 rounded-md font-medium uppercase tracking-wider">{selectedBooking.status}</span>
            <span className="text-xs px-2 py-1 bg-zinc-800 text-zinc-300 rounded-md font-medium uppercase tracking-wider">{selectedBooking.paymentStatus}</span>
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-auto flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <h4 className="text-zinc-500 text-xs font-bold uppercase mb-2">
                Customer Info
              </h4>
              <p className="text-sm">
                <strong>Name:</strong> {selectedBooking.customer?.name}
              </p>
              <p className="text-sm">
                <strong>Email:</strong> {selectedBooking.customer?.email}
              </p>
              <p className="text-sm">
                <strong>Phone:</strong>{" "}
                {selectedBooking.customer?.phone || "N/A"}
              </p>
            </div>
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <h4 className="text-zinc-500 text-xs font-bold uppercase mb-2">
                Host Info
              </h4>
              <p className="text-sm">
                <strong>Name:</strong> {selectedBooking.provider?.name}
              </p>
              <p className="text-sm">
                <strong>Email:</strong> {selectedBooking.provider?.email}
              </p>
              <p className="text-sm">
                <strong>Phone:</strong>{" "}
                {selectedBooking.provider?.phone || "N/A"}
              </p>
            </div>
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <h4 className="text-zinc-500 text-xs font-bold uppercase mb-2">
                Vehicle Info
              </h4>
              <p className="text-sm">
                <strong>Brand/Model:</strong> {selectedBooking.vehicle?.brand} {selectedBooking.vehicle?.model}
              </p>
              <p className="text-sm">
                <strong>License Plate:</strong> {selectedBooking.vehicle?.licensePlate || "N/A"}
              </p>
              <p className="text-sm">
                <strong>Year/Type:</strong> {selectedBooking.vehicle?.year} {selectedBooking.vehicle?.type}
              </p>
            </div>
          </div>

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <h4 className="text-zinc-500 text-xs font-bold uppercase mb-2 flex items-center gap-2">
              <Calendar size={14} /> Trip Logistics
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-zinc-400">Start Date</p>
                <p className="font-medium">
                  {new Date(selectedBooking.startDate).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">End Date</p>
                <p className="font-medium">
                  {new Date(selectedBooking.endDate).toLocaleString()}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-zinc-400">Pickup Location</p>
                <p className="font-medium">
                  {selectedBooking.pickupLocation || "Not set yet"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <h4 className="text-zinc-500 text-xs font-bold uppercase mb-2 flex items-center gap-2">
              <DollarSign size={14} /> Financials
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-zinc-400">Total Price</p>
                <p className="font-bold text-lg">
                  ₹{selectedBooking.totalPrice}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Amount Paid</p>
                <p className="font-bold text-lg text-emerald-500">
                  ₹{selectedBooking.amountPaid}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Platform Fee</p>
                <p className="font-bold text-lg">
                  ₹{selectedBooking.platformFee}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Host Payout</p>
                <p className="font-bold text-lg">
                  ₹{selectedBooking.hostPayout}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Deposit Held</p>
                <p className="font-bold text-lg">
                  ₹{selectedBooking.securityDepositHeld}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Refund Issued</p>
                <p className="font-bold text-lg text-red-400">
                  ₹{selectedBooking.refundAmount}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Extra Charges</p>
                <p className="font-bold text-lg">
                  ₹{selectedBooking.extraCharge}
                </p>
              </div>
            </div>
            {selectedBooking.cancellationReason && (
              <div className="mt-4 p-3 bg-red-500/10 text-red-400 rounded-lg text-sm border border-red-500/20">
                <strong>Cancellation Reason:</strong>{" "}
                {selectedBooking.cancellationReason}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsModal;
