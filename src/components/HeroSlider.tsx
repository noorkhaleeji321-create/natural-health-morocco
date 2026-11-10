import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { HeroSlide } from '../types';
import { initialHeroSlides } from '../data/storeData';
import { formatImageUrl, handleImageError } from '../lib/utils';

interface HeroSliderProps {
  slides?: HeroSlide[];
}

export const HeroSlider: React.FC<HeroSliderProps> = ({ slides }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [canLoadOtherSlides, setCanLoadOtherSlides] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const activeSlides = (slides && slides.length > 0) ? slides : initialHeroSlides;

  // Defer background slides loading for 3 seconds so initial LCP has 100% network priority
  useEffect(() => {
    const timer = setTimeout(() => setCanLoadOtherSlides(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (isPaused || activeSlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, activeSlides.length]);

  const handlePrev = () => {
    setCanLoadOtherSlides(true);
    setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const handleNext = () => {
    setCanLoadOtherSlides(true);
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  };

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      setCanLoadOtherSlides(true);
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
  };

  const currentSlide = activeSlides[currentIndex] || activeSlides[0] || initialHeroSlides[0];

  const getSlideSources = (imagePath?: string) => {
    if (!imagePath) return null;
    if (imagePath.includes('hero_spices')) {
      return {
        mobile: '/assets/images/hero_spices_mobile.webp',
        desktop: '/assets/images/hero_spices_1793739545710.webp',
      };
    }
    if (imagePath.includes('hero_perfume')) {
      return {
        mobile: '/assets/images/hero_perfume_mobile.webp',
        desktop: '/assets/images/hero_perfume_1793739561627.webp',
      };
    }
    if (imagePath.includes('hero_honey_tea')) {
      return {
        mobile: '/assets/images/hero_honey_tea_mobile.webp',
        desktop: '/assets/images/hero_honey_tea_1793739587352.webp',
      };
    }
    if (imagePath.includes('hero_dates_honey')) {
      return {
        mobile: '/assets/images/hero_dates_honey_mobile.webp',
        desktop: '/assets/images/hero_dates_honey_1793739602965.webp',
      };
    }
    if (imagePath.includes('hero_market_morocco')) {
      return {
        mobile: '/assets/images/hero_market_morocco_mobile.webp',
        desktop: '/assets/images/hero_market_morocco_desktop.webp',
      };
    }
    return null;
  };

  return (
    <section
      id="home"
      aria-label="سلايدر العروض الترويجية"
      className="relative w-full h-[220px] sm:h-[380px] md:h-[480px] lg:h-[540px] bg-[#0A0E0C] overflow-hidden text-white select-none group border-b border-[#1C2822]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Semantic H1 for SEO & Accessibility compliance */}
      <h1 className="sr-only">
        {currentSlide.title || 'natural-morocco — دليل أسرار العافية الطبيعية والمنتجات الصحية 100% بالمغرب'}
      </h1>

      {/* Slides Background Container */}
      {activeSlides.map((slide, idx) => {
        const isActive = idx === currentIndex;
        const isNext = idx === (currentIndex + 1) % activeSlides.length;
        // Slide 0 always renders immediately; background slides only render when permitted
        const shouldRenderImg = idx === 0 || ((isActive || isNext) && canLoadOtherSlides);
        const responsiveSources = getSlideSources(slide.image);

        return (
          <div
            key={slide.id || idx}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {shouldRenderImg && formatImageUrl(slide.image) ? (
              responsiveSources ? (
                <picture className="w-full h-full block">
                  <source media="(max-width: 640px)" srcSet={responsiveSources.mobile} type="image/webp" />
                  <source srcSet={responsiveSources.desktop} type="image/webp" />
                  <img
                    src={responsiveSources.mobile}
                    alt={slide.title || 'عرض خاص من متجر natural-morocco'}
                    width={1080}
                    height={608}
                    className="w-full h-full object-cover object-center"
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    fetchPriority={idx === 0 ? 'high' : 'low'}
                    decoding={idx === 0 ? 'sync' : 'async'}
                    onError={handleImageError}
                  />
                </picture>
              ) : (
                <img
                  src={formatImageUrl(slide.image)}
                  alt={slide.title || 'عرض خاص من متجر natural-morocco'}
                  width={1080}
                  height={608}
                  className="w-full h-full object-cover object-center"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  fetchPriority={idx === 0 ? 'high' : 'low'}
                  decoding={idx === 0 ? 'sync' : 'async'}
                  onError={handleImageError}
                />
              )
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#1A2620] via-[#101914] to-[#0A0E0C] flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-[#D97706]/40" />
              </div>
            )}
            {/* Subtle Gradient vignette for contrast and depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E0C]/80 via-transparent to-[#0A0E0C]/40" />
          </div>
        );
      })}

      {/* Navigation Arrows */}
      {activeSlides.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="الشريحة السابقة"
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0A0E0C]/60 hover:bg-[#D97706] text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition-all duration-200 cursor-pointer shadow-lg hover:scale-105"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="الشريحة التالية"
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0A0E0C]/60 hover:bg-[#D97706] text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition-all duration-200 cursor-pointer shadow-lg hover:scale-105"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </>
      )}

      {/* Clean & Discreet Indicator Dots (No bulky background box, zero view obstruction) */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 pointer-events-auto">
          {activeSlides.map((_, dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={() => {
                setCanLoadOtherSlides(true);
                setCurrentIndex(dotIdx);
              }}
              aria-label={`الانتقال إلى الشريحة ${dotIdx + 1}`}
              className="p-1 min-w-[24px] min-h-[24px] flex items-center justify-center cursor-pointer transition-transform"
            >
              <span
                className={`block transition-all duration-300 rounded-full ${
                  dotIdx === currentIndex
                    ? 'w-6 h-1.5 sm:w-7 sm:h-2 bg-[#D97706] shadow-sm shadow-[#D97706]/80'
                    : 'w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/40 hover:bg-white/80'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
};
