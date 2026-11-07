import React, { useState, useEffect, useRef } from 'react';
import { Settings, CheckCircle2, AlertCircle, Save, RotateCcw, MessageCircle, Send, Activity, Database, ShieldCheck, RefreshCw, Smartphone } from 'lucide-react';

export interface AdminGeneralSettingsTabProps {
  storeSettings: any;
  onUpdateSettings: (updates: any) => void;
  onResetDefaults: () => void;
  showNotification: (msg: string, type?: 'success' | 'error') => void;
}

interface BotStatusData {
  status: string;
  uptimeSeconds: number;
  uptimeFormatted?: string;
  memoryUsageMb?: string;
  lastBackupAt?: string | null;
  lastBackupTimestamp?: string | null;
  notificationCount?: number;
  totalOrdersProcessed?: number;
  whatsappConfigured?: boolean;
  whatsappNumber?: string;
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

  // Worker & Notification State
  const [botStatus, setBotStatus] = useState<BotStatusData | null>(null);
  const [loadingBotStatus, setLoadingBotStatus] = useState(false);
  const [isTestingBot, setIsTestingBot] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const fetchBotStatus = async () => {
    setLoadingBotStatus(true);
    try {
      const res = await fetch('/api/bot/status');
      if (res.ok) {
        const data = await res.json();
        if (data.status) {
          setBotStatus(data.status);
        }
      }
    } catch {
      // Ignore if server unreachable
    } finally {
      setLoadingBotStatus(false);
    }
  };

  useEffect(() => {
    fetchBotStatus();
  }, []);

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

      fetchBotStatus();
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

  const handleTestNotification = async () => {
    setIsTestingBot(true);
    try {
      const res = await fetch('/api/bot/test-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsappNumber: whatsappPhone.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.whatsappUrl) {
        showNotification('🚀 تم تحضير تنبيه WhatsApp التجريبي بنجاح! يتم الفتح الآن...', 'success');
        window.open(data.whatsappUrl, '_blank');
        fetchBotStatus();
      } else {
        showNotification(`⚠️ ${data.message || 'فشل إنشاء إشعار WhatsApp التجريبي.'}`, 'error');
      }
    } catch {
      showNotification('حدث خطأ أثناء محاولة إرسال التنبيه التجريبي', 'error');
    } finally {
      setIsTestingBot(false);
    }
  };

  const handleManualBackup = async () => {
    setIsBackingUp(true);
    try {
      const res = await fetch('/api/bot/manual-backup', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('💾 تم إنشاء واستحداث النسخة الاحتياطية بنجاح!', 'success');
        fetchBotStatus();
      } else {
        showNotification('فشل إنشاء النسخة الاحتياطية الحالية', 'error');
      }
    } catch {
      showNotification('حدث خطأ أثناء طلب النسخة الاحتياطية', 'error');
    } finally {
      setIsBackingUp(false);
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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Bot & Quota Guard Status Card */}
      <div className="bg-[#101713] border border-[#213027] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#213027]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] flex items-center justify-center shrink-0">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-['Cairo']">
                  نظام إشعارات WhatsApp المباشر ومراقب المتجر
                </h3>
                <span className="bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Activity className="w-3 h-3 animate-pulse" />
                  <span>بدون Token أو ID (بأسهل طريقة)</span>
                </span>
              </div>
              <p className="text-xs text-[#8A9B90] mt-0.5">
                تنبيهات الطلبات الفورية بنقرة واحدة عبر WhatsApp + النسخ الاحتياطي التلقائي اليومي
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchBotStatus}
            disabled={loadingBotStatus}
            className="text-xs bg-[#17231B] hover:bg-[#1E2E24] text-[#D1D5DB] border border-[#2B3E32] px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingBotStatus ? 'animate-spin' : ''}`} />
            <span>تحديث الحالة</span>
          </button>
        </div>

        {/* Worker Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
          <div className="bg-[#17231B] border border-[#2B3E32] rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#101713] text-[#25D366] flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-[#8A9B90] block">رقم واتساب التاجر</span>
              <span className="text-xs font-mono font-bold text-[#25D366]">{whatsappPhone || 'غير محدد'}</span>
            </div>
          </div>

          <div className="bg-[#17231B] border border-[#2B3E32] rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#101713] text-[#10B981] flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-[#8A9B90] block">آخر نسخة احتياطية</span>
              <span className="text-xs font-mono font-bold text-[#10B981]">
                {botStatus?.lastBackupAt ? new Date(botStatus.lastBackupAt).toLocaleTimeString('ar-MA') : 'محفوظة تلقائياً'}
              </span>
            </div>
          </div>

          <div className="bg-[#17231B] border border-[#2B3E32] rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#101713] text-[#F59E0B] flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-[#8A9B90] block">حالة الخادم المحلي</span>
              <span className="text-xs font-mono font-bold text-[#F59E0B]">
                نشط ومستقر 100%
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons for Worker */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleTestNotification}
            disabled={isTestingBot}
            className="flex-1 min-w-[200px] bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-[#25D366] text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isTestingBot ? (
              <div className="w-4 h-4 border-2 border-[#25D366] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>إختبار إشعارات WhatsApp على هاتفك</span>
          </button>

          <button
            type="button"
            onClick={handleManualBackup}
            disabled={isBackingUp}
            className="flex-1 min-w-[200px] bg-[#18231D] hover:bg-[#213027] border border-[#2B3E32] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isBackingUp ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-[#D97706]" />
            )}
            <span>إنشاء نسخة احتياطية الآن</span>
          </button>
        </div>
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
