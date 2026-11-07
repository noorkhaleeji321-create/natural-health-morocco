import React from 'react';
import { Banknote, Building2, CheckCircle, Shield, Truck, HelpCircle, CreditCard, Globe } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const PaymentMethodsSection: React.FC = () => {
  const { bankSettings } = useStore();

  const isCodActive = bankSettings.isCodEnabled !== false;
  const isBankActive = bankSettings.isBankTransferEnabled === true;
  const isCardActive = bankSettings.isCardEnabled === true;
  const isPaypalActive = bankSettings.isPaypalEnabled === true;

  return (
    <section id="payment-methods" className="py-10 sm:py-20 bg-[#090D0B] border-t border-[#1C2822]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-[#17251E] text-[#F3BA63] text-xs sm:text-sm font-bold px-3 py-1 sm:px-4 sm:py-1.5 rounded-full mb-2 sm:mb-3 border border-[#D97706]/30 shadow-xs">
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D97706]" />
            <span>تسوق بأمان وراحة بال تامة</span>
          </div>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-[#FAF5EC] font-['Cairo'] tracking-tight">
            طرق الدفع المعتمدة في متجرنا
          </h2>
          <p className="mt-2 text-xs sm:text-base text-[#A89C89] leading-relaxed">
            نوفر لكم خيارات دفع مرنة وسهلة تناسب جميع زبنائنا في مختلف ربوع المملكة المغربية.
          </p>
        </div>

        {/* Payment Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 max-w-5xl mx-auto">
          
          {/* Method 1: Cash on Delivery */}
          {isCodActive && (
            <div className="relative bg-[#121A16] rounded-xl sm:rounded-2xl p-4 sm:p-8 border-2 border-[#D97706]/50 shadow-2xl hover:border-[#D97706] transition-all flex flex-col justify-between overflow-hidden">
              {/* Top Recommended Tag */}
              <div className="absolute top-0 left-0 bg-[#D97706] text-white text-[10px] sm:text-[11px] font-black px-3 py-0.5 sm:px-4 sm:py-1 rounded-br-xl shadow-md border-b border-r border-[#F59E0B]/30">
                الخيار الأكثر تفضيلاً ⭐
              </div>

              <div>
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#1E170A] text-[#F59E0B] border border-[#D97706]/30 flex items-center justify-center mb-3 sm:mb-5 mt-2 shadow-inner">
                  <Banknote className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>

                <h3 className="text-lg sm:text-2xl font-black text-[#FAF5EC] font-['Cairo'] mb-1 sm:mb-2">
                  الدفع عند الاستلام (نقداً)
                </h3>
                <p className="text-[11px] sm:text-sm font-medium text-[#A89C89] mb-3 sm:mb-4">
                  Paiement Cash à la Livraison (COD)
                </p>

                <p className="text-xs sm:text-sm text-[#C8BFAF] leading-relaxed mb-4 sm:mb-6">
                  لا تدفع أي درهم حتى يصلك الطلب لباب بيتك! اطلب ما تحتاجه الآن، وعند وصول مندوب التوصيل يمكنك معاينة الطرد والتأكد من سلامته ثم أداء المبلغ نقداً بكل أمان.
                </p>

                {/* Bullet Points */}
                <ul className="space-y-2 text-xs sm:text-sm text-[#D8CEBD]">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#22C55E] shrink-0" />
                    <span>لا تحتاج لبطاقة بنكية أو حساب مسبق.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#22C55E] shrink-0" />
                    <span>معاينة المنتجات والتأكد من مطابقتها قبل التسليم.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#22C55E] shrink-0" />
                    <span>متوفر في جميع مدن وقرى المغرب بدون استثناء.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-5 sm:mt-8 pt-3 sm:pt-4 border-t border-[#1F2C24] flex items-center gap-2 text-[11px] sm:text-xs text-[#A89C89]">
                <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F3BA63] shrink-0" />
                <span>توصيل سريع من 24 إلى 48 ساعة لباب منزلك</span>
              </div>
            </div>
          )}

          {/* Method 2: Bank Transfer */}
          {isBankActive && (
            <div className="relative bg-[#121A16] rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-[#23332A] hover:border-[#D97706]/50 shadow-xl transition-all flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#16251E] text-[#4ADE80] border border-[#254233] flex items-center justify-center mb-3 sm:mb-5 shadow-inner">
                  <Building2 className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>

                <h3 className="text-lg sm:text-2xl font-black text-[#FAF5EC] font-['Cairo'] mb-1 sm:mb-2">
                  التحويل البنكي المباشر
                </h3>
                <p className="text-[11px] sm:text-sm font-medium text-[#A89C89] mb-3 sm:mb-4">
                  Virement Bancaire (RIB)
                </p>

                <p className="text-xs sm:text-sm text-[#C8BFAF] leading-relaxed mb-4 sm:mb-6">
                  مناسب للطلبيات الكبيرة أو لمن يفضل الدفع الإلكتروني المباشر عبر التطبيقات البنكية المغربية. بعد إتمام طلبك، نقوم بتزويدك برقم الحساب البنكي (RIB) لإجراء التحويل.
                </p>

                {/* Supported Moroccan Banks */}
                <div className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-5">
                  <span className="text-[11px] sm:text-xs font-bold text-[#F3BA63] block">البنوك المغربية المدعومة:</span>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {['التجاري وفا بنك', 'بنك CIH', 'بنك أفريقيا (BMCE)', 'بريد بنك', 'البنك الشعبي'].map((bank) => (
                      <span
                        key={bank}
                        className="text-[10px] sm:text-xs bg-[#1A2520] border border-[#2C3E33] text-[#E5DCce] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md font-semibold"
                      >
                        {bank}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bullet Points */}
                <ul className="space-y-2 text-xs sm:text-sm text-[#D8CEBD]">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#22C55E] shrink-0" />
                    <span>تأكيد سريع للطلب عبر إرسال وصل التحويل في الواتساب.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#22C55E] shrink-0" />
                    <span>مثالي لإرسال هدايا العطارة والعسل لأحبابك مباشرة.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-5 sm:mt-8 pt-3 sm:pt-4 border-t border-[#1F2C24] flex items-center gap-2 text-[11px] sm:text-xs text-[#A89C89]">
                <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D97706] shrink-0" />
                <span>فريقنا جاهز لمساعدتكم في أي خطوة عبر الواتساب</span>
              </div>
            </div>
          )}

          {/* Method 3: Credit / Debit Card */}
          {isCardActive && (
            <div className="relative bg-[#121A16] rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-[#23332A] hover:border-[#D97706]/50 shadow-xl transition-all flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#16251E] text-[#60A5FA] border border-[#254233] flex items-center justify-center mb-3 sm:mb-5 shadow-inner">
                  <CreditCard className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>

                <h3 className="text-lg sm:text-2xl font-black text-[#FAF5EC] font-['Cairo'] mb-1 sm:mb-2">
                  البطاقة البنكية
                </h3>
                <p className="text-[11px] sm:text-sm font-medium text-[#A89C89] mb-3 sm:mb-4">
                  Carte Bancaire (Visa / Mastercard / CMI)
                </p>

                <p className="text-xs sm:text-sm text-[#C8BFAF] leading-relaxed mb-4 sm:mb-6">
                  دفع إلكتروني آمن ومباشر عبر خوادم البنك المعتمدة ببطاقتك البنكية الوطنية والدولية مع تشفير تام للبيانات.
                </p>

                <ul className="space-y-2 text-xs sm:text-sm text-[#D8CEBD]">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#22C55E] shrink-0" />
                    <span>تأكيد ومعالجة فورية للطلب بدون انتظار.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#22C55E] shrink-0" />
                    <span>تشفير 256-bit وحماية أمنية مشددة.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-5 sm:mt-8 pt-3 sm:pt-4 border-t border-[#1F2C24] flex items-center gap-2 text-[11px] sm:text-xs text-[#A89C89]">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#34D399] shrink-0" />
                <span>دفع إلكتروني محمي ومعتمد</span>
              </div>
            </div>
          )}

          {/* Method 4: PayPal */}
          {isPaypalActive && (
            <div className="relative bg-[#121A16] rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-[#23332A] hover:border-[#D97706]/50 shadow-xl transition-all flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#16251E] text-[#F59E0B] border border-[#254233] flex items-center justify-center mb-3 sm:mb-5 shadow-inner">
                  <Globe className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>

                <h3 className="text-lg sm:text-2xl font-black text-[#FAF5EC] font-['Cairo'] mb-1 sm:mb-2">
                  حساب بايبال
                </h3>
                <p className="text-[11px] sm:text-sm font-medium text-[#A89C89] mb-3 sm:mb-4">
                  PayPal Express Checkout
                </p>

                <p className="text-xs sm:text-sm text-[#C8BFAF] leading-relaxed mb-4 sm:mb-6">
                  أداء سريع باستخدام حسابك في بايبال العالمي مع ضمان وحماية المشتري المعتمدة عالمياً.
                </p>

                <ul className="space-y-2 text-xs sm:text-sm text-[#D8CEBD]">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#22C55E] shrink-0" />
                    <span>دفع بضغطة زر واحدة عبر حساب بايبال.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#22C55E] shrink-0" />
                    <span>برنامج حماية المشتري المعتمد من PayPal.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-5 sm:mt-8 pt-3 sm:pt-4 border-t border-[#1F2C24] flex items-center gap-2 text-[11px] sm:text-xs text-[#A89C89]">
                <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#60A5FA] shrink-0" />
                <span>دفع دولي سريع ومحمي</span>
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
};
