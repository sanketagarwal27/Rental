import { useState } from "react";
import { register } from "../api/auth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SignupForm = ({ onClose, onLogin }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { name, email, password };
      const res = await register(payload);
      // Since the backend now logs in the user directly, we can set the user state
      if (res && res.data) {
        setUser(res.data);
      }
      onClose(); // Close the signup modal
      navigate("/dashboard");
    } catch (err) {
      const message =
        err.response?.data?.message || "Sign up failed. Please try again.";
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
        className="w-full max-w-md bg-zinc-900 rounded-2xl p-8 border border-zinc-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between mb-6">
          <h2 className="text-2xl font-bold">Sign Up</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Full Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 outline-none focus:border-blue-500 transition"
          />

          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 outline-none focus:border-blue-500 transition"
          />

          <input
            type="password"
            placeholder="Create a Strong Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 outline-none focus:border-blue-500 transition"
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-lg font-semibold transition cursor-pointer"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>

          <div className="text-center text-sm text-zinc-400">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onLogin}
              className="text-blue-400 hover:text-blue-300"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupForm;
