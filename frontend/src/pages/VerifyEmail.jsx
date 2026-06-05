import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "../api/axios";
import { ShieldCheck, ShieldAlert, Loader2, ArrowRight } from "lucide-react";

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [errorMsg, setErrorMsg] = useState("");

  const { checkUserStatus } = useAuth();
  const verifyFetched = useRef(false);

  useEffect(() => {
    if (verifyFetched.current) return;
    verifyFetched.current = true;

    const verifyToken = async () => {
      try {
        const response = await axios.get(`/user/verify-email/${token}`);
        if (response.data?.success) {
          setStatus("success");
          // Refresh user context immediately so they don't have to manually refresh!
          await checkUserStatus();
        } else {
          setStatus("error");
          setErrorMsg(response.data?.message || "Failed to verify email");
        }
      } catch (err) {
        setStatus("error");
        setErrorMsg(err.response?.data?.message || "Invalid or expired verification link");
      }
    };
    verifyToken();
  }, [token, checkUserStatus]);

  return (
    <div className="min-h-screen bg-transparent flex flex-col justify-center items-center px-4 font-sans">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600" />
        
        {status === "loading" && (
          <div className="flex flex-col items-center py-6">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-zinc-100">Verifying Email Address</h2>
            <p className="text-xs text-zinc-500 mt-2">Please wait while we verify your credentials...</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-100">Verification Complete!</h2>
            <p className="text-sm text-zinc-400 mt-2 max-w-xs">
              Thank you! Your email address has been verified successfully.
            </p>
            <Link 
              to="/profile" 
              className="w-full mt-8 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              Go to Profile <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6">
              <ShieldAlert className="w-8 h-8 text-rose-400" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-100">Verification Failed</h2>
            <p className="text-sm text-rose-400 mt-2 font-medium">
              {errorMsg}
            </p>
            <p className="text-xs text-zinc-500 mt-2 max-w-xs">
              The link might have expired or has already been used. Please try sending a new verification link from your profile settings.
            </p>
            <Link 
              to="/profile" 
              className="w-full mt-8 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-sm transition-all cursor-pointer"
            >
              Back to Profile
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
