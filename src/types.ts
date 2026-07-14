export type UserRole = "ADMIN" | "STAFF" | "CUSTOMER";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string;
  status: "ACTIVE" | "PENDING_OTP";
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  categoryId: string;
  stock: number;
  rating: number;
  salesCount: number;
  createdAt: string;
  badge?: "KEY" | "ACCOUNT" | "TOOL" | "VIP" | "HOT" | "NEW";
  filterType?: "Proxy" | "Account" | "Key" | "Tool" | "VIP";
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  product?: Product; // Populated in frontend or during checkout
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
  }[];
  subtotal: number;
  discount: number;
  total: number;
  voucherCode?: string;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "COMPLETED" | "CANCELLED";
  paymentMethod: "COD" | "BANK_TRANSFER" | "E_WALLET";
  createdAt: string;
}

export interface Voucher {
  code: string;
  discountPercentage: number; // e.g. 10 for 10%
  maxDiscount: number; // e.g. 50000 VND
  minOrderValue: number; // e.g. 100000 VND
  expiresAt: string;
  usageLimit: number;
  usageCount: number;
  active: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string; // e.g., "LOGIN", "CREATE_PRODUCT", "BUY"
  details: string;
  ipAddress: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string; // "all" or specific userId
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  readBy: string[]; // List of userIds who read it
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

