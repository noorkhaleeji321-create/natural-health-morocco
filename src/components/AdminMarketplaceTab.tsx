import React, { useState, useMemo } from 'react';
import {
  Store,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  ShieldCheck,
  MapPin,
  Phone,
  MessageCircle,
  Package,
  FileText,
  Eye,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { Seller, StoreEntity, Product, SellerStatus, ProductStatus } from '../types';

interface AdminMarketplaceTabProps {
  sellers: Seller[];
  stores: StoreEntity[];
  products: Product[];
  onUpdateSellerStatus: (
    sellerId: string,
    status: SellerStatus,
    notes?: string
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
  onApproveProduct: (
    productId: string,
    status: 'approved' | 'rejected',
    reason?: string
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
  onRefresh: () => void;
  showNotification: (text: string, type?: 'success' | 'error') => void;
}

export const AdminMarketplaceTab: React.FC<AdminMarketplaceTabProps> = ({
  sellers,
  stores,
  products,
  onUpdateSellerStatus,
  onApproveProduct,
  onRefresh,
  showNotification,
}) => {
  const [subTab, setSubTab] = useState<'sellers' | 'products'>('sellers');

  // Sellers filter & search
  const [sellerStatusFilter, setSellerStatusFilter] = useState<string>('all');
  const [sellerSearch, setSellerSearch] = useState('');
  const [processingSellerId, setProcessingSellerId] = useState<string | null>(null);

  // Products moderation filter & search
  const [productStatusFilter, setProductStatusFilter] = useState<string>('all');
  const [productSearch, setProductSearch] = useState('');
  const [processingProductId, setProcessingProductId] = useState<string | null>(null);

  // Rejection modal states
  const [rejectItemType, setRejectItemType] = useState<'seller' | 'product' | null>(null);
  const [rejectItemId, setRejectItemId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Seller stats
  const pendingSellersCount = useMemo(
    () => sellers.filter((s) => s.sellerStatus === 'pending').length,
    [sellers]
  );
  const approvedSellersCount = useMemo(
    () => sellers.filter((s) => s.sellerStatus === 'approved').length,
    [sellers]
  );

  // Marketplace products stats
  const marketplaceProducts = useMemo(
    () => products.filter((p) => p.sellerId || p.storeId),
    [products]
  );
  const pendingProductsCount = useMemo(
    () => marketplaceProducts.filter((p) => p.status === 'pending_review').length,
    [marketplaceProducts]
  );

  // Filtered sellers
  const filteredSellers = useMemo(() => {
    const query = String(sellerSearch || '').toLowerCase();
    return sellers.filter((sel) => {
      const matchSearch =
        String(sel.sellerName || '').toLowerCase().includes(query) ||
        String(sel.storeName || '').toLowerCase().includes(query) ||
        String(sel.phone || '').includes(query) ||
        (sel.city && String(sel.city).toLowerCase().includes(query));
      const matchStatus =
        sellerStatusFilter === 'all' ? true : sel.sellerStatus === sellerStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [sellers, sellerSearch, sellerStatusFilter]);

  // Filtered products for moderation
  const filteredProducts = useMemo(() => {
    const query = String(productSearch || '').toLowerCase();
    return marketplaceProducts.filter((prod) => {
      const matchSearch =
        String(prod.name || '').toLowerCase().includes(query) ||
        (prod.storeName && String(prod.storeName).toLowerCase().includes(query)) ||
        (prod.category && String(prod.category).toLowerCase().includes(query));
      const matchStatus =
        productStatusFilter === 'all'
          ? true
          : (prod.status || 'approved') === productStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [marketplaceProducts, productSearch, productStatusFilter]);

  // Action handlers
  const handleApproveSeller = async (sellerId: string) => {
    setProcessingSellerId(sellerId);
    const res = await onUpdateSellerStatus(sellerId, 'approved');
    setProcessingSellerId(null);
    if (res.success) {
      showNotification('تم اعتماد وتفعيل متجر البائع بنجاح! يمكنه الآن بيع منتجاته', 'success');
    } else {
      showNotification(res.error || 'فشل اعتماد البائع', 'error');
    }
  };

  const handleSuspendSeller = async (sellerId: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في تعليق نشاط هذا البائع مؤقتاً؟')) return;
    setProcessingSellerId(sellerId);
    const res = await onUpdateSellerStatus(sellerId, 'suspended');
    setProcessingSellerId(null);
    if (res.success) {
      showNotification('تم تعليق حساب البائع مؤقتاً', 'success');
    } else {
      showNotification(res.error || 'فشل تعليق البائع', 'error');
    }
  };

  const handleOpenRejectModal = (type: 'seller' | 'product', id: string) => {
    setRejectItemType(type);
    setRejectItemId(id);
    setRejectionReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectItemId || !rejectItemType) return;

    if (rejectItemType === 'seller') {
      setProcessingSellerId(rejectItemId);
      const res = await onUpdateSellerStatus(rejectItemId, 'rejected', rejectionReason);
      setProcessingSellerId(null);
      if (res.success) {
        showNotification('تم رفض طلب البائع وتدوين السبب بنجاح', 'success');
      } else {
        showNotification(res.error || 'فشل رفض الطلب', 'error');
      }
    } else {
      setProcessingProductId(rejectItemId);
      const res = await onApproveProduct(rejectItemId, 'rejected', rejectionReason);
      setProcessingProductId(null);
      if (res.success) {
        showNotification('تم رفض المنتج وتوجيه الملاحظة للبائع', 'success');
      } else {
        showNotification(res.error || 'فشل رفض المنتج', 'error');
      }
    }

    setRejectItemType(null);
    setRejectItemId(null);
    setRejectionReason('');
  };

  const handleApproveProductAction = async (productId: string) => {
    setProcessingProductId(productId);
    const res = await onApproveProduct(productId, 'approved');
    setProcessingProductId(null);
    if (res.success) {
      showNotification('تمت الموافقة على المنتج ونشره حياً في السوق!', 'success');
    } else {
      showNotification(res.error || 'فشل اعتماد المنتج', 'error');
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Top Marketplace Banner & KPI Bar */}
      <div className="bg-gradient-to-r from-[#17251E] via-[#101A14] to-[#0D1510] border border-[#23352A] rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-[#1E2E24]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#D97706]/20 border border-[#D97706]/40 flex items-center justify-center text-[#F3BA63] shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-[#FAF5EC] font-['Cairo'] flex items-center gap-2">
                <span>إدارة سوق التجار والتعاونيات الحرفية</span>
                <span className="text-xs bg-[#D97706]/20 text-[#F59E0B] px-2.5 py-0.5 rounded-full border border-[#D97706]/30 font-bold">
                  Multi-Vendor Marketplace
                </span>
              </h3>
              <p className="text-xs text-[#A89C89] mt-0.5">
                مراجعة طلبات الانضمام، تدقيق الهويات والوثائق القانونية، ومراقبة جودة المنتجات المعروضة للزبائن
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 bg-[#1A2820] hover:bg-[#23382B] text-[#FAF5EC] text-xs font-bold px-3.5 py-2 rounded-xl border border-[#2A4032] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-[#D97706]" />
            <span>تحديث بيانات السوق</span>
          </button>
        </div>

        {/* 4 Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-5">
          <div className="bg-[#121B16] border border-[#233328] rounded-2xl p-4">
            <div className="text-xs font-bold text-[#8E8070] mb-1">إجمالي البائعين</div>
            <div className="text-2xl font-black text-[#FAF5EC] font-['Cairo']">{sellers.length}</div>
            <div className="text-[11px] text-[#A89C89] mt-0.5">مسجلين في المنصة</div>
          </div>

          <div className="bg-[#121B16] border border-[#233328] rounded-2xl p-4">
            <div className="text-xs font-bold text-[#8E8070] mb-1">طلبات بائعين تنتظر</div>
            <div className="text-2xl font-black text-[#F59E0B] font-['Cairo']">{pendingSellersCount}</div>
            <div className="text-[11px] text-[#A89C89] mt-0.5">بحاجة لمراجعة المشرف</div>
          </div>

          <div className="bg-[#121B16] border border-[#233328] rounded-2xl p-4">
            <div className="text-xs font-bold text-[#8E8070] mb-1">منتجات بائعين للمراجعة</div>
            <div className="text-2xl font-black text-[#F59E0B] font-['Cairo']">{pendingProductsCount}</div>
            <div className="text-[11px] text-[#A89C89] mt-0.5">معلقة بانتظار الاعتماد</div>
          </div>

          <div className="bg-[#121B16] border border-[#233328] rounded-2xl p-4">
            <div className="text-xs font-bold text-[#8E8070] mb-1">المتاجر النشطة</div>
            <div className="text-2xl font-black text-[#22C55E] font-['Cairo']">{approvedSellersCount}</div>
            <div className="text-[11px] text-[#A89C89] mt-0.5">معتمدة وتبيع للزبائن</div>
          </div>
        </div>
      </div>

      {/* Sub-tabs switch */}
      <div className="flex items-center gap-2 border-b border-[#213026]">
        <button
          type="button"
          onClick={() => setSubTab('sellers')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            subTab === 'sellers'
              ? 'border-[#D97706] text-[#FAF5EC] bg-[#141F19]'
              : 'border-transparent text-[#8E8070] hover:text-[#FAF5EC]'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>طلبات وبائعي السوق ({sellers.length})</span>
          {pendingSellersCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#D97706] text-white text-[10px] flex items-center justify-center font-bold">
              {pendingSellersCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSubTab('products')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            subTab === 'products'
              ? 'border-[#D97706] text-[#FAF5EC] bg-[#141F19]'
              : 'border-transparent text-[#8E8070] hover:text-[#FAF5EC]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>مراجعة منتجات التجار ({marketplaceProducts.length})</span>
          {pendingProductsCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#EF4444] text-white text-[10px] flex items-center justify-center font-bold">
              {pendingProductsCount}
            </span>
          )}
        </button>
      </div>

      {/* SUB-TAB 1: SELLERS & STORES MANAGEMENT */}
      {subTab === 'sellers' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#121A16] border border-[#213026] p-3 sm:p-4 rounded-xl">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#665D50] absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ابحث بالاسم، المتجر، الهاتف، المدينة..."
                value={sellerSearch}
                onChange={(e) => setSellerSearch(e.target.value)}
                className="w-full bg-[#16221B] border border-[#2B3E32] rounded-lg pr-9 pl-3 py-2 text-xs text-[#FAF5EC] placeholder-[#665D50] focus:outline-none focus:border-[#D97706]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-[#8E8070] shrink-0">الحالة:</span>
              {[
                { key: 'all', label: 'الكل' },
                { key: 'pending', label: `قيد المراجعة (${pendingSellersCount})` },
                { key: 'approved', label: 'معتمد' },
                { key: 'suspended', label: 'معلق' },
                { key: 'rejected', label: 'مرفوض' },
              ].map((st) => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setSellerStatusFilter(st.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                    sellerStatusFilter === st.key
                      ? 'bg-[#D97706] text-white'
                      : 'bg-[#18251E] text-[#A89C89] hover:bg-[#203229]'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sellers List Cards */}
          {filteredSellers.length === 0 ? (
            <div className="bg-[#121A16] border border-[#213026] rounded-2xl p-12 text-center space-y-2">
              <Store className="w-10 h-10 text-[#5A4F42] mx-auto" />
              <h4 className="text-base font-bold text-[#FAF5EC]">لا يوجد بائعون مطابقون لهذا التصنيف</h4>
              <p className="text-xs text-[#8E8070]">يمكن للتجار الجدد تقديم طلبات الانضمام عبر واجهة المتجر</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredSellers.map((seller) => {
                const store = stores.find((st) => st.sellerId === seller.id);
                const isPending = seller.sellerStatus === 'pending';
                const isApproved = seller.sellerStatus === 'approved';
                const isSuspended = seller.sellerStatus === 'suspended';
                const isRejected = seller.sellerStatus === 'rejected';

                const cleanPhone = (seller.phone || '').replace(/\D/g, '');
                const whatsappUrl = cleanPhone
                  ? `https://wa.me/212${cleanPhone.replace(/^0/, '')}`
                  : null;

                const sellerProdsCount = products.filter(
                  (p) => p.sellerId === seller.id || (store && p.storeId === store.id)
                ).length;

                return (
                  <div
                    key={seller.id}
                    className="bg-[#121A16] border border-[#233328] hover:border-[#2D4536] rounded-2xl p-5 sm:p-6 transition-all space-y-4"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left info */}
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-[#16241C] border border-[#2B3E32] flex items-center justify-center overflow-hidden shrink-0">
                          {seller.logoUrl || store?.logoUrl ? (
                            <img
                              src={seller.logoUrl || store?.logoUrl}
                              alt={seller.storeName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Store className="w-7 h-7 text-[#F59E0B]" />
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-bold text-[#FAF5EC]">{seller.storeName}</h4>
                            {isApproved && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                                معتمد ونشط
                              </span>
                            )}
                            {isPending && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-full animate-pulse">
                                <Clock className="w-3 h-3" />
                                طلب جديد قيد المراجعة
                              </span>
                            )}
                            {isSuspended && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-950/40 border border-red-800/40 px-2 py-0.5 rounded-full">
                                <AlertTriangle className="w-3 h-3" />
                                معلق مؤقتاً
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-950/40 border border-red-800/40 px-2 py-0.5 rounded-full">
                                <XCircle className="w-3 h-3" />
                                طلب مرفوض
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-[#A89C89] flex items-center gap-4 flex-wrap">
                            <span>المسؤول: <strong className="text-[#FAF5EC]">{seller.sellerName}</strong></span>
                            <span>الهاتف: <strong className="text-[#F3BA63] font-mono">{seller.phone}</strong></span>
                            {seller.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-[#D97706]" />
                                <span>{seller.city}</span>
                              </span>
                            )}
                            <span>منتجاته: <strong className="text-[#4ADE80]">{sellerProdsCount}</strong></span>
                          </div>

                          {seller.businessDocument && (
                            <div className="text-[11px] text-[#A89C89] pt-1">
                              وثيقة الاعتماد / CIN: <code className="text-[#FAF5EC] font-mono bg-[#16241C] px-2 py-0.5 rounded">{seller.businessDocument}</code>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Action buttons (Responsive on Mobile) */}
                      <div className="flex items-center gap-2 flex-wrap pt-2 lg:pt-0 border-t lg:border-t-0 border-[#1E2C22] w-full lg:w-auto justify-end">
                        {whatsappUrl && (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2.5 bg-[#1B3526] hover:bg-[#254A35] text-[#4ADE80] rounded-xl border border-[#2E5E41] transition-colors inline-flex items-center gap-1 text-xs font-bold"
                            title="مراسلة التاجر عبر الواتساب للتحقق"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span className="lg:hidden">واتساب</span>
                          </a>
                        )}

                        {isPending && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApproveSeller(seller.id)}
                              disabled={processingSellerId === seller.id}
                              className="flex-1 lg:flex-none px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 active:scale-95"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>قبول واعتماد</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenRejectModal('seller', seller.id)}
                              disabled={processingSellerId === seller.id}
                              className="px-3.5 py-2.5 bg-red-950/60 hover:bg-red-900 text-red-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-red-800/60 transition-colors cursor-pointer disabled:opacity-50 active:scale-95"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>رفض</span>
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <button
                            type="button"
                            onClick={() => handleSuspendSeller(seller.id)}
                            disabled={processingSellerId === seller.id}
                            className="px-3 py-2 bg-[#251A1A] hover:bg-red-950 text-red-300 rounded-xl font-bold text-xs flex items-center gap-1 border border-red-900/40 transition-colors cursor-pointer disabled:opacity-50 active:scale-95"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>تعليق الحساب مؤقتاً</span>
                          </button>
                        )}

                        {isSuspended && (
                          <button
                            type="button"
                            onClick={() => handleApproveSeller(seller.id)}
                            disabled={processingSellerId === seller.id}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>إلغاء التعليق وإعادة التفعيل</span>
                          </button>
                        )}

                        {isRejected && (
                          <button
                            type="button"
                            onClick={() => handleApproveSeller(seller.id)}
                            disabled={processingSellerId === seller.id}
                            className="px-3.5 py-2 bg-[#1C2C22] hover:bg-[#253D2F] text-[#FAF5EC] rounded-xl font-bold text-xs flex items-center gap-1.5 border border-[#2F4738] transition-colors cursor-pointer active:scale-95"
                          >
                            <span>إعادة النظر واعتماد المتجر</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Seller Description if available */}
                    {seller.description && (
                      <div className="text-xs text-[#8E8070] bg-[#0E1511] p-3 rounded-xl border border-[#1E2B22]">
                        <span className="text-[#FAF5EC] font-bold">نبذة المتجر: </span>
                        {seller.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: PRODUCT MODERATION QUEUE */}
      {subTab === 'products' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#121A16] border border-[#213026] p-3 sm:p-4 rounded-xl">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#665D50] absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ابحث بالمنتج أو اسم المتجر..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full bg-[#16221B] border border-[#2B3E32] rounded-lg pr-9 pl-3 py-2 text-xs text-[#FAF5EC] placeholder-[#665D50] focus:outline-none focus:border-[#D97706]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-[#8E8070] shrink-0">حالة المنتج:</span>
              {[
                { key: 'pending_review', label: `بانتظار الاعتماد (${pendingProductsCount})` },
                { key: 'approved', label: 'معتمد' },
                { key: 'rejected', label: 'مرفوض' },
                { key: 'all', label: 'الكل' },
              ].map((st) => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setProductStatusFilter(st.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                    productStatusFilter === st.key
                      ? 'bg-[#D97706] text-white'
                      : 'bg-[#18251E] text-[#A89C89] hover:bg-[#203229]'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Moderation Table / Cards */}
          {filteredProducts.length === 0 ? (
            <div className="bg-[#121A16] border border-[#213026] rounded-2xl p-12 text-center space-y-2">
              <Package className="w-10 h-10 text-[#5A4F42] mx-auto" />
              <h4 className="text-base font-bold text-[#FAF5EC]">لا توجد منتجات مطابقة لهذا التصنيف</h4>
              <p className="text-xs text-[#8E8070]">
                أي منتج جديد يضيفه التجار في لوحة تحكمهم سيظهر هنا لتدقيق المكونات والسعر قبل النشر.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map((prod) => {
                const status = prod.status || 'approved';
                const isPending = status === 'pending_review';

                return (
                  <div
                    key={prod.id}
                    className="bg-[#121A16] border border-[#233328] hover:border-[#2D4536] rounded-2xl p-4 sm:p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-16 h-16 rounded-xl object-cover bg-[#0F1612] border border-[#283C30] shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-[#FAF5EC]">{prod.name}</h4>
                          <span className="text-[11px] bg-[#1A2820] text-[#A89C89] px-2 py-0.5 rounded border border-[#273B2F]">
                            {prod.category}
                          </span>
                          {prod.isOrganic && (
                            <span className="text-[10px] bg-emerald-950/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/40">
                              طبيعي 100%
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-[#8E8070] flex items-center gap-3 flex-wrap">
                          <span>المتجر: <strong className="text-[#F3BA63]">{prod.storeName || 'تاجر شريك'}</strong></span>
                          <span>السعر: <strong className="text-[#FAF5EC] font-['Cairo']">{prod.price} DH</strong></span>
                          <span>الوحدة: <strong>{prod.unit || 'قطعة'}</strong></span>
                          {prod.origin && <span>المصدر: <strong>{prod.origin}</strong></span>}
                          <span>المخزون: <strong>{prod.stockQuantity ?? 10}</strong></span>
                        </div>

                        {prod.shortDescription && (
                          <p className="text-xs text-[#A89C89] line-clamp-1">{prod.shortDescription}</p>
                        )}

                        {prod.rejectionReason && (
                          <div className="text-[11px] text-red-300">
                            سبب الرفض: {prod.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions (Mobile Responsive) */}
                    <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-[#1E2C22] w-full md:w-auto justify-end flex-wrap">
                      {isPending ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApproveProductAction(prod.id)}
                            disabled={processingProductId === prod.id}
                            className="flex-1 md:flex-none px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 active:scale-95"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>اعتماد ونشر المنتج</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenRejectModal('product', prod.id)}
                            disabled={processingProductId === prod.id}
                            className="px-3.5 py-2.5 bg-red-950/60 hover:bg-red-900 text-red-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-red-800/60 transition-colors cursor-pointer disabled:opacity-50 active:scale-95"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>رفض</span>
                          </button>
                        </>
                      ) : status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-xl">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>معروض حالياً للبيع</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApproveProductAction(prod.id)}
                          className="px-3.5 py-2 bg-[#1C2C22] hover:bg-[#253D2F] text-[#FAF5EC] rounded-xl font-bold text-xs border border-[#2F4738] transition-colors cursor-pointer active:scale-95"
                        >
                          إعادة الاعتماد
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* REJECTION MODAL */}
      {rejectItemType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn" dir="rtl">
          <div className="w-full max-w-md bg-[#121A16] border border-[#2A3F31] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-400">
              <XCircle className="w-5 h-5" />
              <h4 className="font-bold text-base text-[#FAF5EC]">
                {rejectItemType === 'seller' ? 'تأكيد رفض طلب البائع' : 'تأكيد رفض المنتج'}
              </h4>
            </div>

            <p className="text-xs text-[#A89C89]">
              يرجى توضيح سبب الرفض ليتم إبلاغ التاجر به وتعديله بالشكل المطلوب (مثلاً: نقص وثيقة، سعر غير مطابق، صورة غير واضحة):
            </p>

            <textarea
              rows={3}
              placeholder="اكتب سبب الرفض هنا..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-[#16221B] border border-[#2B3E32] rounded-xl p-3 text-xs text-[#FAF5EC] placeholder-[#665D50] focus:outline-none focus:border-red-500 resize-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectItemType(null)}
                className="px-4 py-2 text-xs font-bold text-[#8E8070] hover:text-white bg-[#16221B] rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-colors cursor-pointer"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
