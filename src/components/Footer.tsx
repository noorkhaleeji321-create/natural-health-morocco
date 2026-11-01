import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  Heart,
  Sparkles,
  Lock,
  X,
  FileText,
  MessageCircle,
  Send,
  CheckCircle2,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface FooterProps {
  onNavigate?: (
    page:
      | 'home'
      | 'products'
      | 'cart'
      | 'order-tracking'
      | 'admin'
  ) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { storeSettings, adminLogin } = useStore();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState('');
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);

  const handleLink = (
    e: React.MouseEvent,
    page:
      | 'home'
      | 'products'
      | 'cart'
      | 'order-tracking'
      | 'admin',
    href: string
  ) => {
    e.preventDefault();
    if (
      page === 'products' ||
      page === 'cart' ||
      page === 'order-tracking' ||
      page === 'admin'
    ) {
      onNavigate?.(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onNavigate?.('home');
      setTimeout(() => {
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleAdminPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPinError('');
    setIsSubmittingPin(true);
    try {
      const success = await adminLogin(adminPinInput);
      if (success) {
        setShowAdminModal(false);
        setAdminPinInput('');
        onNavigate?.('admin');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setAdminPinError('رمز الأمان غير صحيح. يرجى إدخال رمز PIN الصحيح.');
      }
    } catch {
      setAdminPinError('حدث خطأ أثناء المصادقة');
    } finally {
      setIsSubmittingPin(false);
    }
  };

  const cleanWhatsappNumber = (storeSettings.whatsapp || '212661234567').replace(/[^0-9]/g, '');

  return (
    <footer id="contact" className="bg-[#060908] text-[#FAF7F0] border-t-4 border-[#D97706] pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-12 border-b border-[#1A2620]">
          
          {/* Brand Col */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              {storeSettings.logoUrl ? (
                <img
                  src={storeSettings.logoUrl}
                  alt={storeSettings.storeName}
                  className="w-12 h-12 rounded-xl object-cover shadow-md border border-[#D97706]/40 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D97706] to-[#92400E] text-white flex items-center justify-center font-serif text-2xl font-black shadow-md shrink-0">
                  {storeSettings.storeName.trim().charAt(0) || 'ع'}
                </div>
              )}
              <div>
                <h3 className="text-2xl font-black font-['Cairo'] text-white">
                  {storeSettings.storeName}
                </h3>
                <p className="text-xs text-[#C7BCAB]">{storeSettings.storeSlogan}</p>
              </div>
            </div>

            <p className="text-sm text-[#BDB09B] leading-relaxed">
              وجهتكم الموثوقة لأجود أنواع التوابل الفاخرة، العسل الحر الأصيل، الزيوت المعصورة على البارد، والنباتات الطبية المعتمدة، نخدمكم بأمانة وإخلاص منذ عام 1998.
            </p>

            <div className="pt-2">
              <span className="text-xs font-bold text-[#F3BA63] block mb-2">طرق الدفع المتوفرة:</span>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-[#121B16] text-[#E0D7C6] px-3 py-1 rounded-md border border-[#223329]">
                  💵 الدفع نقداً عند الاستلام
                </span>
                <span className="bg-[#121B16] text-[#E0D7C6] px-3 py-1 rounded-md border border-[#223329]">
                  🏦 التحويل البنكي المباشر
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links Col */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-base font-bold font-['Cairo'] text-[#F3BA63] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#D97706]" />
              روابط سريعة
            </h4>
            <ul className="space-y-2.5 text-sm text-[#A89C89]">
              <li>
                <a
                  href="#home"
                  onClick={(e) => handleLink(e, 'home', '#home')}
                  className="hover:text-[#F3BA63] transition-colors block"
                >
                  الصفحة الرئيسية
                </a>
              </li>
              <li>
                <a
                  href="#products"
                  onClick={(e) => handleLink(e, 'products', '#products')}
                  className="hover:text-[#F3BA63] transition-colors block font-bold text-[#E0D7C6]"
                >
                  صفحة جميع المنتجات (الكتالوج)
                </a>
              </li>
              <li>
                <a
                  href="#wellness-guide"
                  onClick={(e) => handleLink(e, 'home', '#wellness-guide')}
                  className="hover:text-[#F3BA63] transition-colors block font-bold text-[#F3BA63]"
                >
                  دليل أسرار العافية الطبيعية 🌿
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  onClick={(e) => handleLink(e, 'home', '#about')}
                  className="hover:text-[#F3BA63] transition-colors block font-bold text-[#4ADE80]"
                >
                  من نحن وقصة المتجر 📜
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setShowContactModal(true)}
                  className="hover:text-[#F3BA63] transition-colors block font-bold text-[#6EE7B7] text-right w-full cursor-pointer"
                >
                  اتصل بنا وفريق الدعم 📞
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="hover:text-[#F3BA63] transition-colors block font-bold text-[#93C5FD] text-right w-full cursor-pointer"
                >
                  سياسة الخصوصية والأمان 🔒
                </button>
              </li>
              <li>
                <a
                  href="#cart"
                  onClick={(e) => handleLink(e, 'cart', '#cart')}
                  className="hover:text-[#F3BA63] transition-colors block font-bold text-[#D97706]"
                >
                  سلة التسوق وإتمام الطلب 🛒
                </a>
              </li>
              <li>
                <a
                  href="#order-tracking"
                  onClick={(e) => handleLink(e, 'order-tracking', '#order-tracking')}
                  className="hover:text-[#F3BA63] transition-colors block font-bold text-[#34D399]"
                >
                  تتبع حالة طلبك 🚚
                </a>
              </li>
              <li>
                <a
                  href="#best-sellers"
                  onClick={(e) => handleLink(e, 'home', '#best-sellers')}
                  className="hover:text-[#F3BA63] transition-colors block"
                >
                  المنتجات الأكثر طلباً
                </a>
              </li>
              <li>
                <a
                  href="#new-arrivals"
                  onClick={(e) => handleLink(e, 'home', '#new-arrivals')}
                  className="hover:text-[#F3BA63] transition-colors block"
                >
                  المنتجات الجديدة
                </a>
              </li>
              <li>
                <a
                  href="#categories"
                  onClick={(e) => handleLink(e, 'home', '#categories')}
                  className="hover:text-[#F3BA63] transition-colors block"
                >
                  تصنيفات المتجر
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Details Col */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-base font-bold font-['Cairo'] text-[#F3BA63] flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-[#D97706]" />
              معلومات التواصل
            </h4>
            
            <ul className="space-y-3 text-sm text-[#C4B8A6]">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#D97706] shrink-0 mt-1" />
                <span>{storeSettings.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#D97706] shrink-0" />
                <span dir="ltr" className="font-mono text-[#FAF5EC]">{storeSettings.phone}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#D97706] shrink-0" />
                <span dir="ltr" className="font-sans text-xs text-[#FAF5EC]">{storeSettings.email}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#D97706] shrink-0 mt-1" />
                <span>{storeSettings.openingHours}</span>
              </li>
            </ul>
          </div>

          {/* WhatsApp Direct & Guarantee Col */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-base font-bold font-['Cairo'] text-[#F3BA63]">
              طلب سريع عبر الواتساب
            </h4>
            <p className="text-xs text-[#A89C89] leading-relaxed">
              هل تفضل إرسال قائمتك أو الاستفسار مباشرة مع فريق المتجر؟ تواصل معنا بنقرة زر:
            </p>
            
            <a
              href={`https://wa.me/${cleanWhatsappNumber}?text=${encodeURIComponent(`السلام عليكم ورحمة الله، أريد الاستفسار عن منتجات ${storeSettings.storeName}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-sm py-3 px-4 rounded-xl shadow-md transition-all hover:scale-102"
            >
              <span>مراسلتنا عبر الواتساب 💬</span>
            </a>

            <div className="bg-[#101914] p-3 rounded-xl border border-[#213429] text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-[#F3BA63] font-bold">
                <ShieldCheck className="w-4 h-4 text-[#D97706]" />
                <span>ضمان الجودة والأصالة</span>
              </div>
              <p className="text-[#A89C89]">
                جميع منتجاتنا طبيعية 100%، وتستفيدون من إمكانية فحص الطرد عند الاستلام.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom copyright and legal navigation bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#8A7D6D] border-t border-[#1C2822]">
          <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-start">
            <span>جميع الحقوق محفوظة</span>
            <button
              type="button"
              onClick={() => setShowAdminModal(true)}
              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#1A2620] hover:bg-[#D97706] hover:text-white text-[#F3BA63] font-bold transition-all cursor-pointer shadow-xs"
              title="دخول لوحة التحكم (Admin)"
            >
              ©
            </button>
            <span>{new Date().getFullYear()}</span>
            <strong className="text-white">{storeSettings.storeName}</strong>
            <span>– عِطارة مغربية أصيلة</span>
          </div>

          {/* Quick Legal Pages: About Us, Contact Us, Privacy Policy */}
          <div className="flex items-center gap-3 sm:gap-5 text-xs font-bold text-[#D0C5B4] flex-wrap justify-center">
            <button
              type="button"
              onClick={(e) => handleLink(e, 'home', '#about')}
              className="hover:text-[#F3BA63] transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>من نحن</span>
            </button>
            <span className="text-[#36493F]">•</span>
            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className="hover:text-[#F3BA63] transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>اتصل بنا</span>
            </button>
            <span className="text-[#36493F]">•</span>
            <button
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="hover:text-[#4ADE80] transition-colors cursor-pointer flex items-center gap-1 text-[#6EE7B7]"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
              <span>سياسة الخصوصية</span>
            </button>
          </div>

          <div className="flex items-center gap-1 text-[#786D60]">
            <span>صُنِع بكل</span>
            <Heart className="w-3.5 h-3.5 text-[#DC2626] fill-current" />
            <span>لإحياء تراث العطارة المغربية</span>
          </div>
        </div>

      </div>

      {/* 1. Modal: سياسة الخصوصية (Privacy Policy) */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#101713] border border-[#26372D] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="absolute top-5 left-5 text-[#A89C89] hover:text-white bg-[#1A2620] hover:bg-[#2A3C32] p-2 rounded-xl transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#213027]">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#047857] text-white flex items-center justify-center shadow-lg shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black font-['Cairo'] text-white">
                  سياسة الخصوصية وحماية المعطيات
                </h3>
                <p className="text-xs text-[#A89C89]">
                  التزام تام بالسرية وأمان بيانات زبنائنا الكرام في {storeSettings.storeName}
                </p>
              </div>
            </div>

            <div className="space-y-5 text-xs sm:text-sm text-[#C8BCAB] leading-relaxed">
              <div className="bg-[#15201A] p-4 rounded-2xl border border-[#273B30]">
                <p className="font-bold text-white mb-1.5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  <span>الالتزام بالقانون المغربي رقم 09-08:</span>
                </p>
                <p className="text-[#A89C89]">
                  نلتزم بالاحترام التام للسرية وحماية الأشخاص الذاتيين تجاه معالجة المعطيات ذات الطابع الشخصي. كل معلوماتكم تعامل بأقصى درجات الأمان والسرية المهنية.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#F3BA63] text-sm mb-1.5">1. ما هي البيانات التي نجمعها؟</h4>
                <p className="text-[#B5A896]">
                  نجمع فقط المعلومات الضرورية لإتمام وتوصيل طلبك لباب بيتك: (الاسم الكامل، رقم الهاتف للتواصل وقت التسليم، والمدينة والعنوان). لا نطلب أي بيانات بنكية سرية أو بطاقات مصرفية.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#F3BA63] text-sm mb-1.5">2. كيف نستخدم معلوماتك؟</h4>
                <ul className="list-disc list-inside space-y-1 text-[#B5A896]">
                  <li>تأكيد طلبيتك هاتفياً أو عبر تطبيق الواتساب قبل إرسال الشحنة.</li>
                  <li>تزويد مندوب التوصيل المعتمد بعنوانك ورقمك لتسليم الطرد بنجاح.</li>
                  <li>إرسال رقم التتبع لإشعارك بموعد وصول الموزع.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-[#F3BA63] text-sm mb-1.5">3. عدم مشاركة البيانات مع أطراف ثالثة:</h4>
                <p className="text-[#B5A896]">
                  نضمن لك 100% أن أرقام هواتفكم وعناوينكم <strong className="text-white">لا تُباع، ولا تُؤجَّر، ولا تُشارَك</strong> مع أي شركات تسويقية أو أطراف خارجية على الإطلاق.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#F3BA63] text-sm mb-1.5">4. الدفع الآمن عند الاستلام (COD):</h4>
                <p className="text-[#B5A896]">
                  نحن نوفر خدمة الدفع نقداً عند استلام الطرد بعد معاينة المنتجات، أو عبر التحويل البنكي المباشر لحساب المحل، وبالتالي لا نقوم بتسجيل أو تخزين أية أرقام بطاقات دفع.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#F3BA63] text-sm mb-1.5">5. حق التعديل وحذف البيانات:</h4>
                <p className="text-[#B5A896]">
                  يحق لك في أي وقت التواصل معنا مباشرة عبر الواتساب لطلب حذف بياناتك أو تعديل سجل طلبياتك بشكل فوري ودائم.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-[#213027] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="bg-[#10B981] hover:bg-[#059669] text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-lg"
              >
                فهمت وموافق ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: اتصل بنا (Contact Us) */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#101713] border border-[#26372D] rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowContactModal(false);
                setContactSuccess(false);
              }}
              className="absolute top-5 left-5 text-[#A89C89] hover:text-white bg-[#1A2620] hover:bg-[#2A3C32] p-2 rounded-xl transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#213027]">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D97706] to-[#92400E] text-white flex items-center justify-center shadow-lg shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black font-['Cairo'] text-white">
                  اتصل بنا – خدمة الزبائن
                </h3>
                <p className="text-xs text-[#A89C89]">
                  فريق {storeSettings.storeName} رهن إشارتكم للإجابة عن كل الاستفسارات
                </p>
              </div>
            </div>

            {/* Quick Contact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <a
                href={`https://wa.me/${cleanWhatsappNumber}?text=${encodeURIComponent('السلام عليكم ورحمة الله، أريد الاستفسار عن منتجات العطارة.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-2xl bg-[#14261C] border border-[#25D366]/40 hover:border-[#25D366] transition-all flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#25D366] text-black flex items-center justify-center font-bold shrink-0">
                  <MessageCircle className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <span className="text-[11px] text-[#86EFAC] block font-bold">محادثة واتساب مباشرة</span>
                  <span className="text-xs font-mono font-bold text-white group-hover:text-[#25D366]" dir="ltr">
                    +{storeSettings.whatsapp || '212 7 75 04 46 15'}
                  </span>
                </div>
              </a>

              <a
                href={`tel:${storeSettings.phone || '+212775044615'}`}
                className="p-3.5 rounded-2xl bg-[#17221C] border border-[#2B3C32] hover:border-[#D97706] transition-all flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#D97706] text-white flex items-center justify-center font-bold shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-[#A89C89] block font-bold">اتصال هاتفي مباشر</span>
                  <span className="text-xs font-mono font-bold text-white group-hover:text-[#F3BA63]" dir="ltr">
                    {storeSettings.phone || '+212 7 75 04 46 15'}
                  </span>
                </div>
              </a>
            </div>

            {/* Direct WhatsApp Quick Message Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!contactMessage.trim()) return;
                const msg = `السلام عليكم ورحمة الله،\nالاسم: ${contactName || 'زبون'}\nالموضوع: ${contactSubject || 'استفسار عن المنتجات'}\nالرسالة: ${contactMessage}`;
                window.open(`https://wa.me/${cleanWhatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
                setContactSuccess(true);
              }}
              className="space-y-3 bg-[#0B120E] p-4 sm:p-5 rounded-2xl border border-[#1E2E25]"
            >
              <h4 className="text-xs font-bold text-[#FAF5EC] flex items-center gap-1.5 font-['Cairo']">
                <Send className="w-4 h-4 text-[#D97706]" />
                <span>إرسال رسالة مباشرة لفريق المتجر:</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#A89C89] mb-1">اسمك الكريم:</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="مثال: محمد، فاطمة..."
                    className="w-full bg-[#141E18] border border-[#25372C] rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#D97706]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#A89C89] mb-1">موضوع الاستفسار:</label>
                  <input
                    type="text"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    placeholder="مثال: استفسار عن خلطة زيادة الوزن"
                    className="w-full bg-[#141E18] border border-[#25372C] rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#D97706]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#A89C89] mb-1">رسالتك بالتفصيل:</label>
                <textarea
                  rows={3}
                  required
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="اكتب استفسارك أو طلبك هنا..."
                  className="w-full bg-[#141E18] border border-[#25372C] rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#D97706] resize-none"
                />
              </div>

              {contactSuccess && (
                <p className="text-xs text-[#34D399] font-bold bg-[#132A1F] p-2.5 rounded-xl border border-[#10B981]/40 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  <span>تم تجهيز الرسالة وفتح تطبيق الواتساب بنجاح!</span>
                </p>
              )}

              <button
                type="submit"
                className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-black font-black py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>إرسال الرسالة عبر الواتساب فوراً</span>
              </button>
            </form>

            {/* Address & Hours Summary */}
            <div className="mt-4 pt-3 border-t border-[#1C2922] grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#A89C89]">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                <span className="truncate">{storeSettings.address || 'المغرب'}، {storeSettings.city || 'الدار البيضاء'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                <span className="truncate">{storeSettings.openingHours || 'يومياً 08:30 - 21:30'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Admin Login Modal triggered by clicking © */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#121A15] border border-[#2A3C32] rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setShowAdminModal(false);
                setAdminPinInput('');
                setAdminPinError('');
              }}
              className="absolute top-4 left-4 text-[#A89C89] hover:text-white p-1 rounded-lg cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-[#2D1A0C] border border-[#D97706]/40 rounded-full flex items-center justify-center mx-auto mb-3 text-[#F3BA63]">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black font-['Cairo'] text-white">دخول لوحة إدارة المحل</h3>
              <p className="text-xs text-[#A89C89] mt-1">
                أدخل رمز الأمان (PIN) الخاص بالمشرف للوصول الفوري
              </p>
            </div>

            <form onSubmit={handleAdminPinSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={adminPinInput}
                  onChange={(e) => setAdminPinInput(e.target.value)}
                  placeholder="أدخل رمز PIN الخاص بالإدارة"
                  autoFocus
                  className="w-full bg-[#0A100D] text-center text-xl tracking-widest text-white px-4 py-3 rounded-xl border border-[#2B3C32] focus:outline-hidden focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20 placeholder:text-sm placeholder:tracking-normal placeholder:text-[#6B7C73]"
                />
              </div>

              {adminPinError && (
                <p className="text-xs text-red-400 font-bold text-center bg-red-950/40 p-2 rounded-lg border border-red-900/50">
                  {adminPinError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmittingPin || !adminPinInput.trim()}
                className="w-full bg-[#D97706] hover:bg-[#B45309] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-md cursor-pointer text-sm"
              >
                {isSubmittingPin ? 'جاري التحقق...' : 'دخول لوحة التحكم ⚙️'}
              </button>
            </form>
          </div>
        </div>
      )}
    </footer>
  );
};
