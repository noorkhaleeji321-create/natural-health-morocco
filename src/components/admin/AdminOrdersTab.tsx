import React, { useState } from 'react';
import {
  Search,
  Package,
  ShoppingBag,
  Eye,
  Trash2,
  Edit,
  Database,
  CheckCircle2,
  RefreshCw,
  Phone,
  MessageCircle,
  AlertCircle,
} from 'lucide-react';
import { Order, Product, OrderStatus } from '../../types';

export interface AdminOrdersTabProps {
  orders: Order[];
  products: Product[];
  onUpdateStatus: (id: string, status: OrderStatus, note?: string) => Promise<any>;
  onDeleteOrder: (id: string) => Promise<any>;
  showNotification: (msg: string, type?: 'success' | 'error') => void;
  onRefreshOrders?: () => Promise<any> | void;
}

export const AdminOrdersTab: React.FC<AdminOrdersTabProps> = ({
  orders,
  products,
  onUpdateStatus,
  onDeleteOrder,
  showNotification,
  onRefreshOrders,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('new');
  const [statusNote, setStatusNote] = useState('');
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [inspectingOrder, setInspectingOrder] = useState<Order | null>(null);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);

  // Helper to reliably resolve accurate product details & high-res image for any order item
  const resolveOrderItem = (it: any) => {
    const prodId =
      it.productId ||
      it.product?.id ||
      (it.id && !it.id.startsWith('item-') && !it.id.startsWith('oi_') ? it.id : undefined);

    const matched = products.find(
      (p) =>
        (prodId && p.id === prodId) ||
        (it.product?.name && p.name === it.product.name) ||
        (it.productNameSnapshot && p.name === it.productNameSnapshot) ||
        (it.productName && p.name === it.productName)
    );

    const name =
      it.product?.name ||
      it.productNameSnapshot ||
      it.productName ||
      matched?.name ||
      'منتج طبيعي';

    const isDefaultLogo = (img?: string) => !img || img.includes('WhatsApp_Image_2026-10-28_at_19.35.25_6c594579.jpeg');

    const candidateImg =
      it.product?.image ||
      it.image ||
      it.productImageSnapshot ||
      it.productImage;

    const image =
      (!isDefaultLogo(candidateImg) ? candidateImg : undefined) ||
      matched?.image ||
      (matched?.images && matched.images[0]) ||
      candidateImg ||
      '/assets/aistudio/WhatsApp_Image_2026-10-28_at_19.35.25_6c594579.jpeg';

    const quantity = Number(it.quantity) || 1;
    const unitPrice = Number(it.unitPrice || it.product?.price || matched?.price || 0);
    const lineTotal = Number(it.lineTotal || unitPrice * quantity);
    const weight = it.selectedWeight || it.unit || it.product?.unit || matched?.unit || '';
    const category = matched?.category || it.product?.category || '';

    return {
      productId: prodId,
      name,
      image,
      quantity,
      unitPrice,
      lineTotal,
      weight,
      category,
    };
  };

  // Payment method counts
  const codCount = orders.filter((o) => o.paymentMethod === 'cod').length;
  const cardCount = orders.filter((o) => o.paymentMethod === 'card' || (o.paymentMethod as any) === 'paddle').length;
  const paypalCount = orders.filter((o) => o.paymentMethod === 'paypal').length;
  const bankCount = orders.filter((o) => o.paymentMethod === 'bank_transfer' || (o.paymentMethod as any) === 'rib').length;

  // Status counts
  const newOrPendingCount = orders.filter((o) => o.status === 'new' || o.status === 'pending').length;
  const processingCount = orders.filter((o) => o.status === 'processing').length;
  const shippedCount = orders.filter((o) => o.status === 'shipped').length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;

  const filteredOrders = orders.filter((o) => {
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'new' && (o.status === 'new' || o.status === 'pending')) ||
      o.status === statusFilter;

    const matchPayment =
      paymentFilter === 'all' ||
      (paymentFilter === 'cod' && o.paymentMethod === 'cod') ||
      (paymentFilter === 'card' && (o.paymentMethod === 'card' || (o.paymentMethod as any) === 'paddle')) ||
      (paymentFilter === 'paypal' && o.paymentMethod === 'paypal') ||
      (paymentFilter === 'bank_transfer' && (o.paymentMethod === 'bank_transfer' || (o.paymentMethod as any) === 'rib'));

    const cleanSearch = searchTerm.toLowerCase();
    const matchSearch =
      o.id.toLowerCase().includes(cleanSearch) ||
      o.customer.fullName.toLowerCase().includes(cleanSearch) ||
      o.customer.phone.includes(cleanSearch) ||
      o.customer.city.toLowerCase().includes(cleanSearch);

    return matchStatus && matchPayment && matchSearch;
  });

  const openStatusModal = (ord: Order) => {
    setSelectedOrder(ord);
    setNewStatus(ord.status);
    setStatusNote(ord.statusNote || '');
  };

  const handleSaveStatus = async () => {
    if (!selectedOrder) return;
    setIsSavingStatus(true);
    try {
      await onUpdateStatus(selectedOrder.id, newStatus, statusNote);
      showNotification(`تم تحديث حالة الطلب #${selectedOrder.id} إلى "${newStatus}" بنجاح!`);
      setSelectedOrder(null);
    } catch (err: any) {
      showNotification(`خطأ أثناء التحديث: ${err.message || 'تعذر تحديث الحالة'}`, 'error');
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    setIsDeletingOrder(true);
    const ordId = orderToDelete.id;
    try {
      await onDeleteOrder(ordId);
      showNotification(`تم حذف ومسح الطلب #${ordId} نهائياً بنجاح!`, 'success');
      setOrderToDelete(null);
    } catch (err: any) {
      showNotification(`خطأ أثناء الحذف: ${err.message || 'تعذر مسح الطلب'}`, 'error');
    } finally {
      setIsDeletingOrder(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Permanent Cloud Storage & Live Sync Banner */}
      <div className="bg-[#121A15] border border-[#233528] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-white font-['Cairo']">
                جميع الطلبات مسجلة ومحفوظة بشكل دائم ({orders.length} طلبية مسجلة)
              </h3>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>حفظ دائم في السيرفر والقاعدة المحلية</span>
              </span>
            </div>
            <p className="text-xs text-[#8A9B90] mt-1 leading-relaxed">
              جميع الطلبات بجميع طرق الدفع (الدفع عند الاستلام، بطاقة بنكية، بايبال، أو تحويل بنكي) تبقى مسجلة دائماً دون حد أقصى.
            </p>
          </div>
        </div>

        {onRefreshOrders && (
          <button
            type="button"
            disabled={isRefreshing}
            onClick={async () => {
              setIsRefreshing(true);
              try {
                await onRefreshOrders();
                showNotification(`تم تحديث ومزامنة الطلبيات! إجمالي الطلبات الحالية: ${orders.length}`, 'success');
              } catch (e: any) {
                showNotification('تعذر التحديث: ' + (e.message || 'خطأ أثناء الاتصال'), 'error');
              } finally {
                setIsRefreshing(false);
              }
            }}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[#1A281E] hover:bg-[#25392B] text-[#34D399] border border-[#34D399]/40 text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'جاري المزامنة...' : 'مزامنة وتحديث الطلبات الآن 🔄'}</span>
          </button>
        )}
      </div>

      {/* Advanced Filters Panel: Status + Payment Method + Search */}
      <div className="bg-[#101713] border border-[#213027] p-4 sm:p-5 rounded-2xl space-y-3.5 shadow-xl">
        {/* Top Row: Search and Status Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <span className="text-[11px] font-bold text-[#7A8B80] shrink-0 ml-1">الحالة:</span>
            {[
              { id: 'all', label: 'الكل', count: orders.length },
              { id: 'new', label: 'جديد / بالانتظار', count: newOrPendingCount },
              { id: 'processing', label: 'قيد التجهيز', count: processingCount },
              { id: 'shipped', label: 'تم الشحن', count: shippedCount },
              { id: 'delivered', label: 'تم التسليم', count: deliveredCount },
              { id: 'cancelled', label: 'ملغي', count: cancelledCount },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === st.id
                    ? 'bg-[#D97706] text-white shadow-md'
                    : 'bg-[#151F19] text-[#A89C89] border border-[#213027] hover:text-white hover:bg-[#1C2820]'
                }`}
              >
                <span>{st.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    statusFilter === st.id ? 'bg-black/30 text-white' : 'bg-[#223126] text-[#8A9B90]'
                  }`}
                >
                  {st.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث برقم الطلب، الاسم، الهاتف، المدينة..."
              className="w-full bg-[#151F19] border border-[#26372D] rounded-xl px-3 py-2 pr-8 text-xs text-white placeholder-[#776B5A] focus:outline-hidden focus:border-[#D97706]"
            />
            <Search className="w-3.5 h-3.5 text-[#776B5A] absolute right-2.5 top-1/2 -translate-y-1/2" />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#8A9B90] hover:text-white"
              >
                مسح
              </button>
            )}
          </div>
        </div>

        {/* Bottom Row: Payment Method Filter Pills */}
        <div className="pt-3 border-t border-[#1C2820] flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-[#7A8B80] shrink-0 ml-1">طريقة الدفع:</span>
          {[
            { id: 'all', label: 'جميع طرق الدفع', count: orders.length, icon: '💳' },
            { id: 'cod', label: 'الدفع عند الاستلام (COD)', count: codCount, icon: '💵' },
            { id: 'card', label: 'بطاقة بنكية / Mastercard', count: cardCount, icon: '💳' },
            { id: 'paypal', label: 'بايبال (PayPal)', count: paypalCount, icon: '🅿️' },
            { id: 'bank_transfer', label: 'تحويل بنكي (RIB)', count: bankCount, icon: '🏦' },
          ].map((pm) => (
            <button
              key={pm.id}
              type="button"
              onClick={() => setPaymentFilter(pm.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                paymentFilter === pm.id
                  ? 'bg-[#1E3B2B] text-emerald-300 border border-emerald-500/50 shadow-md'
                  : 'bg-[#131A15] text-[#9AA89E] border border-[#213027] hover:text-white hover:bg-[#1A251E]'
              }`}
            >
              <span>{pm.icon}</span>
              <span>{pm.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  paymentFilter === pm.id ? 'bg-emerald-500/30 text-emerald-200' : 'bg-[#1E2B22] text-[#8A9B90]'
                }`}
              >
                {pm.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#121A15] border border-[#3E2323] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 text-right font-['Cairo']">
            <div className="flex items-center gap-3.5 pb-4 border-b border-[#2B1B1B]">
              <div className="w-12 h-12 rounded-2xl bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:lg font-black text-white">
                  تأكيد مسح وحذف الطلب
                </h3>
                <p className="text-xs text-[#EF4444] font-medium">
                  هل أنت متأكد فعلاً من رغبتك في مسح هذا الطلب؟
                </p>
              </div>
            </div>

            <div className="bg-[#17211B] border border-[#233329] rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-[#233329]">
                <span className="text-[#8A9B90]">رقم الطلب:</span>
                <span className="font-mono font-bold text-[#F3BA63]">#{orderToDelete.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8A9B90]">اسم الزبون:</span>
                <span className="font-bold text-white">{orderToDelete.customer.fullName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8A9B90]">رقم الهاتف:</span>
                <span className="font-mono text-[#D97706]" dir="ltr">{orderToDelete.customer.phone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8A9B90]">المدينة:</span>
                <span className="text-white">{orderToDelete.customer.city}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#233329]">
                <span className="text-[#8A9B90]">إجمالي المبلغ:</span>
                <span className="font-mono font-bold text-sm text-[#10B981]">{orderToDelete.total} DH</span>
              </div>
            </div>

            <p className="text-[11px] text-[#A89C89] bg-[#2A1515]/60 border border-[#EF4444]/20 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
              <span>⚠️ تنبيه: سيتم حذف هذا الطلب نهائياً من المتجر وقاعدة البيانات ولا يمكن التراجع عن هذه الخطوة.</span>
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-[#2E4135] bg-[#17231C] hover:bg-[#1E2E25] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء التراجع
              </button>
              <button
                type="button"
                disabled={isDeletingOrder}
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-3 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-black shadow-lg shadow-[#EF4444]/20 flex items-center justify-center gap-2 transition-transform hover:scale-101 cursor-pointer disabled:opacity-50"
              >
                {isDeletingOrder ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>{isDeletingOrder ? 'جاري الحذف...' : 'نعم، احذف الطلب'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL ORDER DETAILS MODAL */}
      {inspectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="bg-[#101713] border border-[#2E4135] rounded-3xl p-5 sm:p-7 max-w-2xl w-full shadow-2xl space-y-5 my-8 text-right font-['Cairo']">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#213027]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#D97706]/20 border border-[#D97706]/40 text-[#F59E0B] flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-white font-mono">
                      تفاصيل الطلب #{inspectingOrder.id}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        inspectingOrder.status === 'new'
                          ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30'
                          : inspectingOrder.status === 'processing'
                          ? 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30'
                          : inspectingOrder.status === 'shipped'
                          ? 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/30'
                          : inspectingOrder.status === 'delivered'
                          ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30'
                          : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30'
                      }`}
                    >
                      {inspectingOrder.status === 'new'
                        ? 'جديد'
                        : inspectingOrder.status === 'processing'
                        ? 'قيد التجهيز'
                        : inspectingOrder.status === 'shipped'
                        ? 'تم الشحن'
                        : inspectingOrder.status === 'delivered'
                        ? 'تم التسليم'
                        : 'ملغي'}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#7A8B80]">
                    بتاريخ: {new Date(inspectingOrder.createdAt).toLocaleDateString('ar-MA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingOrder(null)}
                className="w-9 h-9 rounded-full bg-[#18231C] text-[#8A9B90] hover:text-white hover:bg-[#25372B] flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#141E18] rounded-2xl p-4 border border-[#213127] space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E2B22]">
                <span className="text-[#8A9B90] font-bold">بيانات الزبون وعنوان التوصيل:</span>
                <span className="text-[#34D399] font-bold">📍 {inspectingOrder.customer.city}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#8A9B90] text-[11px] block">الاسم الكامل:</span>
                  <span className="font-bold text-white text-sm">{inspectingOrder.customer.fullName}</span>
                </div>
                <div>
                  <span className="text-[#8A9B90] text-[11px] block">رقم الهاتف:</span>
                  <span className="font-mono font-bold text-[#F59E0B] text-sm" dir="ltr">
                    {inspectingOrder.customer.phone}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[#8A9B90] text-[11px] block">العنوان الكامل بالتفصيل:</span>
                <p className="font-medium text-white text-xs mt-0.5">{inspectingOrder.customer.address}</p>
              </div>
              {inspectingOrder.customer.notes && (
                <div className="bg-[#1A261F] p-2.5 rounded-xl border border-[#24372C] text-[#F3BA63] text-[11px]">
                  <span className="font-bold block mb-0.5">ملاحظات الزبون:</span>
                  {inspectingOrder.customer.notes}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-[#1C2821]">
                {inspectingOrder.customer.phone && (
                  <a
                    href={`tel:${inspectingOrder.customer.phone.replace(/[^\d+]/g, '')}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#19271E] hover:bg-[#223328] text-white text-xs font-bold border border-[#2C3E32] active:scale-95 transition-all"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#34D399]" />
                    <span dir="ltr">{inspectingOrder.customer.phone}</span>
                  </a>
                )}
                {inspectingOrder.customer.phone && (
                  <a
                    href={`https://wa.me/212${inspectingOrder.customer.phone.replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent(
                      `السلام عليكم ورحمة الله أخي الكريم ${inspectingOrder.customer.fullName}، بخصوص طلبيتكم رقم #${inspectingOrder.id}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] text-xs font-bold border border-[#25D366]/40 active:scale-95 transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>مراسلة عبر واتساب</span>
                  </a>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#D97706]" />
                  <span>المنتجات المطلوبة في هذه الطلبية ({inspectingOrder.items.length}):</span>
                </h4>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {inspectingOrder.items.map((rawItem, idx) => {
                  const item = resolveOrderItem(rawItem);
                  return (
                    <div
                      key={idx}
                      className="bg-[#131D16] border border-[#233529] hover:border-[#385240] rounded-2xl p-3 sm:p-3.5 flex items-center gap-3.5 transition-all shadow-md"
                    >
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-[#2E4135] bg-[#0E1511] shrink-0 group">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h5 className="font-bold text-white text-xs sm:text-sm line-clamp-1">{item.name}</h5>
                            <div className="flex items-center gap-2 mt-1">
                              {item.category && (
                                <span className="text-[10px] bg-[#1E2B22] text-[#8A9B90] px-2 py-0.5 rounded-md font-medium">
                                  {item.category}
                                </span>
                              )}
                              {item.weight && (
                                <span className="text-[10px] bg-[#2C2619] text-[#F59E0B] border border-[#F59E0B]/30 px-2 py-0.5 rounded-md font-bold">
                                  ⚖️ {item.weight}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-left shrink-0">
                            <span className="font-mono font-black text-sm sm:text-base text-[#F59E0B] block">
                              {item.lineTotal} DH
                            </span>
                            <span className="text-[10px] text-[#7A8B80]">
                              {item.unitPrice} DH × {item.quantity}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#141F18] border border-[#25372B] rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center text-[#8A9B90]">
                <span>مجموع المنتجات:</span>
                <span className="font-mono font-bold text-white">
                  {inspectingOrder.subtotal || inspectingOrder.total} DH
                </span>
              </div>
              <div className="flex justify-between items-center text-[#8A9B90]">
                <span>مصاريف التوصيل:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {inspectingOrder.shipping === 0 ? 'مجاني 🚚' : `${inspectingOrder.shipping} DH`}
                </span>
              </div>
              <div className="flex justify-between items-center text-[#8A9B90]">
                <span>طريقة الدفع:</span>
                <span className="font-bold text-white">
                  {inspectingOrder.paymentMethod === 'cod'
                    ? '💵 الدفع نقداً عند الاستلام'
                    : inspectingOrder.paymentMethod === 'card'
                    ? '💳 بطاقة بنكية'
                    : inspectingOrder.paymentMethod === 'paypal'
                    ? '🅿️ بايبال'
                    : '🏦 تحويل بنكي'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#213227] text-sm">
                <span className="font-bold text-white">المجموع الإجمالي المستحق:</span>
                <span className="font-mono font-black text-lg text-[#F59E0B]">
                  {inspectingOrder.total} DH
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const ord = inspectingOrder;
                  setInspectingOrder(null);
                  openStatusModal(ord);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <Edit className="w-4 h-4" />
                <span>تحديث حالة الطلب</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectingOrder(null)}
                className="px-5 py-3 rounded-xl bg-[#17231C] hover:bg-[#203127] text-[#A89C89] hover:text-white font-bold text-xs transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#101713] border border-[#2E4135] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#213027]">
              <h3 className="text-base font-bold text-white font-mono">
                تحديث حالة الطلب #{selectedOrder.id}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-[#18231C] text-[#8A9B90] hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#E5DCce] mb-1.5">الحالة الجديدة للطلب:</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                className="w-full bg-[#151F19] border border-[#2B3C31] rounded-xl px-3 py-3 text-white font-bold text-sm focus:outline-hidden focus:border-[#D97706]"
              >
                <option value="new">جديد (New)</option>
                <option value="processing">قيد التجهيز (Processing)</option>
                <option value="shipped">تم الشحن (Shipped)</option>
                <option value="delivered">تم التسليم (Delivered)</option>
                <option value="cancelled">ملغي (Cancelled)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#E5DCce] mb-1.5">
                ملاحظة الحالة للزبون:
              </label>
              <textarea
                rows={2}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="مثال: تم إرسال الطرد مع شركة أمانة"
                className="w-full bg-[#151F19] border border-[#2B3C31] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-hidden focus:border-[#D97706]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#213027]">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold text-[#A89C89] bg-[#16221B] rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={isSavingStatus}
                onClick={handleSaveStatus}
                className="flex-1 sm:flex-none bg-[#D97706] hover:bg-[#B45309] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSavingStatus && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isSavingStatus ? 'جاري الحفظ...' : 'حفظ الحالة الآن'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE ORDERS VIEW */}
      <div className="block sm:hidden space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-[#101713] border border-[#213027] rounded-2xl p-8 text-center text-xs space-y-3">
            <p className="text-[#8A9B90]">
              لا توجد طلبيات مطابقة للفلتر المحدد
            </p>
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const cleanPhone = (ord.customer.phone || '').replace(/\D/g, '');
            const whatsappUrl = cleanPhone
              ? `https://wa.me/212${cleanPhone.replace(/^0/, '')}?text=${encodeURIComponent(
                  `السلام عليكم ${ord.customer.fullName} بخصوص طلبيتكم #${ord.id}.`
                )}`
              : null;
            const telUrl = cleanPhone ? `tel:${ord.customer.phone}` : null;

            return (
              <div
                key={ord.id}
                className="bg-[#101713] border border-[#213027] rounded-2xl p-4 space-y-3.5 shadow-lg"
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-[#1C2821]">
                  <div>
                    <span className="font-mono font-black text-sm text-[#F59E0B]">#{ord.id}</span>
                    <span className="text-[10px] text-[#7A8B80] block mt-0.5">
                      {new Date(ord.createdAt).toLocaleDateString('ar-MA')}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      ord.status === 'new'
                        ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30'
                        : ord.status === 'processing'
                        ? 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30'
                        : ord.status === 'shipped'
                        ? 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/30'
                        : ord.status === 'delivered'
                        ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30'
                        : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30'
                    }`}
                  >
                    {ord.status === 'new'
                      ? 'جديد'
                      : ord.status === 'processing'
                      ? 'قيد التجهيز'
                      : ord.status === 'shipped'
                      ? 'تم الشحن'
                      : ord.status === 'delivered'
                      ? 'تم التسليم'
                      : 'ملغي'}
                  </span>
                </div>

                <div className="bg-[#141E18] rounded-xl p-3 border border-[#213127] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{ord.customer.fullName}</span>
                    <span className="text-[#34D399] font-bold text-[11px]">📍 {ord.customer.city}</span>
                  </div>

                  <p className="text-[#A89C89] text-[11px] line-clamp-2">{ord.customer.address}</p>

                  <div className="flex items-center gap-2 pt-1 border-t border-[#1C2821]">
                    {telUrl && (
                      <a
                        href={telUrl}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-[#19271E] hover:bg-[#223328] text-white text-xs font-bold border border-[#2C3E32]"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#34D399]" />
                        <span dir="ltr">{ord.customer.phone}</span>
                      </a>
                    )}
                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-lg bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] text-xs font-bold border border-[#25D366]/40"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>واتساب</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-[#8A9B90] block">المجموع:</span>
                    <span className="text-base font-black font-mono text-[#F59E0B]">{ord.total} DH</span>
                  </div>

                  <div>
                    {ord.paymentMethod === 'cod' ? (
                      <span className="inline-flex items-center gap-1 bg-[#233527] text-[#4ADE80] px-2.5 py-1 rounded-full text-[11px] font-bold border border-[#10B981]/30">
                        💵 عند الاستلام
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-[#1A2836] text-[#60A5FA] px-2.5 py-1 rounded-full text-[11px] font-bold border border-[#3B82F6]/30">
                        💳 دفع إلكتروني
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#1C2821]">
                  <button
                    type="button"
                    onClick={() => setInspectingOrder(ord)}
                    className="py-2.5 px-3 rounded-xl bg-[#17231C] hover:bg-[#203127] text-[#F3BA63] font-bold text-xs flex items-center justify-center gap-1 border border-[#2B3D30]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>الصور</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openStatusModal(ord)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>تغيير الحالة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderToDelete(ord)}
                    className="py-2.5 px-3 rounded-xl bg-[#2A1515] hover:bg-[#3B1B1B] text-[#EF4444] font-bold text-xs flex items-center justify-center gap-1 border border-[#EF4444]/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP ORDERS VIEW */}
      <div className="hidden sm:block bg-[#101713] border border-[#213027] rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead>
              <tr className="text-[#8A9B90] bg-[#141D17] border-b border-[#213027]">
                <th className="p-4 font-bold">الطلب</th>
                <th className="p-4 font-bold">الزبون والهاتف</th>
                <th className="p-4 font-bold">العنوان والمدينة</th>
                <th className="p-4 font-bold">المنتجات والصور</th>
                <th className="p-4 font-bold">المبلغ</th>
                <th className="p-4 font-bold">الدفع</th>
                <th className="p-4 font-bold">الحالة</th>
                <th className="p-4 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#18231C]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-xs text-[#8A9B90]">
                    لا توجد طلبات مطابقة للفلتر المحدد
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#141F18] transition-colors">
                    <td className="p-4">
                      <span className="font-mono font-bold text-white block">#{ord.id}</span>
                      <span className="text-[10px] text-[#7A8B80]">
                        {new Date(ord.createdAt).toLocaleDateString('ar-MA')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-white block">{ord.customer.fullName}</span>
                      <span className="font-mono text-xs text-[#D97706]" dir="ltr">
                        {ord.customer.phone}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-white block font-bold">{ord.customer.city}</span>
                      <span className="text-xs text-[#A89C89] truncate max-w-[180px] block">
                        {ord.customer.address}
                      </span>
                    </td>

                    <td className="p-4 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">{ord.items.length} منتج</span>
                        <button
                          type="button"
                          onClick={() => setInspectingOrder(ord)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F3BA63] hover:underline bg-[#1A271E] px-2 py-0.5 rounded-md border border-[#2D4133] cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>عرض</span>
                        </button>
                      </div>
                    </td>

                    <td className="p-4 font-mono font-bold text-[#F59E0B]">{ord.total} DH</td>
                    <td className="p-4 text-xs">
                      {ord.paymentMethod === 'cod' ? (
                        <span className="inline-flex items-center gap-1 bg-[#233527] text-[#4ADE80] px-2.5 py-1 rounded-full font-bold border border-[#10B981]/30">
                          💵 عند الاستلام
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-[#1A2836] text-[#60A5FA] px-2.5 py-1 rounded-full font-bold border border-[#3B82F6]/30">
                          💳 دفع إلكتروني
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          ord.status === 'new'
                            ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30'
                            : ord.status === 'processing'
                            ? 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30'
                            : ord.status === 'shipped'
                            ? 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/30'
                            : ord.status === 'delivered'
                            ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30'
                            : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30'
                        }`}
                      >
                        {ord.status === 'new'
                          ? 'جديد'
                          : ord.status === 'processing'
                          ? 'قيد التجهيز'
                          : ord.status === 'shipped'
                          ? 'تم الشحن'
                          : ord.status === 'delivered'
                          ? 'تم التسليم'
                          : 'ملغي'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setInspectingOrder(ord)}
                          className="p-1.5 rounded-lg bg-[#17231C] hover:bg-[#223328] text-[#F3BA63] border border-[#2B3D30]"
                          title="معاينة كاملة"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openStatusModal(ord)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#19271E] hover:bg-[#223328] text-[#34D399] font-bold text-xs border border-[#26372D]"
                          title="تغيير الحالة"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderToDelete(ord)}
                          className="p-1.5 rounded-lg bg-[#2A1515] hover:bg-[#3B1B1B] text-[#EF4444] border border-[#EF4444]/30"
                          title="حذف الطلب"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
