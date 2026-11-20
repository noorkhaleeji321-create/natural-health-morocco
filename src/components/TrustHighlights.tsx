import React from 'react';
import { ShieldCheck, Truck, Award, Leaf } from 'lucide-react';

export const TrustHighlights: React.FC = () => {
  return (
    <section id="trust-features" className="bg-[#080C0A] border-t border-b border-[#1C2822] py-4 sm:py-5 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-6 text-[#FAF7F0]">
        <div className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 h-[60px] sm:h-[68px] rounded-xl bg-[#121A16] border border-[#223128] shadow-xs">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1E170A] text-[#F59E0B] border border-[#D97706]/30 flex items-center justify-center shrink-0">
            <Leaf className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-xs leading-4 sm:text-sm sm:leading-5 text-[#FAF5EC] truncate">طبيعي 100%</h4>
            <p className="text-[10px] leading-[14px] sm:text-xs sm:leading-4 text-[#A89C89] truncate">بدون مواد حافظة</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 h-[60px] sm:h-[68px] rounded-xl bg-[#121A16] border border-[#223128] shadow-xs">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1E170A] text-[#F59E0B] border border-[#D97706]/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-xs leading-4 sm:text-sm sm:leading-5 text-[#FAF5EC] truncate">الدفع عند الاستلام</h4>
            <p className="text-[10px] leading-[14px] sm:text-xs sm:leading-4 text-[#A89C89] truncate">افحص قبل الدفع</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 h-[60px] sm:h-[68px] rounded-xl bg-[#121A16] border border-[#223128] shadow-xs">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1E170A] text-[#F59E0B] border border-[#D97706]/30 flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-xs leading-4 sm:text-sm sm:leading-5 text-[#FAF5EC] truncate">شحن لجميع المدن</h4>
            <p className="text-[10px] leading-[14px] sm:text-xs sm:leading-4 text-[#A89C89] truncate">توصيل لباب البيت</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 h-[60px] sm:h-[68px] rounded-xl bg-[#121A16] border border-[#223128] shadow-xs">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1E170A] text-[#F59E0B] border border-[#D97706]/30 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-xs leading-4 sm:text-sm sm:leading-5 text-[#FAF5EC] truncate">خبرة منذ 1998</h4>
            <p className="text-[10px] leading-[14px] sm:text-xs sm:leading-4 text-[#A89C89] truncate">أصالة العطارة</p>
          </div>
        </div>
      </div>
    </section>
  );
};
