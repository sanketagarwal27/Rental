import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { getAdminStats, getAllUsers } from "../api/admin";
import { Users, Car, CalendarCheck, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

const AdminPanel = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalVehicles: 0, totalBookings: 0 });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [statsData, usersData] = await Promise.all([
          getAdminStats(),
          getAllUsers(),
        ]);
        if (statsData.success) {
          setStats(statsData.data);
        }
        if (usersData.success) {
          setUsers(usersData.data);
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
          <div className="flex items-center gap-3 mb-8">
            <ShieldAlert className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <p className="text-zinc-400 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold mt-1">{stats.totalUsers}</p>
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <Car className="w-7 h-7" />
              </div>
              <div>
                <p className="text-zinc-400 text-sm font-medium">Total Vehicles</p>
                <p className="text-3xl font-bold mt-1">{stats.totalVehicles}</p>
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <CalendarCheck className="w-7 h-7" />
              </div>
              <div>
                <p className="text-zinc-400 text-sm font-medium">Total Bookings</p>
                <p className="text-3xl font-bold mt-1">{stats.totalBookings}</p>
              </div>
            </div>
          </div>

          {/* Users List */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-xl font-bold">Registered Users</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-950/50">
                    <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold uppercase overflow-hidden">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              u.name.charAt(0)
                            )}
                          </div>
                          <span className="font-medium text-sm">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                        {u.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${u.role === 'Admin' ? 'bg-blue-500/10 text-blue-400' : 'bg-zinc-800 text-zinc-300'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-zinc-500">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
