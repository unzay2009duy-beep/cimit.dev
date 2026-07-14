import { io, Socket } from "socket.io-client";
import { User, Product, Category, Order, Voucher, ActivityLog, ChatMessage, Notification, Review } from "../types";

const API_BASE = ""; // Relative paths since frontend and backend are hosted on same domain

let accessToken: string | null = localStorage.getItem("accessToken");
let refreshToken: string | null = localStorage.getItem("refreshToken");
let currentUser: User | null = null;
let socketInstance: Socket | null = null;

// Initialize Socket.io connection
export function getSocket(userId?: string): Socket {
  if (!socketInstance) {
    socketInstance = io(window.location.origin);
    
    socketInstance.on("connect", () => {
      console.log("Connected to Realtime Server via Websocket");
      if (userId) {
        socketInstance?.emit("join", userId);
      } else {
        const cachedUser = getCurrentUser();
        if (cachedUser) {
          socketInstance?.emit("join", cachedUser.id);
        }
      }
    });
  } else if (userId) {
    socketInstance.emit("join", userId);
  }
  return socketInstance;
}

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem("accessToken", access);
  localStorage.setItem("refreshToken", refresh);
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  currentUser = null;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

export function getCurrentUser(): User | null {
  if (currentUser) return currentUser;
  const stored = localStorage.getItem("user");
  if (stored) {
    try {
      currentUser = JSON.parse(stored);
      return currentUser;
    } catch {
      return null;
    }
  }
  return null;
}

export function setCurrentUser(user: User) {
  currentUser = user;
  localStorage.setItem("user", JSON.stringify(user));
}

// Request wrapper that injects Bearer token and handles Token Refresh
async function apiRequest(url: string, options: RequestInit = {}): Promise<any> {
  const headers = new Headers(options.headers || {});
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 || response.status === 403) {
    // Attempt Token Refresh
    if (refreshToken) {
      try {
        const refreshResponse = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setTokens(data.accessToken, refreshToken);
          
          // Retry original request
          headers.set("Authorization", `Bearer ${data.accessToken}`);
          const retryResponse = await fetch(url, { ...options, headers });
          if (!retryResponse.ok) {
            const errData = await retryResponse.json();
            throw new Error(errData.error || "Giao dịch thất bại");
          }
          return retryResponse.json();
        } else {
          // Refresh token expired or revoked
          clearTokens();
          window.dispatchEvent(new Event("auth_expired"));
          throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        }
      } catch (err: any) {
        clearTokens();
        throw new Error(err.message || "Xác thực phiên làm việc thất bại");
      }
    } else {
      throw new Error("Vui lòng đăng nhập để thực hiện tác vụ này");
    }
  }

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error || "Có lỗi xảy ra");
  }

  return response.json();
}

// Core API endpoints definitions
export const api = {
  // Auth API
  async login(email: string, password: string) {
    const data = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (data.success && data.accessToken) {
      setTokens(data.accessToken, data.refreshToken);
      setCurrentUser(data.user);
      getSocket(data.user.id);
    }
    return data;
  },

  async register(email: string, password: string, name: string) {
    return apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
  },

  async verifyOtp(email: string, otp: string) {
    const data = await apiRequest("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
    if (data.success && data.accessToken) {
      setTokens(data.accessToken, data.refreshToken);
      setCurrentUser(data.user);
      getSocket(data.user.id);
    }
    return data;
  },

  async resendOtp(email: string) {
    return apiRequest("/api/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async getProfile() {
    const user = await apiRequest("/api/auth/me");
    setCurrentUser(user);
    return user;
  },

  async getUsers() {
    return apiRequest("/api/auth/users");
  },

  async updateUserRole(userId: string, role: string) {
    return apiRequest(`/api/auth/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
  },

  // Products API
  async getProducts(category?: string, search?: string): Promise<Product[]> {
    let url = "/api/products";
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (search) params.append("search", search);
    
    const queryStr = params.toString();
    if (queryStr) url += `?${queryStr}`;
    
    return apiRequest(url);
  },

  async getProduct(id: string): Promise<Product> {
    return apiRequest(`/api/products/${id}`);
  },

  async createProduct(prod: Partial<Product>): Promise<Product> {
    return apiRequest("/api/products", {
      method: "POST",
      body: JSON.stringify(prod),
    });
  },

  async updateProduct(id: string, prod: Partial<Product>): Promise<Product> {
    return apiRequest(`/api/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(prod),
    });
  },

  async deleteProduct(id: string): Promise<{ success: boolean; message: string }> {
    return apiRequest(`/api/products/${id}`, {
      method: "DELETE",
    });
  },

  // Categories API
  async getCategories(): Promise<Category[]> {
    return apiRequest("/api/categories");
  },

  async createCategory(cat: Partial<Category>): Promise<Category> {
    return apiRequest("/api/categories", {
      method: "POST",
      body: JSON.stringify(cat),
    });
  },

  async updateCategory(id: string, cat: Partial<Category>): Promise<Category> {
    return apiRequest(`/api/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(cat),
    });
  },

  async deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
    return apiRequest(`/api/categories/${id}`, {
      method: "DELETE",
    });
  },

  // Vouchers API
  async getVouchers(): Promise<Voucher[]> {
    return apiRequest("/api/vouchers");
  },

  async applyVoucher(code: string, orderValue: number): Promise<{ success: boolean; code: string; discount: number; discountPercentage: number }> {
    return apiRequest("/api/vouchers/apply", {
      method: "POST",
      body: JSON.stringify({ code, orderValue }),
    });
  },

  async createVoucher(voucher: Partial<Voucher>): Promise<Voucher> {
    return apiRequest("/api/vouchers", {
      method: "POST",
      body: JSON.stringify(voucher),
    });
  },

  // Orders API
  async checkout(orderData: any): Promise<Order> {
    return apiRequest("/api/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  },

  async getOrders(): Promise<Order[]> {
    return apiRequest("/api/orders");
  },

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    return apiRequest(`/api/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },

  // Reviews API
  async getReviews(productId: string): Promise<Review[]> {
    return apiRequest(`/api/reviews/${productId}`);
  },

  async submitReview(review: { productId: string; rating: number; comment: string }): Promise<Review> {
    return apiRequest("/api/reviews", {
      method: "POST",
      body: JSON.stringify(review),
    });
  },

  // Activity Logs API (Admin only)
  async getLogs(): Promise<ActivityLog[]> {
    return apiRequest("/api/logs");
  },

  // Chats API
  async getChats(): Promise<ChatMessage[]> {
    return apiRequest("/api/chats");
  },

  // Notifications API
  async getNotifications(): Promise<Notification[]> {
    return apiRequest("/api/notifications");
  },

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    return apiRequest("/api/notifications/read-all", {
      method: "POST",
    });
  },

  // Upload Photo Simulator (returns Base64 URL stream or custom url)
  async uploadImage(base64Image: string): Promise<{ success: boolean; url: string; public_id: string }> {
    return apiRequest("/api/upload", {
      method: "POST",
      body: JSON.stringify({ image: base64Image }),
    });
  },

  // Debug Diagnostics helper to bypass sandboxing during testing
  async getDebugState(): Promise<any> {
    return apiRequest("/api/debug/state");
  }
};
