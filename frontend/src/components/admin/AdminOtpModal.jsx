import { useState, useEffect } from "react";
import axiosInstance from "../../api/axios";
import { toast } from "sonner";
import { ShieldAlert, X } from "lucide-react";

export default function AdminOtpModal({ isOpen, onClose, onConfirm, title, description }) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestingOtp, setRequestingOtp] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOtp("");
      const fetchOtp = async () => {
        setRequestingOtp(true);
        try {
          const res = await axiosInstance.post("/admin/request-otp");
          if (res.data.success) {
            toast.success("OTP sent to your email.");
          }
        } catch (error) {
          toast.error("Failed to request OTP. Please try again.");
          onClose();
        } finally {
          setRequestingOtp(false);
        }
      };
      fetchOtp();
    }
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }
    setLoading(true);
    try {
      await onConfirm(otp);
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-zinc-800 flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldAlert size={24} className="text-blue-500" />
                Security Verification
              </h3>
              <p className="text-sm text-zinc-400 mt-2">
                {title} <br />
                {description}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6">
            {requestingOtp ? (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-zinc-400 text-sm">Sending OTP to your email...</p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Enter 6-digit OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-center text-2xl tracking-[0.5em] focus:border-blue-500 focus:outline-none"
                  placeholder="------"
                  autoFocus
                />
              </div>
            )}
          </div>

          <div className="p-4 bg-zinc-950/50 border-t border-zinc-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || requestingOtp}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || requestingOtp || otp.length !== 6}
              className="px-6 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Execute"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
