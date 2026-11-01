import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Settings, 
  Monitor, 
  Smartphone, 
  Tablet, 
  ChevronLeft, 
  Layout, 
  Type, 
  Image as ImageIcon, 
  Share2,
  ArrowRight,
  Zap,
  Globe,
  Database,
  Palette
} from 'lucide-react';

interface AICustomizationStudioProps {
  templateId: string;
  onBack: () => void;
  onComplete: () => void;
}

export const AICustomizationStudio: React.FC<AICustomizationStudioProps> = ({ templateId, onBack, onComplete }) => {
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'processing' | 'completed'>('idle');
  const [progress, setGenerationProgress] = useState(0);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const steps = [
    { id: 1, title: 'Business Info', icon: Settings },
    { id: 2, title: 'AI Production', icon: Sparkles },
    { id: 3, title: 'Review & Publish', icon: Globe },
  ];

  const processingSteps = [
    { label: 'Analyzing Business Brand', weight: 15 },
    { label: 'Generating High-Conversion Copy', weight: 25 },
    { label: 'Optimizing Visual Layout', weight: 20 },
    { label: 'Preparing SEO & Meta Tags', weight: 20 },
    { label: 'Final Quality Polish', weight: 20 },
  ];

  const handleStartGeneration = () => {
    if (!businessName) return;
    setStep(2);
    setGenerationStatus('processing');
    setGenerationProgress(0);
  };

  useEffect(() => {
    if (generationStatus === 'processing') {
      const interval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setGenerationStatus('completed');
            setStep(3);
            return 100;
          }
          return prev + 1;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [generationStatus]);

  return (
    <div className="min-h-screen bg-[#050806] text-white flex flex-col">
      {/* Top Header */}
      <header className="h-16 border-b border-[#1E2B22] bg-[#0A0E0C] px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-[#1C2C22] rounded-xl transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-[#1E2B22]" />
          <h1 className="font-black tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#D97706]" />
            AI Production Studio
          </h1>
        </div>

        {/* Stepper UI */}
        <div className="hidden md:flex items-center gap-8">
          {steps.map((s) => (
            <div key={s.id} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border transition-all ${
                step === s.id 
                  ? 'bg-[#D97706] border-[#D97706] text-white shadow-lg shadow-[#D97706]/20' 
                  : step > s.id 
                  ? 'bg-emerald-500 border-emerald-500 text-white' 
                  : 'bg-[#141F18] border-[#213027] text-[#4F5E56]'
              }`}>
                {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
              </div>
              <span className={`text-xs font-bold uppercase tracking-widest ${
                step === s.id ? 'text-white' : 'text-[#4F5E56]'
              }`}>
                {s.title}
              </span>
            </div>
          ))}
        </div>

        <button 
          onClick={onComplete}
          disabled={step < 3}
          className="px-5 py-2 bg-[#D97706] hover:bg-[#B45309] disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black shadow-lg transition-all"
        >
          Publish Website
        </button>
      </header>

      {/* Main Studio Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Business Information Form */}
        <aside className="w-full lg:w-80 xl:w-96 border-r border-[#1E2B22] bg-[#0A0E0C] p-6 overflow-y-auto shrink-0">
          <div className="space-y-8">
            <section>
              <h3 className="text-sm font-black text-[#D97706] uppercase tracking-widest mb-4">Identity</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#8A9B90] uppercase tracking-wider mb-1.5">Business Name</label>
                  <input 
                    type="text" 
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Atlas Botanicals"
                    className="w-full bg-[#141F18] border border-[#213027] rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-[#D97706]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#8A9B90] uppercase tracking-wider mb-1.5">Description</label>
                  <textarea 
                    rows={4}
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    placeholder="Tell AI about your products, services and target audience..."
                    className="w-full bg-[#141F18] border border-[#213027] rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-[#D97706] resize-none"
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-black text-[#D97706] uppercase tracking-widest mb-4">Branding</h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center gap-2 p-3 bg-[#141F18] border border-[#213027] rounded-xl hover:border-[#D97706] transition-colors group">
                  <Palette className="w-4 h-4 text-[#4F5E56] group-hover:text-[#D97706]" />
                  <span className="text-xs font-bold">Theme</span>
                </button>
                <button className="flex items-center gap-2 p-3 bg-[#141F18] border border-[#213027] rounded-xl hover:border-[#D97706] transition-colors group">
                  <Type className="w-4 h-4 text-[#4F5E56] group-hover:text-[#D97706]" />
                  <span className="text-xs font-bold">Fonts</span>
                </button>
                <button className="flex items-center gap-2 p-3 bg-[#141F18] border border-[#213027] rounded-xl hover:border-[#D97706] transition-colors group">
                  <ImageIcon className="w-4 h-4 text-[#4F5E56] group-hover:text-[#D97706]" />
                  <span className="text-xs font-bold">Images</span>
                </button>
                <button className="flex items-center gap-2 p-3 bg-[#141F18] border border-[#213027] rounded-xl hover:border-[#D97706] transition-colors group">
                  <Layout className="w-4 h-4 text-[#4F5E56] group-hover:text-[#D97706]" />
                  <span className="text-xs font-bold">Layout</span>
                </button>
              </div>
            </section>

            <div className="pt-8">
              <button 
                onClick={handleStartGeneration}
                disabled={!businessName || generationStatus === 'processing'}
                className="w-full py-4 bg-gradient-to-r from-[#D97706] to-[#B45309] hover:shadow-xl hover:shadow-[#D97706]/20 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-30"
              >
                <Sparkles className="w-5 h-5" />
                Generate My Website
              </button>
            </div>
          </div>
        </aside>

        {/* Center: Live 3D Website Preview */}
        <main className="flex-1 bg-[#050806] relative flex flex-col overflow-hidden">
          {/* Viewport Toggles */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-[#101713]/80 backdrop-blur-md border border-[#213027] p-1 rounded-2xl">
            <button 
              onClick={() => setViewMode('desktop')}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'desktop' ? 'bg-[#D97706] text-white shadow-lg' : 'text-[#4F5E56] hover:text-white'}`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('tablet')}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'tablet' ? 'bg-[#D97706] text-white shadow-lg' : 'text-[#4F5E56] hover:text-white'}`}
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('mobile')}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'mobile' ? 'bg-[#D97706] text-white shadow-lg' : 'text-[#4F5E56] hover:text-white'}`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 p-8 pt-20 flex items-center justify-center">
            <div className={`transition-all duration-500 bg-[#0A0E0C] border border-[#213027] shadow-2xl rounded-2xl overflow-hidden relative ${
              viewMode === 'desktop' ? 'w-full max-w-5xl aspect-video' :
              viewMode === 'tablet' ? 'w-[600px] h-[800px]' :
              'w-[340px] h-[700px]'
            }`}>
              {/* Fake Website Content Loading */}
              <div className="absolute inset-0 overflow-y-auto no-scrollbar">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-12">
                    <div className="w-32 h-6 bg-[#141F18] rounded-full animate-pulse" />
                    <div className="flex gap-4">
                      <div className="w-12 h-2 bg-[#141F18] rounded-full" />
                      <div className="w-12 h-2 bg-[#141F18] rounded-full" />
                    </div>
                  </div>

                  <div className="max-w-2xl">
                    <div className="h-12 bg-gradient-to-r from-[#141F18] to-[#0A0E0C] rounded-2xl w-3/4 mb-4 animate-pulse" />
                    <div className="h-12 bg-gradient-to-r from-[#141F18] to-[#0A0E0C] rounded-2xl w-1/2 mb-8 animate-pulse" />
                    <div className="h-4 bg-[#141F18] rounded-full w-full mb-2" />
                    <div className="h-4 bg-[#141F18] rounded-full w-full mb-2" />
                    <div className="h-4 bg-[#141F18] rounded-full w-2/3" />
                  </div>

                  <div className="grid grid-cols-3 gap-6 mt-20">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="aspect-square bg-[#141F18] rounded-3xl animate-pulse" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Success Overlay */}
              <AnimatePresence>
                {step === 3 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-[#050806]/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center"
                  >
                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-6 shadow-2xl shadow-emerald-500/20">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-black mb-4">Ready to Launch!</h2>
                    <p className="text-[#A89C89] max-w-sm mb-8">
                      Your business website has been optimized and prepared. Preview the live version and hit publish.
                    </p>
                    <div className="flex gap-4">
                      <button className="px-6 py-3 bg-white text-black rounded-xl font-bold text-sm">Preview Live</button>
                      <button className="px-6 py-3 bg-[#D97706] text-white rounded-xl font-bold text-sm">Get URL</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>

        {/* Right Side: AI Generation Status */}
        <aside className="w-full lg:w-80 border-l border-[#1E2B22] bg-[#0A0E0C] p-6 overflow-y-auto shrink-0">
          <h3 className="text-sm font-black text-[#D97706] uppercase tracking-widest mb-6">Process Log</h3>
          
          <div className="space-y-6">
            {generationStatus === 'idle' ? (
              <div className="text-center py-12 px-4 border border-dashed border-[#213027] rounded-[2rem]">
                <Clock className="w-10 h-10 text-[#4F5E56] mx-auto mb-4" />
                <p className="text-xs text-[#4F5E56] font-bold">Waiting for input to start AI generation...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Progress Circle */}
                <div className="relative w-32 h-32 mx-auto">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle 
                      cx="50" cy="50" r="45" 
                      fill="none" 
                      stroke="#141F18" 
                      strokeWidth="8" 
                    />
                    <motion.circle 
                      cx="50" cy="50" r="45" 
                      fill="none" 
                      stroke="#D97706" 
                      strokeWidth="8" 
                      strokeDasharray="282.7"
                      strokeDashoffset={282.7 - (282.7 * progress) / 100}
                      strokeLinecap="round"
                      initial={{ strokeDashoffset: 282.7 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black">{progress}%</span>
                    <span className="text-[8px] font-black text-[#8A9B90] uppercase tracking-widest">Global</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {processingSteps.map((step, idx) => {
                    const stepThreshold = processingSteps.slice(0, idx).reduce((acc, s) => acc + s.weight, 0);
                    const isDone = progress >= stepThreshold + step.weight;
                    const isActive = progress >= stepThreshold && progress < stepThreshold + step.weight;

                    return (
                      <div key={idx} className={`p-4 rounded-2xl border transition-all ${
                        isDone ? 'bg-emerald-500/5 border-emerald-500/20' : 
                        isActive ? 'bg-[#D97706]/5 border-[#D97706]/40' : 
                        'bg-[#0A0E0C] border-[#1E2B22]'
                      }`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[10px] font-black uppercase tracking-wider ${
                            isDone ? 'text-emerald-500' : 
                            isActive ? 'text-[#D97706]' : 
                            'text-[#4F5E56]'
                          }`}>
                            {step.label}
                          </span>
                          {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                        </div>
                        <div className="w-full h-1 bg-[#141F18] rounded-full overflow-hidden">
                          <motion.div 
                            className={`h-full ${isDone ? 'bg-emerald-500' : 'bg-[#D97706]'}`}
                            animate={{ width: isDone ? '100%' : isActive ? `${((progress - stepThreshold) / step.weight) * 100}%` : '0%' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 grid grid-cols-2 gap-4">
                  <div className="p-3 bg-[#141F18] rounded-xl border border-[#213027]">
                    <p className="text-[8px] font-black text-[#4F5E56] uppercase mb-1">Compute</p>
                    <div className="flex items-center gap-1.5 text-[#D97706]">
                      <Zap className="w-3 h-3" />
                      <span className="text-xs font-bold font-mono">1.2 TFLOPS</span>
                    </div>
                  </div>
                  <div className="p-3 bg-[#141F18] rounded-xl border border-[#213027]">
                    <p className="text-[8px] font-black text-[#4F5E56] uppercase mb-1">Latency</p>
                    <div className="flex items-center gap-1.5 text-blue-400">
                      <Database className="w-3 h-3" />
                      <span className="text-xs font-bold font-mono">18ms</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
