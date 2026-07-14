import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { User, Product, Category, Order, Voucher, ActivityLog, ChatMessage, Notification, Review, UserRole } from "../src/types.js";

const DB_FILE = path.join(process.cwd(), "db_store.json");

interface DBStructure {
  users: (User & { passwordHash: string })[];
  products: Product[];
  categories: Category[];
  orders: Order[];
  vouchers: Voucher[];
  logs: ActivityLog[];
  chats: ChatMessage[];
  notifications: Notification[];
  reviews: Review[];
  otps: Record<string, { otp: string; expiresAt: number }>; // For password resets / active register email verification
}

let db: DBStructure = {
  users: [],
  products: [],
  categories: [],
  orders: [],
  vouchers: [],
  logs: [],
  chats: [],
  notifications: [],
  reviews: [],
  otps: {},
};

// Helper to save DB to file
export function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving database:", err);
  }
}

// Define global categories
export const NEW_CATEGORIES: Category[] = [
  { id: "cat_proxy_vip", name: "Proxy VIP", slug: "proxy-vip", icon: "Shield" },
  { id: "cat_proxy_body", name: "Proxy Body", slug: "proxy-body", icon: "Layers" },
  { id: "cat_proxy_drag", name: "Proxy Drag", slug: "proxy-drag", icon: "Activity" },
  { id: "cat_proxy_anten", name: "Proxy Anten", slug: "proxy-anten", icon: "Radio" },
  { id: "cat_nhe_tam", name: "nhẹ tâm", slug: "nhe-tam", icon: "Heart" },
  { id: "cat_migul_1day", name: "migul 1day", slug: "migul-1day", icon: "Clock" },
  { id: "cat_migul_7day", name: "migul day7", slug: "migul-7day", icon: "Calendar" },
  { id: "cat_migul_14day", name: "migul 14day", slug: "migul-14day", icon: "Calendar" },
  { id: "cat_migul_30day", name: "migul 30day", slug: "migul-30day", icon: "Package" },
  { id: "cat_migul_365day", name: "migul 365day", slug: "migul-365day", icon: "Shield" },
  { id: "cat_migul_lifetime", name: "migul vĩnh viễn", slug: "migul-lifetime", icon: "Zap" },
  { id: "cat_migul_pro_1day", name: "migul pro 1day", slug: "migul-pro-1day", icon: "Clock" },
  { id: "cat_migul_pro_7day", name: "migul pro 7day", slug: "migul-pro-7day", icon: "Calendar" },
  { id: "cat_migul_pro_30day", name: "migul pro30day", slug: "migul-pro-30day", icon: "Package" },
];

export function getPriceByDuration(productName: string, categoryName: string, defaultPrice: number): number {
  const combined = `${productName} ${categoryName}`.toLowerCase();
  
  if (combined.includes("vĩnh viễn") || combined.includes("vinh vien") || combined.includes("vinhvien") || combined.includes("lifetime") || combined.includes("permanent")) {
    return 600000;
  }
  if (combined.includes("365day") || combined.includes("365 day") || combined.includes("365 ngày") || combined.includes("365 ngay") || combined.includes("1 năm") || combined.includes("1 nam") || combined.includes("year")) {
    return 400000;
  }
  if (combined.includes("30day") || combined.includes("30 day") || combined.includes("30 ngày") || combined.includes("30 ngay") || combined.includes("1 tháng") || combined.includes("1 thang") || combined.includes("pro30day") || combined.includes("pro 30day")) {
    return 150000;
  }
  if (combined.includes("14day") || combined.includes("14 day") || combined.includes("14 ngày") || combined.includes("14 ngay") || combined.includes("2 tuần") || combined.includes("2 tuan")) {
    return 80000;
  }
  if (combined.includes("7day") || combined.includes("7 day") || combined.includes("7 ngày") || combined.includes("7 ngay") || combined.includes("1 tuần") || combined.includes("1 tuan") || combined.includes("day7")) {
    return 50000;
  }
  if (combined.includes("1day") || combined.includes("1 day") || combined.includes("1 ngày") || combined.includes("1 ngay") || combined.includes("24h") || combined.includes("day1")) {
    return 30000;
  }
  return defaultPrice;
}

// Helper to generate 55 diverse products (at least 50 products)
export function generateProductSeed(): Product[] {
  const list: Product[] = [];
  const categoriesInfo = [
    { id: "cat_proxy_vip", name: "Proxy VIP", filter: "Proxy", badge: "VIP" as const, images: ["1544197150-b99a580bb7a8", "1558494949-ef010cbdcc31", "1563986768609-322da13575f3"] },
    { id: "cat_proxy_body", name: "Proxy Body", filter: "Proxy", badge: "HOT" as const, images: ["1526374965328-7f61d4dc18c5", "1510511459019-dda7724fd87", "1451187580459-43490279c0fa"] },
    { id: "cat_proxy_drag", name: "Proxy Drag", filter: "Proxy", badge: "TOOL" as const, images: ["1550751827-4bd374c3f58b", "1531403009284-440f080d1e12", "1518770660439-4636190af475"] },
    { id: "cat_proxy_anten", name: "Proxy Anten", filter: "Proxy", badge: "NEW" as const, images: ["1517694712202-14dd9538aa97", "1618005182384-a83a8bd57fbe", "1639762681485-074b7f938ba0"] },
    { id: "cat_nhe_tam", name: "nhẹ tâm", filter: "Tool", badge: "VIP" as const, images: ["1614064641938-3bbee52942c7", "1563986768609-322da13575f3", "1451187580459-43490279c0fa"] },
    { id: "cat_migul_1day", name: "migul 1day", filter: "Key", badge: "KEY" as const, images: ["1608306479277-19aa67a5744a", "1618005182384-a83a8bd57fbe", "1639762681485-074b7f938ba0"] },
    { id: "cat_migul_7day", name: "migul day7", filter: "Key", badge: "HOT" as const, images: ["1614064641938-3bbee52942c7", "1550751827-4bd374c3f58b", "1518770660439-4636190af475"] },
    { id: "cat_migul_14day", name: "migul 14day", filter: "Key", badge: "HOT" as const, images: ["1614064641938-3bbee52942c7", "1550751827-4bd374c3f58b", "1518770660439-4636190af475"] },
    { id: "cat_migul_30day", name: "migul 30day", filter: "Key", badge: "VIP" as const, images: ["1526374965328-7f61d4dc18c5", "1510511459019-5dda7724fd87", "1451187580459-43490279c0fa"] },
    { id: "cat_migul_365day", name: "migul 365day", filter: "Key", badge: "VIP" as const, images: ["1526374965328-7f61d4dc18c5", "1510511459019-5dda7724fd87", "1451187580459-43490279c0fa"] },
    { id: "cat_migul_lifetime", name: "migul vĩnh viễn", filter: "Key", badge: "VIP" as const, images: ["1526374965328-7f61d4dc18c5", "1510511459019-5dda7724fd87", "1451187580459-43490279c0fa"] },
    { id: "cat_migul_pro_1day", name: "migul pro 1day", filter: "VIP", badge: "NEW" as const, images: ["1558494949-ef010cbdcc31", "1563986768609-322da13575f3", "1517694712202-14dd9538aa97"] },
    { id: "cat_migul_pro_7day", name: "migul pro 7day", filter: "VIP", badge: "HOT" as const, images: ["1618005182384-a83a8bd57fbe", "1639762681485-074b7f938ba0", "1614064641938-3bbee52942c7"] },
    { id: "cat_migul_pro_30day", name: "migul pro30day", filter: "Account", badge: "ACCOUNT" as const, images: ["1550751827-4bd374c3f58b", "1531403009284-440f080d1e12", "1518770660439-4636190af475"] }
  ];

  let prodIdx = 1;
  for (const cat of categoriesInfo) {
    for (let i = 1; i <= 5; i++) {
      // Deterministic prices from 5000đ to 500.000đ
      const prices = [5000, 15000, 25000, 50000, 75000, 100000, 150000, 200000, 250000, 300000, 450000, 500000];
      const basePrice = prices[(prodIdx * 3 + i * 7) % prices.length];
      
      // Sold count between 10 and 5000
      const salesCount = 10 + ((prodIdx * 89 + i * 23) % 4990);
      
      // Stock count between 0 and 500. Let's make every 10th item out of stock
      let stock = 5 + ((prodIdx * 43 + i * 17) % 495);
      if (prodIdx % 10 === 0) {
        stock = 0; // Out of stock
      }

      const ratingStr = (4.0 + ((prodIdx * 13 + i * 7) % 11) / 10).toFixed(1);
      const rating = Number(ratingStr);

      // Name and description templates
      let prodName = "";
      let description = "";
      const isProxy = cat.name.toLowerCase().includes("proxy");
      const isMigul = cat.name.toLowerCase().includes("migul");
      
      if (isProxy) {
        const types = ["IPv4", "IPv6", "SOCKS5", "HTTP", "Residential"];
        const type = types[(i + prodIdx) % types.length];
        const regions = ["Việt Nam", "USA", "Singapore", "Japan", "Europe"];
        const region = regions[(i * 2 + prodIdx) % regions.length];
        prodName = `${cat.name} ${type} - Server ${region} #0${i}`;
        
        // Exact user-requested renames for Proxy VIP category
        if (cat.id === "cat_proxy_vip") {
          if (i === 1) {
            prodName = "proxy 30day - ios hot";
          } else if (i === 2) {
            prodName = "proxy 7day - ios";
          } else if (i === 3) {
            prodName = "proxy14day - ios";
          } else if (i === 4) {
            prodName = "Proxy 1day -ios";
          } else if (i === 5) {
            prodName = "proxy 365 day - ios";
          }
        }
        
        description = `Dịch vụ cung cấp Proxy dòng ${cat.name} chuẩn kết nối ${type} cực kỳ ổn định đặt tại server ${region}. Băng thông không giới hạn, độ trễ cực thấp, tốc độ tải tối đa 1Gbps, bảo mật dữ liệu tuyệt đối.`;
      } else if (isMigul) {
        const variants = ["Standard Edition", "VIP Ultra", "Bypass Master", "Pro Edition", "Gaming Booster"];
        const variant = variants[(i + prodIdx) % variants.length];
        prodName = `Key ${cat.name} - ${variant} [Lượt ${i}]`;
        description = `Bản quyền chính hãng ${cat.name} phân hệ ${variant}. Hỗ trợ cập nhật tự động nhanh chóng, không giật lag, tối ưu hóa băng thông, chống gián đoạn kết nối, an toàn tuyệt đối 100%.`;
      } else { // nhẹ tâm
        const utilities = ["Dọn rác hệ thống", "Tối ưu hóa game", "Bảo vệ kết nối", "Tăng tốc mạng", "Mượt Ping"];
        const util = utilities[(i + prodIdx) % utilities.length];
        prodName = `Phần mềm ${cat.name} - ${util} v${i}.0`;
        description = `Công cụ ${cat.name} chuyên dụng để ${util}. Giao diện thân thiện dễ sử dụng, tương thích cao với tất cả dòng máy, giúp tối ưu hóa hệ thống nhẹ nhàng và đem lại sự an tâm tuyệt đối khi sử dụng.`;
      }

      const price = getPriceByDuration(prodName, cat.name, basePrice);

      const imageId = cat.images[(i + prodIdx) % cat.images.length];
      const image = `https://images.unsplash.com/photo-${imageId}?w=500&auto=format&fit=crop&q=80`;

      // Assign badges dynamically from specified pool
      const badges: ("KEY" | "ACCOUNT" | "TOOL" | "VIP" | "HOT" | "NEW")[] = ["KEY", "ACCOUNT", "TOOL", "VIP", "HOT", "NEW"];
      let badge = badges[(prodIdx + i) % badges.length];
      if (prodName.toLowerCase().includes("hot")) {
        badge = "HOT";
      }

      list.push({
        id: `prod_cimit_${prodIdx}`,
        name: prodName,
        price,
        description,
        image,
        categoryId: cat.id,
        stock,
        rating,
        salesCount,
        createdAt: new Date(Date.now() - (prodIdx * 2) * 3600 * 1000).toISOString(),
        badge,
        filterType: cat.filter as any,
      });

      prodIdx++;
    }
  }

  // Append the 6th Proxy VIP product: proxy vĩnh viễn - ios
  const priceVip6 = getPriceByDuration("proxy vĩnh viễn - ios", "Proxy VIP", 600000);
  list.push({
    id: "prod_cimit_71",
    name: "proxy vĩnh viễn - ios",
    price: priceVip6,
    description: "Dịch vụ cung cấp Proxy VIP dòng vĩnh viễn chuẩn kết nối ổn định đặt tại server Việt Nam. Băng thông không giới hạn, độ trễ cực thấp, tốc độ tải tối đa 1Gbps, bảo mật dữ liệu tuyệt đối.",
    image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&auto=format&fit=crop&q=80",
    categoryId: "cat_proxy_vip",
    stock: 120,
    rating: 5.0,
    salesCount: 884,
    createdAt: new Date().toISOString(),
    badge: "VIP",
    filterType: "Proxy",
  });

  return list;
}

// Helper to load DB from file and seed if necessary
export async function loadDB() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      db = JSON.parse(content);
      // Ensure all fields exist
      db.users = db.users || [];
      db.products = db.products || [];
      db.categories = db.categories || [];
      db.orders = db.orders || [];
      db.vouchers = db.vouchers || [];
      db.logs = db.logs || [];
      db.chats = db.chats || [];
      db.notifications = db.notifications || [];
      db.reviews = db.reviews || [];
      db.otps = db.otps || {};

      // Migrate DB if old categories or if the new duration packages are missing
      const hasOldData = db.categories.some(c => c.id === "cat_phone") || !db.products.some(p => p.categoryId === "cat_migul_14day");
      if (hasOldData) {
        console.log("Old catalog detected, regenerating Cimit.dev products...");
        db.categories = NEW_CATEGORIES;
        db.products = generateProductSeed();
        
        // Clean up reviews pointing to nonexistent products
        db.reviews = [
          {
            id: "rev_1",
            productId: "prod_cimit_1",
            userId: "usr_customer",
            userName: "Lê Khách Hàng",
            rating: 5,
            comment: "Proxy VIP siêu nhanh ổn định mượt mà, hỗ trợ cực nhiệt tình!",
            createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
          },
          {
            id: "rev_2",
            productId: "prod_cimit_6",
            userId: "usr_customer",
            userName: "Bùi Thị Minh",
            rating: 4,
            comment: "Key migul kích hoạt ngay lập tức, chạy rất mượt không giật lag tí nào.",
            createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
          }
        ];
        saveDB();
      } else {
        // Automatically migrate products to use the correct duration-based prices if they don't match
        let dbUpdated = false;
        
        // Ensure all categories from NEW_CATEGORIES are present
        for (const cat of NEW_CATEGORIES) {
          if (!db.categories.some(c => c.id === cat.id)) {
            db.categories.push(cat);
            dbUpdated = true;
          }
        }
        
        // Ensure all seeded products (including new categories) are present in the DB
        const seededProducts = generateProductSeed();
        const existingIds = new Set(db.products.map(p => p.id));
        for (const seededProd of seededProducts) {
          if (!existingIds.has(seededProd.id)) {
            db.products.push(seededProd);
            dbUpdated = true;
          }
        }
        
        // Apply duration-based prices and sync seeded properties
        for (const p of db.products) {
          const seeded = seededProducts.find(sp => sp.id === p.id);
          if (seeded) {
            if (p.name !== seeded.name) {
              p.name = seeded.name;
              dbUpdated = true;
            }
            if (p.badge !== seeded.badge) {
              p.badge = seeded.badge;
              dbUpdated = true;
            }
          }
          const cat = db.categories.find(c => c.id === p.categoryId);
          const catName = cat ? cat.name : "";
          const correctPrice = getPriceByDuration(p.name, catName, p.price);
          if (p.price !== correctPrice) {
            p.price = correctPrice;
            dbUpdated = true;
          }
        }
        
        if (dbUpdated) {
          console.log("Database successfully migrated with duration prices and new products.");
          saveDB();
        }
      }
      return;
    } catch (err) {
      console.error("Error parsing database, re-initializing:", err);
    }
  }

  // Seed default database
  console.log("Seeding new database...");
  
  // Hash standard passwords
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync("admin123", salt);
  const staffHash = bcrypt.hashSync("staff123", salt);
  const customerHash = bcrypt.hashSync("customer123", salt);

  db.users = [
    {
      id: "usr_admin",
      email: "admin@shop.vn",
      name: "Nguyễn Admin Manager",
      role: "ADMIN",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      passwordHash: adminHash,
    },
    {
      id: "usr_staff",
      email: "staff@shop.vn",
      name: "Trần Nhân Viên Staff",
      role: "STAFF",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      passwordHash: staffHash,
    },
    {
      id: "usr_customer",
      email: "customer@shop.vn",
      name: "Lê Khách Hàng",
      role: "CUSTOMER",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      passwordHash: customerHash,
    }
  ];

  db.categories = NEW_CATEGORIES;
  db.products = generateProductSeed();

  db.vouchers = [
    {
      code: "XINCHAO",
      discountPercentage: 10,
      maxDiscount: 50000,
      minOrderValue: 100000,
      expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      usageLimit: 1000,
      usageCount: 145,
      active: true,
    },
    {
      code: "APPTET",
      discountPercentage: 20,
      maxDiscount: 100000,
      minOrderValue: 250000,
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      usageLimit: 500,
      usageCount: 12,
      active: true,
    },
    {
      code: "FREESHIP",
      discountPercentage: 100,
      maxDiscount: 30000,
      minOrderValue: 50000,
      expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      usageLimit: 5000,
      usageCount: 1280,
      active: true,
    },
  ];

  db.logs = [
    {
      id: "log_1",
      timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
      userId: "usr_admin",
      userName: "Nguyễn Admin Manager",
      userRole: "ADMIN",
      action: "LOGIN",
      details: "Đăng nhập hệ thống quản lý thành công",
      ipAddress: "127.0.0.1",
    },
    {
      id: "log_2",
      timestamp: new Date(Date.now() - 1800 * 1000).toISOString(),
      userId: "usr_staff",
      userName: "Trần Nhân Viên Staff",
      userRole: "STAFF",
      action: "UPDATE_PRODUCT",
      details: "Cập nhật tồn kho sản phẩm (Tồn: 45)",
      ipAddress: "192.168.1.15",
    },
    {
      id: "log_3",
      timestamp: new Date(Date.now() - 900 * 1000).toISOString(),
      userId: "usr_customer",
      userName: "Lê Khách Hàng",
      userRole: "CUSTOMER",
      action: "LOGIN",
      details: "Đăng nhập mua sắm",
      ipAddress: "115.79.12.3",
    }
  ];

  db.chats = [
    {
      id: "chat_1",
      senderId: "usr_customer",
      senderName: "Lê Khách Hàng",
      senderRole: "CUSTOMER",
      message: "Xin chào, shop cho mình hỏi Proxy VIP có hỗ trợ kết nối SOCKS5 tốc độ cao không ạ?",
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: "chat_2",
      senderId: "usr_staff",
      senderName: "Trần Nhân Viên Staff",
      senderRole: "STAFF",
      message: "Dạ chào anh/chị Lê Khách Hàng! Dạ Proxy VIP bên em hỗ trợ chuẩn SOCKS5 và HTTP tốc độ cao, độ trễ cực thấp ạ. Mình có thể mua trực tiếp ngay trên trang chủ nhé!",
      timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    }
  ];

  db.notifications = [
    {
      id: "notif_welcome",
      userId: "all",
      title: "Chào mừng bạn đến với Cimit.dev!",
      message: "Hệ thống phân phối Proxy VIP, Key Premium & Tool tự động phân quyền, bảo mật cao cấp với các tính năng OTP, Chat & Thông báo thời gian thực đã sẵn sàng.",
      type: "success",
      readBy: [],
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    }
  ];

  db.reviews = [
    {
      id: "rev_1",
      productId: "prod_cimit_1",
      userId: "usr_customer",
      userName: "Lê Khách Hàng",
      rating: 5,
      comment: "Proxy VIP siêu nhanh ổn định mượt mà, hỗ trợ cực nhiệt tình!",
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: "rev_2",
      productId: "prod_cimit_6",
      userId: "usr_customer",
      userName: "Bùi Thị Minh",
      rating: 4,
      comment: "Key migul kích hoạt ngay lập tức, chạy rất mượt không giật lag tí nào.",
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    }
  ];

  db.otps = {};

  saveDB();
}

// Get raw DB states
export function getDB() {
  return db;
}

// System logging helper
export function addLog(userId: string, userName: string, role: UserRole, action: string, details: string, ip: string = "127.0.0.1") {
  const newLog: ActivityLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    userId,
    userName,
    userRole: role,
    action,
    details,
    ipAddress: ip,
  };
  db.logs.unshift(newLog);
  // Keep logs at a reasonable limit (e.g. max 500)
  if (db.logs.length > 500) {
    db.logs.pop();
  }
  saveDB();
  return newLog;
}

// System notification helper
export function addNotification(title: string, message: string, type: "info" | "success" | "warning" | "error" = "info", userId: string = "all") {
  const newNotif: Notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    title,
    message,
    type,
    readBy: [],
    createdAt: new Date().toISOString(),
  };
  db.notifications.unshift(newNotif);
  if (db.notifications.length > 100) {
    db.notifications.pop();
  }
  saveDB();
  return newNotif;
}
