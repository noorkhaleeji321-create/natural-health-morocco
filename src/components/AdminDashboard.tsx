import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Layers,
  CreditCard,
  Settings,
  Lock,
  Sliders,
  Database,
  RefreshCw,
  Store,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { AdminProductsTab } from './admin/AdminProductsTab';
import { AdminCategoriesTab } from './admin/AdminCategoriesTab';
import { AdminOrdersTab } from './admin/AdminOrdersTab';
import { AdminPaymentTab } from './admin/AdminPaymentTab';
import { AdminContentTab } from './admin/AdminContentTab';
import { AdminGeneralSettingsTab } from './admin/AdminGeneralSettingsTab';
import { AdminDatabaseTab } from './admin/AdminDatabaseTab';
import { AdminMarketplaceTab } from './AdminMarketplaceTab';

interface AdminDashboardProps {
  onNavigateToHome: () => void;
  onNavigateToProducts: () => void;
}

type AdminTab =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'orders'
  | 'payments'
  | 'content'
  | 'database'
  | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateToHome,
  onNavigateToProducts,
}) => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    orders,
    updateOrderStatus,
    deleteOrder,
    bankSettings,
    updateBankSettings,
    storeSettings,
    updateStoreSettings,
    isAdminAuthenticated,
    adminLogin,
    resetToDefaults,
    sellers,
    stores,
    updateSellerStatus,
    approveProduct,
    refreshMarketplace,
  } = useStore();

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // ================= ADMIN AUTH GATE =================
  if (!isAdminAuthenticated) {
    const handleLoginSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setPinError('');
      setIsLoggingIn(true);
      try {
        const success = await adminLogin(pinInput);
        if (success) {
          setPinInput('');
        } else {
          setPinError('رمز PIN الخاص بالإدارة غير صحيح.');
        }
      } catch (err: any) {
        setPinError(`خطأ أثناء التحقق: ${err.message || 'تعذر التحقق من الرمز.'}`);
      } finally {
        setIsLoggingIn(false);
      }
    };

    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="bg-[#101713] border border-[#26372D] rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D97706] to-[#78350F] text-white flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Lock className="w-8 h-8" />
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-white font-['Cairo']">
              لوحة إدارة المتجر (Admin)
            </h2>
            <p className="text-xs text-[#A89C89] mt-1.5 leading-relaxed">
              منطقة مخصصة لصاحب المتجر لإدارة المنتجات، الطلبات، وطرق الدفع
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#E5DCce] mb-1.5">
                أدخل رمز الأمان الخاص بالإدارة (PIN):
              </label>
              <input
                type="password"
                maxLength={15}
                inputMode="numeric"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                className="w-full bg-[#151F19] border border-[#2E4135] rounded-xl px-4 py-3.5 text-center text-2xl tracking-[0.4em] text-white focus:outline-hidden focus:border-[#D97706] font-mono"
                autoFocus
              />
            </div>

            {pinError && (
              <div className="p-3 rounded-xl bg-[#2D1515] border border-[#EF4444]/40 text-[#FCA5A5] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-[#D97706] hover:bg-[#B45309] text-white font-bold py-3.5 rounded-xl text-sm shadow-lg transition-transform active:scale-98 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoggingIn && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>{isLoggingIn ? 'جاري التحقق...' : 'تسجيل الدخول إلى لوحة التحكم'}</span>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#1C2821] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onNavigateToHome}
                className="text-xs font-bold text-[#A89C89] hover:text-white transition-colors cursor-pointer"
              >
                ← العودة للمتجر
              </button>
              <div className="text-[10px] font-bold text-blue-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>مرتبط بسحابة وقاعدة بيانات AIWebCrafter المشفرة</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Navigation tabs
  const navTabs = [
    { id: 'dashboard', label: 'الرئيسية / السوق', icon: LayoutDashboard },
    { id: 'products', label: 'المنتجات', icon: Package, badge: products.length },
    { id: 'categories', label: 'التصنيفات', icon: Layers, badge: categories.length },
    { id: 'orders', label: 'الطلبات', icon: ShoppingBag, badge: orders.length },
    { id: 'payments', label: 'طرق الدفع والـ RIB', icon: CreditCard },
    { id: 'content', label: 'المحتوى والهوية', icon: Store },
    { id: 'database', label: 'قاعدة البيانات', icon: Database },
    { id: 'settings', label: 'الإعدادات العامة', icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-10 pb-20 relative">
      {/* Premium Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] right-[10%] w-[30%] h-[30%] bg-[#D97706]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] left-[10%] w-[30%] h-[30%] bg-[#D97706]/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10">

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs sm:text-sm flex items-center gap-2 border animate-in slide-in-from-top duration-300 ${
            feedbackMsg.type === 'success'
              ? 'bg-[#102A1C] text-[#6EE7B7] border-[#10B981]'
              : 'bg-[#2A1515] text-[#FCA5A5] border-[#EF4444]'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[#EF4444]" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Admin Header */}
      <div className="bg-[#101713] border border-[#213027] rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D97706] text-white flex items-center justify-center font-bold shadow-lg shrink-0">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-white font-['Cairo']">
              لوحة التحكم والإدارة
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs text-[#8A9B90]">
                إدارة المنتجات، الطلبات، البائعين، وطرق الدفع
              </span>
              <span className="inline-flex items-center gap-1.5 bg-[#172338] text-[#93C5FD] border border-[#2563EB]/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />
                <span>AIWebCrafter Cloud API (متصل ومفعل)</span>
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onNavigateToHome}
          className="text-xs font-bold text-[#A89C89] hover:text-white bg-[#15201A] border border-[#26372D] px-4 py-2 rounded-xl transition-colors cursor-pointer"
        >
          ← العودة للمتجر الرئيسي
        </button>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none border-b border-[#213027]">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#D97706] text-white shadow-lg'
                  : 'bg-[#121A15] text-[#8A9B90] border border-[#213027] hover:text-white hover:bg-[#18231C]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                    isActive ? 'bg-black/30 text-white' : 'bg-[#1E2B22] text-[#34D399]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      <div className="mt-4">
        {activeTab === 'dashboard' && (
          <AdminMarketplaceTab
            sellers={sellers}
            stores={stores}
            products={products}
            onUpdateSellerStatus={updateSellerStatus}
            onApproveProduct={approveProduct}
            onRefresh={refreshMarketplace}
            showNotification={showNotification}
          />
        )}

        {activeTab === 'products' && (
          <AdminProductsTab
            products={products}
            categories={categories}
            onAdd={addProduct}
            onUpdate={updateProduct}
            onDelete={deleteProduct}
            showNotification={showNotification}
          />
        )}

        {activeTab === 'categories' && (
          <AdminCategoriesTab
            categories={categories}
            onAdd={addCategory}
            onUpdate={updateCategory}
            onDelete={deleteCategory}
            showNotification={showNotification}
          />
        )}

        {activeTab === 'orders' && (
          <AdminOrdersTab
            orders={orders}
            products={products}
            onUpdateStatus={updateOrderStatus}
            onDeleteOrder={deleteOrder}
            showNotification={showNotification}
          />
        )}

        {activeTab === 'payments' && (
          <AdminPaymentTab
            bankSettings={bankSettings}
            onUpdate={updateBankSettings}
            showNotification={showNotification}
          />
        )}

        {activeTab === 'content' && (
          <AdminContentTab
            storeSettings={storeSettings}
            onUpdateSettings={updateStoreSettings}
            showNotification={showNotification}
          />
        )}



        {activeTab === 'database' && (
          <AdminDatabaseTab showNotification={showNotification} />
        )}

        {activeTab === 'settings' && (
          <AdminGeneralSettingsTab
            storeSettings={storeSettings}
            onUpdateSettings={updateStoreSettings}
            onResetDefaults={resetToDefaults}
            showNotification={showNotification}
          />
        )}
      </div>
      </div>
    </div>
  );
};
