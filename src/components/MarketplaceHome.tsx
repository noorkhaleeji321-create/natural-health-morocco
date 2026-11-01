import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight, 
  Monitor, 
  Smartphone, 
  Tablet, 
  ChevronRight, 
  Layers, 
  Globe, 
  ShoppingBag, 
  Zap,
  Star,
  CheckCircle2,
  Users,
  Palette
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  pages: number;
  rating: number;
  reviews: number;
  isPopular?: boolean;
}

const templates: Template[] = [
  {
    id: 'tpl-1',
    name: 'Natural Morocco',
    category: 'Herbalist & Health',
    description: 'Premium store for natural products, oils, and traditional herbs with a deep dark theme.',
    price: 149,
    image: '/assets/aistudio/aad8b4fe-64a3-4e47-89bd-93b688d4e9a1__1_daght_16fef5de.jpg',
    pages: 6,
    rating: 5.0,
    reviews: 124,
    isPopular: true
  },
  {
    id: 'tpl-2',
    name: 'Skyline Real Estate',
    category: 'Real Estate',
    description: 'Modern property listings with high-res galleries and interactive maps.',
    price: 199,
    image: '/assets/aistudio/c03cbe4c-6ae7-47e0-bfc4-154f493edd5a__1_daght_c1eb50b4.jpg',
    pages: 12,
    rating: 4.9,
    reviews: 86
  },
  {
    id: 'tpl-3',
    name: 'Gourmet Kitchen',
    category: 'Restaurant',
    description: 'Elegant menu display with online ordering and table reservation system.',
    price: 129,
    image: '/assets/aistudio/3a1a3410-5a45-44eb-b5d2-b3e9eab91623__1_daghta_ec752c93.jpg',
    pages: 5,
    rating: 4.8,
    reviews: 210
  }
];

const categories = [
  'All', 'Restaurants', 'Real Estate', 'Barbers', 'Beauty', 'Doctors', 'Dentists', 'Lawyers', 'Construction', 'Agencies'
];

export const MarketplaceHome: React.FC<{ onExploreTemplate: (id: string) => void }> = ({ onExploreTemplate }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  return (
    <div className="min-h-screen bg-[#050806] text-white">
      {/* Cinematic Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Abstract 3D Background elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#D97706]/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#D97706]/5 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col items-center text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D97706]/10 border border-[#D97706]/20 text-[#D97706] text-xs font-bold mb-8"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Website Marketplace</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-black mb-6 tracking-tight"
            >
              Professional Websites.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D97706] to-[#FCD34D]">
                Ready Tomorrow.
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-[#A89C89] max-w-2xl mb-12 leading-relaxed"
            >
              Choose a ready-made website, customize it with your business details, 
              and let AI prepare everything for you. No coding, no stress.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4"
            >
              <button className="px-8 py-4 bg-[#D97706] hover:bg-[#B45309] text-white rounded-2xl font-black text-lg shadow-2xl shadow-[#D97706]/20 flex items-center gap-3 group transition-all">
                Get My Website
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 bg-[#141F18] hover:bg-[#1C2C22] text-[#E5DCce] rounded-2xl font-bold text-lg border border-[#213027] transition-all">
                Explore Templates
              </button>
            </motion.div>
          </div>

          {/* 3D Browser Preview Mockup */}
          <motion.div 
            initial={{ opacity: 0, y: 100, rotateX: 20 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
            className="mt-24 perspective-1000"
          >
            <div className="relative mx-auto max-w-5xl group">
              {/* Browser Frame */}
              <div className="bg-[#101713] rounded-t-2xl p-3 border-x border-t border-[#213027] flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#EF4444]/30" />
                  <div className="w-3 h-3 rounded-full bg-[#F59E0B]/30" />
                  <div className="w-3 h-3 rounded-full bg-[#10B981]/30" />
                </div>
                <div className="mx-auto bg-[#0A0E0C] px-10 py-1 rounded-full text-[10px] text-[#4F5E56] font-mono border border-[#1C2821]">
                  https://natural-morocco.ma
                </div>
              </div>
              <div className="aspect-video bg-[#0A0E0C] border-x border-b border-[#213027] rounded-b-2xl overflow-hidden shadow-2xl shadow-black/80 relative">
                <img 
                  src="/assets/aistudio/aad8b4fe-64a3-4e47-89bd-93b688d4e9a1__1_daght_16fef5de.jpg" 
                  alt="Website Preview" 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050806] via-transparent to-transparent opacity-60" />
                
                {/* Floating UI Cards over Browser */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1/4 -right-12 p-4 bg-[#101713]/90 backdrop-blur-md border border-[#213027] rounded-2xl shadow-2xl hidden lg:block"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#8A9B90] font-bold uppercase tracking-wider">Speed Score</p>
                      <p className="text-lg font-black text-white">99 / 100</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-1/4 -left-12 p-4 bg-[#101713]/90 backdrop-blur-md border border-[#213027] rounded-2xl shadow-2xl hidden lg:block"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#D97706]/20 flex items-center justify-center text-[#D97706]">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#8A9B90] font-bold uppercase tracking-wider">AI Content</p>
                      <p className="text-lg font-black text-white">Generated</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Marketplace Section */}
      <section id="marketplace" className="py-24 bg-[#0A0E0C]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-4xl font-black mb-4">Premium Templates</h2>
              <p className="text-[#A89C89] max-w-xl">
                Browse our collection of high-performance websites. Each one is a production-ready masterpiece waiting for your brand.
              </p>
            </div>
            
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {categories.slice(0, 6).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-[#D97706] text-white shadow-lg'
                      : 'bg-[#141F18] text-[#8A9B90] border border-[#213027] hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-6">
            {templates.map((tpl) => (
              <motion.div
                key={tpl.id}
                whileHover={{ y: -10 }}
                className="group relative bg-[#101713] border border-[#213027] rounded-3xl overflow-hidden shadow-xl"
              >
                {/* 3D Perspective Card Image */}
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img 
                    src={tpl.image} 
                    alt={tpl.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#101713] via-transparent to-transparent opacity-60" />
                  
                  {tpl.isPopular && (
                    <div className="absolute top-4 right-4 bg-[#D97706] text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-lg">
                      Popular
                    </div>
                  )}

                  {/* Device Toggles overlay */}
                  <div className="absolute bottom-4 left-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 transition-transform">
                    <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white cursor-pointer hover:bg-white/20">
                      <Monitor className="w-3.5 h-3.5" />
                    </div>
                    <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white cursor-pointer hover:bg-white/20">
                      <Tablet className="w-3.5 h-3.5" />
                    </div>
                    <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white cursor-pointer hover:bg-white/20">
                      <Smartphone className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-[#D97706] uppercase tracking-[0.2em]">{tpl.category}</span>
                    <div className="flex items-center gap-1 text-[#FCD34D]">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-xs font-bold">{tpl.rating}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-black mb-2 group-hover:text-[#D97706] transition-colors">{tpl.name}</h3>
                  <p className="text-xs text-[#8A9B90] mb-6 line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>

                  <div className="flex items-center justify-between pt-6 border-t border-[#1E2B22]">
                    <div>
                      <p className="text-[10px] text-[#4F5E56] font-bold uppercase">Starting from</p>
                      <p className="text-xl font-black text-white">${tpl.price}</p>
                    </div>
                    <button 
                      onClick={() => onExploreTemplate(tpl.id)}
                      className="px-5 py-2.5 bg-[#D97706]/10 hover:bg-[#D97706] text-[#D97706] hover:text-white rounded-xl text-xs font-black transition-all border border-[#D97706]/20"
                    >
                      Customize & Buy
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <button className="inline-flex items-center gap-2 text-[#8A9B90] hover:text-white font-bold transition-colors">
              View All 48+ Templates
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* AI Studio Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[#D97706]/5 blur-[150px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="bg-[#101713] border border-[#213027] rounded-[2rem] p-8 shadow-2xl relative">
              {/* AI Processing Animation */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-black flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#D97706]" />
                    AI Website Studio
                  </h4>
                  <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[10px] font-black uppercase tracking-wider">
                    Processing
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Understanding Business', status: 'completed' },
                    { label: 'Generating Content', status: 'completed' },
                    { label: 'Optimizing Website', status: 'active' },
                    { label: 'Preparing SEO', status: 'pending' },
                    { label: 'Final Quality Check', status: 'pending' }
                  ].map((step, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-[#0A0E0C] rounded-2xl border border-[#1E2B22]">
                      <div className="flex items-center gap-3">
                        {step.status === 'completed' ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                        ) : step.status === 'active' ? (
                          <div className="w-5 h-5 rounded-full border-2 border-[#D97706] border-t-transparent animate-spin" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-[#1E2B22]" />
                        )}
                        <span className={`text-sm font-bold ${step.status === 'pending' ? 'text-[#4F5E56]' : 'text-white'}`}>
                          {step.label}
                        </span>
                      </div>
                      {step.status === 'active' && (
                        <span className="text-[10px] font-black text-[#D97706] animate-pulse">85%</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <div className="w-full h-2 bg-[#1E2B22] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '85%' }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="h-full bg-gradient-to-r from-[#D97706] to-[#FCD34D]" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
              Our AI Does the <br />
              <span className="text-[#D97706]">Heavy Lifting.</span>
            </h2>
            <p className="text-lg text-[#A89C89] mb-8 leading-relaxed">
              Just provide your business name and details. Our specialized AI models generate professional copy, 
              select the perfect assets, and optimize every pixel for conversion.
            </p>
            
            <ul className="space-y-4 mb-10">
              {[
                'Instant Content Generation',
                'Automatic SEO Optimization',
                'Mobile-First Responsive Design',
                'High-Performance Page Loads'
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm font-bold text-[#E5DCce]">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>

            <button className="px-8 py-4 bg-[#D97706] hover:bg-[#B45309] text-white rounded-2xl font-black text-lg shadow-xl shadow-[#D97706]/10 transition-all active:scale-95">
              Start Building Now
            </button>
          </div>
        </div>
      </section>

      {/* Trust & Stats */}
      <section className="py-24 border-t border-[#1E2B22]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Active Websites', value: '12,000+', icon: Globe },
              { label: 'Happy Clients', value: '8.5k', icon: Users },
              { label: 'Designs Created', value: '45k', icon: Palette },
              { label: 'Success Rate', value: '99.9%', icon: CheckCircle2 }
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#141F18] text-[#D97706] flex items-center justify-center mx-auto mb-4 border border-[#213027]">
                  <stat.icon className="w-6 h-6" />
                </div>
                <p className="text-3xl font-black text-white mb-1">{stat.value}</p>
                <p className="text-xs font-bold text-[#8A9B90] uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer / CTA */}
      <section className="py-24 bg-gradient-to-b from-[#0A0E0C] to-[#050806]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
            Ready to launch your <br />
            digital presence?
          </h2>
          <p className="text-lg text-[#A89C89] mb-12">
            Join thousands of businesses that trust our AI to power their online growth.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto px-10 py-5 bg-[#D97706] hover:bg-[#B45309] text-white rounded-2xl font-black text-xl shadow-2xl transition-all">
              Launch My Site
            </button>
            <button className="w-full sm:w-auto px-10 py-5 bg-[#141F18] hover:bg-[#1C2C22] text-[#E5DCce] rounded-2xl font-bold text-xl border border-[#213027] transition-all">
              Contact Sales
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
