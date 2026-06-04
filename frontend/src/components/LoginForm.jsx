import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

const LoginForm = ({ onClose, onSignUp, forgot }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
      toast.success("Logged in successfully!", { duration: 500 });
      onClose();
      navigate("/home");
    } catch (err) {
      const message =
        err.response?.data?.message || "Invalid credentials. Please try again.";
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
          <h2 className="text-2xl font-bold text-white">Login</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <input
            type="email"
            placeholder="Email Address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 outline-none focus:border-blue-500 transition"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 outline-none focus:border-blue-500 transition"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={forgot}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Forgot Password?
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-lg font-semibold transition cursor-pointer"
          >
            {loading ? "Logging in…" : "Login"}
          </button>
        </form>

        <div className="text-center text-sm text-zinc-400 mt-4">
          New here?{" "}
          <button
            type="button"
            onClick={onSignUp}
            className="text-blue-400 hover:text-blue-300"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
