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

const AdminPanel = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVehicles: 0,
    totalBookings: 0,
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" or "messages"
  const [conversations, setConversations] = useState([]);
  const [activeChatUserId, setActiveChatUserId] = useState(null);

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

  useEffect(() => {
    if (activeTab === "messages") {
      const fetchConversations = async () => {
        try {
          const res = await axiosInstance.get("/message/admin/conversations");
          setConversations(res.data.data || []);
        } catch (error) {
          console.error("Failed to fetch conversations", error);
        }
      };
      fetchConversations();
    }
  }, [activeTab]);

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
            </>
          ) : activeTab === "users" ? (
            <AdminUsers />
          ) : activeTab === "vehicles" ? (
            <AdminVehicles />
          ) : activeTab === "bookings" ? (
            <AdminBookings />
          ) : (
            <div className="flex bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden h-[600px]">
              {/* Conversations List */}
              <div className="w-1/3 border-r border-zinc-800 overflow-y-auto">
                <div className="p-4 border-b border-zinc-800">
                  <h3 className="font-bold">Conversations</h3>
                </div>
                <div className="divide-y divide-zinc-800">
                  {conversations.length === 0 && (
                    <div className="p-4 text-zinc-500 text-center text-sm">
                      No messages yet.
                    </div>
                  )}
                  {conversations.map((conv) => (
                    <div
                      key={conv.user._id}
                      onClick={() => setActiveChatUserId(conv.user._id)}
                      className={`p-4 cursor-pointer transition-colors ${activeChatUserId === conv.user._id ? "bg-zinc-800" : "hover:bg-zinc-800/50"}`}
                    >
                      <div className="font-medium text-sm text-zinc-200">
                        {conv.user.fullName || conv.user.email}
                      </div>
                      <div className="text-xs text-zinc-500 truncate mt-1">
                        {conv.lastMessage.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat View */}
              <div className="flex-1 bg-zinc-950">
                {activeChatUserId ? (
                  <SupportChat
                    isWidget={false}
                    otherUserId={activeChatUserId}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-500">
                    Select a conversation to start messaging
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
