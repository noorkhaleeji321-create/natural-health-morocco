import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Save, Building2 } from 'lucide-react';

export interface AdminPaymentTabProps {
  bankSettings: any;
  onUpdate: (updates: any) => Promise<any> | void;
  showNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminPaymentTab: React.FC<AdminPaymentTabProps> = ({
  bankSettings,
  onUpdate,
  showNotification,
}) => {
  const [bankName, setBankName] = useState(bankSettings.bankName || '');
  const [accountHolder, setAccountHolder] = useState(bankSettings.accountHolder || '');
  const [rib, setRib] = useState(bankSettings.rib || '');
  const [instructions, setInstructions] = useState(bankSettings.instructions || '');
  const [isBankTransferEnabled, setIsBankTransferEnabled] = useState(
    bankSettings.isBankTransferEnabled !== false
  );
  const [isCodEnabled, setIsCodEnabled] = useState(bankSettings.isCodEnabled !== false);
  const [isCardEnabled, setIsCardEnabled] = useState(bankSettings.isCardEnabled === true);
  const [isPaypalEnabled, setIsPaypalEnabled] = useState(bankSettings.isPaypalEnabled === true);
  const [paymentMode, setPaymentMode] = useState<'sandbox' | 'live'>(
    bankSettings.paymentMode || 'sandbox'
  );
  const [paddleVendorId, setPaddleVendorId] = useState(bankSettings.paddleVendorId || '');
  const [paddleClientToken, setPaddleClientToken] = useState(bankSettings.paddleClientToken || '');
  const [paddleApiKey, setPaddleApiKey] = useState(bankSettings.paddleApiKey || '');
  const [cardPublishableKey, setCardPublishableKey] = useState(bankSettings.cardPublishableKey || '');
  const [cardSecretKey, setCardSecretKey] = useState(bankSettings.cardSecretKey || '');
  const [paypalClientId, setPaypalClientId] = useState(bankSettings.paypalClientId || '');
  const [paypalClientSecret, setPaypalClientSecret] = useState(bankSettings.paypalClientSecret || '');

  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isDirtyRef = useRef(false);

  useEffect(() => {
    if (!isDirtyRef.current) {
      setBankName(bankSettings.bankName || '');
      setAccountHolder(bankSettings.accountHolder || '');
      setRib(bankSettings.rib || '');
      setInstructions(bankSettings.instructions || '');
      setIsBankTransferEnabled(bankSettings.isBankTransferEnabled !== false);
      setIsCodEnabled(bankSettings.isCodEnabled !== false);
      setIsCardEnabled(bankSettings.isCardEnabled === true);
      setIsPaypalEnabled(bankSettings.isPaypalEnabled === true);
      setPaymentMode(bankSettings.paymentMode || 'sandbox');
      setPaddleVendorId(bankSettings.paddleVendorId || '');
      setPaddleClientToken(bankSettings.paddleClientToken || '');
      setPaddleApiKey(bankSettings.paddleApiKey || '');
      setCardPublishableKey(bankSettings.cardPublishableKey || '');
      setCardSecretKey(bankSettings.cardSecretKey || '');
      setPaypalClientId(bankSettings.paypalClientId || '');
      setPaypalClientSecret(bankSettings.paypalClientSecret || '');
    }
  }, [bankSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanRib = rib.replace(/\s+/g, '');

    setIsSaving(true);
    try {
      const res: any = await onUpdate({
        bankName: bankName.trim(),
        accountHolder: accountHolder.trim(),
        rib: cleanRib,
        instructions: instructions.trim(),
        isBankTransferEnabled,
        isCodEnabled,
        isCardEnabled,
        isPaypalEnabled,
        paymentMode,
        paddleVendorId: paddleVendorId.trim(),
        paddleClientToken: paddleClientToken.trim(),
        paddleApiKey: paddleApiKey.trim(),
        cardPublishableKey: cardPublishableKey.trim() || paddleClientToken.trim(),
        cardSecretKey: cardSecretKey.trim() || paddleApiKey.trim(),
        paypalClientId: paypalClientId.trim(),
        paypalClientSecret: paypalClientSecret.trim(),
      });

      if (res && res.error && !res.success) {
        setSaveStatus({
          type: 'error',
          message: `تعذر التحديث: ${res.error}.`,
        });
        showNotification(`تنبيه: تعذر التحديث: ${res.error}`, 'error');
        setIsSaving(false);
        return;
      }

      isDirtyRef.current = false;
      const successMsg = '✓ تم حفظ وتحديث إعدادات بوابات الدفع الإلكترونية والـ RIB بنجاح!';
      setSaveStatus({ type: 'success', message: successMsg });
      showNotification(successMsg, 'success');

      setTimeout(() => {
        setSaveStatus(null);
      }, 5000);
    } catch (err: any) {
      setSaveStatus({ type: 'error', message: `حدث خطأ أثناء حفظ معلومات الدفع: ${err?.message || 'إعادة المحاولة'}` });
      showNotification('حدث خطأ أثناء حفظ معلومات الدفع', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-[#101713] border border-[#213027] rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center gap-3 pb-4 border-b border-[#213027] mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#D97706]/10 text-[#D97706] flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white font-['Cairo']">
              إدارة وتفعيل طرق الدفع
            </h3>
            <p className="text-xs text-[#8A9B90]">
              التحكم في تفعيل أو تعطيل الدفع عند الاستلام والتحويل البنكي وتعديل الـ RIB المغربي
            </p>
          </div>
        </div>

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

        <form onSubmit={handleSave} className="space-y-6 text-xs sm:text-sm">
          <div className="bg-[#141D17] border border-[#223127] rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#F3BA63]">وضع تشغيل بوابات الدفع:</h4>
              <span className="text-[11px] bg-[#1d2d22] text-[#34D399] border border-[#234533] px-2.5 py-0.5 rounded-full font-bold">
                {paymentMode === 'sandbox' ? '🧪 بيئة الاختبار (Sandbox)' : '⚡ بيئة الإنتاج المباشرة (Live Mode)'}
              </span>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-white text-xs font-bold">
                <input
                  type="radio"
                  name="paymentMode"
                  value="sandbox"
                  checked={paymentMode === 'sandbox'}
                  onChange={() => {
                    isDirtyRef.current = true;
                    setPaymentMode('sandbox');
                  }}
                  className="accent-[#D97706]"
                />
                <span>اختبار تجريبي (Sandbox Test)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-white text-xs font-bold">
                <input
                  type="radio"
                  name="paymentMode"
                  value="live"
                  checked={paymentMode === 'live'}
                  onChange={() => {
                    isDirtyRef.current = true;
                    setPaymentMode('live');
                  }}
                  className="accent-[#D97706]"
                />
                <span>إنتاج حقيقي (Live Production)</span>
              </label>
            </div>
          </div>

          <div className="bg-[#141D17] border border-[#223127] rounded-2xl p-4 sm:p-5 space-y-4">
            <h4 className="text-xs font-bold text-[#F3BA63]">تفعيل طرق الدفع في المتجر:</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#18241E] border border-[#27372D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCardEnabled}
                  onChange={(e) => {
                    isDirtyRef.current = true;
                    setIsCardEnabled(e.target.checked);
                  }}
                  className="w-5 h-5 accent-[#D97706]"
                />
                <div>
                  <span className="font-bold text-white block">💳 البطاقة البنكية (Visa / Mastercard)</span>
                  <span className="text-[11px] text-[#8A9B90]">تحويل مباشر عبر خوادم البنك المعتمد</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#18241E] border border-[#27372D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPaypalEnabled}
                  onChange={(e) => {
                    isDirtyRef.current = true;
                    setIsPaypalEnabled(e.target.checked);
                  }}
                  className="w-5 h-5 accent-[#D97706]"
                />
                <div>
                  <span className="font-bold text-white block">🅿️ بايبال (PayPal Express)</span>
                  <span className="text-[11px] text-[#8A9B90]">الدفع الآمن بالحساب العالمي</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#18241E] border border-[#27372D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCodEnabled}
                  onChange={(e) => {
                    isDirtyRef.current = true;
                    setIsCodEnabled(e.target.checked);
                  }}
                  className="w-5 h-5 accent-[#D97706]"
                />
                <div>
                  <span className="font-bold text-white block">💵 الدفع عند الاستلام (COD)</span>
                  <span className="text-[11px] text-[#8A9B90]">نقداً لمندوب التوصيل عند الباب</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#18241E] border border-[#27372D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBankTransferEnabled}
                  onChange={(e) => {
                    isDirtyRef.current = true;
                    setIsBankTransferEnabled(e.target.checked);
                  }}
                  className="w-5 h-5 accent-[#D97706]"
                />
                <div>
                  <span className="font-bold text-white block">🏦 التحويل البنكي (Virement RIB)</span>
                  <span className="text-[11px] text-[#8A9B90]">تحويل عادي إلى الحساب البنكي</span>
                </div>
              </label>
            </div>
          </div>

          {isCardEnabled && (
            <div className="bg-[#141D17] border border-[#223127] rounded-2xl p-4 sm:p-5 space-y-4">
              <h4 className="text-xs font-bold text-[#F3BA63] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#D97706]" />
                <span>مفاتيح الربط ببوابة Paddle للدفع بالبطاقات:</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#E5DCce] mb-1">Paddle Vendor ID</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={paddleVendorId}
                    onChange={(e) => {
                      isDirtyRef.current = true;
                      setPaddleVendorId(e.target.value);
                    }}
                    placeholder="123456"
                    className="w-full bg-[#18231D] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-hidden focus:border-[#D97706]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#E5DCce] mb-1">Paddle Client Token</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={paddleClientToken}
                    onChange={(e) => {
                      isDirtyRef.current = true;
                      setPaddleClientToken(e.target.value);
                    }}
                    placeholder="live_xxxxxxxx..."
                    className="w-full bg-[#18231D] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-hidden focus:border-[#D97706]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#E5DCce] mb-1">Paddle API Key</label>
                  <input
                    type="password"
                    dir="ltr"
                    value={paddleApiKey}
                    onChange={(e) => {
                      isDirtyRef.current = true;
                      setPaddleApiKey(e.target.value);
                    }}
                    placeholder="pdl_k1_xxxxxxxx..."
                    className="w-full bg-[#18231D] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-hidden focus:border-[#D97706]"
                  />
                </div>
              </div>
            </div>
          )}

          {isPaypalEnabled && (
            <div className="bg-[#141D17] border border-[#223127] rounded-2xl p-4 sm:p-5 space-y-4">
              <h4 className="text-xs font-bold text-[#F3BA63] flex items-center gap-2">
                <span>🅿️ مفاتيح الربط ببوابة بايبال (PayPal API Credentials):</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#E5DCce] mb-1">PayPal Client ID</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={paypalClientId}
                    onChange={(e) => {
                      isDirtyRef.current = true;
                      setPaypalClientId(e.target.value);
                    }}
                    placeholder="AXXXXXXXXXXXXXXXXXXXXXXXXXX..."
                    className="w-full bg-[#18231D] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-hidden focus:border-[#D97706]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#E5DCce] mb-1">PayPal Secret Key</label>
                  <input
                    type="password"
                    dir="ltr"
                    value={paypalClientSecret}
                    onChange={(e) => {
                      isDirtyRef.current = true;
                      setPaypalClientSecret(e.target.value);
                    }}
                    placeholder="EXXXXXXXXXXXXXXXXXXXXXXXXXX..."
                    className="w-full bg-[#18231D] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-hidden focus:border-[#D97706]"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="bg-[#141D17] border border-[#223127] rounded-2xl p-4 sm:p-5 space-y-4">
            <h4 className="text-xs font-bold text-[#F3BA63] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#D97706]" />
              <span>معلومات الحساب البنكي الرسمي (RIB المغربي):</span>
            </h4>

            <div>
              <label className="block text-xs font-bold text-[#E5DCce] mb-1">
                اسم البنك <span className="text-[#D97706]">*</span>
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => {
                  isDirtyRef.current = true;
                  setBankName(e.target.value);
                  setSaveStatus(null);
                }}
                placeholder="مثال: التجاري وفا بنك (Attijariwafa Bank)"
                className="w-full bg-[#18231D] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:border-[#D97706]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#E5DCce] mb-1">
                اسم صاحب الحساب (Titulaire du compte) <span className="text-[#D97706]">*</span>
              </label>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => {
                  isDirtyRef.current = true;
                  setAccountHolder(e.target.value);
                  setSaveStatus(null);
                }}
                placeholder="مثال: متجر الهوية الرقمية"
                className="w-full bg-[#18231D] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:border-[#D97706]"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[#E5DCce]">
                  رقم الـ RIB المغربي (24 رقماً بالضبط) <span className="text-[#D97706]">*</span>
                </label>
                <span className="text-[11px] font-mono text-[#F3BA63]">
                  {rib.replace(/\s+/g, '').length} / 24 رقماً
                </span>
              </div>
              <input
                type="text"
                dir="ltr"
                value={rib}
                onChange={(e) => {
                  isDirtyRef.current = true;
                  setRib(e.target.value);
                  setSaveStatus(null);
                }}
                placeholder="007780000123456789012345"
                className="w-full bg-[#18231D] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white font-mono text-sm tracking-wider focus:outline-hidden focus:border-[#D97706]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#E5DCce] mb-1">
                تعليمات التحويل للزبون:
              </label>
              <textarea
                rows={3}
                value={instructions}
                onChange={(e) => {
                  isDirtyRef.current = true;
                  setInstructions(e.target.value);
                  setSaveStatus(null);
                }}
                placeholder="تعليمات خاصة بإرسال وصل التحويل البنكي..."
                className="w-full bg-[#18231D] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:border-[#D97706]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-[#D97706] hover:bg-[#B45309] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-101"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'جاري الحفظ...' : 'حفظ وتحديث معلومات الدفع في المتجر'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
