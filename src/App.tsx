import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Shirt,
  Home as HomeIcon,
  BookOpen,
  Tag,
  LogOut,
  LogIn,
  ShoppingCart,
  Search,
  Star,
  Activity,
  Calendar,
  Package,
  Clock,
  User as UserIcon,
  Bell,
  CreditCard,
  Moon,
  Sun,
  Menu,
  X,
  ChevronRight,
  MessageSquare,
  ShieldAlert,
  Layers,
  Heart,
  Truck,
  CheckCircle2
} from "lucide-react";

// Sub-components
import { Skeleton, ProductCardSkeleton, OrderRowSkeleton } from "./components/Skeleton";
import { DeveloperConsole } from "./components/DeveloperConsole";
import { ChatWidget } from "./components/ChatWidget";
import { NotificationToast } from "./components/NotificationToast";
import { AuthModal } from "./components/AuthModal";
import { CheckoutModal } from "./components/CheckoutModal";
import { AdminLogs } from "./components/AdminLogs";
import { StaffProducts } from "./components/StaffProducts";

// API and types
import { api, getCurrentUser, clearTokens, getSocket } from "./lib/api";
import { User, Product, Category, CartItem, Order, Notification, Review } from "./types";
import { motion, AnimatePresence } from "motion/react";
import anonymousBg from "../assets/anonymous.svg";
import itachiBannerBg from "./assets/images/itachi_product_1784025175148.jpg";
import { getProductImage } from "./lib/imageHelper";

export default function App() {
  // Navigation View State
  const [activeView, setActiveView] = useState<
    "catalog" | "product-detail" | "orders" | "staff-inventory" | "admin-logs" | "admin-users"
  >("catalog");

  // Authentication and Dark Mode
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [darkMode, setDarkMode] = useState<boolean>(
    localStorage.getItem("theme") === "dark" || 
    (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );

  // Modal Triggers
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem("cart");
    return stored ? JSON.parse(stored) : [];
  });

  // Core Catalog/Shop States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Custom Filters & Pagination States
  const [selectedFilter, setSelectedFilter] = useState<"Tất cả" | "Proxy" | "Account" | "Key" | "Tool" | "VIP">("Tất cả");
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc" | "sales-desc" | "stock-desc" | "rating-desc">("newest");
  const [visibleCount, setVisibleCount] = useState(15);
  
  // Loading & Error boundary alerts
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
  // Reviews State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Notifications bell dropdown states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

  // Sync Dark Mode state to html body element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Load Categories & Products on startup (fetches all products, processed in client side)
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Error loading categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  // Reset pagination on filter or sort change
  useEffect(() => {
    setVisibleCount(15);
  }, [selectedCategory, selectedFilter, searchTerm, sortBy]);

  // Sync Cart array to localStorage on changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Load reviews when selectedProduct changes
  useEffect(() => {
    if (selectedProduct) {
      const loadReviews = async () => {
        try {
          const data = await api.getReviews(selectedProduct.id);
          setReviews(data);
        } catch {}
      };
      loadReviews();
      setUserRating(5);
      setUserComment("");
    }
  }, [selectedProduct]);

  // Load orders when relevant view is opened
  useEffect(() => {
    if (activeView === "orders" && user) {
      const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
          const data = await api.getOrders();
          setOrders(data);
        } catch (err) {
          console.error("Failed to load orders:", err);
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrders();
    }
  }, [activeView, user]);

  // Fetch past system notifications and register WS listeners on startup
  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();

    const socket = getSocket();
    
    // Auto sync notifications bell in real-time on WS broadcast
    const handleNewNotif = (notif: Notification) => {
      setNotifications((prev) => {
        if (prev.some(n => n.id === notif.id)) return prev;
        return [notif, ...prev];
      });
    };

    socket.on("notification:receive", handleNewNotif);

    // Watch token expiries
    const handleAuthExpired = () => {
      setUser(null);
      setIsAuthModalOpen(true);
    };
    window.addEventListener("auth_expired", handleAuthExpired);

    return () => {
      socket.off("notification:receive", handleNewNotif);
      window.removeEventListener("auth_expired", handleAuthExpired);
    };
  }, []);

  const handleLogout = () => {
    clearTokens();
    setUser(null);
    setActiveView("catalog");
    setCart([]);
  };

  // Cart operations helpers
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { productId: product.id, quantity, product }];
    });

    // Bounce cart widget visually
    const cartBtn = document.getElementById("header-cart-launcher");
    if (cartBtn) {
      cartBtn.classList.add("scale-110", "bg-indigo-700");
      setTimeout(() => cartBtn.classList.remove("scale-110", "bg-indigo-700"), 300);
    }
  };

  const handleUpdateCartQty = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, quantity: newQty } : item))
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Submit Product Review Star / Comments
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!selectedProduct || !userComment.trim()) return;

    setSubmittingReview(true);
    try {
      const review = await api.submitReview({
        productId: selectedProduct.id,
        rating: userRating,
        comment: userComment.trim(),
      });
      setReviews((prev) => [review, ...prev]);
      setUserComment("");
      
      // Update local product average rating inside details view
      const currentReviews = [review, ...reviews];
      const avg = currentReviews.reduce((sum, r) => sum + r.rating, 0) / currentReviews.length;
      setSelectedProduct((prev) => prev ? { ...prev, rating: Number(avg.toFixed(1)) } : null);
      
      // Refresh global products catalog
      fetchProducts();
    } catch (err) {
      console.error("Submit review failed:", err);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Dispatch orders status changes (Staff/Admin)
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.updateOrderStatus(orderId, status);
      // Reload orders list
      const updatedOrders = await api.getOrders();
      setOrders(updatedOrders);
    } catch (err: any) {
      alert(err.message || "Không thể cập nhật trạng thái đơn hàng");
    }
  };

  const handleReadNotifications = async () => {
    setIsNotifDropdownOpen(!isNotifDropdownOpen);
    if (!isNotifDropdownOpen && user) {
      try {
        await api.markAllNotificationsRead();
        fetchNotifications();
      } catch {}
    }
  };

  // 1. Filter and sort products client-side for maximum speed and smooth animations
  const filteredAndSortedProducts = React.useMemo(() => {
    let result = [...products];

    // 1. Search term filter
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term)
      );
    }

    // 2. Main Filter Type
    if (selectedFilter !== "Tất cả") {
      result = result.filter((p) => {
        if (p.filterType) {
          return p.filterType === selectedFilter;
        }
        // Fallback matching
        const nameLower = p.name.toLowerCase();
        if (selectedFilter === "Proxy") return nameLower.includes("proxy");
        if (selectedFilter === "Account") return nameLower.includes("account") || nameLower.includes("acc");
        if (selectedFilter === "Key") return nameLower.includes("key") || nameLower.includes("migul");
        if (selectedFilter === "Tool") return nameLower.includes("tool") || nameLower.includes("phần mềm") || nameLower.includes("nhẹ tâm");
        if (selectedFilter === "VIP") return p.badge === "VIP" || nameLower.includes("vip") || nameLower.includes("pro");
        return true;
      });
    }

    // 3. Sub-Category Filter
    if (selectedCategory !== "") {
      result = result.filter((p) => p.categoryId === selectedCategory);
    }

    // 4. Sorting
    result.sort((a, b) => {
      if (sortBy === "price-asc") {
        return a.price - b.price;
      }
      if (sortBy === "price-desc") {
        return b.price - a.price;
      }
      if (sortBy === "sales-desc") {
        return b.salesCount - a.salesCount;
      }
      if (sortBy === "stock-desc") {
        return b.stock - a.stock;
      }
      if (sortBy === "rating-desc") {
        return b.rating - a.rating;
      }
      // "newest" / default
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [products, searchTerm, selectedFilter, selectedCategory, sortBy]);

  // 2. Instant Buy Now function
  const handleBuyNow = (product: Product) => {
    if (product.stock <= 0) return;
    setCart([{ productId: product.id, quantity: 1, product }]);
    setIsCheckoutModalOpen(true);
  };

  // 3. Infinite Scroll Effect
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 150
      ) {
        setVisibleCount((prev) => {
          if (prev >= filteredAndSortedProducts.length) return prev;
          return prev + 10;
        });
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [filteredAndSortedProducts.length]);

  // Count unread notifications for current user context
  const unreadCount = notifications.filter(
    (n) => user && (n.userId === "all" || n.userId === user.id) && !n.readBy.includes(user.id)
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300 pb-16 flex flex-col justify-between relative overflow-hidden">
      
      {/* Subtle Background Watermark (Anonymous Emblem) */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.08] bg-no-repeat bg-center bg-contain z-0 max-w-4xl mx-auto"
        style={{ backgroundImage: `url(${anonymousBg})`, backgroundPosition: "center 60%" }}
      />
      {/* 1. MASTER HEADER NAVIGATION */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 transition duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Glowing Brand Logo */}
          <button
            id="brand-logo-btn"
            onClick={() => { setActiveView("catalog"); setSelectedProduct(null); }}
            className="flex items-center gap-2 cursor-pointer group text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
              <Layers size={18} />
            </div>
            <div>
              <span className="font-extrabold text-sm md:text-base text-gray-900 dark:text-white leading-none block tracking-tight">
                Cimit.dev
              </span>
              <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider block mt-0.5">
                Phân Quyền & Live
              </span>
            </div>
          </button>

          {/* Interactive view menus */}
          <nav className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
            <button
              id="nav-catalog"
              onClick={() => { setActiveView("catalog"); setSelectedProduct(null); }}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${activeView === "catalog" ? "bg-gray-100 dark:bg-slate-800 text-gray-950 dark:text-white" : "hover:bg-gray-50 dark:hover:bg-slate-800/50"}`}
            >
              Cửa Hàng
            </button>
            <button
              id="nav-orders"
              onClick={() => {
                if (!user) setIsAuthModalOpen(true);
                else { setActiveView("orders"); setSelectedProduct(null); }
              }}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${activeView === "orders" ? "bg-gray-100 dark:bg-slate-800 text-gray-950 dark:text-white" : "hover:bg-gray-50 dark:hover:bg-slate-800/50"}`}
            >
              {user && (user.role === "ADMIN" || user.role === "STAFF") ? "Đơn Đặt Hàng" : "Đơn Hàng Của Tôi"}
            </button>
            
            {/* Conditional Staff inventory tabs */}
            {user && (user.role === "ADMIN" || user.role === "STAFF") && (
              <button
                id="nav-inventory"
                onClick={() => { setActiveView("staff-inventory"); setSelectedProduct(null); }}
                className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${activeView === "staff-inventory" ? "bg-gray-100 dark:bg-slate-800 text-gray-950 dark:text-white" : "hover:bg-gray-50 dark:hover:bg-slate-800/50"}`}
              >
                Quản Lý Kho
              </button>
            )}

            {/* Conditional Admin activity logs and permissions tabs */}
            {user && user.role === "ADMIN" && (
              <>
                <button
                  id="nav-logs"
                  onClick={() => { setActiveView("admin-logs"); setSelectedProduct(null); }}
                  className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${activeView === "admin-logs" ? "bg-gray-100 dark:bg-slate-800 text-gray-950 dark:text-white" : "hover:bg-gray-50 dark:hover:bg-slate-800/50"}`}
                >
                  Nhật Ký Truy Vết
                </button>
                <button
                  id="nav-users"
                  onClick={() => { setActiveView("admin-users"); setSelectedProduct(null); }}
                  className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${activeView === "admin-users" ? "bg-gray-100 dark:bg-slate-800 text-gray-950 dark:text-white" : "hover:bg-gray-50 dark:hover:bg-slate-800/50"}`}
                >
                  Phân Quyền
                </button>
              </>
            )}
          </nav>

          {/* Action buttons (Search, Theme, Notification Bell, Cart, User) */}
          <div className="flex items-center gap-2">
            
            {/* Dark Mode toggle */}
            <button
              id="theme-toggler"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-500 dark:text-gray-300 transition cursor-pointer shrink-0"
              title="Đổi giao diện"
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Notification Bell Dropdown */}
            <div className="relative shrink-0">
              <button
                id="notification-bell-btn"
                onClick={handleReadNotifications}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-500 dark:text-gray-300 transition relative cursor-pointer"
                title="Thông báo hệ thống"
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white font-bold text-[8px] rounded-full flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Bell dropdown popover */}
              <AnimatePresence>
                {isNotifDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 glass border border-gray-150 dark:border-slate-800 rounded-2xl shadow-2xl p-4 space-y-3 z-50 text-xs text-gray-700 dark:text-gray-300"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
                      <span className="font-bold text-gray-900 dark:text-white">Thông báo ({unreadCount} chưa đọc)</span>
                    </div>

                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                      {notifications.length === 0 ? (
                        <p className="text-center text-gray-400 py-6 text-[11px]">Chưa nhận được thông báo nào.</p>
                      ) : (
                        notifications
                          .filter(n => !user || n.userId === "all" || n.userId === user.id)
                          .slice(0, 5)
                          .map((n) => {
                            const isRead = user && n.readBy.includes(user.id);
                            return (
                              <div
                                key={n.id}
                                className={`p-2 rounded-xl border flex flex-col gap-0.5 transition ${isRead ? "bg-gray-50/20 dark:bg-slate-950/20 border-gray-100 dark:border-slate-900" : "bg-indigo-50/30 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-950"}`}
                              >
                                <span className={`font-bold text-[11px] text-gray-900 dark:text-white ${!isRead && "text-indigo-600 dark:text-indigo-400"}`}>{n.title}</span>
                                <span className="text-[10px] text-gray-500 leading-normal mt-0.5">{n.message}</span>
                                <span className="text-[8px] text-gray-400 font-mono mt-1">{new Date(n.createdAt).toLocaleTimeString()}</span>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>



            {/* User Avatar & Logout controls */}
            {user ? (
              <div className="flex items-center gap-2 pl-1 border-l border-gray-200 dark:border-slate-800">
                <img
                  referrerPolicy="no-referrer"
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-indigo-200 dark:border-slate-700 hover:scale-105 transition shrink-0"
                />
                <div className="hidden md:block text-left max-w-[80px] truncate shrink-0">
                  <p className="font-bold text-xs text-gray-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-[9px] font-extrabold text-indigo-500 uppercase">{user.role}</p>
                </div>
                <button
                  id="header-logout-btn"
                  onClick={handleLogout}
                  className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-full transition cursor-pointer"
                  title="Đăng xuất"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button
                id="header-login-btn"
                onClick={() => setIsAuthModalOpen(true)}
                className="p-2 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-100 dark:border-slate-800 rounded-full text-indigo-600 dark:text-indigo-400 transition cursor-pointer shrink-0"
                title="Đăng nhập"
              >
                <LogIn size={15} />
              </button>
            )}

            {/* Responsive Hamburger for Mobile Nav */}
            <div className="lg:hidden shrink-0">
              <button
                id="mobile-nav-toggle"
                onClick={() => {
                  // Fallback: simple toggler alert or view redirection to catalog/orders
                  setActiveView(activeView === "catalog" ? "orders" : "catalog");
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-600 dark:text-gray-300"
              >
                <Menu size={17} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE CONTENT WINDOW */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 flex-1 w-full">
        <AnimatePresence mode="wait">
          
          {/* VIEW: CATALOG STORE */}
          {activeView === "catalog" && !selectedProduct && (
            <motion.div
              key="catalog"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Parallax Hero Banner with glowing banner action */}
              <div
                className="parallax-bg relative h-[250px] md:h-[340px] rounded-3xl overflow-hidden flex items-center p-6 md:p-12 text-white shadow-2xl border border-orange-500/30 shadow-[0_0_30px_rgba(249,115,22,0.35)] animate-fade-in"
                style={{ backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.8), rgba(249, 115, 22, 0.25)), url(${itachiBannerBg})` }}
              >
                <div className="max-w-xl space-y-3.5 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 text-black font-black uppercase text-[9px] tracking-wider rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)] animate-pulse">
                      🔥 FREE FIRE SHOP ACTIVE
                    </span>
                    <span className="text-[9px] font-black text-amber-400 bg-black/60 px-2.5 py-1 rounded-full border border-amber-500/30">
                      Bypass v4.0 Active
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-4xl font-black tracking-tight leading-tight uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-red-500">
                    Chào Mừng Bạn Đến Với Cimit.dev
                  </h1>
                  <p className="text-xs md:text-sm text-gray-100 leading-relaxed max-w-md font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    Hệ thống bán lẻ dịch vụ Free Fire thông minh, hack mượt ping, SOCKS5 VIP và key bypass uy tín. Hỗ trợ trực tuyến 24/7 chất lượng đỉnh cao.
                  </p>
                </div>
              </div>

              {/* Real-time search and interactive filters row */}
              <div className="space-y-4">
                {/* 1. Primary Filter Types Requested by User */}
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none scroll-smooth">
                    {["Tất cả", "Proxy", "Account", "Key", "Tool", "VIP"].map((opt) => (
                      <button
                        id={`filter-type-${opt}`}
                        key={opt}
                        onClick={() => {
                          setSelectedFilter(opt as any);
                          setSelectedCategory(""); // Reset sub-category on main type filter change
                        }}
                        className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all duration-300 cursor-pointer border ${
                          selectedFilter === opt
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-105"
                            : "bg-gray-50 dark:bg-slate-850 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 border-transparent"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {/* Search and Sort controls */}
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    {/* Sort dropdown */}
                    <div className="relative">
                      <select
                        id="catalog-sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full sm:w-48 px-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:border-indigo-500 transition cursor-pointer appearance-none pr-8"
                      >
                        <option value="newest">🔥 Mới nhất</option>
                        <option value="price-asc">💰 Giá tăng dần</option>
                        <option value="price-desc">💸 Giá giảm dần</option>
                        <option value="sales-desc">⚡ Bán chạy</option>
                        <option value="stock-desc">📦 Còn nhiều</option>
                        <option value="rating-desc">⭐ Đánh giá cao</option>
                      </select>
                      <div className="absolute right-3 top-3 pointer-events-none text-gray-400 text-[10px]">▼</div>
                    </div>

                    {/* Search bar */}
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3.5 top-2.5 text-gray-400" size={14} />
                      <input
                        id="catalog-search-input"
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm kiếm sản phẩm, dịch vụ..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 transition text-gray-800 dark:text-gray-100"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Secondary Specific Subcategories Selection Bar (Dynamic based on selectedFilter) */}
                {categories.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none scroll-smooth">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0 mr-1">
                      Danh mục con:
                    </span>
                    <button
                      id="filter-category-all"
                      onClick={() => setSelectedCategory("")}
                      className={`px-3 py-1 rounded-xl text-[10px] font-bold tracking-tight whitespace-nowrap transition cursor-pointer ${
                        selectedCategory === ""
                          ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
                          : "bg-gray-50 dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      Tất cả danh mục con
                    </button>
                    {categories
                      .filter((cat) => {
                        if (selectedFilter === "Tất cả") return true;
                        // Map sub-categories matching primary filter types
                        if (selectedFilter === "Proxy") return cat.name.toLowerCase().includes("proxy");
                        if (selectedFilter === "Key") return cat.name.toLowerCase().includes("migul");
                        if (selectedFilter === "Tool") return cat.name.toLowerCase().includes("nhẹ tâm");
                        if (selectedFilter === "VIP") return cat.name.toLowerCase().includes("vip") || cat.name.toLowerCase().includes("pro");
                        if (selectedFilter === "Account") return cat.name.toLowerCase().includes("pro30day");
                        return true;
                      })
                      .map((cat) => (
                        <button
                          id={`filter-category-${cat.id}`}
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`px-3 py-1 rounded-xl text-[10px] font-bold tracking-tight whitespace-nowrap transition cursor-pointer ${
                            selectedCategory === cat.id
                              ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
                              : "bg-gray-50 dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Primary Product Grid Catalog */}
              {loadingProducts ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  <ProductCardSkeleton />
                  <ProductCardSkeleton />
                  <ProductCardSkeleton />
                  <ProductCardSkeleton />
                  <ProductCardSkeleton />
                </div>
              ) : filteredAndSortedProducts.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800">
                  <Search size={44} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Không tìm thấy sản phẩm phù hợp</p>
                  <p className="text-xs text-gray-400 mt-1">Hãy thử tìm kiếm từ khoá khác hoặc thay đổi bộ lọc.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Grid format: 2 columns mobile, 3 columns tablet, 4-5 columns desktop */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                    {filteredAndSortedProducts.slice(0, visibleCount).map((prod) => {
                      const isOutOfStock = prod.stock <= 0;
                      const badgeColors: Record<string, string> = {
                        KEY: "bg-gradient-to-r from-amber-500 to-orange-600 text-white border-transparent shadow-[0_0_8px_rgba(249,115,22,0.4)]",
                        ACCOUNT: "bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-transparent shadow-[0_0_8px_rgba(147,51,234,0.4)]",
                        TOOL: "bg-gradient-to-r from-red-500 to-rose-600 text-white border-transparent shadow-[0_0_8px_rgba(239,68,68,0.4)]",
                        VIP: "bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-black border-transparent shadow-[0_0_8px_rgba(234,179,8,0.4)]",
                        HOT: "bg-gradient-to-r from-orange-600 to-red-600 text-white border-transparent shadow-[0_0_8px_rgba(220,38,38,0.4)]",
                        NEW: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-transparent shadow-[0_0_8px_rgba(16,185,129,0.4)]",
                      };

                      const isHotProduct = prod.name.toLowerCase().includes("hot");

                      return (
                        <div
                          key={prod.id}
                          className={`rounded-3xl border p-3.5 flex flex-col justify-between hover:scale-[1.03] hover:shadow-2xl duration-300 transition-all relative group cursor-pointer ${
                            isHotProduct
                              ? "bg-gradient-to-br from-red-500/10 via-amber-500/5 to-slate-900/10 dark:from-red-950/20 dark:via-amber-950/10 dark:to-slate-900/30 border-red-500/60 dark:border-orange-500/50 shadow-[0_0_15px_rgba(239,68,68,0.25)] animate-pulse hover:border-red-500 dark:hover:border-orange-400"
                              : "bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800/80 shadow-md hover:border-orange-500/80 dark:hover:border-orange-500/60 hover:shadow-orange-500/10 dark:hover:shadow-orange-500/5"
                          }`}
                          onClick={() => setSelectedProduct(prod)}
                        >
                          {/* 16:9 Thumbnail image with Badge overlay */}
                          <div className="relative aspect-video w-full rounded-2xl overflow-hidden shrink-0 bg-gray-50 dark:bg-slate-950">
                            <img
                              referrerPolicy="no-referrer"
                              src={getProductImage(prod.image, prod.categoryId)}
                              alt={prod.name}
                              className="w-full h-full object-cover group-hover:scale-105 duration-500 transition"
                              loading="lazy"
                            />
                            
                            {/* Top-left corners tags */}
                            <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                              {isOutOfStock ? (
                                <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-wider border rounded bg-red-600 text-white shadow-sm border-red-600">
                                  HẾT HÀNG
                                </span>
                              ) : (
                                prod.badge && (
                                  <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider border rounded backdrop-blur-md shadow-sm ${badgeColors[prod.badge] || badgeColors.NEW}`}>
                                    {prod.badge}
                                  </span>
                                )
                              )}
                            </div>

                            {/* Product Name Overlay DIRECTLY on the Image */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-2.5 pt-8 z-10 flex flex-col justify-end">
                              <span className={`text-[10px] md:text-[11px] font-black uppercase tracking-wide drop-shadow-[0_2px_3px_rgba(0,0,0,0.95)] line-clamp-1 duration-300 transition-colors flex items-center gap-1 ${
                                isHotProduct ? "text-amber-400 group-hover:text-red-500" : "text-white group-hover:text-orange-400"
                              }`}>
                                {isHotProduct && <span className="animate-bounce">🔥</span>}
                                {prod.name}
                                {isHotProduct && <span className="animate-pulse">🔥</span>}
                              </span>
                            </div>

                            {/* Wishlist Button Overlay */}
                            <button
                              id={`wishlist-btn-${prod.id}`}
                              onClick={(e) => { e.stopPropagation(); }}
                              className="absolute top-2 right-2 p-1.5 bg-white/75 dark:bg-black/40 backdrop-blur-sm rounded-full text-gray-500 hover:text-orange-500 hover:scale-110 transition cursor-pointer z-10"
                            >
                              <Heart size={11} className="fill-transparent" />
                            </button>
                          </div>

                          {/* Info area */}
                          <div className="mt-3 flex-1 flex flex-col justify-between">
                            <div>
                              {/* Tiny category name above the product description */}
                              <span className="text-[9px] font-extrabold text-orange-500 dark:text-orange-400 uppercase tracking-wider block">
                                {categories.find(c => c.id === prod.categoryId)?.name || "Sản phẩm"}
                              </span>

                              {/* Sales count and Remaining stock */}
                              <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[9px] text-gray-500 dark:text-gray-400">
                                <span className="bg-gray-50 dark:bg-slate-850 px-1.5 py-0.5 rounded border border-gray-100 dark:border-slate-800">
                                  Đã bán: <strong className="text-gray-700 dark:text-gray-200 font-bold">{prod.salesCount}</strong>
                                </span>
                                <span className={`px-1.5 py-0.5 rounded border ${isOutOfStock ? "bg-rose-50 dark:bg-rose-950/20 text-rose-500 border-rose-100 dark:border-rose-900/30" : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 border-emerald-100 dark:border-emerald-900/30"}`}>
                                  Còn: <strong className="font-bold">{prod.stock}</strong>
                                </span>
                              </div>
                            </div>

                            {/* Price highlighted in Turquoise and BUY NOW button */}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-slate-850/60">
                              <div>
                                <span className="text-[8px] text-gray-400 block font-semibold uppercase tracking-wider">Đơn giá</span>
                                <span className="text-[13px] font-black text-teal-500 dark:text-teal-400 leading-none">
                                  {prod.price.toLocaleString()}đ
                                </span>
                              </div>

                              <button
                                id={`buy-now-btn-${prod.id}`}
                                disabled={isOutOfStock}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBuyNow(prod);
                                }}
                                className={`px-3 py-1.5 text-[9px] font-black tracking-wider rounded-xl transition duration-300 shadow-sm cursor-pointer border flex items-center gap-1 uppercase ${
                                  isOutOfStock
                                    ? "bg-gray-100 dark:bg-slate-800 border-gray-100 dark:border-slate-850 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                                    : "bg-teal-500 hover:bg-teal-600 text-white border-teal-500 hover:border-teal-600 hover:scale-105 active:scale-95"
                                }`}
                              >
                                MUA NGAY
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Load More Pagination & Scroll indicator */}
                  {filteredAndSortedProducts.length > visibleCount && (
                    <div className="flex justify-center pt-6 pb-2">
                      <button
                        id="load-more-btn"
                        onClick={() => setVisibleCount((prev) => prev + 15)}
                        className="px-6 py-2.5 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-850 border border-gray-200 dark:border-slate-800 rounded-2xl text-xs font-black text-indigo-600 dark:text-indigo-400 shadow-sm transition hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
                      >
                        <Layers size={13} />
                        Xem Thêm Sản Phẩm ({filteredAndSortedProducts.length - visibleCount} còn lại)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* VIEW: PRODUCT DETAIL (Rating star forms, Comments list) */}
          {activeView === "catalog" && selectedProduct && (
            <motion.div
              key="product-detail"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="space-y-8"
            >
              {/* Back button */}
              <button
                id="back-to-catalog"
                onClick={() => setSelectedProduct(null)}
                className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
              >
                <span>← Quay lại danh mục</span>
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Images specs (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="relative h-80 w-full rounded-3xl overflow-hidden shadow-xl border border-orange-500/20 shadow-orange-500/5">
                    <img
                      referrerPolicy="no-referrer"
                      src={getProductImage(selectedProduct.image, selectedProduct.categoryId)}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Name Overlay directly on detail image */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent p-5 pt-16">
                      <span className="text-[10px] font-black text-orange-500 dark:text-orange-400 uppercase tracking-wider block mb-1">
                        {categories.find(c => c.id === selectedProduct.categoryId)?.name || "Chi Tiết Mặt Hàng"}
                      </span>
                      <h2 className="text-sm md:text-base font-black text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                        {selectedProduct.name}
                      </h2>
                    </div>
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl space-y-2 text-xs">
                    <div className="flex justify-between text-gray-500">
                      <span>Tình trạng kho hàng:</span>
                      <strong className={selectedProduct.stock > 0 ? "text-emerald-500" : "text-rose-500"}>
                        {selectedProduct.stock > 0 ? `Còn hàng (Tồn: ${selectedProduct.stock})` : "Hết hàng"}
                      </strong>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Số lượng đã bán:</span>
                      <strong className="text-gray-800 dark:text-white">{selectedProduct.salesCount} sản phẩm</strong>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Giá niêm yết:</span>
                      <strong className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">{selectedProduct.price.toLocaleString()}đ</strong>
                    </div>
                  </div>
                </div>

                {/* Specs, rating form, reviews (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="space-y-2">
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-bold uppercase px-3 py-1 rounded-full">
                      {categories.find(c => c.id === selectedProduct.categoryId)?.name || "Mặt hàng"}
                    </span>
                    <h2 className={`text-xl md:text-2xl font-extrabold leading-tight flex items-center flex-wrap gap-2 ${
                      selectedProduct.name.toLowerCase().includes("hot")
                        ? "text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 drop-shadow-sm font-black"
                        : "text-gray-900 dark:text-white"
                    }`}>
                      {selectedProduct.name.toLowerCase().includes("hot") && <span className="animate-bounce inline-block">🔥</span>}
                      {selectedProduct.name}
                      {selectedProduct.name.toLowerCase().includes("hot") && <span className="animate-pulse inline-block">🔥</span>}
                    </h2>
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={12}
                            className={s <= Math.floor(selectedProduct.rating) ? "text-amber-400 fill-amber-400" : "text-gray-300"}
                          />
                        ))}
                      </div>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{selectedProduct.rating} / 5</span>
                      <span className="text-gray-400">({reviews.length} đánh giá thực tế)</span>
                    </div>
                  </div>

                  <button
                    id="buy-now-detail"
                    onClick={() => handleBuyNow(selectedProduct)}
                    disabled={selectedProduct.stock <= 0}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 hover:from-orange-600 hover:via-amber-600 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg cursor-pointer transition-all hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                  >
                    {selectedProduct.stock > 0 ? "Mua Ngay" : "Sản Phẩm Tạm Hết Hàng"}
                  </button>

                  {/* Rating / Review sections */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white pb-1.5 border-b border-gray-150 dark:border-slate-800">
                      Đánh Giá & Nhận Xét Từ Khách Hàng ({reviews.length})
                    </h3>

                    {/* Submit form */}
                    {user ? (
                      <form onSubmit={handleReviewSubmit} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold">Để lại đánh giá của bạn:</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                id={`star-rating-select-${s}`}
                                key={s}
                                type="button"
                                onClick={() => setUserRating(s)}
                                className="text-amber-400 cursor-pointer"
                              >
                                <Star size={18} className={s <= userRating ? "fill-amber-400" : ""} />
                              </button>
                            ))}
                          </div>
                        </div>

                        <textarea
                          id="comment-review-input"
                          value={userComment}
                          onChange={(e) => setUserComment(e.target.value)}
                          placeholder="Chia sẻ cảm nhận của bạn về chất lượng sản phẩm..."
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition text-gray-800 dark:text-gray-100 min-h-[60px]"
                          required
                        />

                        <button
                          id="submit-review-comment-btn"
                          type="submit"
                          disabled={submittingReview}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow cursor-pointer transition"
                        >
                          Gửi đánh giá
                        </button>
                      </form>
                    ) : (
                      <div className="p-4 bg-gray-50/50 dark:bg-slate-900 border border-gray-100 dark:border-slate-850 rounded-2xl text-center">
                        <p className="text-xs text-gray-500">Hãy <button id="login-to-review" onClick={() => setIsAuthModalOpen(true)} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Đăng nhập</button> để gửi đánh giá của bạn cho sản phẩm này.</p>
                      </div>
                    )}

                    {/* Past comments history */}
                    <div className="space-y-3">
                      {reviews.length === 0 ? (
                        <p className="text-center text-xs text-gray-400 py-6">Chưa có đánh giá nào cho sản phẩm này.</p>
                      ) : (
                        reviews.map((r) => (
                          <div
                            key={r.id}
                            className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-850 shadow-sm flex flex-col gap-1"
                          >
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-gray-800 dark:text-gray-200">{r.userName}</span>
                              <span className="text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex my-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  size={10}
                                  className={s <= r.rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}
                                />
                              ))}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-normal">
                              {r.comment}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* VIEW: ORDERS MANAGEMENT / TRANSACTION DISPATCHER */}
          {activeView === "orders" && (
            <motion.div
              key="orders"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Package className="text-indigo-600 dark:text-indigo-400" />
                  {user && (user.role === "ADMIN" || user.role === "STAFF") ? "Bảng Điều Phối Đơn Hàng Hệ Thống" : "Lịch Sử Đơn Đặt Hàng"}
                </h2>
              </div>

              {loadingOrders ? (
                <div className="space-y-4">
                  <OrderRowSkeleton />
                  <OrderRowSkeleton />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800">
                  <Package size={44} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Chưa tìm thấy dữ liệu đơn đặt hàng</p>
                  <p className="text-xs text-gray-400 mt-1">Bắt đầu chọn những món hàng ưng ý tại mục Cửa hàng nhé!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((ord) => {
                    let statusColor = "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900";
                    if (ord.status === "COMPLETED") {
                      statusColor = "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900";
                    } else if (ord.status === "CANCELLED") {
                      statusColor = "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900";
                    } else if (ord.status === "PROCESSING" || ord.status === "SHIPPED") {
                      statusColor = "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900";
                    }

                    return (
                      <div
                        key={ord.id}
                        className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6"
                      >
                        {/* Summary details */}
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-xs text-gray-900 dark:text-white select-all">Mã Đơn: #{ord.id}</span>
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 border rounded-full ${statusColor}`}>
                              {ord.status}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">{new Date(ord.createdAt).toLocaleDateString()}</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-500">
                            <div>
                              <p className="font-bold text-gray-700 dark:text-gray-300">Khách nhận: <span className="font-normal">{ord.customerName}</span></p>
                              <p>Số ĐT: {ord.customerPhone}</p>
                              <p className="truncate">Email: {ord.customerEmail}</p>
                            </div>
                            <div>
                              <p className="truncate">Địa chỉ giao: {ord.customerAddress}</p>
                              <p>Phương thức: {ord.paymentMethod === "COD" ? "Thanh toán lúc nhận hàng" : ord.paymentMethod === "BANK_TRANSFER" ? "Chuyển khoản trực tuyến" : "Ví điện tử"}</p>
                            </div>
                          </div>

                          {/* Items included */}
                          <div className="border-t border-gray-50 dark:border-slate-850 pt-2.5 space-y-1.5">
                            {ord.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[11px] text-gray-600 dark:text-gray-400">
                                <span className="truncate pr-4">🔸 {it.productName} <strong className="font-mono text-gray-400">x{it.quantity}</strong></span>
                                <span className="font-bold shrink-0">{(it.price * it.quantity).toLocaleString()}đ</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Order management dropdown for admin and staff */}
                        <div className="flex flex-col justify-between items-start md:items-end gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100 dark:border-slate-850 md:pl-6">
                          <div className="text-left md:text-right">
                            <span className="text-[10px] text-gray-400">Giá trị đơn hàng</span>
                            <p className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 leading-none mt-0.5">
                              {ord.total.toLocaleString()}đ
                            </p>
                            {ord.discount > 0 && <span className="text-[9px] text-emerald-500 font-semibold">Đã giảm: -{ord.discount.toLocaleString()}đ</span>}
                          </div>

                          {user && (user.role === "ADMIN" || user.role === "STAFF") ? (
                            <div className="space-y-1 w-full md:w-auto">
                              <label className="block text-[8px] font-bold text-gray-400 uppercase">Phân phối xử lý</label>
                              <select
                                id={`dispatch-order-status-select-${ord.id}`}
                                value={ord.status}
                                onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                                className="px-3 py-1.5 bg-gray-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                              >
                                <option value="PENDING">PENDING</option>
                                <option value="PROCESSING">PROCESSING</option>
                                <option value="SHIPPED">SHIPPED</option>
                                <option value="COMPLETED">COMPLETED</option>
                                <option value="CANCELLED">CANCELLED</option>
                              </select>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[10px] text-indigo-500 font-bold bg-indigo-500/5 px-2.5 py-1 rounded-lg">
                              <Truck size={12} className="animate-bounce" />
                              <span>Đơn hàng tự động theo dõi</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* VIEW: STAFF INVENTORY MANAGER */}
          {activeView === "staff-inventory" && user && (user.role === "ADMIN" || user.role === "STAFF") && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <StaffProducts
                userRole={user.role}
                products={products}
                categories={categories}
                onRefreshProducts={fetchProducts}
                onRefreshCategories={fetchCategories}
              />
            </motion.div>
          )}

          {/* VIEW: ADMIN LOGS ACTIVITY TAB */}
          {activeView === "admin-logs" && user && user.role === "ADMIN" && (
            <motion.div
              key="admin-logs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminLogs />
            </motion.div>
          )}

          {/* VIEW: ADMIN USERS AUDITING TAB */}
          {activeView === "admin-users" && user && user.role === "ADMIN" && (
            <motion.div
              key="admin-users"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminLogs />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 3. UNDER THE HOOD DEVELOPER SYSTEMS */}
      <DeveloperConsole />
      <ChatWidget />
      <NotificationToast />

      {/* 4. MODALS (Auth / Checkout) */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onSuccess={(u) => {
              setUser(u);
              fetchNotifications();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCheckoutModalOpen && (
          <CheckoutModal
            isOpen={isCheckoutModalOpen}
            cartItems={cart}
            onClose={() => setIsCheckoutModalOpen(false)}
            onClearCart={() => setCart([])}
            onUpdateQty={handleUpdateCartQty}
            onRemoveItem={handleRemoveCartItem}
            onSuccess={(ord) => {
              // Automatically switch to orders tracking page on purchase
              setActiveView("orders");
              // Toggle modal off
              setIsCheckoutModalOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
