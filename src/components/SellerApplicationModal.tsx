import React, { useState } from 'react';
import { Store, CheckCircle, AlertCircle, Upload, X, ShieldCheck, Sparkles, MapPin, Phone, User, FileText, ArrowLeft } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SellerApplicationRequest } from '../types';
import { api } from '../lib/api';
import { compressImage } from '../utils/imageCompressor';

interface SellerApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SellerApplicationModal: React.FC<SellerApplicationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, applyToBecomeSeller, currentSeller } = useStore();

  const [storeName, setStoreName] = useState('');
  const [sellerName, setSellerName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [city, setCity] = useState(currentUser?.city || 'مراكش');
  const [description, setDescription] = useState('');
  const [businessDocument, setBusinessDocument] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('/assets/aistudio/WhatsApp_Image_2026-10-27_at_09.50.47_daghta_5b75ff5a.jpeg');

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const compressed = await compressImage(file, 400, 400, 0.8);
      setLogoUrl(compressed);
    } catch {
      // ignore
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!storeName.trim()) {
      setErrorMsg('يرجى كتابة اسم المتجر أو التعاونية');
      return;
    }
    if (!sellerName.trim()) {
      setErrorMsg('يرجى كتابة اسم التاجر أو المسؤول');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('يرجى إدخال رقم الهاتف للتواصل والتحقق');
      return;
    }

    if (!currentUser) {
      setErrorMsg('يرجى تسجيل الدخول أو إنشاء حساب زبون أولاً لربط المتجر بحسابك');
      return;
    }

    setIsSubmitting(true);

    const payload: SellerApplicationRequest = {
      storeName: storeName.trim(),
      sellerName: sellerName.trim(),
      phone: phone.trim(),
      city: city.trim(),
      description: description.trim(),
      businessDocument: businessDocument.trim(),
      logoUrl: logoUrl.trim() || undefined,
      bannerUrl: bannerUrl.trim() || undefined,
    };

    const result = await applyToBecomeSeller(payload);
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMsg(result.message || 'تم إرسال طلبك بنجاح وهو قيد مراجعة إدارة السوق!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 2500);
    } else {
      setErrorMsg(result.error || 'حدث خطأ أثناء إرسال طلب البائع. يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-fadeIn" dir="rtl">
      <div className="relative w-full max-w-2xl bg-[#0F1612] border border-[#233328] rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header with decorative badge */}
        <div className="relative p-6 sm:p-7 bg-gradient-to-l from-[#17251E] to-[#0F1612] border-b border-[#233328]">
          <button
            onClick={onClose}
            className="absolute top-5 left-5 p-2 text-[#9A8D7C] hover:text-white bg-[#1A2820] hover:bg-[#253A2E] rounded-full border border-[#2B3E32] transition-colors cursor-pointer"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#D97706]/20 border border-[#D97706]/40 flex items-center justify-center text-[#F3BA63] shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F59E0B] bg-[#D97706]/10 px-2 py-0.5 rounded-full border border-[#D97706]/20 mb-1">
                <Sparkles className="w-3 h-3" />
                سوق التجار والتعاونيات الحرفية
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#FAF5EC] font-['Cairo']">
                طلب الانضمام كبائع في سوق «محل عند سعيد»
              </h2>
              <p className="text-xs sm:text-sm text-[#A89B88] mt-0.5">
                افتح متجرك المستقل، اعرض منتجاتك الطبيعية والتراثية، وتواصل مع آلاف الزبائن في جميع مدن المغرب
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-red-950/50 border border-red-800/80 rounded-xl text-red-200 text-xs sm:text-sm flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-950/60 border border-emerald-700 rounded-xl text-emerald-200 text-xs sm:text-sm flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {currentSeller && currentSeller.sellerStatus === 'pending' && (
            <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-200 text-xs sm:text-sm">
              <p className="font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#F59E0B]" />
                لديك طلب بائع مسجل بالفعل وهو حالياً: قيد المراجعة من طرف الإدارة.
              </p>
              <p className="text-[#C4B7A4] text-xs mt-1">
                سيتواصل معك فريق السوق عبر الواتساب فور استكمال التحقق من الوثائق لاعتماد متجرك.
              </p>
            </div>
          )}

          {/* Section 1: Store info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#E5DCce] flex items-center gap-2 border-b border-[#213026] pb-2">
              <Store className="w-4 h-4 text-[#D97706]" />
              بيانات المتجر أو التعاونية
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#C4B7A4] mb-1.5">
                  اسم المتجر / العلامة التجارية <span className="text-[#D97706]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تعاونية جبال الأطلس للأعشاب"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-[#141F19] border border-[#283C30] focus:border-[#D97706] rounded-xl px-3.5 py-2.5 text-sm text-[#FAF5EC] placeholder-[#665D50] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#C4B7A4] mb-1.5">
                  المدينة أو الإقليم <span className="text-[#D97706]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تارودانت، أكادير، خنيفرة، مراكش"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-[#141F19] border border-[#283C30] focus:border-[#D97706] rounded-xl px-3.5 py-2.5 text-sm text-[#FAF5EC] placeholder-[#665D50] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#C4B7A4] mb-1.5">
                نبذة عن نشاط المتجر ونوعية المنتجات
              </label>
              <textarea
                rows={2}
                placeholder="صف تخصصك (أعشاب علاجية، زيوت عضوية، عسل جبلي، صوابين طبيعية، بهارات بلدية...)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#141F19] border border-[#283C30] focus:border-[#D97706] rounded-xl px-3.5 py-2 text-sm text-[#FAF5EC] placeholder-[#665D50] focus:outline-none transition-colors resize-none"
              />
            </div>
          </div>

          {/* Section 2: Contact & Legal */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-[#E5DCce] flex items-center gap-2 border-b border-[#213026] pb-2">
              <User className="w-4 h-4 text-[#D97706]" />
              بيانات التاجر القانونية والاتصال
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#C4B7A4] mb-1.5">
                  اسم المسؤول / الحرفي القانوني <span className="text-[#D97706]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="الاسم الكامل"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  className="w-full bg-[#141F19] border border-[#283C30] focus:border-[#D97706] rounded-xl px-3.5 py-2.5 text-sm text-[#FAF5EC] placeholder-[#665D50] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#C4B7A4] mb-1.5">
                  رقم الهاتف والواتساب للتواصل <span className="text-[#D97706]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="06XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#141F19] border border-[#283C30] focus:border-[#D97706] rounded-xl px-3.5 py-2.5 text-sm text-[#FAF5EC] placeholder-[#665D50] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#C4B7A4] mb-1.5">
                رقم البطاقة الوطنية (CIN) أو السجل التجاري / وصل الإيداع
              </label>
              <input
                type="text"
                placeholder="مثال: EE123456 أو رقم السجل التعاوني 1234/2023"
                value={businessDocument}
                onChange={(e) => setBusinessDocument(e.target.value)}
                className="w-full bg-[#141F19] border border-[#283C30] focus:border-[#D97706] rounded-xl px-3.5 py-2 text-sm text-[#FAF5EC] placeholder-[#665D50] focus:outline-none transition-colors"
              />
              <span className="text-[11px] text-[#85796A] mt-1 block">
                تُحفظ هذه الوثائق بأمان لغرض التحقق من الموثوقية فقط ولا تظهر للمتسوقين.
              </span>
            </div>
          </div>

          {/* Section 3: Branding */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-[#E5DCce] flex items-center gap-2 border-b border-[#213026] pb-2">
              <Sparkles className="w-4 h-4 text-[#D97706]" />
              شعار المتجر وهوية العرض (اختياري)
            </h3>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-[#141F19] border border-[#283C30] flex items-center justify-center overflow-hidden shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="شعار المتجر" className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-8 h-8 text-[#5A4F42]" />
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 bg-[#1C2C22] hover:bg-[#253D2F] text-[#FAF5EC] text-xs font-bold px-3 py-2 rounded-lg border border-[#2F4738] transition-colors">
                    <Upload className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>{uploadingLogo ? 'جاري الرفع...' : 'رفع صورة الشعار'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                    />
                  </label>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="text-xs text-red-400 hover:text-red-300 px-2 py-1"
                    >
                      إزالة
                    </button>
                  )}
                </div>
                <input
                  type="url"
                  placeholder="أو ضع رابط صورة الشعار مباشرة"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full bg-[#141F19] border border-[#283C30] focus:border-[#D97706] rounded-lg px-3 py-1.5 text-xs text-[#FAF5EC] placeholder-[#665D50] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Terms Agreement */}
          <div className="p-3.5 bg-[#121A15] border border-[#223326] rounded-xl text-xs text-[#A89B88] space-y-1">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input type="checkbox" required defaultChecked className="mt-0.5 rounded accent-[#D97706]" />
              <span>
                أتعهد بأن جميع المنتجات المعروضة هي منتجات طبيعية أصلية خالية من الغش، ومطابقة للمواصفات الصحية، وألتزم بأسعار وتوصيل أمين لزبائن السوق.
              </span>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#233328]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-[#A89B88] hover:text-white bg-[#141E18] hover:bg-[#1A2820] border border-[#273B2F] rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-xs sm:text-sm font-black text-white bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#F59E0B] hover:to-[#D97706] rounded-xl shadow-lg shadow-[#D97706]/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جاري إرسال الطلب...</span>
                </>
              ) : (
                <>
                  <span>تأكيد وإرسال طلب فتح المتجر</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
