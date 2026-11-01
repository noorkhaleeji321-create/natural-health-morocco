import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Plus, Minus, ShoppingBag, Truck, ArrowLeft, ShieldCheck, CheckCircle, Phone, User, MapPin, Store as StoreIcon, Package } from 'lucide-react';
import { CartItem, Order, SellerOrder } from '../types';
import { useStore } from '../context/StoreContext';
import { api } from '../lib/api';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onOpenFullCartPage?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenFullCartPage,
}) => {
  const { storeSettings, createOrder, currentUser, stores, sellers, addOrderToLocal, refreshData } = useStore();
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [city, setCity] = useState(currentUser?.city || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'transfer'>('cod');
  const [orderNumber, setOrderNumber] = useState('');
  const [childOrders, setChildOrders] = useState<SellerOrder[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group items by seller/store
  const sellerGroups = useMemo(() => {
    const groups: Record<string, {
      sellerId: string;
      storeName: string;
      storeCity: string;
      items: CartItem[];
      subtotal: number;
    }> = {};

    items.forEach((item) => {
      const sId = item.product.sellerId || 'seller-saeed';
      const store = stores.find((st) => st.id === item.product.storeId || st.sellerId === sId);
      const seller = sellers.find((s) => s.id === sId);
      const storeName = store?.name || seller?.storeName || seller?.businessName || 'محل عند سعيد (المتجر الرئيسي)';
      const storeCity = store?.city || seller?.city || 'مراكش';

      if (!groups[sId]) {
        groups[sId] = {
          sellerId: sId,
          storeName,
          storeCity,
          items: [],
          subtotal: 0,
        };
      }
      groups[sId].items.push(item);
      groups[sId].subtotal += item.product.price * item.quantity;
    });

    return Object.values(groups);
  }, [items, stores, sellers]);

  const hasMultipleVendors = sellerGroups.length > 1;

  const subtotal = items.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );
  const freeShippingThreshold = storeSettings.freeShippingThreshold || 250;
  const isFreeShipping = subtotal >= freeShippingThreshold;
  const shippingCost = items.length === 0 ? 0 : isFreeShipping ? 0 : (storeSettings.shippingFee || 35);
  const total = subtotal + shippingCost;

  const handleStartCheckout = () => {
    setStep('checkout');
  };

  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !city.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.checkoutOrder({
        customerId: currentUser?.id,
        customer: {
          fullName,
          phone,
          city,
          address,
        },
        paymentMethod: paymentMethod === 'cod' ? 'cod' : 'bank_transfer',
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity, selectedWeight: i.selectedWeight })),
      });

      if (res.success && res.order) {
        setOrderNumber(res.order.id);
        setConfirmedOrder(res.order);
        setChildOrders(res.sellerOrders || []);
        addOrderToLocal(res.order);
        refreshData().catch(console.warn);
        setStep('success');
        return;
      }
    } catch (err) {
      console.warn('Backend checkout fallback:', err);
    } finally {
      setIsSubmitting(false);
    }

    // Fallback to local createOrder
    const newOrder = await createOrder({
      customer: { fullName, phone, city, address, email: currentUser?.email },
      items: items.map((i) => ({ product: i.product, quantity: i.quantity })),
      total,
      subtotal,
      shipping: shippingCost,
      paymentMethod: paymentMethod === 'cod' ? 'cod' : 'bank_transfer',
      status: 'new',
    });
    setOrderNumber(newOrder.id);
    setConfirmedOrder(newOrder);
    setIsSubmitting(false);
    setStep('success');
  };

  const handleFinishAndReset = () => {
    onClearCart();
    setStep('cart');
    setFullName('');
    setPhone('');
    setCity('');
    setAddress('');
    onClose();
  };

  const getWhatsAppOrderText = () => {
    const finalTotal = confirmedOrder?.total ?? total;
    const finalSubtotal = confirmedOrder?.subtotal ?? subtotal;
    const finalShipping = confirmedOrder?.shipping ?? shippingCost;
    const orderIdToUse = confirmedOrder?.id || orderNumber;

    const itemsList = (confirmedOrder?.items || items)
      .map((i: any) => {
        const pName = i.product?.name || i.productName || 'منتج طبيعي';
        const pQty = i.quantity || 1;
        const pPrice = i.unitPrice || i.product?.price || 0;
        return `• ${pName} (${pQty} × ${pPrice} د.م)`;
      })
      .join('\n');

    return `السلام عليكم ورحمة الله،\nأود تأكيد طلبي من عِطارة عند سعيد.\n\nرقم الطلب: #${orderIdToUse}\nالاسم: ${fullName}\nالهاتف: ${phone}\nالمدينة والعنوان: ${city} - ${address}\nطريقة الدفع: ${paymentMethod === 'cod' ? 'الدفع نقداً عند الاستلام' : 'تحويل بنكي'}\n\nالمنتجات المطلوبة:\n${itemsList}\n\nمجموع المنتجات: ${finalSubtotal} د.م\nمصاريف التوصيل: ${finalShipping === 0 ? 'مجاني 🚚' : `${finalShipping} د.م`}\nالمجموع الإجمالي الواجب أداؤه: ${finalTotal} درهم مغربي.`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
          />

          {/* Drawer content */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-md bg-[#0D1310] h-full shadow-2xl flex flex-col z-10 overflow-hidden border-l border-[#223128] text-[#FAF5EC]"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#212E27] bg-[#121A16] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1A2E24] text-[#F3BA63] flex items-center justify-center border border-[#D97706]/40">
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-[#FAF5EC] font-['Cairo']">
                    {step === 'cart' && 'سلة المشتريات'}
                    {step === 'checkout' && 'إتمام الطلب (الدفع عند الاستلام)'}
                    {step === 'success' && 'تم استلام طلبك بنجاح!'}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#A89C89]">
                    {step === 'cart' && `${items.length} ${items.length === 1 ? 'منتج' : 'منتجات'} مختارة`}
                    {step === 'checkout' && 'املأ معلومات التوصيل البسيطة'}
                    {step === 'success' && 'محل عند سعيد في خدمتكم'}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1A2520] hover:bg-[#25372E] text-[#FAF5EC] flex items-center justify-center transition-colors border border-[#2A3C32]"
                aria-label="إغلاق السلة"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* STEP 1: CART ITEMS */}
            {step === 'cart' && (
              <>
                {/* Free Shipping Progress Indicator */}
                <div className="bg-[#1A1408] p-2.5 sm:p-3 text-[11px] sm:text-xs text-[#F3BA63] border-b border-[#D97706]/30 shrink-0">
                  {isFreeShipping ? (
                    <div className="flex items-center gap-1.5 font-bold text-[#4ADE80]">
                      <Truck className="w-4 h-4 shrink-0" />
                      <span>تهانينا! طلبيتك مؤهلة للتوصيل المجاني 🚚🎉</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span>أضف بـ <strong className="text-white">{freeShippingThreshold - subtotal} د.م</strong> لتوصيل مجاني!</span>
                      </div>
                      <div className="w-full bg-[#2E200A] h-1.5 rounded-full overflow-hidden border border-[#D97706]/20">
                        <div
                          className="bg-[#D97706] h-full transition-all duration-300 rounded-full"
                          style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Item List */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                  {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#151F1A] border border-[#23332A] flex items-center justify-center text-[#7E7160]">
                        <ShoppingBag className="w-7 h-7 sm:w-8 sm:h-8" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-base text-[#FAF5EC]">سلتك فارغة حالياً</h4>
                        <p className="text-xs text-[#A89C89] max-w-xs">
                          تصفح تشكيلة العطارة، العسل الحر، التوابل، والزيوت الطبيعية وأضف ما يناسبك!
                        </p>
                      </div>
                      <button
                        onClick={onClose}
                        className="mt-2 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-colors shadow-md"
                      >
                        تصفح المنتجات الآن
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex gap-2.5 sm:gap-3 bg-[#121A16] p-2.5 sm:p-3 rounded-xl border border-[#212E27] shadow-xs"
                        >
                          {/* Thumbnail */}
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-16 h-16 sm:w-18 sm:h-18 rounded-lg object-cover bg-[#0A0F0D] shrink-0 border border-white/5"
                          />

                          {/* Info */}
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-1.5">
                                <h4 className="text-xs sm:text-sm font-bold text-[#FAF5EC] line-clamp-1">
                                  {item.product.name}
                                </h4>
                                <button
                                  onClick={() => onRemoveItem(item.product.id)}
                                  className="text-[#8C7D6C] hover:text-[#EF4444] transition-colors p-1"
                                  aria-label="حذف المنتج"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <span className="text-[10px] sm:text-[11px] text-[#A89C89]">الوحدة: {item.product.unit}</span>
                            </div>

                            <div className="flex items-center justify-between pt-1.5">
                              {/* Quantity Counter */}
                              <div className="flex items-center gap-1 border border-[#26372E] rounded-lg bg-[#16221B] px-1 py-0.5">
                                <button
                                  onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                                  className="w-5 h-5 flex items-center justify-center text-xs font-bold text-[#FAF5EC] hover:bg-[#25362E] rounded-md transition-colors"
                                  aria-label="تقليل الكمية"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-bold w-5 text-center text-white">{item.quantity}</span>
                                <button
                                  onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                                  className="w-5 h-5 flex items-center justify-center text-xs font-bold text-[#FAF5EC] hover:bg-[#25362E] rounded-md transition-colors"
                                  aria-label="زيادة الكمية"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Price */}
                              <div className="text-left font-['Cairo']">
                                <span className="font-extrabold text-xs sm:text-base text-[#FAF5EC]">
                                  {item.product.price * item.quantity}
                                </span>
                                <span className="text-[10px] sm:text-[11px] font-bold text-[#F59E0B] mr-1">درهم</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Summary */}
                {items.length > 0 && (
                  <div className="p-3.5 sm:p-4 border-t border-[#212E27] bg-[#121A16] space-y-2.5 sm:space-y-3 shrink-0">
                    <div className="space-y-1 text-xs text-[#C4B8A6]">
                      <div className="flex justify-between">
                        <span>المجموع الفرعي:</span>
                        <span className="font-bold text-[#FAF5EC]">{subtotal} درهم مغربي</span>
                      </div>
                      <div className="flex justify-between">
                        <span>التوصيل (لباب البيت):</span>
                        <span className="font-bold text-[#4ADE80]">
                          {isFreeShipping ? 'مجاني' : `${shippingCost} درهم`}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-[#202D25] text-sm sm:text-base font-black text-[#FAF5EC] font-['Cairo']">
                        <span>المجموع الإجمالي:</span>
                        <span className="text-[#F59E0B] text-base sm:text-lg font-black">{total} درهم</span>
                      </div>
                    </div>

                    {onOpenFullCartPage && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenFullCartPage();
                        }}
                        className="w-full bg-[#18261F] hover:bg-[#23352B] text-[#F3BA63] font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 border border-[#D97706]/40 transition-colors"
                      >
                        <ShoppingBag className="w-4 h-4 text-[#D97706]" />
                        <span>فتح صفحة السلة وإتمام الطلب كاملة</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (onOpenFullCartPage) {
                          onClose();
                          onOpenFullCartPage();
                        } else {
                          handleStartCheckout();
                        }
                      }}
                      className="w-full bg-[#D97706] hover:bg-[#B45309] text-white font-bold py-2.5 sm:py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98"
                    >
                      <span>متابعة الطلب والدفع</span>
                      <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                    </button>

                    <div className="flex items-center justify-between pt-0.5">
                      <button
                        onClick={onClearCart}
                        className="text-[10px] sm:text-[11px] text-[#A89C89] hover:text-[#EF4444] transition-colors"
                      >
                        تفريغ السلة بالكامل
                      </button>
                      <button
                        onClick={onClose}
                        className="text-[10px] sm:text-[11px] text-[#F3BA63] font-bold hover:underline"
                      >
                        مواصلة التسوق
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* STEP 2: CHECKOUT FORM */}
            {step === 'checkout' && (
              <form onSubmit={handleSubmitOrder} className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="bg-[#16221B] p-3 rounded-xl border border-[#26372E] text-xs text-[#E5DCce] space-y-1">
                    <p className="font-bold text-[#F3BA63] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#D97706]" />
                      معلومات التوصيل
                    </p>
                    <p className="text-[#A89C89]">التوصيل لباب بيتك والدفع نقداً عند استلام ومعاينة الطرد.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#E5DCce] mb-1">الاسم الكامل *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="مثال: كريم العلمي"
                        className="w-full bg-[#16201B] border border-[#2B3C32] rounded-xl py-2 pl-3 pr-9 text-xs sm:text-sm text-white focus:outline-hidden focus:border-[#D97706]"
                      />
                      <User className="w-4 h-4 text-[#7A8C82] absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#E5DCce] mb-1">رقم الهاتف (الواتساب) *</label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        dir="ltr"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="06 12 34 56 78"
                        className="w-full bg-[#16201B] border border-[#2B3C32] rounded-xl py-2 pl-3 pr-9 text-xs sm:text-sm text-white focus:outline-hidden focus:border-[#D97706] text-right font-mono"
                      />
                      <Phone className="w-4 h-4 text-[#7A8C82] absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-[#E5DCce] mb-1">المدينة *</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="مثال: الدار البيضاء"
                        className="w-full bg-[#16201B] border border-[#2B3C32] rounded-xl py-2 px-3 text-xs sm:text-sm text-white focus:outline-hidden focus:border-[#D97706]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#E5DCce] mb-1">العنوان أو الحي</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="الحي أو رقم المنزل"
                        className="w-full bg-[#16201B] border border-[#2B3C32] rounded-xl py-2 px-3 text-xs sm:text-sm text-white focus:outline-hidden focus:border-[#D97706]"
                      />
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-xs font-bold text-[#E5DCce] mb-2">طريقة الأداء</label>
                    <div className="space-y-2">
                      <label
                        onClick={() => setPaymentMethod('cod')}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          paymentMethod === 'cod'
                            ? 'bg-[#1D2B22] border-[#D97706] text-white shadow-xs'
                            : 'bg-[#121A16] border-[#223128] text-[#A89C89]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="payment"
                            checked={paymentMethod === 'cod'}
                            onChange={() => setPaymentMethod('cod')}
                            className="text-[#D97706] focus:ring-0"
                          />
                          <span className="text-xs font-bold">الدفع نقداً عند الاستلام (Paiement Cash)</span>
                        </div>
                        <span className="text-[10px] bg-[#D97706] text-white px-2 py-0.5 rounded-full font-bold">
                          المفضل ⭐
                        </span>
                      </label>

                      <label
                        onClick={() => setPaymentMethod('transfer')}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          paymentMethod === 'transfer'
                            ? 'bg-[#1D2B22] border-[#D97706] text-white shadow-xs'
                            : 'bg-[#121A16] border-[#223128] text-[#A89C89]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="payment"
                            checked={paymentMethod === 'transfer'}
                            onChange={() => setPaymentMethod('transfer')}
                            className="text-[#D97706] focus:ring-0"
                          />
                          <span className="text-xs font-bold">التحويل البنكي المباشر (Virement)</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="bg-[#121A16] p-3 rounded-xl border border-[#212E27] text-xs space-y-1">
                    <div className="flex justify-between text-[#A89C89]">
                      <span>عدد المنتجات:</span>
                      <span>{items.reduce((sum, i) => sum + i.quantity, 0)} قطعة</span>
                    </div>
                    <div className="flex justify-between text-[#A89C89]">
                      <span>التوصيل:</span>
                      <span className="text-[#4ADE80] font-bold">{isFreeShipping ? 'مجاني' : `${shippingCost} د.م`}</span>
                    </div>
                    <div className="flex justify-between font-black text-sm text-[#FAF5EC] pt-1 border-t border-[#1C2822]">
                      <span>الإجمالي للأداء:</span>
                      <span className="text-[#F59E0B]">{total} درهم مغربي</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-[#212E27] bg-[#121A16] space-y-2 shrink-0">
                  <button
                    type="submit"
                    className="w-full bg-[#D97706] hover:bg-[#B45309] text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>تأكيد الطلب الآن ({total} د.م)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('cart')}
                    className="w-full py-1.5 text-center text-xs text-[#A89C89] hover:text-white"
                  >
                    ← العودة لتعديل السلة
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: SUCCESS CONFIRMATION */}
            {step === 'success' && (
              <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#162E21] border-2 border-[#22C55E] flex items-center justify-center text-[#22C55E] shadow-xl">
                  <CheckCircle className="w-9 h-9" />
                </div>

                <div className="space-y-1">
                  <h4 className="font-extrabold text-xl text-[#FAF5EC] font-['Cairo']">
                    شكراً لطلبكم من عِطارة عند سعيد!
                  </h4>
                  <p className="text-xs text-[#A89C89] max-w-xs mx-auto">
                    تم تسجيل طلبيتك بنجاح برقم: <strong className="text-[#F59E0B] font-mono">#{confirmedOrder?.id || orderNumber}</strong>. سنتصل بك لتأكيد وقت التوصيل لباب بيتك.
                  </p>
                </div>

                <div className="w-full bg-[#121A16] p-4 rounded-xl border border-[#23342A] text-xs text-right space-y-2 text-[#C4B8A6]">
                  <div className="flex justify-between border-b border-[#1E2E25] pb-1.5">
                    <span>الزبون:</span>
                    <strong className="text-white">{confirmedOrder?.customer?.fullName || fullName}</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#1E2E25] pb-1.5">
                    <span>الهاتف:</span>
                    <strong className="text-white font-mono" dir="ltr">{confirmedOrder?.customer?.phone || phone}</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#1E2E25] pb-1.5">
                    <span>الوجهة:</span>
                    <strong className="text-white">{confirmedOrder?.customer?.city || city} {confirmedOrder?.customer?.address || address ? `(${confirmedOrder?.customer?.address || address})` : ''}</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#1E2E25] pb-1.5">
                    <span>مجموع المنتجات:</span>
                    <strong className="text-white font-mono">{confirmedOrder?.subtotal ?? subtotal} DH</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#1E2E25] pb-1.5">
                    <span>مصاريف التوصيل:</span>
                    <strong className="text-[#34D399] font-mono">{(confirmedOrder?.shipping ?? shippingCost) === 0 ? 'مجاني 🚚' : `${confirmedOrder?.shipping ?? shippingCost} DH`}</strong>
                  </div>
                  <div className="flex justify-between font-bold pt-1 text-sm text-[#FAF5EC]">
                    <span>المجموع الإجمالي الواجب أداؤه:</span>
                    <span className="text-[#F59E0B] font-black">{confirmedOrder?.total ?? total} درهم مغربي</span>
                  </div>
                </div>

                {/* Direct WhatsApp confirmation link */}
                <a
                  href={`https://wa.me/${(storeSettings.whatsapp || '212661234567').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(getWhatsAppOrderText())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>إرسال تفاصيل الطلب عبر الواتساب لتسريع التوصيل 💬</span>
                </a>

                <button
                  onClick={handleFinishAndReset}
                  className="text-xs text-[#F3BA63] font-bold hover:underline pt-2"
                >
                  العودة للصفحة الرئيسية
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
