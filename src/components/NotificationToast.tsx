import React, { useState, useEffect } from "react";
import { Bell, X, Info, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";
import { getSocket, api } from "../lib/api";
import { Notification } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

export function NotificationToast() {
  const [activeToasts, setActiveToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const socket = getSocket();

    const handleNewNotification = (notif: Notification) => {
      const toastId = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      
      const newToast: ToastItem = {
        id: toastId,
        title: notif.title,
        message: notif.message,
        type: notif.type,
      };

      // Play subtle notification alert sound (optional / safe visually)
      setActiveToasts((prev) => [...prev, newToast]);

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setActiveToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 5000);
    };

    socket.on("notification:receive", handleNewNotification);

    return () => {
      socket.off("notification:receive", handleNewNotification);
    };
  }, []);

  const removeToast = (id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full">
      <AnimatePresence>
        {activeToasts.map((toast) => {
          let Icon = Info;
          let borderStyle = "border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950/90";
          let iconColor = "text-sky-500 dark:text-sky-400";
          let barColor = "bg-sky-500";

          if (toast.type === "success") {
            Icon = CheckCircle;
            borderStyle = "border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/90";
            iconColor = "text-emerald-500 dark:text-emerald-400";
            barColor = "bg-emerald-500";
          } else if (toast.type === "warning") {
            Icon = AlertTriangle;
            borderStyle = "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/90";
            iconColor = "text-amber-500 dark:text-amber-400";
            barColor = "bg-amber-500";
          } else if (toast.type === "error") {
            Icon = AlertCircle;
            borderStyle = "border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/90";
            iconColor = "text-rose-500 dark:text-rose-400";
            barColor = "bg-rose-500";
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className={`p-4 rounded-xl border shadow-xl flex gap-3 relative overflow-hidden glass ${borderStyle}`}
            >
              <div className={`${iconColor} mt-0.5 shrink-0`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 pr-4">
                <h4 className="font-bold text-xs text-gray-900 dark:text-white leading-tight">
                  {toast.title}
                </h4>
                <p className="text-[10px] text-gray-600 dark:text-gray-300 mt-1 leading-normal">
                  {toast.message}
                </p>
              </div>
              <button
                id={`dismiss-toast-${toast.id}`}
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer self-start p-0.5 rounded-full hover:bg-gray-200/50 dark:hover:bg-slate-800"
              >
                <X size={14} />
              </button>

              {/* Progress Bar timer animation */}
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 5, ease: "linear" }}
                className={`absolute bottom-0 left-0 h-1 ${barColor}`}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
