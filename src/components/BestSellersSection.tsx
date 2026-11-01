import React from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { Flame, Sparkles } from 'lucide-react';

interface BestSellersSectionProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  onViewAllProducts?: () => void;
}

export const BestSellersSection: React.FC<BestSellersSectionProps> = ({
  products,
  onAddToCart,
  onViewDetails,
  onViewAllProducts,
}) => {
  return (
    <section id="best-sellers" className="pt-0 pb-[38px] px-[12px] max-w-7xl mx-auto">
      {/* Header */}
      <div className="pt-[9px] flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-6 sm:mb-10 pb-3 sm:pb-4 border-b border-[#212E27]">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#F59E0B] mb-1.5 sm:mb-2">
            <Flame className="w-4 h-4 fill-current text-[#D97706]" />
            <span>اختيار زبنائنا الأوفياء</span>
          </div>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-[#FAF5EC] font-['Cairo'] tracking-tight">
            المنتجات الأكثر طلباً
          </h2>
          <p className="text-xs sm:text-sm text-[#A89C89] mt-1">
            الأعشاب والتوابل والزيوت الطبيعية التي نالت أعلى تقييمات ونالت ثقة العائلات المغربية.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onViewAllProducts && (
            <button
              onClick={onViewAllProducts}
              className="text-xs font-bold text-[#FAF5EC] bg-[#1A2620] hover:bg-[#223329] border border-[#2D4236] px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all shadow-xs"
            >
              عرض جميع المنتجات ←
            </button>
          )}
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#F3BA63] bg-[#15201A] border border-[#26382E] px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
            <span>جودة بلديّة مضمونة</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12 bg-[#121A16] rounded-2xl border border-dashed border-[#223128] p-8">
          <p className="text-base text-[#A89C89] font-medium">لا توجد منتجات مطابقة في هذا القسم حالياً.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}
    </section>
  );
};
