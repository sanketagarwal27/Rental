import { useState } from "react";
import { forgotPassword } from "../api/auth";
import { useNavigate } from "react-router-dom";

const ForgotPassword = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [text, setText] = useState("Send Reset Link");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setText("");
      setLoading(true);
      const response = await forgotPassword({ email });
      console.log(response.message);
      setLoading(false);
      setText(response.message);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
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
          <h2 className="text-2xl font-bold text-white">Enter Your Email</h2>
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
            className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold transition"
          >
            {text}
            {loading && (
              <div className="flex justify-center">
                <div className="w-8 h-8 border-4 border-zinc-700 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
