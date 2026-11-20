import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  X,
  ArrowUpDown,
  SlidersHorizontal,
  RotateCcw,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import { useStore } from '../context/StoreContext';
import { updateCategorySeo, updatePageSeo } from '../utils/seo';
import { preloadImages, sortProductsByDisplayOrder } from '../lib/utils';

interface ProductsPageProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  initialCategory?: string | null;
}

type SortOption = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'rating';

const STORE_POPULAR_TERMS = [
  'سنام الجمل',
  'الحلبة',
  'السدر',
  'سم النحل',
  'المفاصل',
  'الكولاجين',
  'الكركم',
  'العكر الفاسي',
];

export const ProductsPage: React.FC<ProductsPageProps> = ({
  products,
  onAddToCart,
  onViewProduct,
  initialCategory = null,
}) => {
  const { categories, isLoadingProducts } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [visibleCount, setVisibleCount] = useState<number>(20);

  // Sync category filter whenever route prop changes
  useEffect(() => {
    setSelectedCategory(initialCategory ?? null);
  }, [initialCategory]);

  // Reset pagination to first 20 products whenever category, search, or sorting changes
  useEffect(() => {
    setVisibleCount(20);
  }, [selectedCategory, searchQuery, sortBy]);

  // Compute authentic popular search keywords guaranteed to exist in the current catalog
  const quickSearchTags = useMemo(() => {
    if (!products || products.length === 0) {
      return STORE_POPULAR_TERMS.slice(0, 6);
    }

    const matched = STORE_POPULAR_TERMS.filter((term) => {
      const q = term.toLowerCase();
      return products.some(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    });

    if (matched.length >= 4) {
      return matched;
    }

    // Fallback to clean short titles extracted from actual products if store items change
    const dynamicFallbacks = products
      .slice(0, 6)
      .map((p) => p.name.trim().split(/\s+/).slice(0, 2).join(' '))
      .filter((t) => t.length >= 3);

    return Array.from(new Set([...matched, ...dynamicFallbacks])).slice(0, 6);
  }, [products]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // 1. Category Filter
    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.origin && p.origin.toLowerCase().includes(q))
      );
    }

    // 3. Sorting (الترتيب المعتمد من الإدارة، الأحدث، السعر، التقييم)
    switch (sortBy) {
      case 'featured':
        result = sortProductsByDisplayOrder(result);
        break;

      case 'newest':
        result.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          if (a.isNew && !b.isNew) return -1;
          if (!a.isNew && b.isNew) return 1;
          return 0;
        });
        break;

      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;

      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;

      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;

      default:
        break;
    }

    return result;
  }, [products, selectedCategory, searchQuery, sortBy]);

  // Pre-compute category counts in one O(n) pass
  const categoryCountMap = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      if (p.category) {
        counts.set(p.category, (counts.get(p.category) || 0) + 1);
      }
    }
    return counts;
  }, [products]);

  // Dynamic SEO sync for Category or All Products catalog view
  useEffect(() => {
    if (selectedCategory) {
      const cat = categories.find((c) => c.name === selectedCategory || c.slug === selectedCategory);
      const slug = cat ? cat.slug : encodeURIComponent(selectedCategory);
      updateCategorySeo(selectedCategory, slug, filteredAndSortedProducts.length);
    } else {
      updatePageSeo('products');
    }
  }, [selectedCategory, categories, filteredAndSortedProducts.length]);

  useEffect(() => {
    const visibleUrls = filteredAndSortedProducts.slice(0, visibleCount).map((p) => p.image);
    if (visibleUrls.length > 0) {
      preloadImages(visibleUrls);
    }
  }, [filteredAndSortedProducts, visibleCount]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSortBy('featured');
  };

  const isFilteringActive = searchQuery.trim() !== '' || selectedCategory !== null || sortBy !== 'featured';

  return (
    <div className="min-h-screen bg-[#080C0A] text-[#FAF5EC] pb-14 sm:pb-20">
      {/* Editorial Catalog Header */}
      <header className="border-b border-[#19241E] bg-[#0B100D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-[#D97706]">
                <span>كتالوج المنتجات الطبيعية الأصيلة</span>
                <span aria-hidden="true" className="text-[#3A4D41]">·</span>
                <span className="text-[#A89C89] tabular-nums">{products.length} منتج معتمد</span>
              </div>

              <h1
                className="text-2xl sm:text-4xl lg:text-[2.65rem] font-black text-[#FAF5EC] font-['Cairo'] tracking-tight leading-tight"
                style={{ textWrap: 'balance' }}
              >
                {selectedCategory ? selectedCategory : 'مجموعة Natural Health Morocco'}
              </h1>

              <p className="text-sm sm:text-[15px] text-[#A89C89] leading-relaxed">
                {selectedCategory
                  ? `تصفح تشكيلة ${selectedCategory} المختارة بعناية من أجود التركيبات الطبيعية مع التوصيل السريع والدفع عند الاستلام.`
                  : 'زيوت نباتية نقية، خلطات صحراوية أصيلة، ومراهم طبيعية للعناية بالصحة والمفاصل والبشرة والشعر.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#9C907E] border-t lg:border-t-0 border-[#19241E] pt-4 lg:pt-0 shrink-0">
              <span className="inline-flex items-center gap-1.5 text-[#C7BCAE]">
                <ShieldCheck className="w-4 h-4 text-[#D97706] shrink-0" />
                <span>منتجات طبيعية 100%</span>
              </span>
              <span aria-hidden="true" className="text-[#2D3E34]">|</span>
              <span>توصيل لجميع المدن المغربية</span>
              <span aria-hidden="true" className="text-[#2D3E34]">|</span>
              <span>الدفع عند الاستلام</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        {/* Refined Catalog Filter & Search Bar */}
        <section
          aria-label="أدوات البحث والتصفية"
          className="bg-[#0E1511] border border-[#1E2B24] rounded-2xl p-4 sm:p-6 space-y-5"
        >
          {/* Search + Sort Row */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <label htmlFor="catalog-search-input" className="sr-only">
                البحث في كتالوج المنتجات
              </label>
              <input
                id="catalog-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن منتج، عشبة، زيت أو كريم (مثال: سنام الجمل، الحلبة، السدر...)"
                className="w-full h-11 sm:h-12 bg-[#131C17] text-[#FAF5EC] pl-11 pr-11 rounded-xl border border-[#25362C] focus:outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/25 text-sm placeholder:text-[#74857A] transition-colors"
              />
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#7D8F84] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-[#213027] hover:bg-[#2C4034] text-[#FAF5EC] flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="مسح البحث"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="relative flex items-center gap-2.5 h-11 sm:h-12 bg-[#131C17] border border-[#25362C] hover:border-[#344A3D] rounded-xl px-3.5 shrink-0 transition-colors">
              <ArrowUpDown className="w-4 h-4 text-[#D97706] shrink-0" />
              <label htmlFor="sort-select" className="text-xs font-semibold text-[#9B8F7E] whitespace-nowrap">
                الترتيب:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none bg-transparent pl-5 text-xs sm:text-sm font-bold text-[#FAF5EC] focus:outline-none cursor-pointer"
              >
                <option value="featured" className="bg-[#111914] text-[#FAF5EC]">
                  الترتيب المعتمد (الأبرز)
                </option>
                <option value="newest" className="bg-[#111914] text-[#FAF5EC]">
                  الأحدث أولاً
                </option>
                <option value="price-asc" className="bg-[#111914] text-[#FAF5EC]">
                  السعر: من الأقل للأعلى
                </option>
                <option value="price-desc" className="bg-[#111914] text-[#FAF5EC]">
                  السعر: من الأعلى للأقل
                </option>
                <option value="rating" className="bg-[#111914] text-[#FAF5EC]">
                  الأعلى تقييماً
                </option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#7D8F84] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Authentic Popular Search Keywords */}
          {quickSearchTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[#8C7F6E] font-medium whitespace-nowrap ml-1">
                الأكثر بحثاً:
              </span>
              {quickSearchTags.map((tag) => {
                const isActive = searchQuery.trim() === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSearchQuery(isActive ? '' : tag)}
                    className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#D97706] text-white border-[#D97706]'
                        : 'bg-[#131C17] text-[#CFC3B1] border-[#233229] hover:border-[#D97706]/50 hover:text-white'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          )}

          {/* Category Filter Tabs */}
          <div className="pt-4 border-t border-[#1A2620] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#E5DDD0] inline-flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#D97706]" />
                <span>التصنيفات</span>
              </span>

              {isFilteringActive && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F59E0B] hover:text-[#FBBF24] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة ضبط</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className={`min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 border transition-colors flex items-center gap-2 cursor-pointer ${
                  selectedCategory === null
                    ? 'bg-[#D97706] text-white border-[#D97706]'
                    : 'bg-[#131C17] text-[#C8BCAA] border-[#233229] hover:text-white hover:border-[#344A3D]'
                }`}
              >
                <span>جميع المنتجات</span>
                <span
                  className={`text-[11px] tabular-nums ${
                    selectedCategory === null ? 'text-white/85' : 'text-[#847969]'
                  }`}
                >
                  {products.length}
                </span>
              </button>

              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.name;
                const count = categoryCountMap.get(cat.name) || 0;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(isSelected ? null : cat.name)}
                    className={`min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 border transition-colors flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-[#D97706] text-white border-[#D97706]'
                        : 'bg-[#131C17] text-[#C8BCAA] border-[#233229] hover:text-white hover:border-[#344A3D]'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span
                      className={`text-[11px] tabular-nums ${
                        isSelected ? 'text-white/85' : 'text-[#847969]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clean Results Summary Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#18221D] text-xs text-[#958877]">
            <div className="flex flex-wrap items-center gap-2">
              <span>النتائج:</span>
              <strong className="text-[#FAF5EC] tabular-nums">
                {filteredAndSortedProducts.length} من أصل {products.length} منتج
              </strong>

              {selectedCategory && (
                <>
                  <span aria-hidden="true" className="text-[#324339]">/</span>
                  <span className="inline-flex items-center gap-1.5 text-[#F3BA63] font-medium">
                    <span>{selectedCategory}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(null)}
                      aria-label="إزالة تصفية التصنيف"
                      className="text-[#958877] hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                </>
              )}

              {searchQuery.trim() && (
                <>
                  <span aria-hidden="true" className="text-[#324339]">/</span>
                  <span className="inline-flex items-center gap-1.5 text-[#F3BA63] font-medium">
                    <span>&ldquo;{searchQuery.trim()}&rdquo;</span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="إزالة نص البحث"
                      className="text-[#958877] hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                </>
              )}
            </div>

            <span className="text-[#889B8F] hidden sm:inline">
              عرض {Math.min(visibleCount, filteredAndSortedProducts.length)} منتج في الصفحة الحالية
            </span>
          </div>
        </section>

        {/* Products Grid */}
        {isLoadingProducts ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            <ProductCardSkeleton count={8} />
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="bg-[#0E1511] rounded-2xl border border-[#223229] p-10 sm:p-16 text-center max-w-lg mx-auto space-y-4">
            <div className="w-14 h-14 rounded-xl bg-[#15201A] text-[#87988D] flex items-center justify-center mx-auto border border-[#24352B]">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-xl font-bold text-[#FAF5EC] font-['Cairo']">
                لم يتم العثور على منتجات مطابقة
              </h2>
              <p className="text-xs sm:text-sm text-[#A89C89] leading-relaxed">
                جرّب البحث بكلمة أخرى أو اختر تصنيفاً مختلفاً لاستعراض جميع منتجات المتجر.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="min-h-[44px] bg-[#D97706] hover:bg-[#B45309] text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              عرض جميع المنتجات ({products.length})
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredAndSortedProducts.slice(0, visibleCount).map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onViewDetails={onViewProduct}
                  priority={index < 4}
                  eager
                  lowPriority={index >= 8}
                />
              ))}
            </div>

            {/* Load More Pagination (20 by 20 progressive reveal) */}
            {visibleCount < filteredAndSortedProducts.length && (
              <div className="pt-6 sm:pt-10 border-t border-[#18221D] text-center space-y-3">
                <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-[#A89C89] tabular-nums">
                  <span>تم عرض</span>
                  <span className="font-bold text-[#F3BA63]">
                    {Math.min(visibleCount, filteredAndSortedProducts.length)}
                  </span>
                  <span>من أصل</span>
                  <span className="font-bold text-[#FAF5EC]">{filteredAndSortedProducts.length}</span>
                  <span>منتج</span>
                </div>

                <div className="w-48 sm:w-64 h-1 bg-[#1A251F] rounded-full mx-auto overflow-hidden">
                  <div
                    className="h-full bg-[#D97706] transition-all duration-300 rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round((visibleCount / filteredAndSortedProducts.length) * 100))}%`,
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 20)}
                  className="min-h-[44px] inline-flex items-center justify-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-xs sm:text-sm px-8 py-3 rounded-xl transition-colors cursor-pointer"
                >
                  <span>
                    إظهار المزيد من المنتجات ({Math.min(20, filteredAndSortedProducts.length - visibleCount)} إضافية)
                  </span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
