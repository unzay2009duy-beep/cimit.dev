import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Camera, Tag, Layers, CheckCircle, ShieldAlert, Percent } from "lucide-react";
import { api } from "../lib/api";
import { Product, Category, Voucher } from "../types";
import { getProductImage } from "../lib/imageHelper";

interface StaffProductsProps {
  userRole: "ADMIN" | "STAFF";
  products: Product[];
  categories: Category[];
  onRefreshProducts: () => void;
  onRefreshCategories: () => void;
}

export function StaffProducts({
  userRole,
  products,
  categories,
  onRefreshProducts,
  onRefreshCategories,
}: StaffProductsProps) {
  // Tabs: "products", "categories", "vouchers"
  const [activeTab, setActiveTab] = useState<"products" | "categories" | "vouchers">("products");

  // Status/Error alerts
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form States - Products
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodImg, setProdImg] = useState("");
  const [prodCat, setProdCat] = useState("");
  const [prodStock, setProdStock] = useState("");

  // Form States - Categories
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catIcon, setCatIcon] = useState("");

  // Form States - Vouchers
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [vCode, setVCode] = useState("");
  const [vPercentage, setVPercentage] = useState("");
  const [vMaxDiscount, setVMaxDiscount] = useState("");
  const [vMinOrder, setVMinOrder] = useState("");
  const [vLimit, setVLimit] = useState("");
  const [vExpires, setVExpires] = useState("");

  const loadVouchers = async () => {
    try {
      const data = await api.getVouchers();
      setVouchers(data);
    } catch {}
  };

  useEffect(() => {
    loadVouchers();
  }, []);

  const clearAlerts = () => {
    setError(null);
    setSuccess(null);
  };

  // Local Image Upload to base64 parser
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    clearAlerts();
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Dung lượng ảnh tối đa là 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      setLoading(true);
      try {
        const base64 = reader.result as string;
        const res = await api.uploadImage(base64);
        if (res.success) {
          setProdImg(res.url);
          setSuccess("Tải ảnh thành công!");
        }
      } catch (err: any) {
        setError(err.message || "Tải ảnh lên thất bại");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Create or Update Product
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();
    setLoading(true);

    if (!prodName || !prodPrice || !prodCat || !prodStock) {
      setError("Vui lòng điền đầy đủ các trường thông tin bắt buộc");
      setLoading(false);
      return;
    }

    const payload = {
      name: prodName,
      price: Number(prodPrice),
      description: prodDesc,
      image: prodImg || undefined,
      categoryId: prodCat,
      stock: Number(prodStock),
    };

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
        setSuccess(`Cập nhật sản phẩm "${prodName}" thành công!`);
        setEditingProduct(null);
      } else {
        await api.createProduct(payload);
        setSuccess(`Đăng sản phẩm "${prodName}" thành công!`);
      }
      
      // Reset form fields
      setProdName("");
      setProdPrice("");
      setProdDesc("");
      setProdImg("");
      setProdCat("");
      setProdStock("");
      onRefreshProducts();
    } catch (err: any) {
      setError(err.message || "Lưu thông tin sản phẩm thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSelect = (p: Product) => {
    clearAlerts();
    setEditingProduct(p);
    setProdName(p.name);
    setProdPrice(p.price.toString());
    setProdDesc(p.description);
    setProdImg(p.image);
    setProdCat(p.categoryId);
    setProdStock(p.stock.toString());
    // Scroll form into view gently
    document.getElementById("product-form-anchor")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDeleteProduct = async (id: string) => {
    if (userRole !== "ADMIN") {
      setError("Chỉ tài khoản ADMIN mới được phép xoá sản phẩm khỏi kệ hàng");
      return;
    }
    clearAlerts();
    if (!window.confirm("Bạn có chắc chắn muốn xoá vĩnh viễn sản phẩm này?")) return;

    try {
      await api.deleteProduct(id);
      setSuccess("Đã xoá sản phẩm khỏi danh sách hệ thống!");
      onRefreshProducts();
    } catch (err: any) {
      setError(err.message || "Xoá sản phẩm thất bại");
    }
  };

  // Add Category
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();
    if (!catName || !catSlug) {
      setError("Vui lòng điền tên danh mục và slug");
      return;
    }

    try {
      await api.createCategory({ name: catName, slug: catSlug.toLowerCase(), icon: catIcon || "Tag" });
      setSuccess(`Tạo danh mục "${catName}" thành công!`);
      setCatName("");
      setCatSlug("");
      setCatIcon("");
      onRefreshCategories();
    } catch (err: any) {
      setError(err.message || "Tạo danh mục thất bại");
    }
  };

  // Add Voucher (ADMIN ONLY)
  const handleVoucherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();
    if (userRole !== "ADMIN") {
      setError("Chỉ tài khoản ADMIN mới được cấp quyền tạo mã giảm giá");
      return;
    }

    if (!vCode || !vPercentage || !vMaxDiscount || !vMinOrder || !vLimit || !vExpires) {
      setError("Vui lòng điền đầy đủ tất cả thuộc tính voucher");
      return;
    }

    try {
      await api.createVoucher({
        code: vCode.toUpperCase(),
        discountPercentage: Number(vPercentage),
        maxDiscount: Number(vMaxDiscount),
        minOrderValue: Number(vMinOrder),
        expiresAt: new Date(vExpires).toISOString(),
        usageLimit: Number(vLimit),
      });
      setSuccess(`Tạo voucher "${vCode.toUpperCase()}" thành công!`);
      setVCode("");
      setVPercentage("");
      setVMaxDiscount("");
      setVMinOrder("");
      setVLimit("");
      setVExpires("");
      loadVouchers();
    } catch (err: any) {
      setError(err.message || "Tạo voucher thất bại");
    }
  };

  return (
    <div className="space-y-6 font-sans text-gray-800 dark:text-gray-100">
      {/* Category subtabs switcher */}
      <div className="flex border-b border-gray-100 dark:border-slate-800 gap-4">
        <button
          id="tab-manage-products"
          onClick={() => { setActiveTab("products"); clearAlerts(); }}
          className={`pb-2.5 font-bold text-xs tracking-tight relative cursor-pointer ${activeTab === "products" ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400" : "text-gray-400 hover:text-gray-600"}`}
        >
          Sản Phẩm & Kho Hàng
        </button>
        <button
          id="tab-manage-categories"
          onClick={() => { setActiveTab("categories"); clearAlerts(); }}
          className={`pb-2.5 font-bold text-xs tracking-tight relative cursor-pointer ${activeTab === "categories" ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400" : "text-gray-400 hover:text-gray-600"}`}
        >
          Danh Mục Ngành Hàng
        </button>
        <button
          id="tab-manage-vouchers"
          onClick={() => { setActiveTab("vouchers"); clearAlerts(); }}
          className={`pb-2.5 font-bold text-xs tracking-tight relative cursor-pointer ${activeTab === "vouchers" ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400" : "text-gray-400 hover:text-gray-600"}`}
        >
          Mã Giảm Giá (Vouchers)
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* Tab Content: Products */}
      {activeTab === "products" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8" id="product-form-anchor">
          {/* Edit/Create Form (5 cols) */}
          <form onSubmit={handleProductSubmit} className="xl:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700/50 space-y-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-slate-700/50 flex justify-between items-center">
              <span>{editingProduct ? `Sửa: ${editingProduct.name.substring(0, 20)}...` : "Thêm Sản Phẩm Mới"}</span>
              {editingProduct && (
                <button
                  id="cancel-product-edit"
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setProdName("");
                    setProdPrice("");
                    setProdDesc("");
                    setProdImg("");
                    setProdCat("");
                    setProdStock("");
                  }}
                  className="text-[10px] text-gray-400 hover:text-rose-500 font-bold cursor-pointer"
                >
                  Huỷ bỏ
                </button>
              )}
            </h3>

            {/* Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">Tên Sản Phẩm *</label>
                <input
                  id="prod-name-input"
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="iPhone 15 Pro Max, v.v..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-all text-gray-800 dark:text-gray-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">Giá Bán (VND) *</label>
                  <input
                    id="prod-price-input"
                    type="number"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="29900000"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-all text-gray-800 dark:text-gray-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">Số Lượng Kho *</label>
                  <input
                    id="prod-stock-input"
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    placeholder="50"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-all text-gray-800 dark:text-gray-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">Danh Mục Sản Phẩm *</label>
                <select
                  id="prod-cat-select"
                  value={prodCat}
                  onChange={(e) => setProdCat(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-all text-gray-800 dark:text-gray-100 cursor-pointer"
                  required
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">Mô Tả Sản Phẩm</label>
                <textarea
                  id="prod-desc-textarea"
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="Tính năng nổi bật, thông số kỹ thuật..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-all text-gray-800 dark:text-gray-100 min-h-[80px]"
                />
              </div>

              {/* Photo Upload Simulator Row */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1.5">Ảnh Đại Diện Sản Phẩm</label>
                <div className="flex gap-3 items-center">
                  <div className="relative shrink-0 w-16 h-16 rounded-xl border border-dashed border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950/60 overflow-hidden flex items-center justify-center">
                    {prodImg ? (
                      <img referrerPolicy="no-referrer" src={prodImg} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={18} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      id="prod-image-file"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="prod-image-file"
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-950 dark:hover:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-[10px] font-bold cursor-pointer transition inline-flex items-center gap-1 text-gray-700 dark:text-gray-300"
                    >
                      <span>Tải ảnh lên</span>
                    </label>
                    <p className="text-[9px] text-gray-400 leading-normal">Hỗ trợ các file đuôi PNG, JPG, WEBP dưới 5MB.</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              id="submit-product-form-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]"
            >
              {loading ? "Đang lưu..." : editingProduct ? "Lưu Cập Nhật" : "Đăng Lên Kệ Hàng"}
            </button>
          </form>

          {/* Active Inventory Grid Table (7 cols) */}
          <div className="xl:col-span-7 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700/50 space-y-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-slate-700/50">
              Kho Hàng Của Cửa Hàng ({products.length} Sản phẩm)
            </h3>

            <div className="overflow-y-auto max-h-[500px] space-y-2.5 pr-1">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-gray-50/50 dark:bg-slate-950/20 border border-gray-100 dark:border-slate-800 rounded-2xl flex gap-3 items-center hover:border-gray-200 dark:hover:border-slate-700 transition"
                >
                  <img
                    referrerPolicy="no-referrer"
                    src={getProductImage(p.image, p.categoryId)}
                    alt={p.name}
                    className="w-10 h-10 object-cover rounded-lg shrink-0 border border-gray-100 dark:border-slate-800"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-gray-900 dark:text-white truncate">{p.name}</h4>
                    <div className="flex gap-3 text-[10px] text-gray-500 mt-1">
                      <span>Tồn: <strong className={p.stock < 10 ? "text-rose-500" : "text-gray-700 dark:text-gray-300"}>{p.stock}</strong></span>
                      <span>Bán: <strong className="text-gray-700 dark:text-gray-300">{p.salesCount}</strong></span>
                      <span>Giá: <strong className="text-indigo-600 dark:text-indigo-400">{p.price.toLocaleString()}đ</strong></span>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      id={`edit-product-btn-${p.id}`}
                      onClick={() => handleEditSelect(p)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-lg cursor-pointer transition"
                    >
                      <Edit size={13} />
                    </button>
                    {userRole === "ADMIN" && (
                      <button
                        id={`delete-product-btn-${p.id}`}
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 rounded-lg cursor-pointer transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Categories */}
      {activeTab === "categories" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Create Category Form */}
          <form onSubmit={handleCategorySubmit} className="xl:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700/50 space-y-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-slate-700/50">
              Tạo Danh Mục Ngành Hàng
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">Tên Danh Mục *</label>
                <input
                  id="cat-name-input"
                  type="text"
                  value={catName}
                  onChange={(e) => { setCatName(e.target.value); setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-")); }}
                  placeholder="Ví dụ: Thiết bị Gia dụng"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-all text-gray-800 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">Slug Liên Kết *</label>
                <input
                  id="cat-slug-input"
                  type="text"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="gia-dung"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-all text-gray-800 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">Icon đại diện (Tên Lucide Icon)</label>
                <input
                  id="cat-icon-input"
                  type="text"
                  value={catIcon}
                  onChange={(e) => setCatIcon(e.target.value)}
                  placeholder="Smartphone, Shirt, Home, BookOpen, v.v..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-all text-gray-800 dark:text-gray-100"
                />
              </div>
            </div>

            <button
              id="submit-category-btn"
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]"
            >
              Thêm Danh Mục
            </button>
          </form>

          {/* List Categories */}
          <div className="xl:col-span-7 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700/50 space-y-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-slate-700/50">
              Các Ngành Hàng Đang Hoạt Động ({categories.length})
            </h3>
            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 bg-gray-50/50 dark:bg-slate-950/20 border border-gray-100 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2">
                    <Layers size={14} className="text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <h4 className="font-bold text-xs text-gray-900 dark:text-white">{c.name}</h4>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">slug: {c.slug}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Vouchers */}
      {activeTab === "vouchers" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Create Voucher Form (ADMIN ONLY) */}
          <form onSubmit={handleVoucherSubmit} className="xl:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700/50 space-y-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-slate-700/50 flex items-center gap-1.5">
              <Percent size={16} className="text-indigo-600 dark:text-indigo-400" />
              Tạo Mã Giảm Giá Mới (Admin Only)
            </h3>
            {userRole !== "ADMIN" && (
              <p className="text-[10px] text-rose-500 bg-rose-50 dark:bg-rose-950/20 p-2 border border-rose-100 dark:border-rose-900/40 rounded-lg">
                ⚠️ Chỉ quản trị viên cấp cao [ADMIN] mới được tạo lập voucher khuyến mại.
              </p>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">Mã Voucher (In Hoa) *</label>
                <input
                  id="voucher-code-input"
                  type="text"
                  value={vCode}
                  onChange={(e) => setVCode(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: BLACKFRIDAY"
                  disabled={userRole !== "ADMIN"}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-all text-gray-800 dark:text-gray-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">% Giảm Giá (1-100) *</label>
                  <input
                    id="voucher-percentage-input"
                    type="number"
                    min={1}
                    max={100}
                    value={vPercentage}
                    onChange={(e) => setVPercentage(e.target.value)}
                    placeholder="20"
                    disabled={userRole !== "ADMIN"}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-all text-gray-800 dark:text-gray-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">Giảm Tối Đa (VND) *</label>
                  <input
                    id="voucher-max-discount-input"
                    type="number"
                    value={vMaxDiscount}
                    onChange={(e) => setVMaxDiscount(e.target.value)}
                    placeholder="100000"
                    disabled={userRole !== "ADMIN"}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-all text-gray-800 dark:text-gray-100"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">Đơn Tối Thiểu (VND) *</label>
                  <input
                    id="voucher-min-order-input"
                    type="number"
                    value={vMinOrder}
                    onChange={(e) => setVMinOrder(e.target.value)}
                    placeholder="250000"
                    disabled={userRole !== "ADMIN"}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-all text-gray-800 dark:text-gray-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">Số Lượt Sử Dụng *</label>
                  <input
                    id="voucher-limit-input"
                    type="number"
                    value={vLimit}
                    onChange={(e) => setVLimit(e.target.value)}
                    placeholder="500"
                    disabled={userRole !== "ADMIN"}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-all text-gray-800 dark:text-gray-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">Ngày Hết Hạn *</label>
                <input
                  id="voucher-expiry-input"
                  type="date"
                  value={vExpires}
                  onChange={(e) => setVExpires(e.target.value)}
                  disabled={userRole !== "ADMIN"}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-all text-gray-800 dark:text-gray-100 cursor-pointer"
                  required
                />
              </div>
            </div>

            <button
              id="submit-voucher-btn"
              type="submit"
              disabled={userRole !== "ADMIN"}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]"
            >
              Tạo Lập Voucher
            </button>
          </form>

          {/* List Vouchers */}
          <div className="xl:col-span-7 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700/50 space-y-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-slate-700/50">
              Các Voucher Đang Có Hiệu Lực ({vouchers.length})
            </h3>
            <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
              {vouchers.map((v) => (
                <div
                  key={v.code}
                  className="p-3.5 bg-gray-50/50 dark:bg-slate-950/20 border border-gray-100 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-lg select-all">{v.code}</span>
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">Giảm {v.discountPercentage}%</span>
                    </div>
                    <div className="flex gap-3 text-[10px] text-gray-500 mt-2">
                      <span>Đơn tối thiểu: <strong className="text-gray-700 dark:text-gray-300">{v.minOrderValue.toLocaleString()}đ</strong></span>
                      <span>Giảm tối đa: <strong className="text-gray-700 dark:text-gray-300">{v.maxDiscount.toLocaleString()}đ</strong></span>
                      <span>Đã dùng: <strong className="text-gray-700 dark:text-gray-300">{v.usageCount}/{v.usageLimit}</strong></span>
                    </div>
                  </div>
                  <span className="text-[9px] text-gray-400 font-medium shrink-0">HSD: {new Date(v.expiresAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
