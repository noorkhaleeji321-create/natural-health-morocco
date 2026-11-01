import React, { useState, useEffect, useMemo } from 'react';
import {
  Store,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Search,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  PackageCheck,
  CheckCircle,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product, StoreEntity, Seller } from '../types';
import { ProductCard } from './ProductCard';
import { api } from '../lib/api';

interface StorePageProps {
  storeSlug: string;
  onBack: () => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onViewProduct: (product: Product) => void;
}

export const StorePage: React.FC<StorePageProps> = ({
  storeSlug,
  onBack,
  onAddToCart,
  onViewProduct,
}) => {
  const { stores, sellers, products } = useStore();

  const [loading, setLoading] = useState(false);
  const [remoteStore, setRemoteStore] = useState<StoreEntity | null>(null);
  const [remoteSeller, setRemoteSeller] = useState<Seller | null>(null);
  const [remoteProducts, setRemoteProducts] = useState<Product[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Match from context or fetch from backend API
  const contextStore = useMemo(() => {
    return stores.find((s) => s.slug === storeSlug || s.id === storeSlug) || null;
  }, [stores, storeSlug]);

  const contextSeller = useMemo(() => {
    if (!contextStore) return null;
    return sellers.find((sel) => sel.id === contextStore.sellerId) || null;
  }, [contextStore, sellers]);

  useEffect(() => {
    // If not found in context or to ensure fresh data:
    let isMounted = true;
    setLoading(true);
    api.getStoreBySlug(storeSlug).then((data) => {
      if (isMounted && data) {
        setRemoteStore(data.store);
        if (data.seller) setRemoteSeller(data.seller);
        if (data.products) setRemoteProducts(data.products);
      }
      if (isMounted) setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [storeSlug]);

  const activeStore = remoteStore || contextStore;
  const activeSeller = remoteSeller || contextSeller;

  // Aggregate products for this store
  const storeProducts = useMemo(() => {
    if (!activeStore) return [];
    // From context products matching storeId or sellerId
    const matchingFromContext = products.filter(
      (p) =>
        (p.storeId && p.storeId === activeStore.id) ||
        (p.sellerId && p.sellerId === activeStore.sellerId)
    );
    // Combine with remote products without duplicates
    const map = new Map<string, Product>();
    matchingFromContext.forEach((p) => map.set(p.id, p));
    remoteProducts.forEach((p) => map.set(p.id, p));
    
    // Only show approved products to public visitors
    return Array.from(map.values()).filter((p) => !p.status || p.status === 'approved');
  }, [activeStore, products, remoteProducts]);

  // Categories present in this store
  const storeCategories = useMemo(() => {
    const set = new Set<string>();
    storeProducts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [storeProducts]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return storeProducts.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCat =
        selectedCategory === 'all' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [storeProducts, searchQuery, selectedCategory]);

  if (loading && !activeStore) {
    return (
      <div className="min-h-[60vh] bg-[#080C0A] text-[#FAF5EC] flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#D97706]/30 border-t-[#D97706] rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[#A89C89]">جاري تحميل بيانات المتجر ومنتجاته...</p>
        </div>
      </div>
    );
  }

  if (!activeStore) {
    return (
      <div className="min-h-[60vh] bg-[#080C0A] text-[#FAF5EC] flex items-center justify-center p-8" dir="rtl">
        <div className="max-w-md w-full bg-[#121A16] border border-[#233328] rounded-2xl p-8 text-center space-y-4">
          <Store className="w-12 h-12 text-[#6E6354] mx-auto" />
          <h2 className="text-xl font-bold font-['Cairo']">المتجر غير موجود أو غير متاح</h2>
          <p className="text-xs text-[#8E8070]">
            قد يكون المتجر قيد المراجعة أو تم تعديل رابطه التعريفي.
          </p>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 bg-[#D97706] hover:bg-[#F59E0B] text-[#0A0F0D] font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer text-xs"
          >
            <ArrowRight className="w-4 h-4" />
            العودة للمتجر الرئيسي
          </button>
        </div>
      </div>
    );
  }

  const cleanPhone = (activeStore.phone || activeSeller?.phone || '').replace(/\D/g, '');
  const whatsappUrl = cleanPhone
    ? `https://wa.me/212${cleanPhone.replace(/^0/, '')}?text=${encodeURIComponent(
        `السلام عليكم، أتواصل معك بخصوص متجرك "${activeStore.name}" على منصة محل عند سعيد`
      )}`
    : null;

  return (
    <div className="min-h-screen bg-[#080C0A] text-[#FAF5EC] pb-16" dir="rtl">
      
      {/* Store Banner Hero */}
      <div className="relative h-48 sm:h-64 lg:h-72 w-full overflow-hidden bg-[#101814] border-b border-[#213026]">
        {activeStore.bannerUrl ? (
          <img
            src={activeStore.bannerUrl}
            alt={activeStore.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#14231B] via-[#101914] to-[#0A100D]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080C0A] via-[#080C0A]/60 to-transparent" />

        {/* Back Button */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 bg-[#0C1410]/80 hover:bg-[#15241C] text-[#FAF5EC] text-xs font-bold px-3.5 py-2 rounded-xl border border-[#25392D] backdrop-blur-xs transition-all cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للسوق</span>
          </button>
        </div>
      </div>

      {/* Store Profile Card Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20 relative z-10">
        <div className="bg-[#121A16] border border-[#24362B] rounded-2xl p-6 sm:p-7 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div className="flex items-start sm:items-center gap-4 sm:gap-5">
              {/* Store Logo */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#16241C] border-2 border-[#D97706]/50 shadow-xl overflow-hidden flex items-center justify-center shrink-0">
                {activeStore.logoUrl ? (
                  <img
                    src={activeStore.logoUrl}
                    alt={activeStore.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Store className="w-10 h-10 text-[#F59E0B]" />
                )}
              </div>

              {/* Store Info */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-[#F59E0B] bg-[#D97706]/15 px-2.5 py-0.5 rounded-full border border-[#D97706]/30">
                    متجر شريك معتمد
                  </span>
                  {activeStore.rating && (
                    <div className="flex items-center gap-1 text-xs text-[#F59E0B] font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{activeStore.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black font-['Cairo'] text-[#FAF5EC] flex items-center gap-2">
                  <span>{activeStore.name}</span>
                  <span title="متجر معتمد وموثوق">
                    <ShieldCheck className="w-6 h-6 text-[#22C55E]" />
                  </span>
                </h1>

                {activeStore.slogan && (
                  <p className="text-xs sm:text-sm text-[#F3BA63] font-medium">
                    {activeStore.slogan}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-[#A89C89] flex-wrap pt-0.5">
                  {activeStore.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>{activeStore.city}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <PackageCheck className="w-3.5 h-3.5 text-[#22C55E]" />
                    <span>{storeProducts.length} منتجات معروضة للبيع</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Contact Actions */}
            <div className="flex items-center gap-3 shrink-0">
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#1F3D2B] hover:bg-[#285038] text-[#4ADE80] text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl border border-[#2E5E40] transition-colors shadow-md"
                >
                  <Phone className="w-4 h-4" />
                  <span>تواصل عبر الواتساب</span>
                </a>
              )}
            </div>

          </div>

          {/* Description / Story */}
          {activeStore.description && (
            <div className="mt-5 pt-5 border-t border-[#1F2E25] text-xs sm:text-sm text-[#C8BAA7] leading-relaxed">
              {activeStore.description}
            </div>
          )}
        </div>
      </div>

      {/* Store Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        
        {/* Controls Bar: Categories & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#121A16] border border-[#213026] p-4 rounded-xl">
          
          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#D97706] text-white'
                  : 'bg-[#18241D] text-[#A89C89] hover:bg-[#223328]'
              }`}
            >
              جميع منتجات المتجر ({storeProducts.length})
            </button>
            {storeCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#D97706] text-white'
                    : 'bg-[#18241D] text-[#A89C89] hover:bg-[#223328]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-[#665D50] absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث في منتجات هذا المتجر..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#16221B] border border-[#2B3E32] rounded-lg pr-9 pl-3 py-2 text-xs sm:text-sm text-[#FAF5EC] placeholder-[#665D50] focus:outline-none focus:border-[#D97706]"
            />
          </div>

        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-[#121A16] border border-[#213026] rounded-2xl p-12 text-center space-y-3">
            <ShoppingBag className="w-12 h-12 text-[#5A4F42] mx-auto" />
            <h3 className="text-lg font-bold text-[#FAF5EC]">لا توجد منتجات مطابقة في هذا المتجر حالياً</h3>
            <p className="text-xs text-[#8E8070]">
              جرب تغيير خيارات البحث أو استعراض كل التصنيفات.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onViewDetails={onViewProduct}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
