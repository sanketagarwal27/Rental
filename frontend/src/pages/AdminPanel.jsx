import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { getAdminStats, getAllUsers } from "../api/admin";
import {
  Users,
  Car,
  CalendarCheck,
  ShieldAlert,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import axiosInstance from "../api/axios.js";
import SupportChat from "../components/SupportChat";
import AdminUsers from "../components/admin/AdminUsers";
import AdminVehicles from "../components/admin/AdminVehicles";
import AdminBookings from "../components/admin/AdminBookings";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import BookingDetailsModal from "../components/admin/BookingDetailsModal.jsx";

const AdminPanel = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVehicles: 0,
    totalBookings: 0,
    bookingStats: {
      completed: 0,
      cancelledTotal: 0,
      cancelledByAdmin: 0,
      cancelledByHost: 0,
      cancelledByCustomer: 0,
    },
    recentCancellations: [],
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [booking, setBooking] = useState(null);
  const [isFetchingBooking, setIsFetchingBooking] = useState(false);

  const handleRowClick = async (bookingId) => {
    try {
      setIsFetchingBooking(true);
      const res = await axiosInstance.get(`/admin/bookings/${bookingId}`);
      if (res.data.success) {
        setBooking(res.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch booking details");
    } finally {
      setIsFetchingBooking(false);
    }
  };

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const statsData = await getAdminStats();
        if (statsData.success) {
          setStats(statsData.data);
        }
      } catch (error) {
        toast.error("Failed to fetch admin data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="flex bg-zinc-950 min-h-screen">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-zinc-950 min-h-screen text-zinc-100">
      <Sidebar />
      <main className="flex-1 lg:ml-0 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 lg:p-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-blue-500" />
              <h1 className="text-3xl font-bold tracking-tight">
                Admin Dashboard
              </h1>
            </div>

            <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "dashboard" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === "users" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}
              >
                <Users size={16} /> Users
              </button>
              <button
                onClick={() => setActiveTab("vehicles")}
                className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === "vehicles" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}
              >
                <Car size={16} /> Vehicles
              </button>
              <button
                onClick={() => setActiveTab("bookings")}
                className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === "bookings" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}
              >
                <CalendarCheck size={16} /> Bookings
              </button>
              <button
                onClick={() => setActiveTab("messages")}
                className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === "messages" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}
              >
                <MessageSquare size={16} /> Support
              </button>
            </div>
          </div>

          {activeTab === "dashboard" ? (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center gap-5">
                  <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Users className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm font-medium">
                      Total Users
                    </p>
                    <p className="text-3xl font-bold mt-1">
                      {stats.totalUsers}
                    </p>
                  </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center gap-5">
                  <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <Car className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm font-medium">
                      Total Vehicles
                    </p>
                    <p className="text-3xl font-bold mt-1">
                      {stats.totalVehicles}
                    </p>
                  </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center gap-5">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <CalendarCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm font-medium">
                      Total Bookings
                    </p>
                    <p className="text-3xl font-bold mt-1">
                      {stats.totalBookings}
                    </p>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold mb-6">Booking Overview</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          {
                            name: "Bookings",
                            Total: stats.totalBookings,
                            Completed: stats.bookingStats?.completed || 0,
                            Cancelled: stats.bookingStats?.cancelledTotal || 0,
                          },
                        ]}
                        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="name" stroke="#a1a1aa" />
                        <YAxis stroke="#a1a1aa" />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "#18181b",
                            borderColor: "#27272a",
                            color: "#f4f4f5",
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="Total"
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="Completed"
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="Cancelled"
                          fill="#ef4444"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold mb-6">
                    Cancellations by Role
                  </h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "By Admin",
                              value: stats.bookingStats?.cancelledByAdmin || 0,
                            },
                            {
                              name: "By Host",
                              value: stats.bookingStats?.cancelledByHost || 0,
                            },
                            {
                              name: "By Customer",
                              value:
                                stats.bookingStats?.cancelledByCustomer || 0,
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          <Cell fill="#ef4444" /> {/* Admin: Red */}
                          <Cell fill="#f59e0b" /> {/* Host: Orange */}
                          <Cell fill="#8b5cf6" /> {/* Customer: Purple */}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "#18181b",
                            borderColor: "#27272a",
                            color: "#f4f4f5",
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Cancellations Table */}
              {booking && (
                <BookingDetailsModal
                  onClose={() => setBooking(null)}
                  selectedBooking={booking}
                />
              )}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-6">Recent Cancellations</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-400 text-sm">
                        <th className="py-3 px-4 font-medium">Role</th>
                        <th className="py-3 px-4 font-medium">Cancelled By</th>
                        <th className="py-3 px-4 font-medium">Reason</th>
                        <th className="py-3 px-4 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {stats.recentCancellations?.length > 0 ? (
                        stats.recentCancellations.map((cancel) => (
                          <tr
                            key={cancel.bookingId}
                            className="hover:bg-zinc-800/20 transition-colors cursor-pointer"
                            onClick={() => handleRowClick(cancel.bookingId)}
                          >
                            <td className="py-3 px-4 text-sm">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  cancel.cancelledBy === "Admin"
                                    ? "bg-red-500/10 text-red-500"
                                    : cancel.cancelledBy === "Host"
                                      ? "bg-orange-500/10 text-orange-500"
                                      : "bg-purple-500/10 text-purple-500"
                                }`}
                              >
                                {cancel.cancelledBy}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm font-medium">
                              {cancel.cancelledByName}
                            </td>
                            <td className="py-3 px-4 text-sm text-zinc-400 max-w-xs truncate">
                              {cancel.reason || "No reason provided"}
                            </td>
                            <td className="py-3 px-4 text-sm text-zinc-400">
                              {new Date(cancel.date).toLocaleDateString('en-GB')}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="5"
                            className="py-8 text-center text-zinc-500 text-sm"
                          >
                            No recent cancellations found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : activeTab === "users" ? (
            <AdminUsers />
          ) : activeTab === "vehicles" ? (
            <AdminVehicles />
          ) : activeTab === "bookings" ? (
            <AdminBookings />
          ) : (
            <SupportChat isWidget={false} />
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
