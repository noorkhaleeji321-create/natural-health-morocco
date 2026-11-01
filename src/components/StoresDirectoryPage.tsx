import React, { useState, useMemo } from 'react';
import {
  Store,
  MapPin,
  ShieldCheck,
  Star,
  Search,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Package,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { StoreEntity } from '../types';

interface StoresDirectoryPageProps {
  onSelectStore: (slug: string) => void;
  onOpenSellerApply: () => void;
  onBackToHome: () => void;
}

export const StoresDirectoryPage: React.FC<StoresDirectoryPageProps> = ({
  onSelectStore,
  onOpenSellerApply,
  onBackToHome,
}) => {
  const { stores, products, currentSeller } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');

  // Filter active stores
  const activeStores = useMemo(() => {
    return stores.filter((s) => s.status === 'active');
  }, [stores]);

  // Unique cities from active stores
  const cities = useMemo(() => {
    const set = new Set<string>();
    activeStores.forEach((s) => {
      if (s.city) set.add(s.city);
    });
    return Array.from(set);
  }, [activeStores]);

  // Filtered stores
  const filteredStores = useMemo(() => {
    return activeStores.filter((store) => {
      const matchSearch =
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (store.slogan && store.slogan.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (store.description && store.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCity = selectedCity === 'all' || store.city === selectedCity;
      return matchSearch && matchCity;
    });
  }, [activeStores, searchQuery, selectedCity]);

  // Count products per store
  const getProductCount = (store: StoreEntity) => {
    return products.filter(
      (p) => (p.storeId === store.id || p.sellerId === store.sellerId) && (!p.status || p.status === 'approved')
    ).length;
  };

  return (
    <div className="min-h-screen bg-[#080C0A] text-[#FAF5EC] py-8 sm:py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#1E2E24]">
          <div>
            <button
              onClick={onBackToHome}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#A89C89] hover:text-[#FAF5EC] mb-2 cursor-pointer transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة للرئيسية</span>
            </button>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[#F59E0B] bg-[#D97706]/15 px-3 py-0.5 rounded-full border border-[#D97706]/30">
                سوق التجار والتعاونيات 🏪
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black font-['Cairo'] text-[#FAF5EC]">
              المتاجر والتعاونيات الشريكة
            </h1>
            <p className="text-xs sm:text-sm text-[#A89C89] mt-1 max-w-2xl">
              استكشف متاجر أمهر العطّارين والنحّالين والتعاونيات الحرفية المغربية المعتمدة، وتسوق مباشرة من مصادر الطبيعة الأصيلة.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenSellerApply}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#F59E0B] hover:to-[#D97706] text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-[#D97706]/20 transition-all cursor-pointer text-xs sm:text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{currentSeller ? 'لوحة تحكم متجري' : 'انضم كبائع وافتح متجرك'}</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#121A16] border border-[#213026] p-4 rounded-xl">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#665D50] absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث باسم المتجر أو التخصص..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#16221B] border border-[#2B3E32] rounded-lg pr-9 pl-3 py-2 text-xs sm:text-sm text-[#FAF5EC] placeholder-[#665D50] focus:outline-none focus:border-[#D97706]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-[#8E8070] shrink-0">المدينة:</span>
            <button
              onClick={() => setSelectedCity('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                selectedCity === 'all'
                  ? 'bg-[#D97706] text-white'
                  : 'bg-[#18241D] text-[#A89C89] hover:bg-[#223328]'
              }`}
            >
              الكل ({activeStores.length})
            </button>
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                  selectedCity === city
                    ? 'bg-[#D97706] text-white'
                    : 'bg-[#18241D] text-[#A89C89] hover:bg-[#223328]'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Stores Grid */}
        {filteredStores.length === 0 ? (
          <div className="bg-[#121A16] border border-[#213026] rounded-2xl p-12 text-center space-y-3">
            <Store className="w-12 h-12 text-[#5A4F42] mx-auto" />
            <h3 className="text-lg font-bold text-[#FAF5EC]">لم يتم العثور على متاجر مطابقة للبحث</h3>
            <p className="text-xs text-[#8E8070]">جرب البحث بكلمات أخرى أو اختر مدينة مختلفة</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.map((store) => {
              const productCount = getProductCount(store);
              return (
                <div
                  key={store.id}
                  onClick={() => onSelectStore(store.slug)}
                  className="group bg-[#121A16] border border-[#233328] hover:border-[#D97706]/70 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between cursor-pointer hover:-translate-y-1"
                >
                  {/* Banner image */}
                  <div className="relative h-32 w-full overflow-hidden bg-[#15201A]">
                    {store.bannerUrl ? (
                      <img
                        src={store.bannerUrl}
                        alt={store.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-[#17271F] to-[#0E1712]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121A16] via-transparent to-black/20" />

                    {/* Store Logo floating */}
                    <div className="absolute -bottom-3 right-4 w-14 h-14 rounded-xl bg-[#142018] border-2 border-[#D97706]/40 overflow-hidden flex items-center justify-center shadow-lg">
                      {store.logoUrl ? (
                        <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-7 h-7 text-[#F59E0B]" />
                      )}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 pt-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-base text-[#FAF5EC] group-hover:text-[#F59E0B] transition-colors line-clamp-1">
                            {store.name}
                          </h3>
                          <span title="معتمد">
                            <ShieldCheck className="w-4 h-4 text-[#22C55E] shrink-0" />
                          </span>
                        </div>
                        {store.rating && (
                          <span className="flex items-center gap-0.5 text-xs text-[#F59E0B] font-bold">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{store.rating.toFixed(1)}</span>
                          </span>
                        )}
                      </div>

                      {store.slogan && (
                        <p className="text-xs text-[#F3BA63] font-medium line-clamp-1 mb-2">
                          {store.slogan}
                        </p>
                      )}

                      {store.description && (
                        <p className="text-xs text-[#8E8070] line-clamp-2 leading-relaxed">
                          {store.description}
                        </p>
                      )}
                    </div>

                    {/* Footer stats */}
                    <div className="pt-4 mt-4 border-t border-[#1F2C24] flex items-center justify-between text-xs text-[#A89C89]">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>{store.city || 'المغرب'}</span>
                      </div>

                      <div className="flex items-center gap-1 text-[#4ADE80] font-bold">
                        <Package className="w-3.5 h-3.5" />
                        <span>{productCount} منتجات</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
