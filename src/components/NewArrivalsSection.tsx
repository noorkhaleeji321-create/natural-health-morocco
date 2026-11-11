import React, { useState } from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import { Sparkles, Clock } from 'lucide-react';

interface NewArrivalsSectionProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  onViewAllProducts?: () => void;
  isLoading?: boolean;
}

export const NewArrivalsSection: React.FC<NewArrivalsSectionProps> = ({
  products,
  onAddToCart,
  onViewDetails,
  onViewAllProducts,
  isLoading = false,
}) => {
  const [visibleCount, setVisibleCount] = useState<number>(20);

  return (
    <section id="new-arrivals" className="py-10 sm:py-20 bg-[#0A0F0D] border-t border-[#1C2822]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-6 sm:mb-10 pb-3 sm:pb-4 border-b border-[#212E27]">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#F3BA63] mb-1.5 sm:mb-2">
              <Clock className="w-4 h-4 text-[#D97706]" />
              <span>حصرياً في محل عند سعيد</span>
            </div>
            <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-[#FAF5EC] font-['Cairo'] tracking-tight">
              منتجات جديدة ووصلت حديثاً
            </h2>
            <p className="text-xs sm:text-sm text-[#A89C89] mt-1">
              أحدث قطفات العسل الجبلي، الزيوت المعصورة حديثاً، وأعشاب موسمية نادرة بجودتها الكاملة.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onViewAllProducts && (
              <button
                onClick={onViewAllProducts}
                className="text-xs font-bold text-[#FAF5EC] bg-[#1A2620] hover:bg-[#223329] border border-[#2D4236] px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all shadow-xs"
              >
                تصفح الكتالوج الكامل ←
              </button>
            )}
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#F59E0B] bg-[#1E170A] border border-[#D97706]/40 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>قطفة ومحصول هذا الموسم</span>
            </div>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6">
            <ProductCardSkeleton count={4} />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 bg-[#121A16] rounded-2xl border border-dashed border-[#223128] p-8">
            <p className="text-base text-[#A89C89] font-medium">لا توجد منتجات جديدة في الوقت الحالي.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6">
              {products.slice(0, visibleCount).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onViewDetails={onViewDetails}
                />
              ))}
            </div>

            {/* Load More Button (20 by 20 progressive reveal on homepage) */}
            {visibleCount < products.length && (
              <div className="mt-8 sm:mt-12 text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-[#A89C89]">
                  <span>تم عرض</span>
                  <span className="font-bold text-[#D97706]">{Math.min(visibleCount, products.length)}</span>
                  <span>من أصل</span>
                  <span className="font-bold text-[#FAF5EC]">{products.length}</span>
                  <span>منتج جديد</span>
                </div>

                {/* Progress indicator */}
                <div className="w-48 sm:w-64 h-1.5 bg-[#1C2921] rounded-full mx-auto overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#D97706] to-[#F59E0B] transition-all duration-300 rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round((visibleCount / products.length) * 100))}%`,
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 20)}
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#92400E] text-white font-bold text-xs sm:text-sm px-8 py-3.5 rounded-xl shadow-lg hover:shadow-orange-900/30 transition-all duration-200 transform hover:scale-[1.02] cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>إظهار المزيد من المنتجات ({Math.min(20, products.length - visibleCount)} إضافية)</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
