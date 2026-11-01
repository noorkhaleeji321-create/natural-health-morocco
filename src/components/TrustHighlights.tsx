import React from 'react';
import { ShieldCheck, Truck, Award, Leaf } from 'lucide-react';

export const TrustHighlights: React.FC = () => {
  return (
    <section id="trust-features" className="bg-[#080C0A] border-t border-b border-[#1C2822] py-4 sm:py-5 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-6 text-[#FAF7F0]">
        <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-[#121A16] border border-[#223128] shadow-xs">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1E170A] text-[#F59E0B] border border-[#D97706]/30 flex items-center justify-center shrink-0">
            <Leaf className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-[#FAF5EC]">طبيعي 100%</h4>
            <p className="text-[10px] sm:text-xs text-[#A89C89]">بدون مواد حافظة</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-[#121A16] border border-[#223128] shadow-xs">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1E170A] text-[#F59E0B] border border-[#D97706]/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-[#FAF5EC]">الدفع عند الاستلام</h4>
            <p className="text-[10px] sm:text-xs text-[#A89C89]">افحص قبل الدفع</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-[#121A16] border border-[#223128] shadow-xs">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1E170A] text-[#F59E0B] border border-[#D97706]/30 flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-[#FAF5EC]">شحن لجميع المدن</h4>
            <p className="text-[10px] sm:text-xs text-[#A89C89]">توصيل لباب البيت</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-[#121A16] border border-[#223128] shadow-xs">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1E170A] text-[#F59E0B] border border-[#D97706]/30 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-[#FAF5EC]">خبرة منذ 1998</h4>
            <p className="text-[10px] sm:text-xs text-[#A89C89]">أصالة العطارة</p>
          </div>
        </div>
      </div>
    </section>
  );
};
