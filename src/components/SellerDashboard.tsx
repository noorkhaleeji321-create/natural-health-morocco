import React, { useState, useEffect, useMemo } from 'react';
import {
  Store,
  Package,
  ShoppingBag,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Upload,
  ExternalLink,
  Settings,
  TrendingUp,
  Boxes,
  ShieldCheck,
  Search,
  Filter,
  Save,
  ArrowRight,
  Info,
  MessageCircle,
  Truck,
  Phone,
  MapPin,
  User,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product, ProductStatus, StoreEntity, Order, SellerOrder } from '../types';
import { api } from '../lib/api';
import { compressImage } from '../utils/imageCompressor';

interface SellerDashboardProps {
  onBackToStore?: () => void;
  onViewPublicStore?: (slug: string) => void;
  onOpenSellerApply?: () => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  onBackToStore,
  onViewPublicStore,
  onOpenSellerApply,
}) => {
  const {
    currentSeller,
    currentStore,
    products,
    categories,
    addSellerProduct,
    updateSellerProduct,
    deleteSellerProduct,
    updateStoreDetails,
    getSellerOrders,
    loginAsSeller,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'settings'>('products');
  const [productStatusFilter, setProductStatusFilter] = useState<string>('all');
  const [productSearch, setProductSearch] = useState('');

  // Seller orders state
  const [sellerOrders, setSellerOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Add / Edit Product Modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states for product
  const [productForm, setProductForm] = useState({
    name: '',
    category: categories[0]?.name || 'أعشاب طبيعية',
    price: '',
    originalPrice: '',
    unit: '100 غرام',
    inStock: true,
    stockQuantity: '20',
    description: '',
    shortDescription: '',
    origin: 'المغرب',
    isOrganic: true,
    image: '',
    instructions: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [productFormError, setProductFormError] = useState<string | null>(null);
  const [productFormSuccess, setProductFormSuccess] = useState<string | null>(null);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Store Settings Form state
  const [storeForm, setStoreForm] = useState({
    name: currentStore?.name || '',
    slogan: currentStore?.slogan || '',
    description: currentStore?.description || '',
    logoUrl: currentStore?.logoUrl || '',
    bannerUrl: currentStore?.bannerUrl || '',
    phone: currentStore?.phone || currentSeller?.phone || '',
    address: currentStore?.address || '',
    city: currentStore?.city || currentSeller?.city || 'مراكش',
  });
  const [savingStore, setSavingStore] = useState(false);
  const [storeSuccessMsg, setStoreSuccessMsg] = useState<string | null>(null);

  // Sync storeForm if currentStore loads
  useEffect(() => {
    if (currentStore) {
      setStoreForm({
        name: currentStore.name || '',
        slogan: currentStore.slogan || '',
        description: currentStore.description || '',
        logoUrl: currentStore.logoUrl || '',
        bannerUrl: currentStore.bannerUrl || '',
        phone: currentStore.phone || currentSeller?.phone || '',
        address: currentStore.address || '',
        city: currentStore.city || currentSeller?.city || 'مراكش',
      });
    }
  }, [currentStore, currentSeller]);

  // Load seller specific orders
  const loadSellerOrders = async () => {
    if (!currentSeller) return;
    setLoadingOrders(true);
    try {
      const res = await api.getSellerOrdersDetailed(currentSeller.id);
      if (res.success && res.orders) {
        setSellerOrders(res.orders);
        setLoadingOrders(false);
        return;
      }
    } catch (err) {
      console.warn('Fallback to local getSellerOrders:', err);
    }

    // Fallback
    const orders = await getSellerOrders(currentSeller.id);
    setSellerOrders(orders);
    setLoadingOrders(false);
  };

  useEffect(() => {
    loadSellerOrders();
  }, [currentSeller, getSellerOrders]);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      await api.updateSellerOrderStatus(orderId, newStatus);
      setSellerOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      console.error('Failed to update seller order status:', err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Filter products belonging to this seller
  const sellerProducts = useMemo(() => {
    if (!currentSeller) return [];
    return products.filter(
      (p) => p.sellerId === currentSeller.id || (currentStore && p.storeId === currentStore.id)
    );
  }, [products, currentSeller, currentStore]);

  // Filtered list for display
  const displayedProducts = useMemo(() => {
    return sellerProducts.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(productSearch.toLowerCase()));
      const matchStatus =
        productStatusFilter === 'all'
          ? true
          : (p.status || 'approved') === productStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [sellerProducts, productSearch, productStatusFilter]);

  // KPI calculations
  const stats = useMemo(() => {
    const totalCount = sellerProducts.length;
    const approvedCount = sellerProducts.filter((p) => (p.status || 'approved') === 'approved').length;
    const pendingCount = sellerProducts.filter((p) => p.status === 'pending_review').length;
    const outOfStockCount = sellerProducts.filter((p) => !p.inStock).length;

    let totalRevenue = 0;
    sellerOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (
          item.product.sellerId === currentSeller?.id ||
          (currentStore && item.product.storeId === currentStore.id)
        ) {
          totalRevenue += item.product.price * item.quantity;
        }
      });
    });

    return {
      totalCount,
      approvedCount,
      pendingCount,
      outOfStockCount,
      ordersCount: sellerOrders.length,
      totalRevenue,
    };
  }, [sellerProducts, sellerOrders, currentSeller, currentStore]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category: categories[0]?.name || 'أعشاب طبيعية',
      price: '',
      originalPrice: '',
      unit: '100 غرام',
      inStock: true,
      stockQuantity: '20',
      description: '',
      shortDescription: '',
      origin: 'المغرب',
      isOrganic: true,
      image: '',
      instructions: '',
    });
    setProductFormError(null);
    setProductFormSuccess(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      category: prod.category,
      price: prod.price.toString(),
      originalPrice: prod.originalPrice ? prod.originalPrice.toString() : '',
      unit: prod.unit || 'قطعة',
      inStock: prod.inStock,
      stockQuantity: (prod.stockQuantity || 20).toString(),
      description: prod.description || '',
      shortDescription: prod.shortDescription || '',
      origin: prod.origin || 'المغرب',
      isOrganic: prod.isOrganic ?? true,
      image: prod.image || '',
      instructions: prod.instructions || '',
    });
    setProductFormError(null);
    setProductFormSuccess(null);
    setIsProductModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const compressed = await compressImage(file, 800, 800, 0.78);
      setProductForm((prev) => ({ ...prev, image: compressed }));
    } catch (err) {
      console.error('Failed to compress image:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductFormError(null);
    setProductFormSuccess(null);

    if (!productForm.name.trim()) {
      setProductFormError('يرجى إدخال اسم المنتج');
      return;
    }
    const priceNum = parseFloat(productForm.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setProductFormError('يرجى إدخال سعر صحيح للمنتج');
      return;
    }
    if (!productForm.image.trim()) {
      setProductFormError('يرجى رفع صورة أو إدخال رابط صورة للمنتج');
      return;
    }

    setIsSubmittingProduct(true);

    const productPayload: Partial<Product> = {
      name: productForm.name.trim(),
      category: productForm.category,
      price: priceNum,
      originalPrice: productForm.originalPrice ? parseFloat(productForm.originalPrice) : undefined,
      unit: productForm.unit.trim(),
      inStock: productForm.inStock,
      stockQuantity: parseInt(productForm.stockQuantity) || 10,
      description: productForm.description.trim(),
      shortDescription: productForm.shortDescription.trim() || undefined,
      origin: productForm.origin.trim(),
      isOrganic: productForm.isOrganic,
      image: productForm.image.trim(),
      instructions: productForm.instructions.trim() || undefined,
      storeName: currentStore?.name || currentSeller?.storeName,
    };

    if (editingProduct) {
      // Update existing
      const res = await updateSellerProduct(editingProduct.id, productPayload);
      setIsSubmittingProduct(false);
      if (res.success) {
        setProductFormSuccess('تم تحديث المنتج وإرسال التعديلات للمراجعة بنجاح');
        setTimeout(() => {
          setIsProductModalOpen(false);
        }, 1200);
      } else {
        setProductFormError(res.error || 'فشل تحديث المنتج');
      }
    } else {
      // Add new product
      const res = await addSellerProduct(productPayload);
      setIsSubmittingProduct(false);
      if (res.success) {
        setProductFormSuccess('تمت إضافة المنتج بنجاح وأُرسل لإدارة السوق للمراجعة والاعتماد');
        setTimeout(() => {
          setIsProductModalOpen(false);
        }, 1200);
      } else {
        setProductFormError(res.error || 'فشل إضافة المنتج');
      }
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف المنتج "${name}" نهائياً من متجرك؟`)) {
      return;
    }
    await deleteSellerProduct(id);
  };

  const handleSaveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore) return;

    setSavingStore(true);
    setStoreSuccessMsg(null);

    const res = await updateStoreDetails(currentStore.id, {
      name: storeForm.name.trim(),
      slogan: storeForm.slogan.trim(),
      description: storeForm.description.trim(),
      logoUrl: storeForm.logoUrl.trim() || undefined,
      bannerUrl: storeForm.bannerUrl.trim() || undefined,
      phone: storeForm.phone.trim(),
      address: storeForm.address.trim(),
      city: storeForm.city.trim(),
    });

    setSavingStore(false);
    if (res.success) {
      setStoreSuccessMsg('تم حفظ وتحديث بيانات المتجر بنجاح!');
      setTimeout(() => setStoreSuccessMsg(null), 3000);
    } else {
      alert(res.error || 'فشل تحديث بيانات المتجر');
    }
  };

  // If not seller or pending/suspended
  if (!currentSeller) {
    return (
      <div className="min-h-[70vh] bg-[#080C0A] text-[#FAF5EC] flex items-center justify-center p-6" dir="rtl">
        <div className="max-w-lg w-full bg-[#121A16] border border-[#233328] rounded-2xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-[#D97706]/20 border border-[#D97706]/40 flex items-center justify-center text-[#F3BA63] mx-auto shadow-inner">
            <Store className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black font-['Cairo'] text-[#FAF5EC]">بوابة إدارة المتاجر والتجار</h2>
            <p className="text-sm text-[#A89C89] mt-2 leading-relaxed">
              لم يتم العثور على متجر نشط مرتبط بحسابك الحالي. يمكنك تقديم طلب رسمي لفتح متجرك أو تجربة لوحة التحكم كتاجر معتمد.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            {onOpenSellerApply && (
              <button
                type="button"
                onClick={onOpenSellerApply}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#F59E0B] hover:to-[#D97706] text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-[#D97706]/20 transition-all cursor-pointer text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>تقديم طلب انضمام كبائع معتمد</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => loginAsSeller('seller-saeed')}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#1A2820] hover:bg-[#25392D] text-[#4ADE80] font-bold px-6 py-3 rounded-xl border border-[#2B3E32] transition-all cursor-pointer text-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>الدخول السريع كتاجر معتمد (محل عند سعيد)</span>
            </button>

            <button
              type="button"
              onClick={onBackToStore}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#141D18] hover:bg-[#1C2922] text-[#A89C89] hover:text-white font-medium px-6 py-2.5 rounded-xl border border-[#213026] transition-all cursor-pointer text-xs"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة للمتجر الرئيسي</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPending = currentSeller.sellerStatus === 'pending';
  const isSuspended = currentSeller.sellerStatus === 'suspended';
  const isRejected = currentSeller.sellerStatus === 'rejected';

  return (
    <div className="min-h-screen bg-[#080C0A] text-[#FAF5EC] py-8 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Header & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1F2E25]">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToStore}
              className="p-2 bg-[#121A16] hover:bg-[#1A2520] border border-[#25362B] rounded-xl text-[#A89C89] hover:text-white transition-colors cursor-pointer"
              title="الرجوع إلى المتجر الرئيسي"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#F59E0B] bg-[#D97706]/15 px-2.5 py-0.5 rounded-full border border-[#D97706]/30">
                  لوحة التاجر 🏪
                </span>
                {currentStore?.slug && (
                  <button
                    onClick={() => onViewPublicStore?.(currentStore.slug)}
                    className="inline-flex items-center gap-1 text-xs text-[#A89C89] hover:text-[#F3BA63] underline cursor-pointer"
                  >
                    <span>معاينة واجهة متجري في السوق</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-['Cairo'] text-[#FAF5EC] mt-1 flex items-center gap-2">
                <span>{currentStore?.name || currentSeller.storeName}</span>
                {currentSeller.sellerStatus === 'approved' && (
                  <span title="بائع معتمد وموثق">
                    <ShieldCheck className="w-6 h-6 text-[#22C55E]" />
                  </span>
                )}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAddModal}
              disabled={isPending || isSuspended || isRejected}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#F59E0B] hover:to-[#D97706] text-white font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-[#D97706]/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة منتج جديد للبيع</span>
            </button>
          </div>
        </div>

        {/* Status Notification Alerts */}
        {isPending && (
          <div className="p-4 sm:p-5 bg-amber-950/40 border border-amber-800/80 rounded-2xl flex items-start gap-3.5 text-amber-200">
            <Clock className="w-6 h-6 text-[#F59E0B] shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-base text-[#FAF5EC]">طلب حساب البائع قيد المراجعة الإدارية</h3>
              <p className="text-xs sm:text-sm text-[#C8BAA7] mt-1">
                مرحباً بك! لقد استلمنا طلب فتح متجرك وهو الآن قيد التدقيق والمطابقة مع معايير جودة العطارة المغربية. بمجرد اعتماد الحساب من إدارة السوق، ستتمكن من نشر منتجاتك مباشرة للزبائن.
              </p>
            </div>
          </div>
        )}

        {isSuspended && (
          <div className="p-4 sm:p-5 bg-red-950/40 border border-red-800/80 rounded-2xl flex items-start gap-3.5 text-red-200">
            <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-base text-[#FAF5EC]">حساب المتجر معلق مؤقتاً</h3>
              <p className="text-xs sm:text-sm text-[#D8B4B4] mt-1">
                تم تعليق عمليات البيع على هذا المتجر من قبل إدارة المنصة. يرجى مراجعة إدارة السوق عبر الواتساب للاستفسار.
              </p>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="p-4 sm:p-5 bg-red-950/40 border border-red-800/80 rounded-2xl flex items-start gap-3.5 text-red-200">
            <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-base text-[#FAF5EC]">تم رفض طلب فتح المتجر</h3>
              <p className="text-xs sm:text-sm text-[#D8B4B4] mt-1">
                لم يستوفِ الطلب الشروط المطلوبة أو تعذر التحقق من موثوقية الوثائق.
              </p>
            </div>
          </div>
        )}

        {/* Quick KPI Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-[#121A16] border border-[#213026] rounded-xl p-4">
            <div className="flex items-center justify-between text-[#8E8070] text-xs font-bold mb-1">
              <span>إجمالي المنتجات</span>
              <Boxes className="w-4 h-4 text-[#D97706]" />
            </div>
            <div className="text-2xl font-black text-[#FAF5EC] font-['Cairo']">{stats.totalCount}</div>
            <div className="text-[11px] text-[#A89C89] mt-0.5">في كتالوج متجرك</div>
          </div>

          <div className="bg-[#121A16] border border-[#213026] rounded-xl p-4">
            <div className="flex items-center justify-between text-[#8E8070] text-xs font-bold mb-1">
              <span>معتمدة ومعروضة</span>
              <CheckCircle className="w-4 h-4 text-[#22C55E]" />
            </div>
            <div className="text-2xl font-black text-[#22C55E] font-['Cairo']">{stats.approvedCount}</div>
            <div className="text-[11px] text-[#A89C89] mt-0.5">يتاح للزبائن شراؤها</div>
          </div>

          <div className="bg-[#121A16] border border-[#213026] rounded-xl p-4">
            <div className="flex items-center justify-between text-[#8E8070] text-xs font-bold mb-1">
              <span>قيد المراجعة</span>
              <Clock className="w-4 h-4 text-[#F59E0B]" />
            </div>
            <div className="text-2xl font-black text-[#F59E0B] font-['Cairo']">{stats.pendingCount}</div>
            <div className="text-[11px] text-[#A89C89] mt-0.5">تنتظر فحص المشرف</div>
          </div>

          <div className="bg-[#121A16] border border-[#213026] rounded-xl p-4">
            <div className="flex items-center justify-between text-[#8E8070] text-xs font-bold mb-1">
              <span>طلبات متجري</span>
              <ShoppingBag className="w-4 h-4 text-[#3B82F6]" />
            </div>
            <div className="text-2xl font-black text-[#FAF5EC] font-['Cairo']">{stats.ordersCount}</div>
            <div className="text-[11px] text-[#A89C89] mt-0.5">طلبيات تحتوي منتجاتك</div>
          </div>

          <div className="bg-[#121A16] border border-[#213026] rounded-xl p-4 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-[#8E8070] text-xs font-bold mb-1">
              <span>المبيعات المقدرة</span>
              <TrendingUp className="w-4 h-4 text-[#D97706]" />
            </div>
            <div className="text-2xl font-black text-[#F3BA63] font-['Cairo']">
              {stats.totalRevenue.toLocaleString('ar-MA')} <span className="text-xs">DH</span>
            </div>
            <div className="text-[11px] text-[#A89C89] mt-0.5">قيمة مبيعات منتجاتك</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#213026]">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'border-[#D97706] text-[#FAF5EC] bg-[#141F19]'
                : 'border-transparent text-[#8E8070] hover:text-[#FAF5EC]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>منتجاتي ({sellerProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'border-[#D97706] text-[#FAF5EC] bg-[#141F19]'
                : 'border-transparent text-[#8E8070] hover:text-[#FAF5EC]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>طلبات متجري ({sellerOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'border-[#D97706] text-[#FAF5EC] bg-[#141F19]'
                : 'border-transparent text-[#8E8070] hover:text-[#FAF5EC]'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>إعدادات وهوية المتجر</span>
          </button>
        </div>

        {/* TAB 1: PRODUCTS LIST */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#121A16] border border-[#213026] p-3 sm:p-4 rounded-xl">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-[#665D50] absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ابحث في منتجاتك..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-[#16221B] border border-[#2B3E32] rounded-lg pr-9 pl-3 py-2 text-xs sm:text-sm text-[#FAF5EC] placeholder-[#665D50] focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <span className="text-xs text-[#8E8070] shrink-0">الحالة:</span>
                {[
                  { key: 'all', label: 'الكل' },
                  { key: 'approved', label: 'معتمدة' },
                  { key: 'pending_review', label: 'قيد المراجعة' },
                  { key: 'rejected', label: 'مرفوضة' },
                  { key: 'draft', label: 'مسودة' },
                ].map((st) => (
                  <button
                    key={st.key}
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

            {/* Products Table / Cards */}
            {displayedProducts.length === 0 ? (
              <div className="bg-[#121A16] border border-[#213026] rounded-2xl p-12 text-center space-y-3">
                <Boxes className="w-12 h-12 text-[#5A4F42] mx-auto" />
                <h3 className="text-lg font-bold text-[#FAF5EC]">لا توجد منتجات مطابقة في متجرك</h3>
                <p className="text-xs sm:text-sm text-[#8E8070] max-w-md mx-auto">
                  ابدأ بعرض أعشابك، زيوك أو منتجاتك الطبيعية الحرفية ليتمكن المتسوقون من شرائها عبر المتجر
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleOpenAddModal}
                    disabled={isPending || isSuspended || isRejected}
                    className="inline-flex items-center gap-2 bg-[#D97706] hover:bg-[#F59E0B] text-[#0A0F0D] font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer text-xs sm:text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة أول منتج لمتجرك</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#121A16] border border-[#213026] rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs sm:text-sm">
                    <thead className="bg-[#16221C] text-[#8E8070] border-b border-[#23352A] font-bold">
                      <tr>
                        <th className="p-3.5">المنتج</th>
                        <th className="p-3.5">التصنيف</th>
                        <th className="p-3.5">السعر</th>
                        <th className="p-3.5">المخزون</th>
                        <th className="p-3.5">حالة المراجعة</th>
                        <th className="p-3.5 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1D2A22]">
                      {displayedProducts.map((prod) => {
                        const status = prod.status || 'approved';
                        return (
                          <tr key={prod.id} className="hover:bg-[#15201A] transition-colors">
                            <td className="p-3.5">
                              <div className="flex items-center gap-3">
                                <img
                                  src={prod.image}
                                  alt={prod.name}
                                  className="w-12 h-12 rounded-lg object-cover bg-[#0E1411] border border-[#283C30] shrink-0"
                                />
                                <div>
                                  <div className="font-bold text-[#FAF5EC] line-clamp-1">{prod.name}</div>
                                  <div className="text-[11px] text-[#8E8070] flex items-center gap-1.5 mt-0.5">
                                    <span>{prod.unit || 'قطعة'}</span>
                                    {prod.origin && <span>• من: {prod.origin}</span>}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="p-3.5 text-[#C4B7A4]">
                              <span className="bg-[#1A2820] border border-[#273B2F] px-2 py-0.5 rounded text-[11px]">
                                {prod.category}
                              </span>
                            </td>

                            <td className="p-3.5 font-bold font-['Cairo'] text-[#F3BA63]">
                              {prod.price} <span className="text-[10px] text-[#A89C89]">DH</span>
                              {prod.originalPrice && (
                                <span className="text-[10px] text-[#6E6354] line-through mr-1.5">
                                  {prod.originalPrice} DH
                                </span>
                              )}
                            </td>

                            <td className="p-3.5">
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                  prod.inStock
                                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                                    : 'bg-red-950/60 text-red-300 border border-red-800/40'
                                }`}
                              >
                                {prod.inStock ? `متوفر (${prod.stockQuantity ?? 10})` : 'نفد المخزون'}
                              </span>
                            </td>

                            <td className="p-3.5">
                              {status === 'approved' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                                  <CheckCircle className="w-3 h-3" />
                                  معتمد للبيع
                                </span>
                              )}
                              {status === 'pending_review' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-full">
                                  <Clock className="w-3 h-3" />
                                  قيد مراجعة المشرف
                                </span>
                              )}
                              {status === 'rejected' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-950/40 border border-red-800/40 px-2 py-0.5 rounded-full">
                                  <XCircle className="w-3 h-3" />
                                  مرفوض
                                </span>
                              )}
                              {status === 'draft' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-400 bg-gray-800/40 border border-gray-700 px-2 py-0.5 rounded-full">
                                  مسودة
                                </span>
                              )}
                              {prod.rejectionReason && (
                                <div className="text-[10px] text-red-300 mt-1 max-w-xs">
                                  السبب: {prod.rejectionReason}
                                </div>
                              )}
                            </td>

                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEditModal(prod)}
                                  className="p-1.5 bg-[#1C2C23] hover:bg-[#253D2F] text-[#FAF5EC] rounded-lg border border-[#2D4536] transition-colors cursor-pointer"
                                  title="تعديل المنتج"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(prod.id, prod.name)}
                                  className="p-1.5 bg-red-950/50 hover:bg-red-900/60 text-red-300 rounded-lg border border-red-800/50 transition-colors cursor-pointer"
                                  title="حذف المنتج"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SELLER ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-[#121A16] border border-[#213026] p-4 rounded-xl">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#FAF5EC] font-['Cairo']">
                  طلبيات متجرك ({sellerOrders.length})
                </h3>
                <p className="text-xs text-[#8E8070] mt-0.5">
                  هذه الطلبات مخصصة لمنتجات متجرك فقط، قم بتجهيز الطرود وتحديث حالتها
                </p>
              </div>
              <button
                onClick={loadSellerOrders}
                disabled={loadingOrders}
                className="px-3 py-1.5 bg-[#18251E] hover:bg-[#22332A] text-xs font-bold text-[#FAF5EC] rounded-lg border border-[#2B3E32] transition-colors cursor-pointer"
              >
                تحديث القائمة 🔄
              </button>
            </div>

            {loadingOrders ? (
              <div className="p-12 text-center text-[#8E8070] bg-[#121A16] border border-[#213026] rounded-2xl">
                جاري تحميل طلبيات المتجر...
              </div>
            ) : sellerOrders.length === 0 ? (
              <div className="bg-[#121A16] border border-[#213026] rounded-2xl p-12 text-center space-y-3">
                <ShoppingBag className="w-12 h-12 text-[#5A4F42] mx-auto" />
                <h3 className="text-lg font-bold text-[#FAF5EC]">لا توجد طلبات واردة لمنتجاتك حتى الآن</h3>
                <p className="text-xs sm:text-sm text-[#8E8070] max-w-md mx-auto">
                  فور قيام زبون بطلب منتج من متجرك، ستظهر تفاصيل الطلبية والعنوان هنا للتجهيز والشحن.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sellerOrders.map((order) => {
                  // Support both SellerOrder structure and parent Order fallback
                  const orderId = order.id;
                  const parentOrderId = order.parentOrderId || order.orderId;
                  const customerName = order.customerName || order.customer?.fullName || 'زبون';
                  const customerPhone = order.customerPhone || order.customer?.phone || '';
                  const shippingCity = order.shippingCity || order.customer?.city || '';
                  const shippingAddress = order.shippingAddress || order.customer?.address || '';
                  const orderNotes = order.notes || order.customer?.notes;
                  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-MA') : '';
                  const currentStatus = order.status || 'pending';
                  
                  // Items
                  const orderItems = order.items || [];
                  const totalAmount = order.totalAmount ?? orderItems.reduce((acc: number, it: any) => {
                    const price = it.price ?? it.product?.price ?? 0;
                    const qty = it.quantity ?? 1;
                    return acc + price * qty;
                  }, 0);

                  const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
                  const waMessage = `السلام عليكم ورحمة الله أخي ${encodeURIComponent(customerName)}، معكم متجر ${encodeURIComponent(currentStore?.name || 'محل عند سعيد')} بخصوص طلبيتكم رقم #${orderId}. لقد بدأنا تجهيز طردكم للشحن.`;
                  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${waMessage}` : null;

                  return (
                    <div
                      key={orderId}
                      className="bg-[#121A16] border border-[#213026] rounded-2xl p-4 sm:p-6 space-y-4 shadow-lg"
                    >
                      {/* Top Header: Order numbers & status selector */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1E2B23]">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm sm:text-base font-black text-[#F59E0B]">
                              #{orderId}
                            </span>
                            {parentOrderId && (
                              <span className="text-[11px] font-mono text-[#8E8070] bg-[#18231C] px-2 py-0.5 rounded border border-[#233328]">
                                الطلب الرئيسي: #{parentOrderId}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#8E8070] mt-1">
                            تاريخ الطلب: {orderDate}
                          </div>
                        </div>

                        {/* Interactive Status Selector */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#A89C89]">حالة الطلبية:</span>
                          <select
                            value={currentStatus}
                            disabled={updatingOrderId === orderId}
                            onChange={(e) => handleUpdateOrderStatus(orderId, e.target.value)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-hidden cursor-pointer transition-colors ${
                              currentStatus === 'delivered'
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                                : currentStatus === 'shipped'
                                ? 'bg-blue-950/80 text-blue-300 border-blue-700'
                                : currentStatus === 'processing'
                                ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                                : currentStatus === 'cancelled'
                                ? 'bg-red-950/80 text-red-300 border-red-700'
                                : 'bg-[#1C2C23] text-[#FAF5EC] border-[#2D4235]'
                            }`}
                          >
                            <option value="pending" className="bg-[#121A16] text-white">🟡 قيد الانتظار (جديد)</option>
                            <option value="processing" className="bg-[#121A16] text-white">🟠 قيد التجهيز</option>
                            <option value="shipped" className="bg-[#121A16] text-white">🔵 تم الشحن مع شركة التوصيل</option>
                            <option value="delivered" className="bg-[#121A16] text-white">🟢 تم التسليم بنجاح</option>
                            <option value="cancelled" className="bg-[#121A16] text-white">🔴 ملغى</option>
                          </select>
                        </div>
                      </div>

                      {/* Customer Delivery Info Card */}
                      <div className="bg-[#152019] rounded-xl p-3.5 border border-[#223228] text-xs space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1D2B21] pb-2">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-[#D97706]" />
                            <span className="font-bold text-white text-sm">{customerName}</span>
                          </div>

                          {customerPhone && (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[#FAF5EC]" dir="ltr">
                                📞 {customerPhone}
                              </span>
                              {waUrl && (
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold px-2 py-0.5 rounded text-[10px] shadow-xs transition-colors"
                                >
                                  <MessageCircle className="w-3 h-3 fill-current" />
                                  <span>واتساب</span>
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#C4B7A4]">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                            <span>
                              <strong>المدينة:</strong> {shippingCity}
                            </span>
                          </div>
                          <div>
                            <span>
                              <strong>العنوان:</strong> {shippingAddress}
                            </span>
                          </div>
                        </div>

                        {orderNotes && (
                          <div className="text-[11px] text-[#A89C89] bg-[#0E1511] p-2 rounded-lg">
                            <strong>ملاحظات الزبون:</strong> {orderNotes}
                          </div>
                        )}
                      </div>

                      {/* Items list */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-[#8E8070] block">منتجات هذا الطرد:</span>
                        <div className="divide-y divide-[#1B2820] bg-[#152019] rounded-xl p-3 border border-[#223228]">
                          {orderItems.map((item: any, idx: number) => {
                            const pName = item.productName || item.product?.name || 'منتج';
                            const matchedProd = products.find(p => p.id === (item.productId || item.product?.id) || p.name === pName);
                            const isDefaultLogo = (img?: string) => !img || img.includes('WhatsApp_Image_2026-10-28_at_19.35.25_6c594579.jpeg');
                            const rawImg = item.productImage || item.product?.image;
                            const pImg = (!isDefaultLogo(rawImg) ? rawImg : undefined) || matchedProd?.image || rawImg || '/assets/aistudio/WhatsApp_Image_2026-10-28_at_19.35.25_6c594579.jpeg';
                            const pPrice = item.unitPrice ?? item.price ?? item.product?.price ?? 0;
                            const pQty = item.quantity ?? 1;
                            const pTotal = item.totalPrice ?? (pPrice * pQty);

                            return (
                              <div key={idx} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs sm:text-sm">
                                <div className="flex items-center gap-2.5">
                                  {pImg && (
                                    <img
                                      src={pImg}
                                      alt={pName}
                                      className="w-10 h-10 rounded-lg object-cover border border-[#2B3E32] shrink-0"
                                    />
                                  )}
                                  <div>
                                    <span className="font-bold text-[#FAF5EC] font-['Cairo']">{pName}</span>
                                    <div className="text-[11px] text-[#8E8070]">
                                      الكمية: <span className="text-white font-bold">{pQty}</span> × {pPrice} DH
                                    </div>
                                  </div>
                                </div>
                                <span className="font-bold font-mono text-[#F3BA63]">
                                  {pTotal} DH
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Summary row */}
                      <div className="pt-2 border-t border-[#1E2B23] flex items-center justify-between text-xs sm:text-sm">
                        <div className="text-[#8E8070]">
                          طريقة الدفع:{' '}
                          <span className="text-[#FAF5EC] font-bold">
                            {order.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : 'الدفع عند الاستلام'}
                          </span>
                        </div>
                        <div className="font-bold text-sm sm:text-base text-[#FAF5EC]">
                          المجموع الخاص بمتجرك:{' '}
                          <span className="text-[#F59E0B] font-mono font-black text-lg">{totalAmount} DH</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STORE SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-[#121A16] border border-[#213026] rounded-2xl p-6 sm:p-8">
            <form onSubmit={handleSaveStoreSettings} className="max-w-2xl space-y-5">
              <div>
                <h3 className="text-base font-bold text-[#FAF5EC]">تعديل بيانات وهوية المتجر</h3>
                <p className="text-xs text-[#8E8070] mt-0.5">
                  هذه المعلومات تظهر للمتسوقين في صفحة متجرك المستقل وبطاقات منتجاتك في السوق
                </p>
              </div>

              {storeSuccessMsg && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-700 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{storeSuccessMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#C4B7A4] mb-1">اسم المتجر</label>
                  <input
                    type="text"
                    required
                    value={storeForm.name}
                    onChange={(e) => setStoreForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full bg-[#16221B] border border-[#283C30] rounded-xl px-3 py-2 text-sm text-[#FAF5EC] focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#C4B7A4] mb-1">المدينة / الإقليم</label>
                  <input
                    type="text"
                    required
                    value={storeForm.city}
                    onChange={(e) => setStoreForm((p) => ({ ...p, city: e.target.value }))}
                    className="w-full bg-[#16221B] border border-[#283C30] rounded-xl px-3 py-2 text-sm text-[#FAF5EC] focus:outline-none focus:border-[#D97706]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#C4B7A4] mb-1">شعار المتجر اللفظي (Slogan)</label>
                <input
                  type="text"
                  placeholder="مثال: أصالة الزيوت الجبلية وجودة الأعشاب النقية"
                  value={storeForm.slogan}
                  onChange={(e) => setStoreForm((p) => ({ ...p, slogan: e.target.value }))}
                  className="w-full bg-[#16221B] border border-[#283C30] rounded-xl px-3 py-2 text-sm text-[#FAF5EC] focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#C4B7A4] mb-1">نبذة المتجر والتعريف بنشاطه</label>
                <textarea
                  rows={3}
                  value={storeForm.description}
                  onChange={(e) => setStoreForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full bg-[#16221B] border border-[#283C30] rounded-xl px-3 py-2 text-sm text-[#FAF5EC] focus:outline-none focus:border-[#D97706] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#C4B7A4] mb-1">رقم الهاتف / الواتساب للتواصل</label>
                  <input
                    type="tel"
                    value={storeForm.phone}
                    onChange={(e) => setStoreForm((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full bg-[#16221B] border border-[#283C30] rounded-xl px-3 py-2 text-sm text-[#FAF5EC] focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#C4B7A4] mb-1">العنوان أو المقر</label>
                  <input
                    type="text"
                    value={storeForm.address}
                    onChange={(e) => setStoreForm((p) => ({ ...p, address: e.target.value }))}
                    className="w-full bg-[#16221B] border border-[#283C30] rounded-xl px-3 py-2 text-sm text-[#FAF5EC] focus:outline-none focus:border-[#D97706]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#C4B7A4] mb-1">رابط صورة الشعار (Logo URL)</label>
                  <input
                    type="url"
                    value={storeForm.logoUrl}
                    onChange={(e) => setStoreForm((p) => ({ ...p, logoUrl: e.target.value }))}
                    className="w-full bg-[#16221B] border border-[#283C30] rounded-xl px-3 py-2 text-sm text-[#FAF5EC] focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#C4B7A4] mb-1">رابط صورة الغلاف (Banner URL)</label>
                  <input
                    type="url"
                    value={storeForm.bannerUrl}
                    onChange={(e) => setStoreForm((p) => ({ ...p, bannerUrl: e.target.value }))}
                    className="w-full bg-[#16221B] border border-[#283C30] rounded-xl px-3 py-2 text-sm text-[#FAF5EC] focus:outline-none focus:border-[#D97706]"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={savingStore}
                  className="px-6 py-2.5 bg-[#D97706] hover:bg-[#F59E0B] text-[#0A0F0D] font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 text-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingStore ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-fadeIn" dir="rtl">
          <div className="relative w-full max-w-2xl bg-[#0F1612] border border-[#233328] rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="p-6 bg-gradient-to-l from-[#17251E] to-[#0F1612] border-b border-[#233328] flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-[#FAF5EC] font-['Cairo']">
                  {editingProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد لمتجرك'}
                </h3>
                <p className="text-xs text-[#8E8070] mt-0.5">
                  يتم إرسال المنتجات الجديدة والمعدلة لإدارة السوق للمراجعة قبل نشرها
                </p>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-2 text-[#8E8070] hover:text-white bg-[#1A2820] rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {productFormError && (
                <div className="p-3 bg-red-950/50 border border-red-800 rounded-xl text-red-200 text-xs">
                  {productFormError}
                </div>
              )}
              {productFormSuccess && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-700 rounded-xl text-emerald-200 text-xs">
                  {productFormSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#C4B7A4] mb-1">
                    اسم المنتج <span className="text-[#D97706]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: زيت أركان بكر معصور على البارد"
                    value={productForm.name}
                    onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full bg-[#141F19] border border-[#283C30] rounded-xl px-3.5 py-2 text-sm text-[#FAF5EC] focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#C4B7A4] mb-1">
                    التصنيف <span className="text-[#D97706]">*</span>
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm((p) => ({ ...p, category: e.target.value }))}
                    className="w-full bg-[#141F19] border border-[#283C30] rounded-xl px-3.5 py-2 text-sm text-[#FAF5EC] focus:outline-none focus:border-[#D97706]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#C4B7A4] mb-1">
                    السعر (DH) <span className="text-[#D97706]">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="85"
                    value={productForm.price}
                    onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))}
                    className="w-full bg-[#141F19] border border-[#283C30] rounded-xl px-3 py-2 text-sm text-[#FAF5EC] focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#C4B7A4] mb-1">السعر السابق (تخفيض)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="120"
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm((p) => ({ ...p, originalPrice: e.target.value }))}
                    className="w-full bg-[#141F19] border border-[#283C30] rounded-xl px-3 py-2 text-sm text-[#FAF5EC] focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#C4B7A4] mb-1">وحدة البيع</label>
                  <input
                    type="text"
                    placeholder="100 ملل أو 250 غ"
                    value={productForm.unit}
                    onChange={(e) => setProductForm((p) => ({ ...p, unit: e.target.value }))}
                    className="w-full bg-[#141F19] border border-[#283C30] rounded-xl px-3 py-2 text-sm text-[#FAF5EC] focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#C4B7A4] mb-1">كمية المخزون</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.stockQuantity}
                    onChange={(e) => setProductForm((p) => ({ ...p, stockQuantity: e.target.value }))}
                    className="w-full bg-[#141F19] border border-[#283C30] rounded-xl px-3 py-2 text-sm text-[#FAF5EC] focus:outline-none focus:border-[#D97706]"
                  />
                </div>
              </div>

              {/* Product Image */}
              <div>
                <label className="block text-xs font-bold text-[#C4B7A4] mb-1">
                  صورة المنتج <span className="text-[#D97706]">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-[#141F19] border border-[#283C30] flex items-center justify-center overflow-hidden shrink-0">
                    {productForm.image ? (
                      <img src={productForm.image} alt="معاينة" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-[#5A4F42]" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 bg-[#1C2C22] hover:bg-[#253D2F] text-[#FAF5EC] text-xs font-bold px-3 py-1.5 rounded-lg border border-[#2F4738] transition-colors">
                      <Upload className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>{uploadingImage ? 'جاري الرفع...' : 'رفع صورة من الجهاز'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                    <input
                      type="url"
                      placeholder="أو ضع رابط مباشر للصورة"
                      value={productForm.image}
                      onChange={(e) => setProductForm((p) => ({ ...p, image: e.target.value }))}
                      className="w-full bg-[#141F19] border border-[#283C30] rounded-lg px-3 py-1.5 text-xs text-[#FAF5EC] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#C4B7A4] mb-1">وصف موجز للمنتج</label>
                <input
                  type="text"
                  placeholder="وصف سريع يظهر أسفل عنوان المنتج (أول كلمتين)"
                  value={productForm.shortDescription}
                  onChange={(e) => setProductForm((p) => ({ ...p, shortDescription: e.target.value }))}
                  className="w-full bg-[#141F19] border border-[#283C30] rounded-xl px-3.5 py-2 text-xs text-[#FAF5EC] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#C4B7A4] mb-1">الوصف التفصيلي والفوائد</label>
                <textarea
                  rows={3}
                  placeholder="اشرح فوائد المنتج، مكوناته، وطريقة استخلاصه..."
                  value={productForm.description}
                  onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full bg-[#141F19] border border-[#283C30] rounded-xl px-3.5 py-2 text-xs text-[#FAF5EC] focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#C4B7A4] mb-1">منطقة الأصل / المصدر</label>
                  <input
                    type="text"
                    placeholder="مثال: تارودانت، تالوين، سوس، الأطلس المتوسط"
                    value={productForm.origin}
                    onChange={(e) => setProductForm((p) => ({ ...p, origin: e.target.value }))}
                    className="w-full bg-[#141F19] border border-[#283C30] rounded-xl px-3.5 py-2 text-xs text-[#FAF5EC] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#C4B7A4] mb-1">طريقة الاستعمال (اختياري)</label>
                  <input
                    type="text"
                    placeholder="مثال: قطرات صباحاً ومساءً على بشرة نظيفة"
                    value={productForm.instructions}
                    onChange={(e) => setProductForm((p) => ({ ...p, instructions: e.target.value }))}
                    className="w-full bg-[#141F19] border border-[#283C30] rounded-xl px-3.5 py-2 text-xs text-[#FAF5EC] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-[#FAF5EC] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.inStock}
                    onChange={(e) => setProductForm((p) => ({ ...p, inStock: e.target.checked }))}
                    className="rounded accent-[#D97706]"
                  />
                  <span>المنتج متوفر في المخزون</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-[#FAF5EC] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isOrganic}
                    onChange={(e) => setProductForm((p) => ({ ...p, isOrganic: e.target.checked }))}
                    className="rounded accent-[#D97706]"
                  />
                  <span>منتج طبيعي وبيولوجي 100%</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#233328]">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#8E8070] hover:text-white bg-[#141E18] rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className="px-6 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#D97706] to-[#B45309] rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingProduct ? 'جاري الحفظ...' : editingProduct ? 'حفظ التعديلات' : 'إرسال المنتج للمراجعة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
