import React from 'react';
import { Leaf, Award, HeartHandshake, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const AboutSection: React.FC = () => {
  const { storeSettings } = useStore();

  const aboutImage = storeSettings.aboutImageUrl || '/assets/aistudio/WhatsApp_Image_2026-10-27_at_09.50.47_daghta_5b75ff5a.jpeg';
  const badgeYears = storeSettings.aboutBadgeYears || '25+';
  const badgeTitle = storeSettings.aboutBadgeTitle || 'سنة من العطاء والأمانة';
  const badgeSubtitle = storeSettings.aboutBadgeSubtitle || 'خدمة العائلات بأجود أنواع العطارة';

  // Format the name elegantly to prevent awkward repetition
  const rawName = (storeSettings.storeName || 'natural-morocco').trim();
  const cleanName = rawName.replace(/^(محل|متجر)\s+/, '');
  const displayTitle = rawName.startsWith('عِطارة') || rawName.startsWith('عطارة')
    ? rawName
    : `متجر ${rawName}`;

  const storyP1 = storeSettings.aboutStoryP1 || `تأسس متجر ${cleanName || 'natural-morocco'} من قلب دروب وأسواق المغرب العريقة، لنضع بين أيديكم أجود أنواع المنتجات الطبيعية، الزيوت النقية، الأعشاب والمراهم العناية الصحية المنتقاة بعناية فائقة.`;
  const storyP2 = storeSettings.aboutStoryP2 || 'نحرص على انتقاء منتجاتنا مباشرة من كبار النحّالين في الأطلس، وتعاونيات زيت الأركان بسوس، ومزارع الزعفران بتالوين، لنضمن لكم نقاوة طبيعية 100% خالية من أي مواد حافظة أو إضافات كيميائية، مع التزامنا التام بالأمانة والمشورة الصادقة.';

  return (
    <section id="about" className="py-10 sm:py-20 bg-[#080C0A] border-t border-[#1C2822] overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          
          {/* Visual Showcase / Image Grid */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Image */}
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-2 sm:border-4 border-[#1C2922] aspect-4/5">
                <img
                  src={aboutImage}
                  alt={`${displayTitle} للعطارة المغربية`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080C0A] via-transparent to-transparent" />
                
                {/* Floating Experience Badge */}
                <div className="absolute bottom-3 right-3 left-3 sm:bottom-6 sm:right-6 sm:left-6 bg-[#121A16]/95 backdrop-blur-md p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-[#26372E] shadow-xl flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#D97706] text-white flex items-center justify-center font-black text-xl sm:text-2xl font-['Cairo'] shrink-0 shadow-md">
                    {badgeYears}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-[#FAF5EC]">{badgeTitle}</h4>
                    <p className="text-[10px] sm:text-xs text-[#A89C89]">{badgeSubtitle}</p>
                  </div>
                </div>
              </div>

              {/* Decorative accent element */}
              <div className="hidden sm:block absolute -top-4 -right-4 w-28 h-28 bg-[#D97706]/10 rounded-full blur-2xl pointer-events-none" />
              <div className="hidden sm:block absolute -bottom-4 -left-4 w-32 h-32 bg-[#2D4A3E]/10 rounded-full blur-2xl pointer-events-none" />
            </div>
          </div>

          {/* Text Content */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-[#16221B] text-[#F3BA63] text-xs sm:text-sm font-bold px-3 py-1 sm:px-4 sm:py-1.5 rounded-full border border-[#D97706]/30 shadow-xs">
              <Leaf className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D97706]" />
              <span>أصالة، ثقة، وجودة متوارثة</span>
            </div>

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-[#FAF5EC] font-['Cairo'] tracking-tight leading-tight">
              مرحباً بكم في <span className="text-[#F59E0B]">{displayTitle}</span>
            </h2>

            <p className="text-base sm:text-lg text-[#E6DDD0] leading-relaxed font-['Cairo'] text-justify sm:text-right">
              {storyP1}
            </p>

            <p className="text-sm sm:text-base text-[#B3A694] leading-relaxed font-['Cairo'] text-justify sm:text-right">
              {storyP2}
            </p>

            {/* Core Values Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 pt-2 sm:pt-4">
              
              <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl bg-[#121A16] border border-[#223128] shadow-xs">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#1E2E25] text-[#F3BA63] flex items-center justify-center shrink-0 mt-0.5 border border-[#2F4437]">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-[#FAF5EC]">نقاوة طبيعية 100%</h4>
                  <p className="text-[10px] sm:text-xs text-[#A89C89] mt-0.5">مفحوصة وخالية تماماً من الغش أو المواد الحافظة.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl bg-[#121A16] border border-[#223128] shadow-xs">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#D97706] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <HeartHandshake className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-[#FAF5EC]">تعاونيات محلية مغربية</h4>
                  <p className="text-[10px] sm:text-xs text-[#A89C89] mt-0.5">ندعم المنتجين الصغار ونوفر لكم المحصول مباشرة من منبعه.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl bg-[#121A16] border border-[#223128] shadow-xs">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#1E2E25] text-[#F3BA63] flex items-center justify-center shrink-0 mt-0.5 border border-[#2F4437]">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-[#FAF5EC]">طحن وتحضير طازج</h4>
                  <p className="text-[10px] sm:text-xs text-[#A89C89] mt-0.5">التوابل والخلطات تطحن بعناية للمحافظة على الزيوت الطيارة.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl bg-[#121A16] border border-[#223128] shadow-xs">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#D97706] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-[#FAF5EC]">ثقة وراحة بال</h4>
                  <p className="text-[10px] sm:text-xs text-[#A89C89] mt-0.5">دفع عند الاستلام وحرية الفحص قبل أداء المبلغ.</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
