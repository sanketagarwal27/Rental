import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Car,
  PlusCircle,
  Calendar,
  MessageSquare,
  User,
  Settings,
  LogOut,
} from "lucide-react";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    { to: "/dashboard/profile", label: "Profile", icon: User },
  ];

  // Helper to extract initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="w-64 h-screen bg-zinc-950 border-r border-zinc-900 text-zinc-100 flex flex-col justify-between sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-zinc-900 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              AUTO<span className="text-blue-500">RENT</span>
            </h1>
            <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
              Vehicle Rentals
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col p-4 gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/dashboard"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative font-medium text-sm ${
                    isActive
                      ? "bg-blue-600/10 text-blue-400 font-semibold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${
                        isActive
                          ? "text-blue-400"
                          : "text-zinc-400 group-hover:text-zinc-200"
                      }`}
                    />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-md shadow-blue-500/50" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Session Profile & Logout */}
      <div className="p-4 border-t border-zinc-900 bg-zinc-950 flex flex-col gap-3">
        {user && (
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sm font-semibold text-zinc-300 uppercase shadow-inner">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getInitials(user.name)
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-zinc-200 truncate leading-tight">
                {user.name}
              </span>
              <span className="text-xs text-zinc-500 truncate mt-0.5">
                {user.email}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 w-full text-left font-medium text-sm cursor-pointer mt-1"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
