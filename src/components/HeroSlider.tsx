import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, ShieldCheck, Truck, Award, Leaf, ArrowLeft, Sparkles } from 'lucide-react';
import { HeroSlide } from '../types';
import { initialHeroSlides } from '../data/storeData';

interface HeroSliderProps {
  slides?: HeroSlide[];
}

export const HeroSlider: React.FC<HeroSliderProps> = ({ slides }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const activeSlides = slides && slides.length > 0 ? slides : initialHeroSlides;

  // Auto-advance
  useEffect(() => {
    if (isPaused || activeSlides.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, activeSlides.length]);

  return (
    <section id="home" className="relative h-[250px] sm:h-[400px] md:h-[500px] bg-[#0A0E0C] overflow-hidden text-white select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <img
            src={activeSlides[currentIndex].image}
            alt={activeSlides[currentIndex].title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4">
            <button className="bg-[#D97706] text-white px-8 py-3 rounded-full font-bold">
              تسوق الآن
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Navigation */}
      <button 
        onClick={() => setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 rounded-full"
      >
        <ChevronLeft />
      </button>
      <button 
        onClick={() => setCurrentIndex((prev) => (prev + 1) % activeSlides.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 rounded-full"
      >
        <ChevronRight />
      </button>
    </section>
  );
};

