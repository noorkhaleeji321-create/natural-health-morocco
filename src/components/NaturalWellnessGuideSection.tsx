import React from 'react';
import { Sparkles, ShieldCheck, Heart, Flame, Activity, Droplets, CheckCircle2, ArrowLeft, Truck } from 'lucide-react';

interface NaturalWellnessGuideSectionProps {
  onBrowseCategory?: (categoryName: string) => void;
  onExploreProducts?: () => void;
}

export const NaturalWellnessGuideSection: React.FC<NaturalWellnessGuideSectionProps> = ({
  onBrowseCategory,
  onExploreProducts,
}) => {
  return (
    <section id="wellness-guide" className="py-14 bg-gradient-to-b from-[#0A0E0C] via-[#0E1511] to-[#0A0E0C] border-y border-[#1A2620] relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#D97706]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#10B981]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#D97706]/15 border border-[#D97706]/35 text-[#F3BA63] px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-xs">
            <Sparkles className="w-4 h-4 text-[#D97706]" />
            <span>دليل أسرار العافية الطبيعية في المغرب 🇲🇦 🌿</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-['Cairo'] tracking-tight leading-snug">
            أفضل المنتجات الطبيعية <span className="text-[#F3BA63]">100%</span> للعناية بالجسم والصحة
          </h2>
          
          <p className="text-sm sm:text-base text-[#C2B5A0] leading-relaxed">
            نقدم لكم في <strong className="text-white">متجر natural-morocco</strong> خلاصة الخبرة المغربية الأصيلة، بمنتجات منتقاة بعناية فائقة من التعاونيات والمناحل الجبلية لضمان صحة وعافية تدوم.
          </p>
        </div>

        {/* 3 Core Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12">
          
          {/* Pillar 1: زيادة الوزن والتسمين الطبيعي */}
          <div className="bg-[#121A15] border border-[#223328] hover:border-[#D97706]/50 rounded-3xl p-6 sm:p-7 shadow-xl hover:shadow-2xl transition-all duration-300 group flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#D97706]/10 rounded-full blur-xl group-hover:scale-150 transition-transform" />
            
            <div className="space-y-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D97706] to-[#B45309] text-white flex items-center justify-center shadow-lg shadow-[#D97706]/20">
                <Flame className="w-7 h-7" />
              </div>

              <div>
                <span className="text-[11px] font-bold text-[#D97706] tracking-wide uppercase">خلطات مغذية ومقوية</span>
                <h3 className="text-lg sm:text-xl font-black text-white font-['Cairo'] mt-0.5">
                  خلطات زيادة الوزن والتسمين الطبيعي
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-[#A89C89] leading-relaxed">
                تركيبات طبيعية غنية بالعسل الجبلي الحر، حبوب اللقاح، غذاء ملكات النحل، والمكسرات الفاخرة (اللوز والجوز) لفتح الشهية وزيادة الوزن بشكل صحي ومتناسق بدون أي هرمونات أو مواد مصنعة.
              </p>

              <ul className="space-y-2 text-xs text-[#D8CFBF] pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                  <span>تنشيط الشهية وتحسين الهضم والامتصاص</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                  <span>طبيعية 100% وآمنة للصغار والكبار</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                  <span>نتائج ملموسة مع تثبيت الوزن الصحي</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-4 border-t border-[#1C2B22]">
              <button
                type="button"
                onClick={() => onBrowseCategory?.('الحبوب والبذور الصحية')}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#18241D] hover:bg-[#D97706] text-[#F3BA63] hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
              >
                <span>تصفح خلطات التسمين والصحة</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Pillar 2: مراهم وكريمات سم النحل للمفاصل والروماتيزم */}
          <div className="bg-[#121A15] border border-[#223328] hover:border-[#10B981]/50 rounded-3xl p-6 sm:p-7 shadow-xl hover:shadow-2xl transition-all duration-300 group flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#10B981]/10 rounded-full blur-xl group-hover:scale-150 transition-transform" />
            
            <div className="space-y-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#059669] to-[#047857] text-white flex items-center justify-center shadow-lg shadow-[#059669]/20">
                <Activity className="w-7 h-7" />
              </div>

              <div>
                <span className="text-[11px] font-bold text-[#34D399] tracking-wide uppercase">علاج المفاصل والبرودة</span>
                <h3 className="text-lg sm:text-xl font-black text-white font-['Cairo'] mt-0.5">
                  مراهم تسكين آلام المفاصل والروماتيزم بـ سم النحل
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-[#A89C89] leading-relaxed">
                مراهم وكريمات علاجية أصلية مستخلصة من سم النحل النقي وزيوت الكافور والقرنفل والأعشاب الحارة، مسكن قوي وفعال لآلام الركبة، الظهر، الروماتيزم، وعرق النسا والبرودة القديمة.
              </p>

              <ul className="space-y-2 text-xs text-[#D8CFBF] pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                  <span>تسكين سريع لآلام الغضاريف وتيبس المفاصل</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                  <span>تنشيط الدورة الدموية ومقاومة البرودة المزمنة</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                  <span>تركيبة عشبية بـ سم النحل الطبيعي المركز</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-4 border-t border-[#1C2B22]">
              <button
                type="button"
                onClick={() => onBrowseCategory?.('الأعشاب والنباتات الطبية')}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#18241D] hover:bg-[#059669] text-[#6EE7B7] hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
              >
                <span>تصفح مراهم سم النحل والمفاصل</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Pillar 3: الزيوت الطبيعية للمساج والعناية بالصحة */}
          <div className="bg-[#121A15] border border-[#223328] hover:border-[#38BDF8]/50 rounded-3xl p-6 sm:p-7 shadow-xl hover:shadow-2xl transition-all duration-300 group flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#38BDF8]/10 rounded-full blur-xl group-hover:scale-150 transition-transform" />
            
            <div className="space-y-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0284C7] to-[#0369A1] text-white flex items-center justify-center shadow-lg shadow-[#0284C7]/20">
                <Droplets className="w-7 h-7" />
              </div>

              <div>
                <span className="text-[11px] font-bold text-[#38BDF8] tracking-wide uppercase">استرخاء وعناية بالجسم</span>
                <h3 className="text-lg sm:text-xl font-black text-white font-['Cairo'] mt-0.5">
                  الزيوت الطبيعية للمساج والعناية بالصحة
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-[#A89C89] leading-relaxed">
                زيوت نقية 100% معصورة على البارد تشمل زيت الأركان التجميلي والصحي، زيت اللافندر، زيت الحبة السوداء، وزيوت التدليك المهدئة للعضلات المشدودة ولإعادة النشاط والحيوية للجسم.
              </p>

              <ul className="space-y-2 text-xs text-[#D8CFBF] pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                  <span>معصورة على البارد بدون أي إضافات كيماوية</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                  <span>إرخاء العضلات وتخفيف التوتر والإجهاد البدني</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                  <span>تغذية وترطيب فائق للبشرة والجسم</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-4 border-t border-[#1C2B22]">
              <button
                type="button"
                onClick={() => onBrowseCategory?.('الزيوت الطبيعية والأركان')}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#18241D] hover:bg-[#0284C7] text-[#7DD3FC] hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
              >
                <span>تصفح زيوت المساج والأركان</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* High-Trust Delivery & Quality Assurance Banner */}
        <div className="bg-gradient-to-r from-[#142019] via-[#1A2C22] to-[#142019] border border-[#273F30] rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#D97706]/20 border border-[#D97706]/40 flex items-center justify-center text-[#F3BA63] shrink-0">
              <Truck className="w-6 h-6 text-[#D97706]" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold text-white font-['Cairo']">
                جودة عالية وتوصيل سريع لجميع المدن المغربية 🇲🇦 🚚
              </h4>
              <p className="text-xs sm:text-sm text-[#A89C89] mt-0.5">
                توصيل مضمون حتى باب المنزل في الدار البيضاء، مراكش، الرباط، طنجة، فاس، أكادير، وغيرها مع إمكانية الدفع نقداً عند الاستلام.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={onExploreProducts}
              className="w-full sm:w-auto bg-[#D97706] hover:bg-[#B45309] text-white font-bold px-6 py-3 rounded-xl text-xs sm:text-sm shadow-lg shadow-[#D97706]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>تسوق كافة المنتجات الطبيعية</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
