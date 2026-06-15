import { useState, useEffect } from "react";
import axiosInstance from "../../api/axios";
import { toast } from "sonner";
import { Search, ShieldAlert, UserX, UserCheck, Shield } from "lucide-react";
import AdminOtpModal from "./AdminOtpModal";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const [otpModal, setOtpModal] = useState({ open: false, action: null, id: null, currentVal: null, title: "", description: "" });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/admin/users?page=${page}&limit=10&search=${search}`);
      if (res.data.success) {
        setUsers(res.data.data);
        setTotalPages(res.data.pagination.pages);
      }
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const toggleBlock = (id, isBlocked) => {
    setOtpModal({
      open: true,
      action: "block",
      id,
      currentVal: isBlocked,
      title: isBlocked ? "Unblock User" : "Block User",
      description: `You are about to ${isBlocked ? "unblock" : "block"} this user. They will ${isBlocked ? "regain" : "lose"} access to their account.`,
    });
  };

  const toggleRole = (id, currentRole) => {
    setOtpModal({
      open: true,
      action: "role",
      id,
      currentVal: currentRole,
      title: currentRole === "Admin" ? "Remove Admin" : "Make Admin",
      description: `You are about to change this user's role to ${currentRole === "Admin" ? "User" : "Admin"}. This grants or revokes critical platform privileges.`,
    });
  };

  const executeAction = async (otp) => {
    const { action, id, currentVal } = otpModal;
    try {
      if (action === "block") {
        const res = await axiosInstance.patch(`/admin/users/${id}/block`, { otp });
        if (res.data.success) {
          toast.success(res.data.message);
          setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isBlocked: !currentVal } : u)));
        }
      } else if (action === "role") {
        const res = await axiosInstance.patch(`/admin/users/${id}/role`, { otp });
        if (res.data.success) {
          toast.success(res.data.message);
          setUsers((prev) => prev.map((u) => u._id === id ? { ...u, role: currentVal === "Admin" ? "User" : "Admin" } : u));
        }
      }
      setOtpModal({ open: false });
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed");
      throw error; // Rethrow to let modal handle loading state if needed
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col h-[700px]">
      <div className="p-6 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold">User Management</h2>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50 sticky top-0 z-10 shadow-sm">
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Actions</th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">{u.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${u.role === "Admin" ? "bg-blue-500/10 text-blue-400" : "bg-zinc-800 text-zinc-300"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {u.isBlocked ? (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">Blocked</span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">Active</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => toggleRole(u._id, u.role)}
                        className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                        title={u.role === "Admin" ? "Remove Admin" : "Make Admin"}
                      >
                        {u.role === "Admin" ? <ShieldAlert size={18} /> : <Shield size={18} />}
                      </button>
                      <button
                        onClick={() => toggleBlock(u._id, u.isBlocked)}
                        className={`p-2 rounded-lg transition-colors ${u.isBlocked ? "text-emerald-400 hover:bg-emerald-400/10" : "text-zinc-400 hover:text-red-400 hover:bg-red-400/10"}`}
                        title={u.isBlocked ? "Unblock User" : "Block User"}
                      >
                        {u.isBlocked ? <UserCheck size={18} /> : <UserX size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-zinc-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
        <span className="text-sm text-zinc-500">Page {page} of {totalPages || 1}</span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-sm bg-zinc-800 text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
            className="px-3 py-1.5 rounded-lg text-sm bg-zinc-800 text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition"
          >
            Next
          </button>
        </div>
      </div>

      <AdminOtpModal
        isOpen={otpModal.open}
        onClose={() => setOtpModal({ ...otpModal, open: false })}
        onConfirm={executeAction}
        title={otpModal.title}
        description={otpModal.description}
      />
    </div>
  );
}
