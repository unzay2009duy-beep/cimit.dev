import React, { useState, useEffect } from "react";
import { Terminal, Copy, Check, ShieldAlert, Key, RefreshCw, Layers } from "lucide-react";
import { api } from "../lib/api";

export function DeveloperConsole() {
  const [isOpen, setIsOpen] = useState(false);
  const [debugState, setDebugState] = useState<{ otps: any; activeUsers: any[] } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchState = async () => {
    setLoading(true);
    try {
      const state = await api.getDebugState();
      setDebugState(state);
    } catch (err) {
      console.error("Failed to fetch debug states:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchState();
      const interval = setInterval(fetchState, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* Toggle Button */}
      <button
        id="dev-console-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
      >
        <Terminal size={14} className={loading ? "animate-spin" : ""} />
        <span>Bảng Điều Khiển Dev (Seeded Accounts & OTP)</span>
      </button>

      {/* Floating Content */}
      {isOpen && (
        <div className="absolute bottom-12 left-0 w-80 md:w-96 max-h-[70vh] overflow-y-auto glass border border-indigo-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 flex flex-col gap-4 text-xs font-sans text-gray-700 dark:text-gray-300">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
            <span className="font-bold flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <ShieldAlert size={14} />
              TRÌNH GIÁM SÁT HỆ THỐNG (DEVELOPER)
            </span>
            <button
              id="dev-console-refresh"
              onClick={fetchState}
              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition"
              title="Làm mới trạng thái"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Seeded Accounts Section */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-1 text-[11px] uppercase tracking-wider">
              <Key size={12} className="text-amber-500" />
              Tài Khoản Seed Sẵn (Password: <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold lowercase">như email bỏ đuôi</span>)
            </h4>
            <div className="grid grid-cols-1 gap-2 bg-gray-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800">
              <div className="flex justify-between items-center">
                <span>🔑 <strong className="text-rose-500">ADMIN:</strong> admin@shop.vn</span>
                <button
                  id="copy-admin-email"
                  onClick={() => copyToClipboard("admin@shop.vn", "admin")}
                  className="flex items-center gap-1 text-[10px] bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700 hover:bg-gray-50 transition"
                >
                  {copiedText === "admin" ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
                  <span>Copy</span>
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span>🔑 <strong className="text-amber-500">STAFF:</strong> staff@shop.vn</span>
                <button
                  id="copy-staff-email"
                  onClick={() => copyToClipboard("staff@shop.vn", "staff")}
                  className="flex items-center gap-1 text-[10px] bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700 hover:bg-gray-50 transition"
                >
                  {copiedText === "staff" ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
                  <span>Copy</span>
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span>🔑 <strong className="text-emerald-500">CUSTOMER:</strong> customer@shop.vn</span>
                <button
                  id="copy-customer-email"
                  onClick={() => copyToClipboard("customer@shop.vn", "customer")}
                  className="flex items-center gap-1 text-[10px] bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700 hover:bg-gray-50 transition"
                >
                  {copiedText === "customer" ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
                  <span>Copy</span>
                </button>
              </div>
            </div>
          </div>

          {/* Intercepted OTP Section */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-1 text-[11px] uppercase tracking-wider">
              <Layers size={12} className="text-indigo-500" />
              MÃ OTP EMAIL GẦN ĐÂY (REAL-TIME INTERCEPTOR)
            </h4>
            
            {debugState && Object.keys(debugState.otps).length > 0 ? (
              <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
                {Object.entries(debugState.otps).map(([email, record]: [string, any]) => (
                  <div key={email} className="flex justify-between items-center p-2 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-lg">
                    <div className="truncate pr-2">
                      <span className="font-medium text-gray-900 dark:text-white">{email}</span>
                      <p className="text-[10px] text-gray-400">Hết hạn: {new Date(record.expiresAt).toLocaleTimeString()}</p>
                    </div>
                    <button
                      id={`copy-otp-${email}`}
                      onClick={() => copyToClipboard(record.otp, email)}
                      className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold px-2.5 py-1 rounded-md shadow-sm transition"
                    >
                      {copiedText === email ? (
                        <>
                          <Check size={10} />
                          <span>Đã copy</span>
                        </>
                      ) : (
                        <>
                          <span>{record.otp}</span>
                          <Copy size={10} />
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center text-gray-400 bg-gray-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-gray-200 dark:border-slate-800">
                Chưa có mã OTP nào được yêu cầu. Hãy thử Đăng ký tài khoản mới để chặn mã tại đây!
              </div>
            )}
          </div>

          {/* Dev notes */}
          <div className="text-[10px] text-indigo-500/80 dark:text-indigo-400/80 leading-relaxed bg-indigo-500/5 dark:bg-indigo-400/5 p-2 rounded-lg border border-indigo-500/10">
            💡 <strong>Mẹo kiểm thử:</strong> Bảng điều khiển tự động đồng bộ hóa cứ sau 3 giây. Bạn có thể mở một trình duyệt ẩn danh hoặc chuyển đổi nhanh tài khoản để thử nghiệm hệ thống phân quyền Admin, Nhân viên và Khách hàng hoàn hảo!
          </div>
        </div>
      )}
    </div>
  );
}
