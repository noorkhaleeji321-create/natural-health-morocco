import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ShoppingCart,
  Check,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  MapPin,
  Plus,
  Minus,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  PackageX,
  MessageCircle,
} from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { useStore } from '../context/StoreContext';

interface ProductDetailPageProps {
  product: Product;
  relatedProducts: Product[];
  onBack: () => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onViewProduct: (product: Product) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  relatedProducts,
  onBack,
  onAddToCart,
  onViewProduct,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Normalize image gallery: use product.images if provided and non-empty, otherwise fallback to [product.image]
  const galleryImages =
    product.images && product.images.length > 0
      ? product.images
      : [product.image];

  // Reset states whenever product changes
  useEffect(() => {
    setActiveImageIndex(0);
    setQuantity(1);
    setAdded(false);
  }, [product.id]);

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const { storeSettings } = useStore();

  const handleAddToCart = () => {
    if (!product.inStock) return;
    onAddToCart(product, quantity);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
    }, 2000);
  };

  const handleWhatsAppOrder = () => {
    const rawPhone = storeSettings.whatsapp || storeSettings.phone || '+212661234567';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const message = `السلام عليكم ورحمة الله، أود طلب هذا المنتج من عِطارة عند سعيد:
🌿 المنتج: ${product.name}
📦 الكمية: ${quantity}
💰 السعر الإجمالي: ${product.price * quantity} درهم (${product.unit})
المرجو تأكيد الطلب وتحديد موعد التوصيل. شكراً جزيلاً!`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const currentActiveImage = galleryImages[activeImageIndex] || product.image;

  return (
    <div className="min-h-screen bg-[#080C0A] text-[#FAF5EC] py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Top Bar: Back Button & Breadcrumbs */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8 pb-4 border-b border-[#1E2B24]">
          <button
            id="back-to-products-btn"
            onClick={onBack}
            className="inline-flex items-center gap-2 bg-[#141E18] hover:bg-[#1E2E25] text-[#FAF5EC] text-xs sm:text-sm font-bold px-4 py-2 rounded-xl border border-[#27382F] transition-all hover:-translate-x-1 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>الرجوع إلى قائمة المنتجات</span>
          </button>

          {/* Breadcrumb Path */}
          <nav className="text-xs text-[#8C7E6D] flex items-center gap-1.5 flex-wrap">
            <button onClick={onBack} className="hover:text-[#F3BA63] transition-colors cursor-pointer">
              الرئيسية
            </button>
            <span>/</span>
            <button onClick={onBack} className="hover:text-[#F3BA63] transition-colors cursor-pointer">
              المنتجات
            </button>
            <span>/</span>
            <span className="text-[#A89C89]">{product.category}</span>
            <span>/</span>
            <span className="text-[#F3BA63] font-bold line-clamp-1 max-w-[150px] sm:max-w-[240px]">
              {product.name}
            </span>
          </nav>
        </div>

        {/* Main Product Card Presentation */}
        <div className="bg-[#101713] rounded-2xl sm:rounded-3xl border border-[#223329] p-4 sm:p-8 lg:p-10 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-start">
            
            {/* Right/Visual Column (Large Main Image + Gallery Navigation) */}
            <div className="lg:col-span-5 space-y-3 sm:space-y-4">
              
              {/* Main Image Container */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#0A0E0C] border border-[#283C30] shadow-xl group">
                <img
                  id="main-product-image"
                  src={currentActiveImage}
                  alt={product.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />

                {/* Stock Overlay if Out of Stock */}
                {!product.inStock && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-20">
                    <div className="bg-[#1A1212]/95 border border-[#EF4444]/60 text-[#FCA5A5] px-4 py-2.5 rounded-xl text-center shadow-2xl">
                      <PackageX className="w-8 h-8 mx-auto mb-1 text-[#EF4444]" />
                      <span className="font-extrabold text-sm sm:text-base block">غير متوفر حالياً</span>
                      <span className="text-[11px] text-[#D1D5DB]">سيتم توفيره قريباً بالمحل</span>
                    </div>
                  </div>
                )}

                {/* Badges on Main Image */}
                <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
                  {product.isBestSeller && (
                    <span className="inline-flex items-center gap-1 bg-[#D97706] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-[#F59E0B]/40">
                      <Sparkles className="w-3.5 h-3.5" />
                      الأكثر طلباً
                    </span>
                  )}
                  {product.isNew && (
                    <span className="inline-flex items-center gap-1 bg-[#1E3328] text-[#F3BA63] text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-[#D97706]/40">
                      منتج جديد
                    </span>
                  )}
                </div>

                {/* Origin tag */}
                {product.origin && (
                  <div className="absolute bottom-3 right-3 z-10">
                    <span className="inline-flex items-center gap-1 bg-black/85 backdrop-blur-xs text-[#FAF5EC] text-xs px-3 py-1 rounded-lg border border-white/10 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[#D97706]" />
                      {product.origin}
                    </span>
                  </div>
                )}

                {/* Navigation Chevrons if multiple images exist */}
                {galleryImages.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-xs transition-colors z-10"
                      aria-label="الصورة السابقة"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-xs transition-colors z-10"
                      aria-label="الصورة التالية"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Image Counter Indicator */}
                    <div className="absolute top-3 left-3 z-10 bg-black/75 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-mono text-[#F3EFE6] border border-white/10">
                      {activeImageIndex + 1} / {galleryImages.length}
                    </div>
                  </>
                )}
              </div>

              {/* Additional Images Thumbnails (مع إمكانية التنقل بينها) */}
              {galleryImages.length > 1 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] text-[#A89C89] font-medium block">
                    صور إضافية للمنتج (اضغط للمعاينة):
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                    {galleryImages.map((imgUrl, index) => {
                      const isActive = index === activeImageIndex;
                      return (
                        <button
                          key={index}
                          onClick={() => setActiveImageIndex(index)}
                          className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                            isActive
                              ? 'border-[#D97706] ring-2 ring-[#D97706]/50 scale-102'
                              : 'border-[#24372D] hover:border-[#D97706]/60 opacity-70 hover:opacity-100'
                          } bg-[#0A0E0C]`}
                          aria-label={`عرض الصورة ${index + 1}`}
                        >
                          <img
                            src={imgUrl}
                            alt={`${product.name} - صورة ${index + 1}`}
                            className="w-full h-full object-cover object-center"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Authentic Guarantees Box */}
              <div className="grid grid-cols-3 gap-2 bg-[#141F1A] p-3 rounded-xl border border-[#23342A] text-center text-[10px] sm:text-xs text-[#C4B8A6]">
                <div className="flex flex-col items-center gap-1 p-1">
                  <ShieldCheck className="w-4 h-4 text-[#D97706]" />
                  <span className="font-bold text-[#FAF5EC]">طبيعي وأصيل</span>
                  <span className="text-[9px] text-[#8C7E6D]">مضمون الجودة</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-1 border-x border-[#23342A]">
                  <Truck className="w-4 h-4 text-[#D97706]" />
                  <span className="font-bold text-[#FAF5EC]">شحن سريع</span>
                  <span className="text-[9px] text-[#8C7E6D]">لكل مدن المغرب</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-1">
                  <RotateCcw className="w-4 h-4 text-[#D97706]" />
                  <span className="font-bold text-[#FAF5EC]">دفع عند الاستلام</span>
                  <span className="text-[9px] text-[#8C7E6D]">معاينة قبل الدفع</span>
                </div>
              </div>
            </div>

            {/* Left/Content Column: Details, Availability, Price, Quantity & Add to Cart */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Category & Rating */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="bg-[#1A2820] text-[#F3BA63] text-xs font-bold px-3 py-1 rounded-full border border-[#D97706]/30">
                  {product.category}
                </span>

                <div className="flex items-center gap-1.5 text-[#F59E0B] text-xs sm:text-sm font-bold">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{product.rating}</span>
                  <span className="text-[#8C7E6D] font-normal">
                    ({product.reviewsCount} تقييم حقيقي)
                  </span>
                </div>
              </div>

              {/* Product Name (اسم المنتج) */}
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-[#FAF5EC] font-['Cairo'] leading-tight">
                {product.name}
              </h1>

              {/* Availability Status (حالة التوفر) */}
              <div>
                {product.inStock ? (
                  <div className="inline-flex items-center gap-2 bg-[#122218] border border-[#22C55E]/30 px-3.5 py-1.5 rounded-xl">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-pulse shadow-[0_0_8px_#22c55e]" />
                    <span className="text-xs sm:text-sm font-bold text-[#4ADE80]">
                      حالة التوفر: متوفر في المخزون (جاهز للشحن الفوري)
                    </span>
                    {typeof product.stockCount === 'number' && product.stockCount > 0 && (
                      <span className="text-xs text-[#8C9E94] hidden sm:inline">
                        • متبقي {product.stockCount} قطعة
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 bg-[#251212] border border-[#EF4444]/40 px-3.5 py-1.5 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-[#EF4444]" />
                    <span className="text-xs sm:text-sm font-bold text-[#FCA5A5]">
                      حالة التوفر: غير متوفر حالياً في المخزون
                    </span>
                  </div>
                )}
              </div>

              {/* Price & Unit (السعر والوزن أو الوحدة) */}
              <div className="bg-[#141F1A] p-4 sm:p-5 rounded-2xl border border-[#24372D] flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <span className="text-xs text-[#8C7E6D] block mb-0.5">السعر بالدرهم المغربي:</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-[#FAF5EC] font-['Cairo']">
                      {product.price}
                    </span>
                    <span className="text-base sm:text-xl font-black text-[#F59E0B]">
                      درهم مغربي DH
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-[#8C7E6D] block mb-0.5">الوزن أو الوحدة:</span>
                  <span className="inline-block bg-[#1B2921] border border-[#2F4438] text-[#FAF5EC] text-xs sm:text-sm font-bold px-3.5 py-1.5 rounded-lg">
                    {product.unit}
                  </span>
                </div>
              </div>

              {/* Product Description (وصف المنتج) */}
              <div className="space-y-2 bg-[#121B16] p-4 rounded-xl border border-[#1E2E25]">
                <h3 className="text-xs sm:text-sm font-bold text-[#F3BA63] font-['Cairo']">
                  وصف المنتج:
                </h3>
                <p className="text-xs sm:text-sm text-[#C4B8A6] leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Health Benefits (الفوائد الصحية إن وُجدت) */}
              {product.benefits && product.benefits.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  <h3 className="text-xs sm:text-sm font-bold text-[#F3BA63] flex items-center gap-1.5 font-['Cairo']">
                    <Sparkles className="w-4 h-4 text-[#D97706]" />
                    الخصائص والفوائد الطبيعية:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {product.benefits.map((benefit, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 bg-[#141E18] p-2.5 rounded-xl border border-[#233329] text-xs text-[#D9D0C1]"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#4ADE80] shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Usage Guide (طريقة الاستعمال إن وُجدت) */}
              {product.usage && (
                <div className="bg-[#141E18] p-3 sm:p-4 rounded-xl border border-[#233329] text-xs space-y-1">
                  <span className="font-bold text-[#F3BA63] block">طريقة الاستعمال:</span>
                  <p className="text-[#C4B8A6] leading-relaxed">{product.usage}</p>
                </div>
              )}

              {/* Quantity Selection & Add to Cart Action */}
              <div className="pt-3 border-t border-[#1F2C24] space-y-3.5">
                
                {product.inStock ? (
                  <>
                    {/* Quantity Selector: − 1 + */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs sm:text-sm font-bold text-[#FAF5EC]">
                        الكمية المطلوبة:
                      </span>
                      
                      <div className="flex items-center gap-1 sm:gap-2 border border-[#2A3D32] rounded-xl bg-[#141E18] p-1">
                        <button
                          id="decrease-qty-btn"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          className="w-8 h-8 flex items-center justify-center text-sm font-bold text-[#FAF5EC] hover:bg-[#203027] rounded-lg transition-colors cursor-pointer"
                          aria-label="إنقاص الكمية"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        
                        <span
                          id="product-quantity-display"
                          className="text-sm sm:text-base font-black min-w-[32px] text-center text-white font-mono"
                        >
                          {quantity}
                        </span>
                        
                        <button
                          id="increase-qty-btn"
                          onClick={() => setQuantity((q) => q + 1)}
                          className="w-8 h-8 flex items-center justify-center text-sm font-bold text-[#FAF5EC] hover:bg-[#203027] rounded-lg transition-colors cursor-pointer"
                          aria-label="زيادة الكمية"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <span className="text-xs text-[#8C7E6D] mr-auto">
                        الإجمالي:{' '}
                        <strong className="text-[#F59E0B] text-sm sm:text-base font-bold font-mono">
                          {product.price * quantity} DH
                        </strong>
                      </span>
                    </div>

                    {/* Action Buttons: Add to Cart & WhatsApp Order */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        id="add-to-cart-action-btn"
                        onClick={handleAddToCart}
                        className={`w-full py-3.5 px-5 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all active:scale-98 shadow-xl cursor-pointer ${
                          added
                            ? 'bg-[#166534] text-white'
                            : 'bg-[#D97706] hover:bg-[#B45309] text-white hover:shadow-2xl'
                        }`}
                      >
                        {added ? (
                          <>
                            <Check className="w-5 h-5 text-white" />
                            <span>تمت الإضافة للسلة ({quantity})!</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-5 h-5 text-white" />
                            <span>🛒 أضف إلى السلة ({product.price * quantity} DH)</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleWhatsAppOrder}
                        className="w-full py-3.5 px-5 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 bg-[#15803D] hover:bg-[#166534] text-white shadow-xl border border-[#22C55E]/30 transition-all active:scale-98 cursor-pointer"
                        title="طلب مباشر وسريع عبر واتساب"
                      >
                        <MessageCircle className="w-5 h-5 text-white" />
                        <span>طلب فوري عبر الواتساب 💬</span>
                      </button>
                    </div>
                  </>
                ) : (
                  /* Out of Stock Notice & Disabled CTA */
                  <div className="space-y-3">
                    <div className="bg-[#241313] border border-[#EF4444]/40 p-3.5 rounded-xl text-xs sm:text-sm text-[#FCA5A5] flex items-center gap-2.5">
                      <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0" />
                      <span>
                        نعتذر، هذا المنتج نفد من المخزون حالياً ولا يمكن إضافته للسلة.
                      </span>
                    </div>

                    <button
                      disabled
                      className="w-full py-4 px-6 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 bg-[#231A1A] text-[#8C7B7B] border border-[#3E2525] cursor-not-allowed opacity-75"
                    >
                      <span>🚫 غير متوفر في المخزون (غير متاح للإضافة)</span>
                    </button>
                  </div>
                )}

                <p className="text-[11px] text-[#7A6D5D] text-center pt-1">
                  🚚 التوصيل متاح لجميع المدن المغربية والدفع نقداً عند الاستلام ومعاينة الطرد.
                </p>
              </div>

            </div>

          </div>
        </div>

        {/* Similar / Related Products Section (قسم منتجات مشابهة) */}
        {relatedProducts.length > 0 && (
          <div className="mt-12 sm:mt-16 space-y-6">
            <div className="flex items-center justify-between border-b border-[#212E27] pb-3">
              <div>
                <span className="text-xs font-bold text-[#D97706] flex items-center gap-1 mb-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  من نفس فئة {product.category}
                </span>
                <h3 className="text-lg sm:text-2xl font-black text-[#FAF5EC] font-['Cairo']">
                  منتجات مشابهة قد تعجبك
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {relatedProducts.slice(0, 4).map((relProduct) => (
                <ProductCard
                  key={relProduct.id}
                  product={relProduct}
                  onAddToCart={onAddToCart}
                  onViewDetails={onViewProduct}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
