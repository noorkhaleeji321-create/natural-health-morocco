import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Sparkles,
  ShoppingBag,
  Filter,
  Layers,
  Check,
} from 'lucide-react';
import { Product, Category } from '../types';
import { ProductCard } from './ProductCard';
import { categories } from '../data/storeData';

interface ProductsPageProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  initialCategory?: string | null;
}

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'rating';

export const ProductsPage: React.FC<ProductsPageProps> = ({
  products,
  onAddToCart,
  onViewProduct,
  initialCategory = null,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Popular search tags for quick filtering
  const quickSearchTags = ['زعفران', 'عسل الدغموس', 'أركان', 'رأس الحانوت', 'غاسول', 'لويزة'];

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

    // 3. Sorting (الأحدث، السعر من الأقل للأعلى، السعر من الأعلى للأقل)
    switch (sortBy) {
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

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSortBy('newest');
  };

  const isFilteringActive = searchQuery.trim() !== '' || selectedCategory !== null || sortBy !== 'newest';

  return (
    <div className="min-h-screen bg-[#080C0A] text-[#FAF5EC] py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2 sm:space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#1A2620] text-[#F3BA63] px-3.5 py-1 rounded-full text-xs font-bold border border-[#D97706]/30">
            <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
            <span>كتالوج المنتجات الطبيعية الأصيلة</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#FAF5EC] font-['Cairo'] tracking-tight">
            جميع منتجات محل عند سعيد
          </h1>

          <p className="text-xs sm:text-base text-[#A89C89] leading-relaxed max-w-2xl mx-auto">
            تصفح أجود ما تجود به الطبيعة المغربية: عسل حر، توابل ملكية، زيوت نادرة، أعشاب جبلية، ومستحضرات الحمام المغربي التقليدي.
          </p>
        </div>

        {/* Search, Filter & Sort Controls Box */}
        <div className="bg-[#111814] rounded-2xl sm:rounded-3xl border border-[#223329] p-4 sm:p-6 shadow-xl space-y-5">
          
          {/* Top Row: Search Input + Sorting Selector */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 sm:gap-4">
            
            {/* Search Bar */}
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم، المكونات، أو المنشأ (مثال: زعفران، عسل، أركان...)"
                className="w-full bg-[#16221B] text-[#FAF5EC] pl-10 pr-11 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-[#2B3E32] focus:outline-hidden focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20 text-xs sm:text-sm placeholder:text-[#7A8C82] transition-all"
              />
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#7A8C82] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs bg-[#2B3E32] hover:bg-[#3B5444] text-[#FAF5EC] rounded-full w-5 h-5 flex items-center justify-center transition-colors"
                  aria-label="مسح البحث"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Sort Selector Dropdown */}
            <div className="flex items-center gap-2 bg-[#16221B] border border-[#2B3E32] rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 shrink-0">
              <ArrowUpDown className="w-4 h-4 text-[#D97706] shrink-0" />
              <label htmlFor="sort-select" className="text-xs font-bold text-[#A89C89] whitespace-nowrap">
                الترتيب:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-xs sm:text-sm font-bold text-[#FAF5EC] focus:outline-hidden cursor-pointer"
              >
                <option value="newest" className="bg-[#121A16] text-[#FAF5EC]">
                  الأحدث أولاً
                </option>
                <option value="price-asc" className="bg-[#121A16] text-[#FAF5EC]">
                  السعر: من الأقل للأعلى ↗
                </option>
                <option value="price-desc" className="bg-[#121A16] text-[#FAF5EC]">
                  السعر: من الأعلى للأقل ↘
                </option>
                <option value="rating" className="bg-[#121A16] text-[#FAF5EC]">
                  الأعلى تقييماً ⭐
                </option>
              </select>
            </div>

          </div>

          {/* Quick Search Chips */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs">
            <span className="text-[#8C7E6D] text-[11px] sm:text-xs">كلمات شائعة:</span>
            {quickSearchTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSearchQuery(tag)}
                className={`text-[11px] sm:text-xs px-2.5 py-1 rounded-full border transition-all ${
                  searchQuery === tag
                    ? 'bg-[#D97706] text-white border-[#D97706]'
                    : 'bg-[#16221B] text-[#C4B8A6] border-[#293A30] hover:border-[#D97706]/50 hover:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Category Filter Pills (تصفية حسب التصنيف) */}
          <div className="pt-3 border-t border-[#1E2D25] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#FAF5EC] flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[#D97706]" />
                <span>تصفية حسب التصنيف:</span>
              </span>

              {isFilteringActive && (
                <button
                  onClick={handleResetFilters}
                  className="text-[11px] text-[#F59E0B] hover:text-[#FBBF24] font-medium underline"
                >
                  إلغاء جميع الفلاتر
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#25372E] scrollbar-track-transparent">
              {/* All Categories Button */}
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 border ${
                  selectedCategory === null
                    ? 'bg-[#D97706] text-white border-[#F59E0B]/50 shadow-md'
                    : 'bg-[#16221B] text-[#C4B8A6] border-[#283C30] hover:text-white hover:bg-[#1D2B22]'
                }`}
              >
                <span>جميع المنتجات</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === null ? 'bg-black/30' : 'bg-[#223128]'}`}>
                  {products.length}
                </span>
              </button>

              {/* Individual Categories */}
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.name;
                const categoryProductsCount = products.filter((p) => p.category === cat.name).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 border ${
                      isSelected
                        ? 'bg-[#D97706] text-white border-[#F59E0B]/50 shadow-md'
                        : 'bg-[#16221B] text-[#C4B8A6] border-[#283C30] hover:text-white hover:bg-[#1D2B22]'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-black/30' : 'bg-[#223128]'}`}>
                      {categoryProductsCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Filter Indicators Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1B2921] text-xs text-[#8C7E6D]">
            <div className="flex items-center gap-2 flex-wrap">
              <span>يتم عرض:</span>
              <span className="font-bold text-[#FAF5EC]">
                {filteredAndSortedProducts.length} من {products.length} منتج
              </span>

              {selectedCategory && (
                <span className="inline-flex items-center gap-1 bg-[#1A2820] text-[#F3BA63] px-2.5 py-0.5 rounded-full border border-[#D97706]/30 text-[11px]">
                  التصنيف: {selectedCategory}
                  <button onClick={() => setSelectedCategory(null)} className="hover:text-white">
                    ✕
                  </button>
                </span>
              )}

              {searchQuery && (
                <span className="inline-flex items-center gap-1 bg-[#1A2820] text-[#F3BA63] px-2.5 py-0.5 rounded-full border border-[#D97706]/30 text-[11px]">
                  البحث: &ldquo;{searchQuery}&rdquo;
                  <button onClick={() => setSearchQuery('')} className="hover:text-white">
                    ✕
                  </button>
                </span>
              )}
            </div>

            <div className="text-[11px] text-[#4ADE80] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] inline-block" />
              <span>جميع المنتجات أصلية وطبيعية 100% ومضمونة</span>
            </div>
          </div>

        </div>

        {/* Products Grid (2 columns on mobile, 3-4 on larger screens) */}
        {filteredAndSortedProducts.length === 0 ? (
          <div className="bg-[#111814] rounded-2xl sm:rounded-3xl border border-dashed border-[#2A3C31] p-8 sm:p-14 text-center max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#18241D] text-[#7A8C82] flex items-center justify-center mx-auto border border-[#2B3E32]">
              <Search className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#FAF5EC] font-['Cairo']">
                لم يتم العثور على أي منتج
              </h3>
              <p className="text-xs sm:text-sm text-[#A89C89] leading-relaxed">
                لم نجد نتائج مطابقة لخيارات البحث أو التصفية الحالية. يرجى تجربة كلمات بحث أخرى أو مسح الفلاتر.
              </p>
            </div>
            <button
              onClick={handleResetFilters}
              className="bg-[#D97706] hover:bg-[#B45309] text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-md"
            >
              عرض جميع المنتجات ({products.length})
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredAndSortedProducts.map((product) => (
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
