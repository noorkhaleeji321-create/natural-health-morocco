import React from 'react';
import { Category } from '../types';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { formatImageUrl, handleImageError } from '../lib/utils';
import { useStore } from '../context/StoreContext';

interface CategorySectionProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categorySlug: string | null) => void;
  onBrowseCategoryInProducts?: (categoryName: string) => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  onBrowseCategoryInProducts,
}) => {
  const { products } = useStore();

  if (!categories || categories.length === 0) {
    return (
      <section id="categories" className="py-6 px-0 bg-[#0A0E0C] border-y border-[#1C2822] min-h-[220px] sm:min-h-[280px]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex gap-3 sm:gap-5 py-2 overflow-hidden" dir="ltr">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={`cat-skel-${i}`}
                className="w-52 sm:w-64 md:w-72 shrink-0 rounded-xl sm:rounded-2xl border border-[#223128] bg-[#121A16] h-48 sm:h-64 animate-pulse flex flex-col justify-between p-3"
              >
                <div className="w-full h-32 sm:h-44 bg-[#1A2620] rounded-lg" />
                <div className="h-4 bg-[#1A2620] rounded w-2/3 mt-2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Pre-calculate real product count per category dynamically
  const categoryCounts = new Map<string, number>();
  (products || []).forEach((p) => {
    if (p.category) {
      const cName = p.category.trim();
      categoryCounts.set(cName, (categoryCounts.get(cName) || 0) + 1);
    }
  });

  const [canLoadMarqueeDuplicate, setCanLoadMarqueeDuplicate] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setCanLoadMarqueeDuplicate(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section id="categories" className="py-6 px-0 bg-[#0A0E0C] border-y border-[#1C2822] min-h-[220px] sm:min-h-[280px]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Categories Single Moving Row */}
        <div className="relative w-full overflow-hidden py-2 mx-0 mb-0" dir="ltr">
          {/* Continuous Moving Track from Left to Right - Always Filled & Visible */}
          <div className="animate-scroll-ltr flex gap-3 sm:gap-5 py-2 w-max">
            {[...categories, ...categories].map((cat, index) => {
              const isSelected = selectedCategory === cat.slug;
              const formattedImg = formatImageUrl(cat.image);
              const shouldRenderImg = index < categories.length || canLoadMarqueeDuplicate;
              const isPrimaryCategory = index < categories.length;

              return (
                <div
                  key={`${cat.id}-${index}`}
                  dir="rtl"
                  onClick={() => {
                    if (onBrowseCategoryInProducts) {
                      onBrowseCategoryInProducts(cat.name);
                    } else {
                      onSelectCategory(isSelected ? null : cat.slug);
                    }
                  }}
                  className={`w-52 sm:w-64 md:w-72 shrink-0 group relative rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 border ${
                    isSelected
                      ? 'ring-2 sm:ring-3 ring-[#D97706] border-[#D97706] shadow-2xl scale-[1.02]'
                      : 'border-[#223128] hover:border-[#D97706]/70 shadow-lg hover:-translate-y-1'
                  } bg-[#121A16] flex flex-col`}
                >
                  {/* Image Container */}
                  <div className="relative h-32 sm:h-44 w-full overflow-hidden bg-[#0C120F]">
                    {formattedImg && shouldRenderImg ? (
                      <img
                        src={formattedImg}
                        alt={cat.name}
                        width={288}
                        height={176}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        loading={isPrimaryCategory ? 'eager' : 'lazy'}
                        fetchPriority={index < 4 ? 'high' : 'auto'}
                        decoding="async"
                        onError={handleImageError}
                      />
                    ) : null}
                    <div
                      className={`cat-fallback w-full h-full flex-col items-center justify-center bg-gradient-to-br from-[#121A16] to-[#0A0E0C] text-[#D97706]/70 ${
                        formattedImg && shouldRenderImg ? 'hidden' : 'flex'
                      }`}
                    >
                      <Sparkles className="w-8 h-8 mb-1" />
                      <span className="text-xs font-semibold">{cat.name}</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0C120F] via-[#0C120F]/40 to-transparent" />

                    {/* Badge (High-Contrast WCAG Compliant Amber) */}
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                      <span className="bg-[#B45309] text-white text-[9px] sm:text-xs font-bold px-2 py-0.5 sm:py-1 rounded-full shadow-lg border border-[#F59E0B]/30">
                        {categoryCounts.get(cat.name.trim()) ?? (cat.count || 0)} منتج
                      </span>
                    </div>

                    {/* Title on Image bottom */}
                    <div className="absolute bottom-2 right-2 left-2 sm:bottom-3 sm:right-3 sm:left-3 text-white">
                      <h3 className="text-xs sm:text-base font-black font-['Cairo'] group-hover:text-[#F3BA63] transition-colors line-clamp-1">
                        {cat.name}
                      </h3>
                    </div>
                  </div>

                  {/* Description & Action */}
                  <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between bg-[#121A16]">
                    <p className="text-[11px] sm:text-xs text-[#A89C89] leading-relaxed line-clamp-2">
                      {cat.description}
                    </p>

                    <div className="mt-2 pt-2 border-t border-[#1F2C24] flex items-center justify-between text-[11px] sm:text-xs font-bold text-[#F3BA63] group-hover:text-[#D97706] transition-colors">
                      <span>{isSelected ? 'إلغاء التصفية' : 'تصفح الأصناف'}</span>
                      <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180 transform group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clear Filter Notice if Active */}
        {selectedCategory && (
          <div className="mt-8 text-center">
            <button
              onClick={() => onSelectCategory(null)}
              className="inline-flex items-center gap-2 bg-[#1A2720] hover:bg-[#25382E] text-[#F3BA63] text-xs sm:text-sm font-bold px-5 py-2.5 rounded-full border border-[#D97706]/40 shadow-md transition-colors"
            >
              <span>عرض جميع الأصناف بدون تصفية</span>
              <span>✕</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
