/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSlider } from './components/HeroSlider';
import { TrustHighlights } from './components/TrustHighlights';
import { CategorySection } from './components/CategorySection';
import { BestSellersSection } from './components/BestSellersSection';
import { NewArrivalsSection } from './components/NewArrivalsSection';
import { AboutSection } from './components/AboutSection';
import { PaymentMethodsSection } from './components/PaymentMethodsSection';
import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';
import { StoreProvider, useStore } from './context/StoreContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Product, CartItem } from './types';
import { Search, Sparkles, ArrowRight, ShieldAlert, X, Loader2 } from 'lucide-react';
import { ProductCard } from './components/ProductCard';

// Lazy loaded page components for optimal performance and chunk splitting
const ProductsPage = lazy(() =>
  import('./components/ProductsPage').then((m) => ({ default: m.ProductsPage }))
);
const ProductDetailPage = lazy(() =>
  import('./components/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage }))
);
const CartCheckoutPage = lazy(() =>
  import('./components/CartCheckoutPage').then((m) => ({ default: m.CartCheckoutPage }))
);
const OrderTrackingPage = lazy(() =>
  import('./components/OrderTrackingPage').then((m) => ({ default: m.OrderTrackingPage }))
);
// Removed CustomerAccountPage import as per requirements
const AdminDashboard = lazy(() =>
  import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const MarketplaceHome = lazy(() =>
  import('./components/MarketplaceHome').then((m) => ({ default: m.MarketplaceHome }))
);
const AICustomizationStudio = lazy(() =>
  import('./components/AICustomizationStudio').then((m) => ({ default: m.AICustomizationStudio }))
);


// Loading Fallback
const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
    <Loader2 className="w-10 h-10 text-[#D97706] animate-spin mb-4" />
    <p className="text-sm font-bold text-[#D0C5B4]">جاري التحميل...</p>
  </div>
);

type PageType =
  | 'home'
  | 'products'
  | 'product-detail'
  | 'cart'
  | 'order-tracking'
  | 'account'
  | 'admin'
  | 'marketplace'
  | 'customization';

function MainAppContent() {
  const { products, categories, heroSlides, isAdminAuthenticated, currentUser, storeSettings } = useStore();

  // Navigation & View state
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [productsPageCategory, setProductsPageCategory] = useState<string | null>(null);

  // Security session alert banner
  const [sessionAlert, setSessionAlert] = useState<string | null>(null);
  const [accountAuthMode, setAccountAuthMode] = useState<'login' | 'register' | 'admin'>('login');

  // Pre-fill parameters for order tracking
  const [trackingOrderId, setTrackingOrderId] = useState<string>('');
  const [trackingPhone, setTrackingPhone] = useState<string>('');

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('said_store_cart_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Auto-dismiss session alert after 5 seconds
  useEffect(() => {
    if (sessionAlert) {
      const timer = setTimeout(() => {
        setSessionAlert(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [sessionAlert]);

  // Session guard: If admin page is open but session is invalidated/not authenticated, redirect immediately
  useEffect(() => {
    if (currentPage === 'admin' && !isAdminAuthenticated) {
      setAccountAuthMode('admin');
      setCurrentPage('account');
      setActiveSection('account');
      setSessionAlert('تنبيه أمني: يلزم تسجيل الدخول ببيانات الإدارة المعتمدة أولاً للوصول إلى لوحة التحكم.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, isAdminAuthenticated]);

  // URL Hash sync with Session Verification
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#admin') {
        if (!isAdminAuthenticated) {
          setAccountAuthMode('admin');
          setCurrentPage('account');
          setActiveSection('account');
          setSessionAlert('تنبيه أمني: لا يمكنك الوصول لصفحة الإدارة بدون تسجيل دخول معتمد. يرجى إدخال رمز الأمان.');
          window.location.hash = '#account';
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          setCurrentPage('admin');
          setActiveSection('admin');
        }
      } else if (hash === '#account') {
        setCurrentPage('account');
        setActiveSection('account');
      } else if (hash === '#cart') {
        setCurrentPage('cart');
        setActiveSection('cart');
      } else if (hash === '#order-tracking') {
        setCurrentPage('order-tracking');
        setActiveSection('order-tracking');
      } else if (hash === '#marketplace') {
        setCurrentPage('marketplace');
        setActiveSection('marketplace');
      }
    };

    // Check on initial mount
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isAdminAuthenticated]);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('said_store_cart_v1', JSON.stringify(cartItems));
    } catch {
      // ignore
    }
  }, [cartItems]);

  // Search & Filter state for Home page
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('home');

  // Scroll to top on page transition
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Add to cart handler
  const handleAddToCart = (product: Product, quantity: number = 1) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.product.id === product.id);
      if (existing) {
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevItems, { product, quantity }];
    });
  };

  // Update quantity handler
  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  // Remove from cart handler
  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.product.id !== productId)
    );
  };

  // Clear cart handler
  const handleClearCart = () => {
    setCartItems([]);
  };

  // Total item count in cart
  const cartCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  // Filtered products when searching on Home page
  const searchFilteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.trim().toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        (p.origin && p.origin.toLowerCase().includes(query))
    );
  }, [searchQuery, products]);

  // Home page filtered best sellers (dynamic from StoreContext)
  const filteredBestSellers = useMemo(() => {
    const bestSellers = products.filter((p) => p.isBestSeller);
    if (!selectedCategory) return bestSellers;
    const cat = categories.find((c) => c.slug === selectedCategory);
    if (!cat) return bestSellers;
    return bestSellers.filter((p) => p.category === cat.name);
  }, [selectedCategory, products, categories]);

  // Home page filtered new arrivals (dynamic from StoreContext)
  const filteredNewArrivals = useMemo(() => {
    const newItems = products.filter((p) => p.isNew);
    if (!selectedCategory) return newItems;
    const cat = categories.find((c) => c.slug === selectedCategory);
    if (!cat) return newItems;
    return newItems.filter((p) => p.category === cat.name);
  }, [selectedCategory, products, categories]);

  // Navigation handlers with Session Protection
  const handleNavigate = (
    page: PageType,
    category?: string | null
  ) => {
    setSearchQuery('');

    // Session Protection Guard for Admin Page
    if (page === 'admin' && !isAdminAuthenticated) {
      setAccountAuthMode('admin');
      setCurrentPage('account');
      setActiveSection('account');
      setSessionAlert('تنبيه أمني: يتطلب الدخول لصفحة الإدارة المصادقة أولاً عبر رمز الأمان (PIN).');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (page === 'products') {
      setProductsPageCategory(category || null);
      setCurrentPage('products');
      setActiveSection('products');
    } else if (page === 'cart') {
      setCurrentPage('cart');
      setActiveSection('cart');
    } else if (page === 'order-tracking') {
      setCurrentPage('order-tracking');
      setActiveSection('order-tracking');
    } else if (page === 'account') {
      // If navigating to account naturally, keep customer login as default unless previously set
      if (accountAuthMode === 'admin') {
        setAccountAuthMode('login');
      }
      setCurrentPage('account');
      setActiveSection('account');
    } else if (page === 'admin') {
      setCurrentPage('admin');
      setActiveSection('admin');
    } else {
      setCurrentPage('home');
      setActiveSection('home');
    }
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentPage('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromDetail = () => {
    setCurrentPage('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler to jump directly to order tracking with credentials
  const handleTrackSpecificOrder = (orderId: string, phone: string) => {
    setTrackingOrderId(orderId);
    setTrackingPhone(phone);
    setCurrentPage('order-tracking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Related products for details view
  const relatedProducts = useMemo(() => {
    if (!selectedProduct) return [];
    return products.filter(
      (p) => p.category === selectedProduct.category && p.id !== selectedProduct.id
    );
  }, [selectedProduct, products]);

  return (
    <div className="min-h-screen flex flex-col bg-[#080C0A] text-[#F3EFE6] font-['Tajawal',sans-serif] selection:bg-[#D97706] selection:text-white">
      {/* Main Navigation with Search, Cart, Account, Tracking & Admin */}
      <Navbar
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeSection={activeSection}
        currentPage={currentPage}
        onNavigate={handleNavigate}
      />

      <main className="flex-1">
        <Suspense fallback={<PageLoadingFallback />}>
          {/* Security Session Alert Banner for Unauthorized Redirections */}
          {sessionAlert && (
            <div className="bg-[#2D1208] border-b border-[#D97706]/50 px-4 py-3 text-center animate-in fade-in slide-in-from-top duration-300">
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-[#FDE68A]">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-[#F59E0B] shrink-0 animate-pulse" />
                  <span>{sessionAlert}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSessionAlert(null)}
                  className="text-[#FDE68A]/70 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                  title="إغلاق التنبيه"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* If user is actively searching in Navbar header and on Home */}
        {searchQuery.trim() && currentPage === 'home' ? (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="flex items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 pb-3 sm:pb-4 border-b border-[#212F28]">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D97706] mb-1">
                  <Search className="w-3.5 h-3.5" />
                  <span>نتائج البحث المباشر</span>
                </div>
                <h2 className="text-xl sm:text-3xl font-black text-[#F3EFE6] font-['Cairo']">
                  نتائج البحث عن: &ldquo;{searchQuery}&rdquo;
                </h2>
                <p className="text-xs sm:text-sm text-[#A39683] mt-1">
                  تم العثور على {searchFilteredProducts.length} منتج متطابق
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNavigate('products')}
                  className="hidden sm:inline-flex items-center gap-1.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold px-4 py-2 rounded-full transition-colors"
                >
                  الانتقال لصفحة المنتجات
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              </div>
            </div>

            {searchFilteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-[#111914] rounded-2xl border border-[#212E27]">
                <p className="text-base text-[#D4C8B5] font-bold">
                  لم يتم العثور على أي منتج يطابق بحثك &ldquo;{searchQuery}&rdquo;
                </p>
                <p className="text-xs text-[#8A7D6C] mt-2">
                  جرب البحث بكلمات أخرى مثل: عسل، سدر، زعفران، أركان، حبة سوداء، كمون...
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-5 bg-[#D97706] text-white text-xs font-bold px-4 py-2 rounded-lg"
                >
                  إعادة ضبط البحث
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6">
                {searchFilteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onViewDetails={handleViewProduct}
                  />
                ))}
              </div>
            )}
          </div>
        ) : currentPage === 'products' ? (
          /* PART 2: Dedicated Products Page */
          <ProductsPage
            products={products}
            onAddToCart={handleAddToCart}
            onViewProduct={handleViewProduct}
            initialCategory={productsPageCategory}
          />
        ) : currentPage === 'product-detail' && selectedProduct ? (
          /* Product Details View */
          <ProductDetailPage
            product={selectedProduct}
            relatedProducts={relatedProducts}
            onBack={handleBackFromDetail}
            onAddToCart={handleAddToCart}
            onViewProduct={handleViewProduct}
          />
        ) : currentPage === 'cart' ? (
          /* PART 4 & 5: Dedicated Cart & Checkout Page */
          <CartCheckoutPage
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveFromCart}
            onClearCart={handleClearCart}
            onNavigateToProducts={() => handleNavigate('products')}
            onNavigateToHome={() => handleNavigate('home')}
            onTrackOrder={handleTrackSpecificOrder}
            onNavigateToAccount={() => handleNavigate('account')}
          />
        ) : currentPage === 'order-tracking' ? (
          /* PART 5: Order Status & Tracking Page */
          <OrderTrackingPage
            initialOrderId={trackingOrderId}
            initialPhone={trackingPhone}
            onNavigateToProducts={() => handleNavigate('products')}
            onNavigateToHome={() => handleNavigate('home')}
          />
        ) : currentPage === 'admin' && isAdminAuthenticated ? (
          /* PART 7 - 12: Admin Management Suite & Dynamic Settings (Strict Session Authenticated Only) */
          <AdminDashboard
            onNavigateToHome={() => handleNavigate('home')}
            onNavigateToProducts={() => handleNavigate('products')}
          />
        ) : (
          /* PART 1: Home Page */
          <>
            {/* Header: Hero Slider with 5 animated slides and trust highlights */}
            {storeSettings?.showHeroSlider !== false ? (
              <HeroSlider slides={heroSlides} />
            ) : (
              <TrustHighlights />
            )}

            {/* Active Category Filter Banner on Home (if selected) */}
            {selectedCategory && (
              <div className="bg-[#1C1608] border-b border-[#D97706]/40 py-3 px-4 text-center">
                <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-xs sm:text-sm font-bold text-[#F3BA63]">
                  <Sparkles className="w-4 h-4 text-[#D97706]" />
                  <span>
                    يتم الآن عرض منتجات تصنيف:{' '}
                    <strong className="text-white">{categories.find((c) => c.slug === selectedCategory)?.name}</strong>
                  </span>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="underline text-[#F59E0B] hover:text-[#FBBF24] ml-2 font-medium cursor-pointer"
                  >
                    (عرض كل المنتجات)
                  </button>
                </div>
              </div>
            )}

            {/* Categories Section */}
            <CategorySection
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onBrowseCategoryInProducts={(catName) => handleNavigate('products', catName)}
            />

            {/* Best Sellers Section */}
            <BestSellersSection
              products={filteredBestSellers}
              onAddToCart={handleAddToCart}
              onViewDetails={handleViewProduct}
              onViewAllProducts={() => handleNavigate('products')}
            />

            {/* New Arrivals Section */}
            <NewArrivalsSection
              products={filteredNewArrivals}
              onAddToCart={handleAddToCart}
              onViewDetails={handleViewProduct}
              onViewAllProducts={() => handleNavigate('products')}
            />

            {/* About Store Section */}
            <AboutSection />

            {/* Payment Methods Section (Cash on Delivery + Bank Transfer) */}
            <PaymentMethodsSection />
          </>
        )}
        </Suspense>
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onOpenFullCartPage={() => {
          setIsCartOpen(false);
          handleNavigate('cart');
        }}
      />

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <MainAppContent />
      </StoreProvider>
    </ErrorBoundary>
  );
}
