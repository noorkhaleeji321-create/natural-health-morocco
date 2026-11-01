import React, { useState, useEffect } from 'react';
import {
  Search,
  Package,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  User,
  Banknote,
  Building2,
  Calendar,
  MessageCircle,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Order, OrderStatus } from '../types';

interface OrderTrackingPageProps {
  initialOrderId?: string;
  initialPhone?: string;
  onNavigateToProducts: () => void;
  onNavigateToHome: () => void;
}

const statusConfig: Record<
  OrderStatus,
  { label: string; step: number; color: string; bg: string; border: string; desc: string }
> = {
  new: {
    label: 'جديد',
    step: 1,
    color: 'text-[#F59E0B]',
    bg: 'bg-[#F59E0B]/10',
    border: 'border-[#F59E0B]/30',
    desc: 'تم تسجيل طلبك بنجاح وهو بانتظار المراجعة والبدء في التجهيز.',
  },
  pending: {
    label: 'قيد الانتظار',
    step: 1,
    color: 'text-[#F59E0B]',
    bg: 'bg-[#F59E0B]/10',
    border: 'border-[#F59E0B]/30',
    desc: 'طلبك قيد المراجعة بانتظار التأكيد من التجار.',
  },
  confirmed: {
    label: 'مؤكد',
    step: 1,
    color: 'text-[#10B981]',
    bg: 'bg-[#10B981]/10',
    border: 'border-[#10B981]/30',
    desc: 'تم تأكيد طلبك بنجاح وجاري تحويله لورشة التجهيز.',
  },
  processing: {
    label: 'قيد التجهيز',
    step: 2,
    color: 'text-[#3B82F6]',
    bg: 'bg-[#3B82F6]/10',
    border: 'border-[#3B82F6]/30',
    desc: 'فريق العطارة يقوم الآن بوزن وتعبئة وتغليف منتجاتك الطبيعية بعناية.',
  },
  ready_for_shipping: {
    label: 'جاهز للشحن',
    step: 2,
    color: 'text-[#8B5CF6]',
    bg: 'bg-[#8B5CF6]/10',
    border: 'border-[#8B5CF6]/30',
    desc: 'تم تجهيز الطرد وتغليفه بالكامل وهو بانتظار استلام المندوب.',
  },
  shipped: {
    label: 'تم الشحن',
    step: 3,
    color: 'text-[#8B5CF6]',
    bg: 'bg-[#8B5CF6]/10',
    border: 'border-[#8B5CF6]/30',
    desc: 'تم تسليم الشحنة لمندوب التوصيل وهي الآن في طريقها إلى عنوانك.',
  },
  delivered: {
    label: 'تم التسليم',
    step: 4,
    color: 'text-[#10B981]',
    bg: 'bg-[#10B981]/10',
    border: 'border-[#10B981]/30',
    desc: 'تم تسليم الطلب للزبون بنجاح. نتمنى لك دوام الصحة والعافية!',
  },
  cancelled: {
    label: 'ملغي',
    step: 0,
    color: 'text-[#EF4444]',
    bg: 'bg-[#EF4444]/10',
    border: 'border-[#EF4444]/30',
    desc: 'تم إلغاء هذا الطلب. يمكنك التواصل معنا للاستفسار أو تقديم طلب جديد.',
  },
  returned: {
    label: 'مرتجع',
    step: 0,
    color: 'text-[#F97316]',
    bg: 'bg-[#F97316]/10',
    border: 'border-[#F97316]/30',
    desc: 'تم إرجاع الشحنة إلى المتجر.',
  },
};

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({
  initialOrderId = '',
  initialPhone = '',
  onNavigateToProducts,
  onNavigateToHome,
}) => {
  const { orders, findOrderByTracking, storeSettings } = useStore();

  const [orderIdInput, setOrderIdInput] = useState(initialOrderId);
  const [phoneInput, setPhoneInput] = useState(initialPhone);
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Auto search if initial props provided
  useEffect(() => {
    if (initialOrderId && initialPhone) {
      handleSearch(undefined, initialOrderId, initialPhone);
    }
  }, [initialOrderId, initialPhone]);

  const handleSearch = (
    e?: React.FormEvent,
    orderIdToSearch = orderIdInput,
    phoneToSearch = phoneInput
  ) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setHasSearched(true);

    if (!orderIdToSearch.trim()) {
      setErrorMessage('يرجى إدخال رقم الطلب (مثال: SAID-982143 أو 982143)');
      return;
    }

    if (!phoneToSearch.trim()) {
      setErrorMessage('يرجى إدخال رقم الهاتف المسجل في الطلب');
      return;
    }

    const found = findOrderByTracking(orderIdToSearch, phoneToSearch);
    if (found) {
      setSearchedOrder(found);
      setErrorMessage('');
    } else {
      setSearchedOrder(null);
      setErrorMessage(
        'لم يتم العثور على طلب يطابق هذا الرقم وهذا الهاتف. يرجى التأكد من صحة البيانات أو مراجعة رقم الطلب المستلم.'
      );
    }
  };

  const getWhatsAppChatUrl = (order: Order) => {
    const text = `السلام عليكم ورحمة الله، أود الاستفسار عن حالة طلبي رقم *#${order.id}* باسم *${encodeURIComponent(
      order.customer.fullName
    )}*.`;
    const cleanPhone = storeSettings.whatsapp.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 bg-[#17251E] text-[#F3BA63] text-xs sm:text-sm font-bold px-3.5 py-1.5 rounded-full mb-3 border border-[#D97706]/30 shadow-xs">
          <Truck className="w-4 h-4 text-[#D97706]" />
          <span>تتبع الشحنات المباشر</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-[#FAF5EC] font-['Cairo'] tracking-tight mb-2 sm:mb-3">
          تتبع حالة طلبك في {storeSettings.storeName}
        </h1>
        <p className="text-xs sm:text-base text-[#A89C89] leading-relaxed">
          أدخل رقم الطلب الخاص بك ورقم الهاتف لتتبع خطوة بخطوة مراحل التجهيز والشحن والتسليم.
        </p>
      </div>

      {/* Search Box */}
      <div className="bg-[#101713] border border-[#213027] rounded-3xl p-5 sm:p-8 shadow-2xl mb-10">
        <form onSubmit={(e) => handleSearch(e)} className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-5">
            <label className="block text-xs font-bold text-[#E5DCce] mb-1.5">
              رقم الطلب (Order ID) <span className="text-[#D97706]">*</span>
            </label>
            <input
              type="text"
              dir="ltr"
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              placeholder="مثال: SAID-982143"
              className="w-full bg-[#151F19] border border-[#26372D] rounded-xl px-4 py-3 text-sm text-[#FAF5EC] placeholder-[#6E6455] focus:outline-hidden focus:border-[#D97706] font-mono text-right"
            />
          </div>

          <div className="sm:col-span-5">
            <label className="block text-xs font-bold text-[#E5DCce] mb-1.5">
              رقم الهاتف المسجل <span className="text-[#D97706]">*</span>
            </label>
            <input
              type="tel"
              dir="ltr"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="0612345678"
              className="w-full bg-[#151F19] border border-[#26372D] rounded-xl px-4 py-3 text-sm text-[#FAF5EC] placeholder-[#6E6455] focus:outline-hidden focus:border-[#D97706] font-mono text-right"
            />
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              className="w-full h-11 sm:h-11.5 bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-102 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>بحث</span>
            </button>
          </div>
        </form>

        {/* Quick Sample Order Pills for immediate test convenience */}
        <div className="mt-4 pt-4 border-t border-[#1C2822] flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[#8A9B90]">طلبات مسجلة للتجربة السريعة:</span>
          {orders.slice(0, 8).map((demo) => (
            <button
              key={demo.id}
              type="button"
              onClick={() => {
                setOrderIdInput(demo.id);
                setPhoneInput(demo.customer.phone);
                handleSearch(undefined, demo.id, demo.customer.phone);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#16221B] hover:bg-[#203127] text-[#F3BA63] border border-[#293B30] transition-colors font-mono cursor-pointer"
            >
              #{demo.id} ({statusConfig[demo.status]?.label || 'مسجل'})
            </button>
          ))}
        </div>

        {errorMessage && (
          <div className="mt-4 p-4 rounded-xl bg-[#2A1515] border border-[#EF4444]/40 text-[#FCA5A5] text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-[#EF4444] mt-0.5" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}
      </div>

      {/* Result Display */}
      {searchedOrder && (
        <div className="space-y-6">
          {/* Status Tracker Card */}
          <div className="bg-[#101713] border border-[#213027] rounded-3xl p-6 sm:p-8 shadow-2xl">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#213027]">
              <div>
                <span className="text-xs text-[#8A9B90] block mb-1">تفاصيل تتبع الطلب:</span>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl sm:text-2xl font-black text-[#FAF5EC] font-mono tracking-wider">
                    #{searchedOrder.id}
                  </h2>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      statusConfig[searchedOrder.status].bg
                    } ${statusConfig[searchedOrder.status].color} ${
                      statusConfig[searchedOrder.status].border
                    }`}
                  >
                    {statusConfig[searchedOrder.status].label}
                  </span>
                </div>
              </div>

              <div className="text-xs sm:text-sm text-[#A89C89] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#D97706]" />
                <span>
                  تاريخ الطلب:{' '}
                  <strong className="text-white font-mono">
                    {new Date(searchedOrder.createdAt).toLocaleDateString('ar-MA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </strong>
                </span>
              </div>
            </div>

            {/* Stepper Timeline (if not cancelled) */}
            {searchedOrder.status !== 'cancelled' ? (
              <div className="py-8 sm:py-12">
                <div className="relative">
                  {/* Progress Line */}
                  <div className="hidden sm:block absolute top-1/2 left-8 right-8 -translate-y-1/2 h-1 bg-[#1A2620] rounded-full z-0">
                    <div
                      className="bg-[#D97706] h-full transition-all duration-700 rounded-full"
                      style={{
                        width:
                          searchedOrder.status === 'new'
                            ? '15%'
                            : searchedOrder.status === 'processing'
                            ? '48%'
                            : searchedOrder.status === 'shipped'
                            ? '80%'
                            : '100%',
                      }}
                    />
                  </div>

                  {/* Steps Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative z-10">
                    {[
                      { key: 'new', label: '1. جديد', icon: Clock, num: 1 },
                      { key: 'processing', label: '2. قيد التجهيز', icon: Package, num: 2 },
                      { key: 'shipped', label: '3. تم الشحن', icon: Truck, num: 3 },
                      { key: 'delivered', label: '4. تم التسليم', icon: CheckCircle2, num: 4 },
                    ].map((step) => {
                      const currentStepNum = statusConfig[searchedOrder.status].step;
                      const isCompleted = step.num <= currentStepNum;
                      const isCurrent = step.num === currentStepNum;
                      const IconComponent = step.icon;

                      return (
                        <div
                          key={step.key}
                          className={`flex sm:flex-col items-center sm:items-center gap-3 sm:gap-2 p-3 sm:p-2 rounded-2xl sm:rounded-none ${
                            isCurrent
                              ? 'bg-[#18261F] sm:bg-transparent border sm:border-0 border-[#D97706]/40'
                              : ''
                          }`}
                        >
                          <div
                            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
                              isCurrent
                                ? 'bg-[#D97706] text-white ring-4 ring-[#D97706]/30 shadow-lg'
                                : isCompleted
                                ? 'bg-[#10B981] text-white shadow-md'
                                : 'bg-[#17221C] text-[#55695C] border border-[#23332A]'
                            }`}
                          >
                            <IconComponent className="w-5 h-5" />
                          </div>

                          <div className="text-right sm:text-center">
                            <span
                              className={`text-xs sm:text-sm font-bold block ${
                                isCurrent
                                  ? 'text-[#F59E0B]'
                                  : isCompleted
                                  ? 'text-[#FAF5EC]'
                                  : 'text-[#62756A]'
                              }`}
                            >
                              {step.label}
                            </span>
                            <span className="text-[10px] sm:text-xs text-[#8A9B90] block">
                              {step.key === 'new'
                                ? 'تسجيل الطلب'
                                : step.key === 'processing'
                                ? 'تعبئة العطارة'
                                : step.key === 'shipped'
                                ? 'مع مندوب الشحن'
                                : 'وصل للزبون'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Current Status Message Box */}
                <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-[#141F19] border border-[#26372D] flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1E2E25] text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#FAF5EC] mb-1">
                      حالة الطلب الحالية: {statusConfig[searchedOrder.status].label}
                    </h4>
                    <p className="text-xs sm:text-sm text-[#A89C89] leading-relaxed">
                      {statusConfig[searchedOrder.status].desc}
                    </p>
                    {searchedOrder.statusNote && (
                      <div className="mt-2 text-xs text-[#F3BA63] bg-[#101713] p-2.5 rounded-lg border border-[#293B30]">
                        <strong>ملاحظة من المتجر:</strong> {searchedOrder.statusNote}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Cancelled Order Notice */
              <div className="my-6 p-6 rounded-2xl bg-[#271515] border border-[#EF4444]/40 flex items-start gap-4">
                <XCircle className="w-8 h-8 text-[#EF4444] shrink-0" />
                <div>
                  <h3 className="text-base font-bold text-white mb-1">هذا الطلب ملغي</h3>
                  <p className="text-xs sm:text-sm text-[#FCA5A5] leading-relaxed">
                    {searchedOrder.statusNote || statusConfig.cancelled.desc}
                  </p>
                </div>
              </div>
            )}

            {/* Order Details & Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[#213027]">
              {/* Customer & Shipping Details */}
              <div className="bg-[#141D17] border border-[#223127] rounded-2xl p-4 sm:p-5 space-y-3">
                <h3 className="text-xs sm:text-sm font-bold text-[#D97706] flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>معلومات التوصيل والمستلم:</span>
                </h3>
                <div className="space-y-2 text-xs sm:text-sm text-[#C4B7A4]">
                  <div className="flex justify-between">
                    <span className="text-[#8A9B90]">الاسم:</span>
                    <strong className="text-white">{searchedOrder.customer.fullName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A9B90]">الهاتف:</span>
                    <strong className="text-white font-mono" dir="ltr">
                      {searchedOrder.customer.phone}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A9B90]">المدينة:</span>
                    <span className="text-white">{searchedOrder.customer.city}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A9B90]">العنوان:</span>
                    <span className="text-white text-right max-w-[240px]">
                      {searchedOrder.customer.address}
                    </span>
                  </div>
                  {searchedOrder.customer.notes && (
                    <div className="flex justify-between pt-2 border-t border-[#213027]">
                      <span className="text-[#8A9B90]">ملاحظات:</span>
                      <span className="text-[#E5DCce] text-right max-w-[240px]">
                        {searchedOrder.customer.notes}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-[#141D17] border border-[#223127] rounded-2xl p-4 sm:p-5 space-y-3">
                <h3 className="text-xs sm:text-sm font-bold text-[#D97706] flex items-center gap-2">
                  <Banknote className="w-4 h-4" />
                  <span>معلومات الدفع والمبالغ:</span>
                </h3>
                <div className="space-y-2 text-xs sm:text-sm text-[#C4B7A4]">
                  <div className="flex justify-between">
                    <span className="text-[#8A9B90]">طريقة الدفع:</span>
                    <strong className="text-[#F3BA63]">
                      {searchedOrder.paymentMethod === 'cod'
                        ? 'الدفع عند الاستلام (COD)'
                        : 'التحويل البنكي (Virement)'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A9B90]">المجموع الفرعي:</span>
                    <span className="font-mono text-white">{searchedOrder.subtotal} DH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A9B90]">مصاريف الشحن والتوصيل:</span>
                    <span className="font-mono text-white">
                      {searchedOrder.shipping === 0 ? 'مجاني 🚚' : `${searchedOrder.shipping} DH`}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#213027] text-sm sm:text-base font-bold">
                    <span className="text-white">المجموع الإجمالي:</span>
                    <span className="font-mono text-[#F59E0B] text-lg">
                      {searchedOrder.total} DH
                    </span>
                  </div>
                </div>

                {searchedOrder.paymentMethod === 'bank_transfer' && (
                  <div className="mt-3 p-3 rounded-xl bg-[#0F1612] border border-[#D97706]/30 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-[#F59E0B] font-bold">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>بيانات الحساب البنكي لتحويل الطلب:</span>
                    </div>
                    <p className="text-[#A89C89]">
                      RIB: <span className="font-mono text-white" dir="ltr">{searchedOrder.bankDetailsSnapshot?.rib || storeSettings.storeName}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Items List */}
            <div className="mt-6 pt-6 border-t border-[#213027]">
              <h3 className="text-xs sm:text-sm font-bold text-[#D97706] mb-3 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                <span>محتويات الطرد ({searchedOrder.items.length} منتج):</span>
              </h3>
              <div className="divide-y divide-[#1D2B22] bg-[#141D17] rounded-2xl overflow-hidden border border-[#213027]">
                {searchedOrder.items.map((item, idx) => {
                  const matched = orders.flatMap(o => o.items).find(i => i.product?.id === item.product?.id)?.product;
                  const isDefaultLogo = (img?: string) => !img || img.includes('WhatsApp_Image_2026-10-28_at_19.35.25_6c594579.jpeg');
                  const candidateImg = item.product?.image || (item as any).image || (item as any).productImageSnapshot;
                  const displayImg = (!isDefaultLogo(candidateImg) ? candidateImg : undefined) || matched?.image || candidateImg || '/assets/aistudio/WhatsApp_Image_2026-10-28_at_19.35.25_6c594579.jpeg';

                  return (
                    <div
                      key={`${item.product?.id || idx}-${idx}`}
                      className="p-3 sm:p-4 flex items-center justify-between gap-3 text-xs sm:text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={displayImg}
                          alt={item.product?.name || 'منتج'}
                          className="w-12 h-12 rounded-xl object-cover border border-[#25362C]"
                        />
                        <div>
                          <h4 className="font-bold text-white font-['Cairo']">{item.product?.name || 'منتج طبيعي'}</h4>
                          <span className="text-[11px] text-[#A89C89]">
                            {item.quantity} × {item.product?.price || 0} DH ({item.product?.unit || ''})
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-[#F59E0B]">
                        {item.quantity * (item.product?.price || 0)} DH
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="mt-8 pt-6 border-t border-[#213027] flex flex-col sm:flex-row items-center justify-between gap-3">
              <a
                href={getWhatsAppChatUrl(searchedOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-black font-black text-xs sm:text-sm px-6 py-3 rounded-xl shadow-lg transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>تواصل معنا بخصوص هذا الطلب عبر واتساب</span>
              </a>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onNavigateToProducts}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-[#17231C] hover:bg-[#213227] text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-xl border border-[#293B30] transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>تصفح المنتجات</span>
                </button>
                <button
                  type="button"
                  onClick={onNavigateToHome}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-[#121A15] hover:bg-[#18231D] text-[#A89C89] hover:text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-xl border border-[#1E2B22] transition-colors"
                >
                  <span>الرئيسية</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
