import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { ImageUploadField } from './ImageUploadField';

export interface AdminContentTabProps {
  storeSettings: any;
  onUpdateSettings: (updates: any) => void;
  showNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminContentTab: React.FC<AdminContentTabProps> = ({
  storeSettings,
  onUpdateSettings,
  showNotification,
}) => {
  const [storeName, setStoreName] = useState(storeSettings.storeName || '');
  const [storeSlogan, setStoreSlogan] = useState(storeSettings.storeSlogan || '');
  const [logoUrl, setLogoUrl] = useState(storeSettings.logoUrl || '');
  const [phone, setPhone] = useState(storeSettings.phone || '');
  const [whatsapp, setWhatsapp] = useState(storeSettings.whatsapp || '');
  const [address, setAddress] = useState(storeSettings.address || '');
  const [city, setCity] = useState(storeSettings.city || '');
  const [openingHours, setOpeningHours] = useState(storeSettings.openingHours || '');
  const [email, setEmail] = useState(storeSettings.email || '');
  const [announcementText, setAnnouncementText] = useState(storeSettings.announcementText || '');

  const [aboutImageUrl, setAboutImageUrl] = useState(storeSettings.aboutImageUrl || '/assets/aistudio/WhatsApp_Image_2026-10-27_at_09.50.47_daghta_5b75ff5a.jpeg');
  const [aboutBadgeYears, setAboutBadgeYears] = useState(storeSettings.aboutBadgeYears || '25+');
  const [aboutBadgeTitle, setAboutBadgeTitle] = useState(storeSettings.aboutBadgeTitle || 'سنة من العطاء والأمانة');
  const [aboutBadgeSubtitle, setAboutBadgeSubtitle] = useState(storeSettings.aboutBadgeSubtitle || 'خدمة العائلات بأجود أنواع العطارة');
  const [aboutStoryP1, setAboutStoryP1] = useState(storeSettings.aboutStoryP1 || '');
  const [aboutStoryP2, setAboutStoryP2] = useState(storeSettings.aboutStoryP2 || '');

  const [aboutSaveStatus, setAboutSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isAboutSaving, setIsAboutSaving] = useState(false);
  const [infoSaveStatus, setInfoSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isInfoSaving, setIsInfoSaving] = useState(false);
  const isContentDirtyRef = useRef(false);

  useEffect(() => {
    if (!isContentDirtyRef.current) {
      setStoreName(storeSettings.storeName || '');
      setStoreSlogan(storeSettings.storeSlogan || '');
      setLogoUrl(storeSettings.logoUrl || '');
      setPhone(storeSettings.phone || '');
      setWhatsapp(storeSettings.whatsapp || '');
      setAddress(storeSettings.address || '');
      setCity(storeSettings.city || '');
      setOpeningHours(storeSettings.openingHours || '');
      setEmail(storeSettings.email || '');
      setAnnouncementText(storeSettings.announcementText || '');
      setAboutImageUrl(storeSettings.aboutImageUrl || '/assets/aistudio/WhatsApp_Image_2026-10-27_at_09.50.47_daghta_5b75ff5a.jpeg');
      setAboutBadgeYears(storeSettings.aboutBadgeYears || '25+');
      setAboutBadgeTitle(storeSettings.aboutBadgeTitle || 'سنة من العطاء والأمانة');
      setAboutBadgeSubtitle(storeSettings.aboutBadgeSubtitle || 'خدمة العائلات بأجود أنواع العطارة');
      setAboutStoryP1(storeSettings.aboutStoryP1 || '');
      setAboutStoryP2(storeSettings.aboutStoryP2 || '');
    }
  }, [storeSettings]);

  const handleSaveStoreInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      setInfoSaveStatus({
        type: 'error',
        message: 'يرجى إدخال اسم المتجر (حقل إجباري)',
      });
      showNotification('يرجى إدخال اسم المتجر أولاً', 'error');
      return;
    }

    setIsInfoSaving(true);
    try {
      await onUpdateSettings({
        storeName: storeName.trim(),
        storeSlogan: storeSlogan.trim(),
        logoUrl: logoUrl.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        address: address.trim(),
        city: city.trim(),
        openingHours: openingHours.trim(),
        email: email.trim(),
        announcementText: announcementText.trim(),
      });

      isContentDirtyRef.current = false;
      const successMsg = '✓ تم حفظ وتحديث معلومات هوية المتجر وبيانات التواصل بنجاح!';
      setInfoSaveStatus({ type: 'success', message: successMsg });
      showNotification('✓ تم حفظ هوية المتجر وبيانات التواصل بنجاح!', 'success');

      setTimeout(() => {
        setIsInfoSaving(false);
        setInfoSaveStatus(null);
      }, 5000);
    } catch (err: any) {
      setInfoSaveStatus({
        type: 'error',
        message: `حدث خطأ أثناء حفظ المعلومات: ${err?.message || 'يرجى إعادة المحاولة.'}`,
      });
      showNotification('حدث خطأ أثناء الحفظ', 'error');
      setIsInfoSaving(false);
    }
  };

  const handleSaveAboutSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAboutSaving(true);
    try {
      await onUpdateSettings({
        aboutImageUrl: aboutImageUrl.trim(),
        aboutBadgeYears: aboutBadgeYears.trim(),
        aboutBadgeTitle: aboutBadgeTitle.trim(),
        aboutBadgeSubtitle: aboutBadgeSubtitle.trim(),
        aboutStoryP1: aboutStoryP1.trim(),
        aboutStoryP2: aboutStoryP2.trim(),
      });

      const successMsg = '✓ تم حفظ صورة ونصوص خانة "من نحن / قصة المتجر" وتطبيقها فوراً!';
      setAboutSaveStatus({ type: 'success', message: successMsg });
      showNotification('✓ تم حفظ خانة "من نحن" بنجاح!', 'success');

      setTimeout(() => {
        setIsAboutSaving(false);
        setAboutSaveStatus(null);
      }, 5000);
    } catch (err: any) {
      setAboutSaveStatus({
        type: 'error',
        message: `حدث خطأ أثناء حفظ بيانات خانة من نحن: ${err?.message || 'يرجى المحاولة مجدداً.'}`,
      });
      showNotification('حدث خطأ أثناء الحفظ', 'error');
      setIsAboutSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Store Identity Card */}
      <div className="bg-[#101713] border border-[#213027] rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#213027]">
          <h3 className="text-base font-bold text-[#F3BA63] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#D97706]" />
            <span>هوية المتجر، الشعار، النصوص وبيانات التواصل</span>
          </h3>
          <span className="text-[11px] bg-[#17251E] text-[#6EE7B7] border border-[#10B981]/30 px-2.5 py-1 rounded-full font-semibold">
            تحديث فوري ومباشر
          </span>
        </div>

        {infoSaveStatus && (
          <div
            className={`mb-6 p-4 rounded-2xl flex items-start gap-3 text-xs sm:text-sm font-bold border transition-all animate-in fade-in duration-300 ${
              infoSaveStatus.type === 'success'
                ? 'bg-[#102A1C] text-[#6EE7B7] border-[#10B981]'
                : 'bg-[#2A1515] text-[#FCA5A5] border-[#EF4444]'
            }`}
          >
            {infoSaveStatus.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-[#10B981] mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-[#EF4444] mt-0.5" />
            )}
            <div className="flex-1">
              <p>{infoSaveStatus.message}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSaveStoreInfo} className="space-y-4 text-xs sm:text-sm">
          <div className="bg-[#141D17] border border-[#233127] rounded-2xl p-4 sm:p-5 mb-4">
            <ImageUploadField
              label="لوجو / شعار المتجر (يظهر في الهيدر والفوتر)"
              value={logoUrl}
              onChange={(val) => setLogoUrl(val)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#E5DCce] mb-1">
                اسم المتجر <span className="text-[#D97706]">*</span>
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => {
                  setStoreName(e.target.value);
                  setInfoSaveStatus(null);
                }}
                placeholder="مثال: متجر الهوية الرقمية"
                className="w-full bg-[#18231D] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:border-[#D97706]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#E5DCce] mb-1">شعار المتجر (Slogan)</label>
              <input
                type="text"
                value={storeSlogan}
                onChange={(e) => {
                  setStoreSlogan(e.target.value);
                  setInfoSaveStatus(null);
                }}
                placeholder="مثال: منتجات رقمية ومواقع جاهزة"
                className="w-full bg-[#18231D] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:border-[#D97706]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#E5DCce] mb-1">
                نص شريط الإعلانات العلوي
              </label>
              <input
                type="text"
                value={announcementText}
                onChange={(e) => {
                  setAnnouncementText(e.target.value);
                  setInfoSaveStatus(null);
                }}
                placeholder="مثال: خصم 20% على جميع المواقع والمنتجات"
                className="w-full bg-[#18231D] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:border-[#D97706]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#E5DCce] mb-1">رقم الهاتف للاتصال</label>
              <input
                type="text"
                dir="ltr"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setInfoSaveStatus(null);
                }}
                placeholder="+212 6 61 23 45 67"
                className="w-full bg-[#18231D] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white font-mono text-right focus:outline-hidden focus:border-[#D97706]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#E5DCce] mb-1">رقم WhatsApp للتواصل</label>
              <input
                type="text"
                dir="ltr"
                value={whatsapp}
                onChange={(e) => {
                  setWhatsapp(e.target.value);
                  setInfoSaveStatus(null);
                }}
                placeholder="212661234567"
                className="w-full bg-[#18231D] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white font-mono text-right focus:outline-hidden focus:border-[#D97706]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#E5DCce] mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setInfoSaveStatus(null);
                }}
                placeholder="contact@store.ma"
                className="w-full bg-[#18231D] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white font-mono text-right focus:outline-hidden focus:border-[#D97706]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#E5DCce] mb-1">المدينة والموقع</label>
              <input
                type="text"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setInfoSaveStatus(null);
                }}
                placeholder="مثال: الدار البيضاء، المغرب"
                className="w-full bg-[#18231D] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:border-[#D97706]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#E5DCce] mb-1">أوقات العمل</label>
              <input
                type="text"
                value={openingHours}
                onChange={(e) => {
                  setOpeningHours(e.target.value);
                  setInfoSaveStatus(null);
                }}
                placeholder="مثال: يومياً من 08:30 صباحاً إلى 09:30 مساءً"
                className="w-full bg-[#18231D] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:border-[#D97706]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#E5DCce] mb-1">العنوان بالتفصيل</label>
              <input
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setInfoSaveStatus(null);
                }}
                placeholder="العنوان الكامل للمتجر..."
                className="w-full bg-[#18231D] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:border-[#D97706]"
              />
            </div>
          </div>

          <div className="pt-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className={`font-bold px-7 py-3 rounded-xl text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 ${
                isInfoSaving || infoSaveStatus?.type === 'success'
                  ? 'bg-[#10B981] hover:bg-[#059669] text-white ring-2 ring-[#34D399]/50'
                  : 'bg-[#D97706] hover:bg-[#B45309] text-white'
              }`}
            >
              {isInfoSaving || infoSaveStatus?.type === 'success' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
                  <span>تم حفظ معلومات الهوية بنجاح! ✓</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>حفظ معلومات الهوية والتواصل</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* About Section */}
      <div className="bg-[#101713] border border-[#213027] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#213027]">
          <div>
            <h3 className="text-base font-bold text-[#F3BA63] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D97706]" />
              <span>إدارة وتعديل قسم "من نحن / قصة المتجر" والصورة الإعلانية</span>
            </h3>
          </div>
        </div>

        {aboutSaveStatus && (
          <div
            className={`p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-bold border transition-all animate-in fade-in ${
              aboutSaveStatus.type === 'success'
                ? 'bg-[#102A1C] text-[#6EE7B7] border-[#10B981]'
                : 'bg-[#2A1515] text-[#FCA5A5] border-[#EF4444]'
            }`}
          >
            {aboutSaveStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#10B981]" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-[#EF4444]" />
            )}
            <span>{aboutSaveStatus.message}</span>
          </div>
        )}

        <form onSubmit={handleSaveAboutSection} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#E5DCce] mb-1">
                رمز الخبرة / سنوات العمل
              </label>
              <input
                type="text"
                value={aboutBadgeYears}
                onChange={(e) => {
                  setAboutBadgeYears(e.target.value);
                  setAboutSaveStatus(null);
                }}
                placeholder="مثال: 10+"
                className="w-full bg-[#18231D] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-hidden focus:border-[#D97706]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#E5DCce] mb-1">
                عنوان البطاقة
              </label>
              <input
                type="text"
                value={aboutBadgeTitle}
                onChange={(e) => {
                  setAboutBadgeTitle(e.target.value);
                  setAboutSaveStatus(null);
                }}
                placeholder="مثال: خبرة وتميز"
                className="w-full bg-[#18231D] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-hidden focus:border-[#D97706]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#E5DCce] mb-1">
                الوصف المرفق
              </label>
              <input
                type="text"
                value={aboutBadgeSubtitle}
                onChange={(e) => {
                  setAboutBadgeSubtitle(e.target.value);
                  setAboutSaveStatus(null);
                }}
                placeholder="مثال: تقديم أفضل حلول البرمجة والتصميم"
                className="w-full bg-[#18231D] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:border-[#D97706]"
              />
            </div>
          </div>

          <div className="pt-2">
            <ImageUploadField
              label="صورة قسم من نحن"
              value={aboutImageUrl}
              onChange={(newUrl) => {
                setAboutImageUrl(newUrl);
                setAboutSaveStatus(null);
              }}
              required
            />
          </div>

          <div className="pt-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className={`font-bold px-7 py-3 rounded-xl text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 ${
                isAboutSaving || aboutSaveStatus?.type === 'success'
                  ? 'bg-[#10B981] hover:bg-[#059669] text-white ring-2 ring-[#34D399]/50'
                  : 'bg-[#D97706] hover:bg-[#B45309] text-white'
              }`}
            >
              {isAboutSaving || aboutSaveStatus?.type === 'success' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
                  <span>تم حفظ قسم من نحن والصورة بنجاح! ✓</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>حفظ صورة ونصوص خانة من نحن</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
