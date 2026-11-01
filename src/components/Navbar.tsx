import React, { useState } from 'react';
import { ShoppingBag, Search, Menu, X, Phone, ShieldCheck, Sparkles, MapPin, Truck, Sliders } from 'lucide-react';
import { storeInfo } from '../data/storeData';
import { useStore } from '../context/StoreContext';

import navbarBannerBg from '../assets/images/navbar_banner_bg_1793276977619.jpg';

const NAVBAR_BANNER_BG = navbarBannerBg;

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeSection?: string;
  currentPage?: 'home' | 'products' | 'product-detail' | 'cart' | 'order-tracking' | 'admin' | 'account' | 'marketplace' | 'customization';
  onNavigate?: (
    page: 'home' | 'products' | 'cart' | 'order-tracking' | 'admin' | 'account' | 'marketplace' | 'customization',
    category?: string | null
  ) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  searchQuery,
  onSearchChange,
  activeSection = 'home',
  currentPage = 'home',
  onNavigate,
}) => {
  const { storeSettings, isAdminAuthenticated } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = (e: React.MouseEvent, id: string, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    // Direct Page Destinations
    if (
      id === 'home' ||
      id === 'marketplace' ||
      id === 'products' ||
      id === 'cart' ||
      id === 'order-tracking' ||
      id === 'admin'
    ) {
      onNavigate?.(id as any);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Anchor sections on homepage: categories, wellness-guide, about, best-sellers, etc.
    const scrollDirectly = (selector: string) => {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        const el = document.querySelector(selector);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          clearInterval(interval);
        } else if (attempts > 20) {
          clearInterval(interval);
        }
      }, 50);
    };

    if (currentPage !== 'home') {
      onNavigate?.('home');
      setTimeout(() => {
        scrollDirectly(href);
      }, 80);
    } else {
      scrollDirectly(href);
    }
  };

  const navLinks = [
    { label: 'الرئيسية', href: '#home', id: 'home' },
    { label: 'المنتجات (الكتالوج)', href: '#products', id: 'products' },
    { label: 'دليل العافية 🌿', href: '#wellness-guide', id: 'wellness-guide' },
    { label: 'التصنيفات', href: '#categories', id: 'categories' },
    { label: 'من نحن', href: '#about', id: 'about' },
    { label: 'تتبع الطلب 🚚', href: '#order-tracking', id: 'order-tracking' },
    { label: 'السلة والطلب', href: '#cart', id: 'cart' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0F1512]/95 backdrop-blur-md border-b border-[#212E27] shadow-lg">
      {/* Top Banner Notice - Moving Single-Line Ticker (Left to Right) */}
      <div className="bg-[#070A09] text-[#E5DCce] text-xs sm:text-sm py-2 px-2 border-b border-[#1A2620] overflow-hidden select-none">
        <div className="flex items-center w-full overflow-hidden" dir="ltr">
          <div className="animate-marquee-right flex items-center gap-8 text-[#E2D7C3] font-medium whitespace-nowrap" dir="rtl">
            {/* Ticker Content Segment 1 */}
            <div className="flex items-center gap-6 shrink-0">
              <span className="flex items-center gap-2 text-[#FAF7F0]">
                <span>🌿</span>
                <span>{storeSettings.announcementText || 'مرحباً بكم في natural-morocco — جودة أصيلة وتوصيل لجميع مدن المغرب 🇲🇦'}</span>
              </span>
              <span className="text-[#D97706] font-black">•</span>
              <span className="flex items-center gap-1.5 text-[#F3BA63]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D97706]" />
                <span>منتجات أصلية 100% طبيعية</span>
              </span>
              <span className="text-[#D97706] font-black">•</span>
              <span className="flex items-center gap-1.5 text-[#FAF7F0]">
                <Phone className="w-3.5 h-3.5 text-[#D97706]" />
                <span>للطلب والاستفسار:</span>
                <strong className="text-[#F3BA63] font-mono tracking-wider">{storeSettings.phone || '+212 000000000'}</strong>
              </span>
            </div>

            <span className="text-[#D97706] font-black shrink-0">•</span>

            {/* Ticker Content Segment 2 (Duplicate for continuous seamless loop) */}
            <div className="flex items-center gap-6 shrink-0">
              <span className="flex items-center gap-2 text-[#FAF7F0]">
                <span>🌿</span>
                <span>{storeSettings.announcementText || 'مرحباً بكم في natural-morocco — جودة أصيلة وتوصيل لجميع مدن المغرب 🇲🇦'}</span>
              </span>
              <span className="text-[#D97706] font-black">•</span>
              <span className="flex items-center gap-1.5 text-[#F3BA63]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D97706]" />
                <span>منتجات أصلية 100% طبيعية</span>
              </span>
              <span className="text-[#D97706] font-black">•</span>
              <span className="flex items-center gap-1.5 text-[#FAF7F0]">
                <Phone className="w-3.5 h-3.5 text-[#D97706]" />
                <span>للطلب والاستفسار:</span>
                <strong className="text-[#F3BA63] font-mono tracking-wider">{storeSettings.phone || '+212 000000000'}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div 
        className="relative bg-cover bg-center border-b border-[#212E27] overflow-hidden shadow-inner"
        style={{ backgroundImage: `url(${NAVBAR_BANNER_BG})` }}
      >
        {/* Refined gradient overlay for stunning background depth and maximum text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B130E]/90 via-[#0B130E]/75 to-[#0B130E]/90 backdrop-blur-[0.5px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          
          {/* Logo */}
          <a
            href="#home"
            onClick={(e) => handleLinkClick(e, 'home', '#home')}
            className="flex items-center gap-2 sm:gap-3 shrink-0 group"
          >
            {storeSettings.logoUrl ? (
              <img
                src={storeSettings.logoUrl}
                alt={storeSettings.storeName}
                className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl object-cover shadow-md sm:shadow-lg border border-[#D97706]/40 group-hover:scale-105 transition-transform shrink-0"
              />
            ) : (
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#1E332B] to-[#0D1813] flex items-center justify-center text-[#E59837] shadow-md sm:shadow-lg border border-[#D97706]/40 group-hover:scale-105 transition-transform shrink-0">
                <span className="text-lg sm:text-2xl font-bold font-serif">
                  {storeSettings.storeName.trim().charAt(0) || 'ع'}
                </span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-base sm:text-2xl text-[#FAF5EC] tracking-tight font-['Cairo']">
                  {storeSettings.storeName}
                </span>
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D97706] animate-pulse" />
              </div>
              <p className="text-[10px] sm:text-xs text-[#A89C89] font-medium hidden xs:block">
                {storeSettings.storeSlogan}
              </p>
            </div>
          </a>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <input
                id="header-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="ابحث عن عسل، زعفران، أركان، أعشاب، توابل..."
                className="w-full bg-[#16201B] text-[#FAF5EC] pl-10 pr-11 py-2.5 rounded-full border border-[#2B3C32] focus:outline-hidden focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20 text-sm transition-all placeholder:text-[#7A8C82]"
              />
              <Search className="w-4 h-4 text-[#8C9E94] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs bg-[#2B3C32] hover:bg-[#395043] text-[#FAF5EC] rounded-full w-5 h-5 flex items-center justify-center"
                  aria-label="مسح البحث"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">

            {/* Order Tracking Button */}
            <button
              onClick={() => onNavigate?.('order-tracking')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer border ${
                currentPage === 'order-tracking'
                  ? 'bg-[#1E3328] text-[#34D399] border-[#10B981]/40'
                  : 'bg-[#16201B] hover:bg-[#1F2E25] text-[#D8CFBF] border-[#293B30]'
              }`}
              title="تتبع مسار طلبك"
            >
              <Truck className="w-4 h-4 text-[#34D399]" />
              <span className="hidden sm:inline">تتبع الطلب</span>
            </button>

            {/* Admin Dashboard Button - Only shown when admin is authenticated - Removed for customer security as per requirement */}
            {/* {isAdminAuthenticated && (
              <button
                onClick={() => onNavigate?.('admin')}
                className={`inline-flex items-center gap-1 px-2.5 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer border ${
                  currentPage === 'admin'
                    ? 'bg-[#D97706] text-white border-[#D97706]'
                    : 'bg-[#16201B] hover:bg-[#2A2215] text-[#F3BA63] border-[#3B2D19]'
                }`}
                title="لوحة إدارة المحل"
              >
                <Sliders className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span className="hidden lg:inline text-[11px]">لوحة الإدارة</span>
              </button>
            )} */}

            {/* Cart Button */}
            <button
              id="cart-toggle-btn"
              onClick={() => {
                if (onNavigate) {
                  onNavigate('cart');
                } else {
                  onOpenCart();
                }
              }}
              className="relative flex items-center gap-1.5 sm:gap-2 bg-[#D97706] hover:bg-[#B45309] text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 text-xs sm:text-sm cursor-pointer"
              aria-label="سلة التسوق وإتمام الطلب"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <span className="font-bold hidden sm:inline">السلة</span>
              {cartCount > 0 ? (
                <span className="bg-[#15231C] text-[#F3BA63] text-[11px] sm:text-xs font-black min-w-[18px] sm:min-w-[20px] h-4 sm:h-5 px-1 rounded-full flex items-center justify-center shadow-xs border border-[#F3BA63]/40">
                  {cartCount}
                </span>
              ) : (
                <span className="bg-black/25 text-white text-[11px] sm:text-xs px-1 rounded-full">0</span>
              )}
            </button>

            {/* Mobile menu button */}
            <button
              id="mobile-nav-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-lg text-[#FAF5EC] hover:bg-[#1E2B24] transition-colors"
              aria-label="القائمة"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>

        {/* Search Bar - Mobile View */}
        <div className="lg:hidden pb-2.5">
          <div className="relative w-full">
            <input
              id="mobile-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث عن عسل، زعفران، أركان، توابل..."
              className="w-full bg-[#16201B] text-[#FAF5EC] pl-8 pr-9 py-1.5 rounded-full border border-[#2B3C32] focus:outline-hidden focus:border-[#D97706] text-xs sm:text-sm placeholder:text-[#7A8C82]"
            />
            <Search className="w-3.5 h-3.5 text-[#8C9E94] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#FAF5EC] bg-[#2B3C32] rounded-full w-4 h-4 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center justify-center gap-1 xl:gap-2 border-t border-[#1F2C25] py-2.5 overflow-x-auto no-scrollbar">
          {navLinks.map((link) => {
            const isCurrent =
              (link.id === 'home' && currentPage === 'home' && (!activeSection || activeSection === 'home')) ||
              (link.id === 'marketplace' && currentPage === 'marketplace') ||
              (link.id === 'products' && (currentPage === 'products' || currentPage === 'product-detail')) ||
              (link.id === 'cart' && currentPage === 'cart') ||
              (link.id === 'order-tracking' && currentPage === 'order-tracking') ||
              (currentPage === 'home' && activeSection === link.id);
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.id, link.href)}
                className={`px-3 xl:px-4 py-1.5 rounded-full text-xs xl:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isCurrent
                    ? 'bg-[#1E3328] text-[#F3BA63] border border-[#D97706]/50 shadow-sm shadow-[#D97706]/10 scale-[1.02]'
                    : 'text-[#C5BCAE] hover:text-white hover:bg-[#17231D]'
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </nav>
      </div>
    </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#232F28] bg-[#121A15] px-4 py-4 space-y-1.5 shadow-2xl">
          {navLinks.map((link) => {
            const isCurrent =
              (link.id === 'home' && currentPage === 'home') ||
              (link.id === 'marketplace' && currentPage === 'marketplace') ||
              (link.id === 'products' && (currentPage === 'products' || currentPage === 'product-detail')) ||
              (link.id === 'cart' && currentPage === 'cart') ||
              (link.id === 'order-tracking' && currentPage === 'order-tracking') ||
              (currentPage === 'home' && activeSection === link.id);
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.id, link.href)}
                className={`block px-4 py-2.5 rounded-xl font-bold text-sm sm:text-base transition-colors ${
                  isCurrent
                    ? 'bg-[#1E3328] text-[#F3BA63] border border-[#D97706]/40'
                    : 'text-[#FAF5EC] hover:bg-[#1C2922]'
                }`}
              >
                {link.label}
              </a>
            );
          })}
          <div className="pt-3 border-t border-[#232F28] text-xs text-[#9C8F7E] space-y-1.5 px-2">
            <p className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#D97706]" />
              {storeSettings.city || storeSettings.address}
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-[#D97706]" />
              واتساب ومكالمات: {storeSettings.phone}
            </p>
          </div>
        </div>
      )}
    </header>
  );
};
