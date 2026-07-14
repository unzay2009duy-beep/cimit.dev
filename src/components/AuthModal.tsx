import React, { useState, useEffect } from "react";
import { X, Mail, Lock, User as UserIcon, ShieldAlert, CheckCircle2, RotateCw, AlertTriangle } from "lucide-react";
import { api } from "../lib/api";
import { User } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [requireOtp, setRequireOtp] = useState(false);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setSuccessMsg(null);
      setRequireOtp(false);
      setDebugOtp(null);
    }
  }, [isOpen]);

  // Intercept debug state to assist user with the active OTP immediately
  useEffect(() => {
    if (requireOtp && email) {
      const fetchDebugState = async () => {
        try {
          const state = await api.getDebugState();
          if (state?.otps?.[email.toLowerCase()]) {
            setDebugOtp(state.otps[email.toLowerCase()].otp);
          }
        } catch {}
      };
      fetchDebugState();
      const interval = setInterval(fetchDebugState, 2000);
      return () => clearInterval(interval);
    }
  }, [requireOtp, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (requireOtp) {
        // OTP Verification
        const res = await api.verifyOtp(email.toLowerCase(), otp);
        if (res.success) {
          setSuccessMsg("Xác minh thành công! Đang đăng nhập...");
          setTimeout(() => {
            onSuccess(res.user);
            onClose();
          }, 1500);
        }
      } else if (isRegister) {
        // Register Customer
        const res = await api.register(email, password, name || email);
        if (res.success) {
          setSuccessMsg(res.message);
          setRequireOtp(true);
          if (res.debugOtp) {
            setDebugOtp(res.debugOtp);
          }
        }
      } else {
        // Login
        const res = await api.login(email, password);
        if (res.success) {
          setSuccessMsg("Đăng nhập thành công!");
          setTimeout(() => {
            onSuccess(res.user);
            onClose();
          }, 1000);
        } else if (res.requireOtp) {
          setRequireOtp(true);
          setSuccessMsg(res.message);
          if (res.debugOtp) {
            setDebugOtp(res.debugOtp);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Giao dịch thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.resendOtp(email);
      setSuccessMsg("Đã gửi lại mã OTP mới đến email của bạn.");
      if (res.debugOtp) {
        setDebugOtp(res.debugOtp);
      }
    } catch (err: any) {
      setError(err.message || "Gửi lại OTP thất bại");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative font-sans text-gray-800 dark:text-gray-100"
      >
        {/* Close Button */}
        <button
          id="close-auth-modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-slate-800/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center glow-primary">
            <Lock size={22} />
          </div>
        </div>

        {/* Header Title */}
        <h3 className="text-center text-xl font-bold tracking-tight text-gray-900 dark:text-white">
          {requireOtp ? "Xác Minh Mã OTP Email" : isRegister ? "Đăng Ký Thành Viên" : "Đăng Nhập Cổng Mua Sắm"}
        </h3>
        <p className="text-center text-xs text-gray-400 mt-1 mb-6">
          {requireOtp 
            ? "Mã OTP bảo mật 6 số đã được gửi mô phỏng về hòm thư của bạn." 
            : isRegister 
              ? "Tham gia để tích luỹ voucher và theo dõi đơn hàng thời gian thực." 
              : "Chào mừng quay trở lại! Nhập thông tin để khám phá cửa hàng."}
        </p>

        {/* Notification Toasts/Alerts inside form */}
        {error && (
          <div className="p-3 mb-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 mb-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Simulated Mail OTP Interceptor helper */}
        {requireOtp && debugOtp && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-400 leading-normal">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />
              <span>Chặn Mã OTP Trực Tuyến (Developer)</span>
            </div>
            <p>Hệ thống tự động phát hiện mã OTP gửi tới email của bạn là: <strong className="font-mono text-indigo-600 dark:text-indigo-400 text-sm select-all">{debugOtp}</strong></p>
          </div>
        )}

        {/* Main Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {requireOtp ? (
            // OTP Form Fields
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Nhập mã xác thực OTP (6 Số)</label>
                <input
                  id="auth-otp-input"
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="Ví dụ: 123456"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-center text-lg font-bold font-mono tracking-widest focus:outline-none focus:border-indigo-500 transition-all text-gray-800 dark:text-gray-100"
                  required
                />
              </div>
              <button
                id="submit-otp-btn"
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 dark:disabled:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]"
              >
                {loading ? "Đang Xác Minh..." : "Kích Hoạt Tài Khoản"}
              </button>
              <div className="flex justify-between items-center text-[11px] pt-1.5">
                <span className="text-gray-400">Không nhận được mã?</span>
                <button
                  id="resend-otp-btn"
                  type="button"
                  onClick={handleResendOtp}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <RotateCw size={11} />
                  <span>Gửi Lại Mã</span>
                </button>
              </div>
            </div>
          ) : (
            // LogIn / Sign Up Form Fields
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Tên đăng nhập</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                  <input
                    id="auth-email-input"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập tên đăng nhập hoặc email"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-all text-gray-800 dark:text-gray-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                  <input
                    id="auth-password-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-all text-gray-800 dark:text-gray-100"
                    required
                  />
                </div>
              </div>

              <button
                id="submit-auth-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]"
              >
                {loading ? "Vui lòng chờ..." : isRegister ? "Đăng Ký Tài Khoản" : "Đăng Nhập"}
              </button>

              <div className="pt-4 border-t border-gray-100 dark:border-slate-800 text-center text-xs">
                <span className="text-gray-400">{isRegister ? "Đã có tài khoản?" : "Chưa có tài khoản?"} </span>
                <button
                  id="toggle-auth-mode-btn"
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                >
                  {isRegister ? "Đăng nhập ngay" : "Đăng ký thành viên"}
                </button>
              </div>
            </>
          )}
        </form>
      </motion.div>
    </div>
  );
}
