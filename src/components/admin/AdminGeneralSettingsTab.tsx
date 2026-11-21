import React, { useState, useEffect, useRef } from 'react';
import { Settings, CheckCircle2, AlertCircle, Save, RotateCcw, MessageCircle, Send } from 'lucide-react';

export interface AdminGeneralSettingsTabProps {
  storeSettings: any;
  onUpdateSettings: (updates: any) => void;
  onResetDefaults: () => void;
  showNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminGeneralSettingsTab: React.FC<AdminGeneralSettingsTabProps> = ({
  storeSettings,
  onUpdateSettings,
  onResetDefaults,
  showNotification,
}) => {
  const [threshold, setThreshold] = useState(storeSettings.freeShippingThreshold ?? 250);
  const [shippingFee, setShippingFee] = useState(storeSettings.shippingFee ?? 35);
  const [currency, setCurrency] = useState(storeSettings.currency || 'DH');
  const [adminPin, setAdminPin] = useState(storeSettings.adminPin || '');
  const [whatsappPhone, setWhatsappPhone] = useState(storeSettings.whatsapp || '+212 7 75 04 46 15');

  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isSettingsDirtyRef = useRef(false);

  const [testWhatsAppUrl, setTestWhatsAppUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isSettingsDirtyRef.current) {
      setThreshold(storeSettings.freeShippingThreshold ?? 250);
      setShippingFee(storeSettings.shippingFee ?? 35);
      setCurrency(storeSettings.currency || 'DH');
      setAdminPin(storeSettings.adminPin || '');
      setWhatsappPhone(storeSettings.whatsapp || '+212 7 75 04 46 15');
    }
  }, [storeSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res: any = await onUpdateSettings({
        freeShippingThreshold: Number(threshold),
        shippingFee: Number(shippingFee),
        currency: currency.trim() || 'DH',
        adminPin: adminPin.trim() || storeSettings.adminPin || '',
        whatsapp: whatsappPhone.trim(),
      });

      isSettingsDirtyRef.current = false;
      const isSyncedToFirebase = res?.firestoreSaved === true;

      if (isSyncedToFirebase) {
        const successMsg = '✓ تم حفظ الإعدادات وتشفيرها بنجاح في قاعدة بيانات Firebase (سحابة آمنة 100%) 🟢';
        setSaveStatus({ type: 'success', message: successMsg });
        showNotification(successMsg, 'success');
      } else {
        const warningMsg = '🚨 علامة خطر: المعلومات لم تحفظ في Firebase! (تم الحفظ محلياً فقط، تعذر الاتصال بسحابة Firebase).';
        setSaveStatus({ type: 'error', message: warningMsg });
        showNotification(warningMsg, 'error');
      }
    } catch (err: any) {
      setSaveStatus({
        type: 'error',
        message: `🚨 علامة خطر: حدث خطأ أثناء حفظ الإعدادات في Firebase: ${err?.message || 'إعادة المحاولة'}`
      });
      showNotification('علامة خطر: فشل حفظ الإعدادات في Firebase', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = () => {
    const cleanPhone = (whatsappPhone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length < 9) {
      showNotification('يرجى إدخال رقم WhatsApp صحيح أولاً.', 'error');
      return;
    }
    const sampleMsg = '📦 رسالة تجريبية من متجر Natural Health Morocco — رقم الواتساب يعمل بنجاح ✅';
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(sampleMsg)}`;
    setTestWhatsAppUrl(url);
    showNotification('🚀 تم تحضير رابط إشعار WhatsApp التجريبي بنجاح!', 'success');
  };

  const handleReset = () => {
    if (
      window.confirm(
        'هل أنت متأكد من إعادة تعيين جميع البيانات إلى الإعدادات الأولية الافتراضية؟'
      )
    ) {
      onResetDefaults();
      showNotification('تم استرجاع البيانات الافتراضية للمتجر.', 'success');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Direct WhatsApp Test Card */}
      <div className="bg-[#101713] border border-[#213027] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] flex items-center justify-center shrink-0">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Cairo']">
                روابط الطلب المباشر عبر WhatsApp
              </h3>
              <p className="text-xs text-[#8A9B90] mt-0.5">
                يتم استخدام رقم الواتساب أدناه مباشرة في أزرار الطلب بالسلة وصفحة المنتجات بدون أي خادم إضافي.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestNotification}
            className="bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-[#25D366] text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>اختبار رابط WhatsApp</span>
          </button>
        </div>

        {testWhatsAppUrl && (
          <div className="mt-4 p-4 rounded-2xl bg-[#102A1C] border border-[#10B981]/40 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-[#6EE7B7] text-xs font-bold">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-[#10B981]" />
              <span>رابط واتساب التجريبي جاهز:</span>
            </div>
            <a
              href={testWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] hover:bg-[#20bd5a] text-black font-black text-xs px-5 py-2.5 rounded-xl shadow-lg transition-transform hover:scale-102 flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>فتح واتساب وإرسال الرسالة التجريبية 💬</span>
            </a>
          </div>
        )}
      </div>

      {/* Main Settings Form */}
      <div className="bg-[#101713] border border-[#213027] rounded-3xl p-6 sm:p-8 shadow-2xl">
        <h3 className="text-base font-bold text-[#F3BA63] mb-4 pb-3 border-b border-[#213027] flex items-center gap-2 font-['Cairo']">
          <Settings className="w-5 h-5 text-[#D97706]" />
          <span>إعدادات الشحن، العملة، إشعارات WhatsApp وحماية الإدارة</span>
        </h3>

        {saveStatus && (
          <div
            className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-bold border transition-all animate-in fade-in ${
              saveStatus.type === 'success'
                ? 'bg-[#102A1C] text-[#6EE7B7] border-[#10B981]'
                : 'bg-[#2A1515] text-[#FCA5A5] border-[#EF4444]'
            }`}
          >
            {saveStatus.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-[#10B981]" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-[#EF4444]" />
            )}
            <span>{saveStatus.message}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5 text-xs sm:text-sm">
          {/* WhatsApp Direct Notification Setup */}
          <div className="bg-[#17231B] border border-[#2B3E32] rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#25D366] font-bold text-xs font-['Cairo']">
              <MessageCircle className="w-4 h-4" />
              <span>رقم WhatsApp لتلقي إشعارات الطلبات الفورية (بدون Token أو Bot)</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#E5DCce] mb-1">
                رقم WhatsApp للتاجر (المستلم للطلبات)
              </label>
              <input
                type="text"
                value={whatsappPhone}
                onChange={(e) => {
                  isSettingsDirtyRef.current = true;
                  setWhatsappPhone(e.target.value);
                  setSaveStatus(null);
                }}
                placeholder="مثال: +212661234567 أو 0661234567"
                className="w-full bg-[#101713] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-hidden focus:border-[#25D366]"
              />
              <span className="text-[11px] text-[#8A9B90] mt-1.5 block leading-relaxed">
                سيتم توجيه جميع إشعارات الطلبات الفورية التي يضعها الزبناء مباشرة إلى رقم WhatsApp هذا بصيغة منسقة ومنظمة شاملاً جميع التفاصيل.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#E5DCce] mb-1">
              الحد الأدنى للشحن المجاني (DH)
            </label>
            <input
              type="number"
              min="0"
              value={threshold ?? ''}
              onChange={(e) => {
                isSettingsDirtyRef.current = true;
                setThreshold(e.target.value === '' ? '' : Number(e.target.value));
                setSaveStatus(null);
              }}
              className="w-full bg-[#18231D] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-hidden focus:border-[#D97706]"
            />
            <span className="text-[11px] text-[#8A9B90] mt-1 block">
              الطلبات التي يتجاوز مجموعها هذا المبلغ ستحصل على شحن مجاني تلقائياً.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#E5DCce] mb-1">
              تكلفة التوصيل الاعتيادية (DH)
            </label>
            <input
              type="number"
              min="0"
              value={shippingFee ?? ''}
              onChange={(e) => {
                isSettingsDirtyRef.current = true;
                setShippingFee(e.target.value === '' ? '' : Number(e.target.value));
                setSaveStatus(null);
              }}
              className="w-full bg-[#18231D] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-hidden focus:border-[#D97706]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#E5DCce] mb-1">رمز العملة</label>
            <input
              type="text"
              value={currency ?? ''}
              onChange={(e) => {
                isSettingsDirtyRef.current = true;
                setCurrency(e.target.value);
                setSaveStatus(null);
              }}
              className="w-full bg-[#18231D] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:border-[#D97706]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#E5DCce] mb-1">
              رمز الأمان الخاص بمدير المتجر (Admin PIN)
            </label>
            <input
              type="text"
              maxLength={15}
              value={adminPin ?? ''}
              onChange={(e) => {
                isSettingsDirtyRef.current = true;
                setAdminPin(e.target.value);
                setSaveStatus(null);
              }}
              placeholder="أدخل رمز PIN السري للإدارة"
              className="w-full bg-[#18231D] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white font-mono tracking-widest focus:outline-hidden focus:border-[#D97706]"
            />
            <p className="text-[11px] text-[#A89C89] mt-1.5 leading-relaxed">
              هذا الرمز هو الذي تستعمله للدخول إلى لوحة الإدارة.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-[#D97706] hover:bg-[#B45309] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-4 transition-transform hover:scale-101"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'جاري الحفظ...' : 'حفظ وتحديث جميع الإعدادات'}</span>
          </button>
        </form>
      </div>

      <div className="bg-[#1C1212] border border-[#EF4444]/30 rounded-3xl p-6 space-y-3">
        <h4 className="text-sm font-bold text-[#FCA5A5] flex items-center gap-2">
          <RotateCcw className="w-4 h-4" />
          <span>إعادة التعيين إلى البيانات الافتراضية:</span>
        </h4>
        <p className="text-xs text-[#E5C1C1]">
          إذا رغبت في إعادة ضبط المتجر واستعادة البيانات الافتراضية.
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
        >
          استعادة البيانات الافتراضية
        </button>
      </div>
    </div>
  );
};
