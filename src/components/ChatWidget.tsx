import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, ShieldAlert, User as UserIcon, LifeBuoy } from "lucide-react";
import { api, getSocket, getCurrentUser } from "../lib/api";
import { ChatMessage, User } from "../types";
import { motion, AnimatePresence } from "motion/react";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [socketConnected, setSocketConnected] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync current user on interval or when widget is clicked
  useEffect(() => {
    const checkUser = () => {
      const u = getCurrentUser();
      setUser(u);
    };
    checkUser();
    window.addEventListener("storage", checkUser);
    const interval = setInterval(checkUser, 1000);
    return () => {
      window.removeEventListener("storage", checkUser);
      clearInterval(interval);
    };
  }, []);

  // Fetch initial history and listen to real-time events via Socket.io
  useEffect(() => {
    if (!isOpen) return;

    const fetchHistory = async () => {
      try {
        const history = await api.getChats();
        setMessages(history);
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    };

    fetchHistory();

    const socket = getSocket();
    setSocketConnected(socket.connected);

    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));

    // Handle incoming messages idempotently to prevent reconnection duplicates
    const handleReceive = (newMsg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    };

    socket.on("chat:receive", handleReceive);

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("chat:receive", handleReceive);
    };
  }, [isOpen]);

  // Scroll to bottom helper
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const currentUserObj = getCurrentUser();
    if (!currentUserObj) return;

    const socket = getSocket();
    
    // Broadcast message via Socket.io
    socket.emit("chat:send", {
      senderId: currentUserObj.id,
      senderName: currentUserObj.name,
      senderRole: currentUserObj.role,
      message: text.trim(),
    });

    setText("");
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Floating Circular Launcher Button */}
      <motion.button
        id="chat-widget-toggle"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-12 h-12 bg-indigo-600 text-white rounded-full shadow-2xl glow-primary cursor-pointer transition hover:bg-indigo-700"
      >
        {isOpen ? <X size={20} /> : <MessageSquare size={20} />}
      </motion.button>

      {/* Main Chat Box Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="chat-widget-panel"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-14 right-0 w-80 md:w-96 h-[480px] flex flex-col glass border border-gray-100 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans"
          >
            {/* Header */}
            <div className="bg-indigo-600 dark:bg-slate-900 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <LifeBuoy size={18} className="animate-pulse text-amber-300" />
                <div>
                  <h3 className="font-bold text-sm tracking-tight">Kênh Chat Hỗ Trợ 24/7</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-indigo-100 dark:text-gray-400">
                    <span className={`w-2 h-2 rounded-full ${socketConnected ? "bg-emerald-400" : "bg-rose-400 animate-ping"}`} />
                    <span>{socketConnected ? "Realtime Socket.io hoạt động" : "Mất kết nối..."}</span>
                  </div>
                </div>
              </div>
              <button
                id="close-chat-widget"
                onClick={() => setIsOpen(false)}
                className="hover:bg-indigo-700 dark:hover:bg-slate-800 p-1.5 rounded-full transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-slate-950/40">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <MessageSquare size={36} className="text-gray-300 dark:text-slate-700 mb-2" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Chưa có cuộc hội thoại nào.</p>
                  <p className="text-[10px] text-gray-400">Nhập tin nhắn bên dưới để liên hệ trực tuyến với các quản trị viên.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = user && msg.senderId === user.id;
                  let senderTagColor = "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300";
                  if (msg.senderRole === "ADMIN") {
                    senderTagColor = "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400";
                  } else if (msg.senderRole === "STAFF") {
                    senderTagColor = "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400";
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      {/* Name Header */}
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                          {msg.senderName}
                        </span>
                        {msg.senderRole !== "CUSTOMER" && (
                          <span className={`text-[8px] uppercase px-1.5 py-0.2 rounded-full font-bold ${senderTagColor}`}>
                            {msg.senderRole}
                          </span>
                        )}
                        <span className="text-[8px] text-gray-400">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Bubble */}
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                          isMe
                            ? "bg-indigo-600 text-white rounded-tr-none shadow-sm font-medium"
                            : "bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-slate-700/50 rounded-tl-none shadow-sm"
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Action Form */}
            {user ? (
              <form
                onSubmit={handleSend}
                className="p-3 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2"
              >
                <input
                  id="chat-message-input"
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Nhập nội dung tư vấn..."
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
                <button
                  id="send-chat-message-btn"
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl transition flex items-center justify-center shadow-md cursor-pointer"
                >
                  <Send size={14} />
                </button>
              </form>
            ) : (
              <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-center">
                <ShieldAlert size={20} className="mx-auto text-amber-500 mb-1.5" />
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1">Cần đăng nhập để trò chuyện</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2">Đăng nhập tài khoản của bạn để kết nối với bộ phận chăm sóc khách hàng trực tuyến.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
