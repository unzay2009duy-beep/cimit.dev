import React, { useState, useEffect } from "react";
import { Activity, Shield, Users, RefreshCw, Layers, Calendar, Check, Clock, UserCheck, ShieldAlert } from "lucide-react";
import { api } from "../lib/api";
import { ActivityLog, User, UserRole } from "../types";

export function AdminLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Business Stats Counter States
  const [ordersCount, setOrdersCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [logsCount, setLogsCount] = useState(0);

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const logsData = await api.getLogs();
      setLogs(logsData);
    } catch (err: any) {
      setError(err.message || "Không thể tải nhật ký hoạt động");
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const usersData = await api.getUsers();
      setUsers(usersData);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách thành viên");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    setError(null);
    try {
      await api.updateUserRole(userId, newRole);
      loadUsers();
      loadLogs();
    } catch (err: any) {
      setError(err.message || "Thay đổi phân quyền thất bại");
    }
  };

  // Run initial loading and set up stats counters
  useEffect(() => {
    loadLogs();
    loadUsers();

    // Fetch orders to calculate stats
    const fetchStats = async () => {
      try {
        const orders = await api.getOrders();
        const totalRev = orders.reduce((sum, o) => sum + o.total, 0);
        const usersList = await api.getUsers();
        const logsList = await api.getLogs();

        // Animate counters up from 0
        let oVal = 0;
        let rVal = 0;
        let uVal = 0;
        let lVal = 0;

        const interval = setInterval(() => {
          let done = true;
          if (oVal < orders.length) {
            oVal += Math.ceil(orders.length / 10) || 1;
            if (oVal >= orders.length) oVal = orders.length;
            setOrdersCount(oVal);
            done = false;
          }
          if (rVal < totalRev) {
            rVal += Math.ceil(totalRev / 10) || 1000;
            if (rVal >= totalRev) rVal = totalRev;
            setRevenue(rVal);
            done = false;
          }
          if (uVal < usersList.length) {
            uVal += 1;
            setUsersCount(uVal);
            done = false;
          }
          if (lVal < logsList.length) {
            lVal += Math.ceil(logsList.length / 10) || 1;
            if (lVal >= logsList.length) lVal = logsList.length;
            setLogsCount(lVal);
            done = false;
          }

          if (done) clearInterval(interval);
        }, 40);

        return () => clearInterval(interval);
      } catch {}
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8 font-sans">
      {/* Visual Business Stats Widget (Glass & Glow counters) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700/50 hover:shadow-xl transition duration-300 relative overflow-hidden group">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Đơn hàng hoàn tất</span>
          <p className="text-2xl md:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 font-mono transition group-hover:scale-105 duration-300">
            {ordersCount}
          </p>
          <div className="absolute right-4 bottom-4 text-indigo-100 dark:text-indigo-950 group-hover:rotate-12 transition duration-300">
            <Layers size={40} />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700/50 hover:shadow-xl transition duration-300 relative overflow-hidden group">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Doanh thu tích luỹ</span>
          <p className="text-2xl md:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 font-mono transition group-hover:scale-105 duration-300">
            {revenue.toLocaleString()}đ
          </p>
          <div className="absolute right-4 bottom-4 text-emerald-100 dark:text-emerald-950 group-hover:rotate-12 transition duration-300">
            <Users size={40} />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700/50 hover:shadow-xl transition duration-300 relative overflow-hidden group">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Thành viên hệ thống</span>
          <p className="text-2xl md:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 font-mono transition group-hover:scale-105 duration-300">
            {usersCount}
          </p>
          <div className="absolute right-4 bottom-4 text-amber-100 dark:text-amber-950 group-hover:rotate-12 transition duration-300">
            <Shield size={40} />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700/50 hover:shadow-xl transition duration-300 relative overflow-hidden group">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Nhật ký truy vết</span>
          <p className="text-2xl md:text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-1 font-mono transition group-hover:scale-105 duration-300">
            {logsCount}
          </p>
          <div className="absolute right-4 bottom-4 text-rose-100 dark:text-rose-950 group-hover:rotate-12 transition duration-300">
            <Activity size={40} />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Two Columns Grid: Role audits + Live logs */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* User Role Audit (4 cols) */}
        <div className="xl:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700/50 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-700/50">
            <h3 className="font-bold text-sm flex items-center gap-2 text-gray-900 dark:text-white">
              <Shield size={16} className="text-indigo-600 dark:text-indigo-400" />
              Kiểm Toán Phân Quyền Thành Viên
            </h3>
            <button
              id="refresh-admin-users"
              onClick={loadUsers}
              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition cursor-pointer"
            >
              <RefreshCw size={12} className={loadingUsers ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
            {loadingUsers && users.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-6">Đang truy vấn...</p>
            ) : (
              users.map((u) => (
                <div
                  key={u.id}
                  className="p-3 bg-gray-50/50 dark:bg-slate-950/20 border border-gray-100 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 hover:border-indigo-100 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      referrerPolicy="no-referrer"
                      src={u.avatar}
                      alt={u.name}
                      className="w-8 h-8 rounded-full border border-gray-200 dark:border-slate-700"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-gray-900 dark:text-white truncate">{u.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                    </div>
                  </div>

                  {/* Dropdown to change role directly */}
                  <select
                    id={`user-role-select-${u.id}`}
                    value={u.role}
                    onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-[10px] font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="STAFF">STAFF</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Tracking Table logs (7 cols) */}
        <div className="xl:col-span-7 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700/50 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-700/50">
            <h3 className="font-bold text-sm flex items-center gap-2 text-gray-900 dark:text-white">
              <Activity size={16} className="text-rose-500 animate-pulse" />
              Nhật Ký Truy Vết Hoạt Động Hệ Thống
            </h3>
            <button
              id="refresh-admin-logs"
              onClick={loadLogs}
              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition cursor-pointer"
            >
              <RefreshCw size={12} className={loadingLogs ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Logs scrollable grid */}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-y-auto max-h-[450px] pr-1 space-y-2.5">
                {loadingLogs && logs.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-6">Đang tải lịch sử...</p>
                ) : logs.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-6">Chưa có hoạt động nào được ghi lại.</p>
                ) : (
                  logs.map((log) => {
                    let roleStyle = "bg-gray-100 text-gray-500 dark:bg-slate-700/50 dark:text-slate-400";
                    if (log.userRole === "ADMIN") roleStyle = "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400";
                    else if (log.userRole === "STAFF") roleStyle = "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";

                    return (
                      <div
                        key={log.id}
                        className="p-3 bg-gray-50/50 dark:bg-slate-950/20 border border-gray-100 dark:border-slate-800 rounded-2xl flex flex-col gap-1.5 hover:border-gray-200 dark:hover:border-slate-700 transition"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-gray-900 dark:text-white">{log.userName}</span>
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded-full ${roleStyle}`}>{log.userRole}</span>
                          </div>
                          <span className="text-[9px] text-gray-400 font-mono flex items-center gap-1 shrink-0">
                            <Clock size={10} />
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-[11px] text-gray-600 dark:text-gray-300">
                          <span>
                            🔑 <strong className="text-indigo-600 dark:text-indigo-400 font-mono text-[10px]">{log.action}:</strong> {log.details}
                          </span>
                          <span className="text-[9px] text-gray-400 font-mono">IP: {log.ipAddress}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
