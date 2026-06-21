import { useState, useRef } from "react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import {
  updateProfile,
  updateAvatar,
  sendEmailVerification,
  changePassword,
  sendPhoneOtp,
  verifyPhoneOtp,
} from "../api/profile";
import {
  User as UserIcon,
  Mail,
  Phone,
  ShieldCheck,
  ShieldAlert,
  Camera,
  Loader2,
  Check,
  Edit3,
  Lock,
  ArrowRight,
  TrendingUp,
  Globe,
  VerifiedIcon,
  AlertCircle,
} from "lucide-react";

const COUNTRY_CODES = [
  { code: "+1", country: "US/CA" },
  { code: "+91", country: "IN" },
  { code: "+44", country: "UK" },
  { code: "+61", country: "AU" },
  { code: "+49", country: "DE" },
  { code: "+33", country: "FR" },
  { code: "+81", country: "JP" },
  { code: "+86", country: "CN" },
  { code: "+55", country: "BR" },
  { code: "+7", country: "RU" },
];

const Profile = () => {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);

  // Helper to split stored phone: +919876543210 -> code: "+91", number: "9876543210"
  const parsePhone = (fullPhone) => {
    if (!fullPhone) return { code: "+91", number: "" };
    const matched = COUNTRY_CODES.find((c) => fullPhone.startsWith(c.code));
    if (matched) {
      return {
        code: matched.code,
        number: fullPhone.slice(matched.code.length),
      };
    }
    return { code: "+91", number: fullPhone };
  };

  // States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState(() => {
    const parsed = parsePhone(user?.phone);
    return {
      name: user?.name || "",
      phoneCountry: parsed.code,
      phoneNumber: parsed.number,
    };
  });

  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passForm, setPassForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const triggerAlert = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 6000);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Combine country code and number
    let combinedPhone = "";
    if (profileForm.phoneNumber.trim()) {
      combinedPhone = `${profileForm.phoneCountry}${profileForm.phoneNumber.trim().replace(/\D/g, "")}`;
    }

    try {
      const response = await updateProfile({
        name: profileForm.name,
        phone: combinedPhone || undefined,
      });
      if (response?.success) {
        setUser(response.data);
        setIsEditingProfile(false);
        triggerAlert("success", "Profile details updated successfully!");
      }
    } catch (err) {
      triggerAlert(
        "error",
        err.response?.data?.message || "Failed to update profile",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    setLoading(true);
    try {
      const response = await updateAvatar(formData);
      if (response?.success) {
        setUser(response.data);
        triggerAlert("success", "Avatar updated successfully!");
      }
    } catch (err) {
      triggerAlert(
        "error",
        err.response?.data?.message || "Failed to upload avatar",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    setVerifyLoading(true);
    try {
      const response = await sendEmailVerification();
      if (response?.success) {
        triggerAlert(
          "success",
          "Verification email sent! Please check your inbox.",
        );
      }
    } catch (err) {
      triggerAlert(
        "error",
        err.response?.data?.message || "Failed to send verification email",
      );
    } finally {
      setVerifyLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      return triggerAlert("error", "New passwords do not match");
    }

    setLoading(true);
    try {
      const response = await changePassword({
        oldPassword: passForm.oldPassword,
        newPassword: passForm.newPassword,
      });
      if (response?.success) {
        setIsChangingPass(false);
        setPassForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        triggerAlert("success", "Password updated successfully!");
      }
    } catch (err) {
      triggerAlert(
        "error",
        err.response?.data?.message || "Failed to change password",
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletion = () => {
    let steps = 0;
    let total = 5;
    if (user?.name) steps++;
    if (user?.email) steps++;
    if (user?.phone) steps++;
    if (user?.avatar) steps++;
    if (user?.isVerifiedEmail) steps++;
    return Math.round((steps / total) * 100);
  };

  const completionRate = calculateCompletion();

  return (
    <div className="flex min-h-screen bg-transparent text-zinc-100 font-sans selection:bg-blue-600/30">
      <Sidebar />

      <main className="flex-1 p-8 pb-32 lg:pb-8 overflow-y-auto max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
              My Profile
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Manage your profile details, verifications, and security settings.
            </p>
          </div>

          {/* Progress bar */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
            <div className="relative w-12 h-12 flex items-center justify-center rounded-full bg-zinc-950 border-2 border-zinc-800">
              {completionRate == 100 ? (
                <VerifiedIcon className="text-green-400" />
              ) : (
                <span className="text-xs font-bold font-mono text-blue-400">
                  {completionRate}%
                </span>
              )}
            </div>
            <div>
              {completionRate == 100 ? (
                <h4 className="text-xs font-semibold text-zinc-300">
                  Profile Completed
                </h4>
              ) : (
                <h4 className="text-xs font-semibold text-zinc-300">
                  Profile Completion
                  <p className="text-[10px] text-zinc-500">
                    Complete tasks to reach 100%
                  </p>
                </h4>
              )}
            </div>
          </div>
        </div>

        {/* Global Alert Notification */}
        {message.text && (
          <div
            className={`p-4 rounded-xl mb-6 flex items-center gap-3 border text-sm animate-fade-in ${
              message.type === "success"
                ? "bg-emerald-950/30 border-emerald-800/50 text-emerald-400"
                : "bg-rose-950/30 border-rose-800/50 text-rose-400"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Avatar & Basic Info Card */}
          <div className="md:col-span-1 flex flex-col gap-6">
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-blue-600/20 to-purple-600/20 -z-10" />

              {/* Avatar Section */}
              <div
                className="relative group mt-6 mb-4 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-28 h-28 rounded-full border-2 border-zinc-700 bg-zinc-950 flex items-center justify-center text-3xl font-extrabold text-zinc-400 uppercase overflow-hidden transition-all duration-300 group-hover:border-blue-500 group-hover:scale-[1.02]">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user?.name?.slice(0, 2) || "U"
                  )}
                </div>
                <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>

              <h2 className="text-xl font-bold">{user?.name}</h2>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                {user?.email}
              </p>

              {/* Badges / Verified Labels */}
              <div className="flex flex-col gap-2 w-full mt-4">
                {user?.isVerifiedEmail ? (
                  <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-3.5 h-3.5" /> Email Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <ShieldAlert className="w-3.5 h-3.5" /> Unverified Email
                  </span>
                )}
              </div>
            </div>

            {/* Quick Stats / Actions */}
            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-5 flex flex-col gap-3">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                Account Overview
              </h3>
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-zinc-300">
                    Status
                  </span>
                </div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  Active User
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed forms and verification actions */}
          <div className="md:col-span-2 flex flex-col gap-6">
            {/* Personal Details Form Section */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-md">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <UserIcon className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-bold text-zinc-100">
                    Personal Details
                  </h3>
                </div>
                {!isEditingProfile && (
                  <button
                    onClick={() => {
                      const parsed = parsePhone(user?.phone);
                      setProfileForm({
                        name: user?.name || "",
                        phoneCountry: parsed.code,
                        phoneNumber: parsed.number,
                      });
                      setIsEditingProfile(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 cursor-pointer transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, name: e.target.value })
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                      Phone Number
                    </label>
                    <div className="flex gap-2">
                      <div className="relative">
                        <select
                          value={profileForm.phoneCountry}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              phoneCountry: e.target.value,
                            })
                          }
                          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all appearance-none cursor-pointer pr-8"
                        >
                          {COUNTRY_CODES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.code} ({c.country})
                            </option>
                          ))}
                        </select>
                        <Globe className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 top-4 pointer-events-none" />
                      </div>

                      <input
                        type="tel"
                        placeholder="98765 43210"
                        value={profileForm.phoneNumber}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            phoneNumber: e.target.value,
                          })
                        }
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}{" "}
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/40">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Full Name
                    </span>
                    <p className="text-sm font-semibold text-zinc-200 mt-1">
                      {user?.name || "Not set"}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/40">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Email Address
                    </span>
                    <p className="text-sm font-semibold text-zinc-200 mt-1">
                      {user?.email}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/40 sm:col-span-2">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Phone Number
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm font-semibold text-zinc-200">
                        {user?.phone || "Not configured yet"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Verification Settings */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-bold text-zinc-100">
                  Identity Verification
                </h3>
              </div>

              <div className="space-y-4">
                {/* Email Verification Box */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Mail className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-200">
                        Email Address
                      </h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  {user?.isVerifiedEmail ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                      <Check className="w-3.5 h-3.5" /> Verified
                    </span>
                  ) : (
                    <button
                      onClick={handleVerifyEmail}
                      disabled={verifyLoading}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/10 self-start sm:self-auto disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {verifyLoading && (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      )}{" "}
                      Verify Email
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Change Password Form */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-md">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-bold text-zinc-100">
                    Change Password
                  </h3>
                </div>
                {!isChangingPass && (
                  <button
                    onClick={() => setIsChangingPass(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 cursor-pointer transition-all"
                  >
                    Update Password
                  </button>
                )}
              </div>

              {isChangingPass && (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        required
                        value={passForm.oldPassword}
                        onChange={(e) =>
                          setPassForm({
                            ...passForm,
                            oldPassword: e.target.value,
                          })
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={passForm.newPassword}
                        onChange={(e) =>
                          setPassForm({
                            ...passForm,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={passForm.confirmPassword}
                        onChange={(e) =>
                          setPassForm({
                            ...passForm,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsChangingPass(false)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}{" "}
                      Update Password
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl relative">
            <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <Phone className="w-6 h-6 text-purple-400" />
            </div>

            <h3 className="text-xl font-bold text-zinc-100">
              Verify Phone Number
            </h3>
            <p className="text-xs text-zinc-400 mt-2">
              We've simulated sending a 6-digit OTP code to{" "}
              <span className="text-zinc-200 font-semibold">{user?.phone}</span>
              .
            </p>
            <p className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 p-2 rounded-lg mt-3 font-semibold">
              🔒 Dev Mode: Look at your backend console output to find the OTP!
            </p>

            <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
              <input
                type="text"
                maxLength={6}
                required
                placeholder="Enter 6-digit OTP"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                className="w-full text-center tracking-[0.5em] text-lg font-bold bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
              />

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpModal(false);
                    setOtpCode("");
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={otpLoading || otpCode.length !== 6}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {otpLoading && <Loader2 className="w-4 h-4 animate-spin" />}{" "}
                  Verify OTP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
