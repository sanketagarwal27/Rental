import { useState } from "react";
import { login } from "../api/auth";

const LoginForm = ({ onClose, onSignUp, forgot }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log({
      email,
      password,
    });
    const payload = {
      email: email,
      password: password,
    };
    try {
      const response = await login(payload);
      console.log(response);
      onClose();
    } catch (err) {
      console.error("Error in logging in..", err);
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
            className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
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
            className="bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold transition"
          >
            Login
          </button>
        </form>
        <div className="text-center text-sm text-zinc-400 mt-4">
          Join the Elite Club{" -> "}
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
