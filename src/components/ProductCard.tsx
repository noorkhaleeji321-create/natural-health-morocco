import React, { useState } from 'react';
import { ShoppingCart, Star, Check, Sparkles, Eye, MessageCircle } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
}

// Helper function to extract first two words of description followed by dots
const getShortDescription = (desc?: string) => {
  if (!desc) return '';
  const words = desc.trim().split(/\s+/);
  if (words.length <= 2) return desc;
  return `${words[0]} ${words[1]} ...`;
};

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onViewDetails,
}) => {
  const { storeSettings } = useStore();
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
    }, 1800);
  };

  const handleWhatsAppOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rawPhone = storeSettings.whatsapp || storeSettings.phone || '+212661234567';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const message = `السلام عليكم ورحمة الله، أود طلب هذا المنتج من عِطارة عند سعيد:
🌿 المنتج: ${product.name}
💰 السعر: ${product.price} درهم (${product.unit})
المرجو تأكيد توفر الطلب وتفاصيل التوصيل. شكراً جزيلاً!`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(product);
    }
  };

  const shortDesc = getShortDescription(product.description);

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-[#121A16] rounded-xl sm:rounded-2xl border border-[#223128] shadow-sm hover:shadow-2xl hover:border-[#D97706]/70 transition-all duration-300 flex flex-col justify-between overflow-hidden hover:-translate-y-1 cursor-pointer h-full"
    >
      {/* Product Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#0C120F] shrink-0">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Hover overlay hint */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="hidden sm:inline-flex items-center gap-1.5 bg-[#0D1511]/90 text-[#F3BA63] text-xs font-bold px-3 py-1.5 rounded-full border border-[#D97706]/40 shadow-lg backdrop-blur-xs">
            <Eye className="w-3.5 h-3.5" />
            عرض تفاصيل المنتج
          </span>
        </div>

        {/* Badges Overlay */}
        <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 flex flex-col gap-1 z-10">
          {product.isBestSeller && (
            <span className="inline-flex items-center gap-0.5 sm:gap-1 bg-[#D97706] text-white text-[8.5px] sm:text-[11px] font-bold px-1.5 sm:px-2.5 py-0.5 rounded-full shadow-md border border-[#F59E0B]/30">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              الأكثر طلباً
            </span>
          )}
          {product.isNew && (
            <span className="inline-flex items-center gap-0.5 sm:gap-1 bg-[#1E3328] text-[#F3BA63] text-[8.5px] sm:text-[11px] font-bold px-1.5 sm:px-2.5 py-0.5 rounded-full shadow-md border border-[#D97706]/30">
              جديد
            </span>
          )}
        </div>

        {/* Category Pill */}
        <div className="absolute bottom-1.5 right-1.5 sm:bottom-2.5 sm:right-2.5 z-10">
          <span className="bg-black/85 backdrop-blur-xs text-[#FAF5EC] text-[8.5px] sm:text-[10.5px] px-1.5 sm:px-2 py-0.5 rounded-md font-medium border border-white/10">
            {product.category}
          </span>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-2 sm:p-3.5 md:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Rating & Stock status header */}
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-[#A39683] mb-1 gap-1">
            <div className="flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full inline-block shrink-0 ${
                  product.inStock
                    ? 'bg-[#22C55E] shadow-[0_0_4px_#22c55e]'
                    : 'bg-[#EF4444] shadow-[0_0_4px_#ef4444]'
                }`}
              />
              <span
                className={`text-[9px] sm:text-[11px] font-medium truncate ${
                  product.inStock ? 'text-[#4ADE80]' : 'text-[#FCA5A5]'
                }`}
              >
                {product.inStock ? 'متوفر' : 'غير متوفر'}
              </span>
            </div>
            
            <div className="flex items-center gap-0.5 text-[#F59E0B] font-bold shrink-0 text-[10px] sm:text-xs">
              <Star className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 fill-current" />
              <span>{product.rating}</span>
            </div>
          </div>

          {/* Product Title */}
          <h3 className="font-bold text-[11.5px] sm:text-base text-[#FAF5EC] group-hover:text-[#F59E0B] transition-colors leading-tight sm:leading-snug line-clamp-2 min-h-[1.75rem] sm:min-h-0">
            {product.name}
          </h3>

          {/* Shortened Product Description (أول كلمتين متبوعة بـ نقاط ...) */}
          {shortDesc && (
            <p className="text-[10px] sm:text-xs text-[#A89C89] mt-1 font-medium text-right" dir="rtl">
              {shortDesc}
            </p>
          )}
        </div>

        {/* Price, Unit & Action */}
        <div className="pt-1.5 sm:pt-2.5 mt-1.5 sm:mt-2.5 border-t border-[#202D25] space-y-1.5 sm:space-y-2.5">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-baseline gap-1">
              <span className="text-sm sm:text-xl font-black text-[#FAF5EC] font-['Cairo']">
                {product.price}
              </span>
              <span className="text-[9px] sm:text-xs font-bold text-[#F59E0B]">DH</span>
            </div>
            <span className="text-[8.5px] sm:text-[10px] text-[#A89C89] font-medium bg-[#1A2520] border border-[#28392F] px-1 py-0.5 rounded-xs sm:rounded-sm">
              {product.unit}
            </span>
          </div>

          {/* Action Buttons: Split Add to Cart & WhatsApp Order */}
          {product.inStock ? (
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={handleAdd}
                className={`py-1.5 sm:py-2 px-1.5 sm:px-2 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs flex items-center justify-center gap-1 transition-all active:scale-95 shadow-md cursor-pointer ${
                  added
                    ? 'bg-[#166534] text-white shadow-lg'
                    : 'bg-[#D97706] hover:bg-[#B45309] text-white hover:shadow-lg'
                }`}
                aria-label={`أضف ${product.name} إلى السلة`}
                title="إضافة المنتج إلى سلة التسوق"
              >
                {added ? (
                  <>
                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white shrink-0" />
                    <span className="truncate">تمت!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white shrink-0" />
                    <span className="truncate">أضف للسلة</span>
                  </>
                )}
              </button>

              {/* WhatsApp Order Button */}
              <button
                type="button"
                onClick={handleWhatsAppOrder}
                className="py-1.5 sm:py-2 px-1.5 sm:px-2 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs flex items-center justify-center gap-1 bg-[#15803D] hover:bg-[#166534] text-white shadow-md border border-[#22C55E]/30 hover:border-[#22C55E]/60 transition-all active:scale-95 cursor-pointer"
                aria-label={`طلب ${product.name} عبر الواتساب`}
                title="طلب فوري عبر الواتساب"
              >
                <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white shrink-0" />
                <span className="truncate">طلب واتساب</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <button
                disabled
                onClick={(e) => e.stopPropagation()}
                className="py-1.5 sm:py-2 px-1.5 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs flex items-center justify-center gap-1 bg-[#231A1A] text-[#8C7B7B] border border-[#3E2525] cursor-not-allowed opacity-75"
                aria-label={`${product.name} غير متوفر`}
              >
                <span className="truncate">غير متوفر</span>
              </button>
              <button
                type="button"
                onClick={handleWhatsAppOrder}
                className="py-1.5 sm:py-2 px-1.5 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs flex items-center justify-center gap-1 bg-[#15803D]/70 hover:bg-[#15803D] text-white border border-[#22C55E]/30 cursor-pointer"
                title="استفسار عن موعد توفر المنتج عبر الواتساب"
              >
                <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white shrink-0" />
                <span className="truncate">طلب بالطلب</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
