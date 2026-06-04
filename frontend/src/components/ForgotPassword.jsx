import { useState } from "react";
import { forgotPassword } from "../api/auth";
import { toast } from "sonner";

const ForgotPassword = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await forgotPassword({ email });
      toast.success(response.message || "Reset link sent! Check your inbox.");
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Could not send reset email. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-zinc-900 rounded-2xl p-8 shadow-2xl border border-zinc-600"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Reset Password</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-zinc-400 mb-6">
          Enter your registered email address and we'll send you a link to reset
          your password.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <input
            type="email"
            placeholder="Email Address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 outline-none focus:border-blue-500 transition"
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-lg font-semibold transition cursor-pointer"
          >
            {loading ? "Sending…" : "Send Reset Link"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
