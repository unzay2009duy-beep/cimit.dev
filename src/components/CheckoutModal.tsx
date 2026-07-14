import React, { useState, useEffect } from "react";
import { X, Trash2, ShoppingCart, Tag, CreditCard, ChevronRight, CheckCircle2, ShieldAlert } from "lucide-react";
import { api, getCurrentUser } from "../lib/api";
import { CartItem, Voucher, Order } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { getProductImage } from "../lib/imageHelper";

interface CheckoutModalProps {
  isOpen: boolean;
  cartItems: CartItem[];
  onClose: () => void;
  onClearCart: () => void;
  onUpdateQty: (productId: string, newQty: number) => void;
  onRemoveItem: (productId: string) => void;
  onSuccess: (order: Order) => void;
}

export function CheckoutModal({
  isOpen,
  cartItems,
  onClose,
  onClearCart,
  onUpdateQty,
  onRemoveItem,
  onSuccess,
}: CheckoutModalProps) {
  const [customerName, setCustomerName] = useState("Khách Hàng Free Fire");
  const [customerEmail, setCustomerEmail] = useState("khachhang@cimit.dev");
  const [customerPhone, setCustomerPhone] = useState("0900000000");
  const [customerAddress, setCustomerAddress] = useState("Nhận Key Free Fire Tự Động Trực Tuyến");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "BANK_TRANSFER" | "E_WALLET">("BANK_TRANSFER");
  
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discount: number; discountPercentage: number } | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [voucherSuccess, setVoucherSuccess] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill logged user credentials
  useEffect(() => {
    if (isOpen) {
      const user = getCurrentUser();
      if (user) {
        setCustomerName(user.name || "Khách Hàng Free Fire");
        setCustomerEmail(user.email || "khachhang@cimit.dev");
      } else {
        setCustomerName("Khách Hàng Free Fire");
        setCustomerEmail("khachhang@cimit.dev");
      }
      setCustomerPhone("0900000000");
      setCustomerAddress("Nhận Key Free Fire Tự Động Trực Tuyến");
      setVoucherCode("");
      setAppliedVoucher(null);
      setVoucherError(null);
      setVoucherSuccess(null);
      setError(null);
    }
  }, [isOpen]);

  // Calculate cart subtotal
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
  const discount = appliedVoucher ? appliedVoucher.discount : 0;
  const total = Math.max(0, subtotal - discount);

  // Recalculate voucher value if subtotal changes
  useEffect(() => {
    if (appliedVoucher) {
      const recalculateDiscount = async () => {
        try {
          const res = await api.applyVoucher(appliedVoucher.code, subtotal);
          if (res.success) {
            setAppliedVoucher({
              code: res.code,
              discount: res.discount,
              discountPercentage: res.discountPercentage,
            });
          }
        } catch {
          setAppliedVoucher(null);
          setVoucherSuccess(null);
          setVoucherError("Đơn hàng không còn đủ giá trị tối thiểu để áp dụng Voucher");
        }
      };
      recalculateDiscount();
    }
  }, [subtotal]);

  const handleApplyVoucher = async () => {
    setVoucherError(null);
    setVoucherSuccess(null);
    if (!voucherCode.trim()) return;

    try {
      const res = await api.applyVoucher(voucherCode.trim(), subtotal);
      if (res.success) {
        setAppliedVoucher({
          code: res.code,
          discount: res.discount,
          discountPercentage: res.discountPercentage,
        });
        setVoucherSuccess(`Áp dụng mã thành công! Giảm -${res.discount.toLocaleString()}đ (${res.discountPercentage}%)`);
      }
    } catch (err: any) {
      setVoucherError(err.message || "Mã giảm giá không chính xác");
      setAppliedVoucher(null);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (cartItems.length === 0) {
      setError("Giỏ hàng của bạn đang trống");
      setLoading(false);
      return;
    }

    const payload = {
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      items: cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      voucherCode: appliedVoucher?.code || undefined,
      paymentMethod,
    };

    try {
      const order = await api.checkout(payload);
      onClearCart();
      onSuccess(order);
      onClose();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi thanh toán");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 15 }}
        className="w-full max-w-5xl h-[90vh] md:h-[80vh] bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row font-sans text-gray-800 dark:text-gray-100"
      >
        {/* Cart items overview side (Left) */}
        <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto border-b md:border-b-0 md:border-r border-gray-100 dark:border-slate-800 flex flex-col gap-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
            <h3 className="font-bold text-base flex items-center gap-2 text-gray-900 dark:text-white uppercase tracking-wider">
              <CreditCard size={18} className="text-orange-500" />
              Thông Tin Thanh Toán
            </h3>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 space-y-3 max-h-[300px] md:max-h-none overflow-y-auto pr-1">
            {cartItems.length === 0 ? (
              <div className="text-center py-10">
                <CreditCard size={40} className="mx-auto text-gray-300 dark:text-slate-700 mb-2" />
                <p className="text-xs text-gray-400">Chưa có sản phẩm nào được chọn.</p>
                <p className="text-[10px] text-gray-400/80 mt-1">Quay lại cửa hàng và click Mua Ngay sản phẩm mong muốn nhé!</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.productId}
                  className="p-3 bg-gray-50/50 dark:bg-slate-950/20 rounded-2xl border border-gray-100 dark:border-slate-800 flex gap-3 items-center"
                >
                  <img
                    referrerPolicy="no-referrer"
                    src={getProductImage(item.product?.image, item.product?.categoryId)}
                    alt={item.product?.name}
                    className="w-14 h-14 object-cover rounded-xl"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs text-gray-900 dark:text-white truncate">
                      {item.product?.name}
                    </h4>
                    <p className="text-xs font-bold text-orange-500 dark:text-orange-400 mt-1">
                      {item.product?.price.toLocaleString()}đ
                    </p>
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-gray-150 dark:border-slate-700 px-2 py-1 rounded-lg">
                    <button
                      id={`dec-qty-${item.productId}`}
                      onClick={() => onUpdateQty(item.productId, item.quantity - 1)}
                      className="text-xs font-bold px-1 hover:text-orange-500 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-xs font-semibold px-1 min-w-[14px] text-center">{item.quantity}</span>
                    <button
                      id={`inc-qty-${item.productId}`}
                      onClick={() => onUpdateQty(item.productId, item.quantity + 1)}
                      className="text-xs font-bold px-1 hover:text-orange-500 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Totals Summary */}
          <div className="bg-gray-50/80 dark:bg-slate-950/30 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-2 mt-auto">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Giá tạm tính:</span>
              <span className="font-medium text-gray-900 dark:text-white">{subtotal.toLocaleString()}đ</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-slate-800">
              <span>Tổng thanh toán:</span>
              <span className="text-orange-500 dark:text-orange-400">{total.toLocaleString()}đ</span>
            </div>
          </div>
        </div>

        {/* Checkout shipping details and Voucher Code (Right) */}
        <form onSubmit={handleSubmitOrder} className="w-full md:w-1/2 p-6 md:p-8 flex flex-col gap-4 overflow-y-auto relative bg-white dark:bg-slate-900">
          <button
            id="close-checkout-modal-btn"
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X size={18} />
          </button>

          <h3 className="font-bold text-base pb-2 border-b border-gray-100 dark:border-slate-800 text-gray-900 dark:text-white uppercase tracking-wider text-orange-500">
            Thông Tin Giao Hàng & Thanh Toán
          </h3>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4 flex-1">
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 space-y-2 text-xs">
              <p className="font-black text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                🔥 KÍCH HOẠT SẢN PHẨM TỰ ĐỘNG
              </p>
              <p className="text-gray-300 leading-relaxed font-medium">
                Đây là sản phẩm kỹ thuật số (Key Hack / Bypass Free Fire). Sau khi hoàn tất đặt hàng và thanh toán, hệ thống sẽ tự động kích hoạt và hiển thị Key bản quyền trực tiếp tại lịch sử đơn hàng của bạn.
              </p>
              <div className="pt-1 flex flex-col gap-1 text-[10px] text-gray-400">
                <span className="flex items-center gap-1">✅ Kích hoạt tức thì 24/7</span>
                <span className="flex items-center gap-1">✅ Không cần thông tin vận chuyển vật lý</span>
                <span className="flex items-center gap-1">✅ Key sạch 100% không virus, Bypass Anticheat</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Hình Thức Thanh Toán</label>
              <div className="p-3 rounded-2xl border border-orange-500 bg-orange-500/10 text-orange-500 flex items-center gap-2.5 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                <CreditCard size={16} className="shrink-0" />
                <div className="flex-1">
                  <span className="text-[11px] font-black uppercase tracking-wider block">Chuyển Khoản Ngân Hàng</span>
                  <span className="text-[9px] text-gray-400 block font-medium mt-0.5">Quét mã QR hoặc chuyển khoản để nhận Key tự động ngay sau khi thanh toán.</span>
                </div>
              </div>
            </div>
          </div>

          <button
            id="submit-order-btn"
            type="submit"
            disabled={loading || cartItems.length === 0}
            className="w-full py-3.5 bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 hover:from-orange-600 hover:via-amber-600 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-500 disabled:text-gray-300 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg cursor-pointer transition-all hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] flex items-center justify-center gap-1.5"
          >
            <span>{loading ? "Đang xử lý đặt hàng..." : "Hoàn Tất Đặt Hàng"}</span>
            <ChevronRight size={14} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
