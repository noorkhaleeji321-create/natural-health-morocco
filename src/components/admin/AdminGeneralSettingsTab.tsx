import React, { useState, useEffect, useRef } from 'react';
import { Settings, CheckCircle2, AlertCircle, Save, RotateCcw } from 'lucide-react';

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
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isSettingsDirtyRef = useRef(false);

  useEffect(() => {
    if (!isSettingsDirtyRef.current) {
      setThreshold(storeSettings.freeShippingThreshold ?? 250);
      setShippingFee(storeSettings.shippingFee ?? 35);
      setCurrency(storeSettings.currency || 'DH');
      setAdminPin(storeSettings.adminPin || '');
    }
  }, [storeSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateSettings({
        freeShippingThreshold: Number(threshold),
        shippingFee: Number(shippingFee),
        currency: currency.trim() || 'DH',
        adminPin: adminPin.trim() || storeSettings.adminPin || '',
      });

      isSettingsDirtyRef.current = false;
      const successMsg = '✓ تم حفظ الإعدادات العامة بنجاح!';
      setSaveStatus({ type: 'success', message: successMsg });
      showNotification(successMsg, 'success');

      setTimeout(() => {
        setSaveStatus(null);
      }, 5000);
    } catch (err: any) {
      setSaveStatus({ type: 'error', message: `حدث خطأ أثناء حفظ الإعدادات العامة: ${err?.message || 'إعادة المحاولة'}` });
      showNotification('حدث خطأ أثناء حفظ الإعدادات العامة', 'error');
    } finally {
      setIsSaving(false);
    }
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-[#101713] border border-[#213027] rounded-3xl p-6 sm:p-8 shadow-2xl">
        <h3 className="text-base font-bold text-[#F3BA63] mb-4 pb-3 border-b border-[#213027] flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#D97706]" />
          <span>إعدادات الشحن، العملة، وحماية الإدارة</span>
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

        <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-bold text-[#E5DCce] mb-1">
              الحد الأدنى للشحن المجاني (DH)
            </label>
            <input
              type="number"
              min="0"
              value={threshold ?? ''}
              onChange={(e) => {
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
            <span>{isSaving ? 'جاري الحفظ...' : 'حفظ وتحديث الإعدادات العامة'}</span>
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
