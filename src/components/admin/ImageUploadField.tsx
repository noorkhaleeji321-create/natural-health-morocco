import React, { useState, useRef } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { compressImage } from '../../utils/imageCompressor';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  required = false,
}) => {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('يرجى اختيار ملف صورة صالح (JPG, PNG, WEBP...)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 10 ميغابايت');
      return;
    }

    try {
      setIsProcessing(true);
      const compressed = await compressImage(file, 800, 800, 0.78);
      onChange(compressed);
    } catch (err) {
      console.error('Image compression failed:', err);
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (typeof e.target?.result === 'string') {
            onChange(e.target.result);
          }
        };
        reader.readAsDataURL(file);
      } catch {
        setUploadError('حدث خطأ أثناء معالجة ملف الصورة');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-[#E5DCce]">
          {label} {required && <span className="text-[#D97706]">*</span>}
        </label>
        <div className="flex items-center gap-1 bg-[#141E18] p-0.5 rounded-lg border border-[#223328]">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
              mode === 'upload'
                ? 'bg-[#D97706] text-white'
                : 'text-[#8A9B90] hover:text-white'
            }`}
          >
            رفع من الحاسوب
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
              mode === 'url'
                ? 'bg-[#D97706] text-white'
                : 'text-[#8A9B90] hover:text-white'
            }`}
          >
            رابط صورة URL
          </button>
        </div>
      </div>

      {mode === 'upload' ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {isProcessing ? (
            <div className="bg-[#151F19] border border-[#2B3C31] rounded-2xl p-5 flex items-center justify-center gap-3 text-xs text-[#F3BA63]">
              <div className="w-4 h-4 border-2 border-[#D97706] border-t-transparent rounded-full animate-spin" />
              <span>جاري معالجة وضغط الصورة بجودة عالية وسرعة فائقة...</span>
            </div>
          ) : value ? (
            <div className="relative group bg-[#151F19] border border-[#2B3C31] rounded-2xl p-3 flex items-center gap-3">
              <img
                src={value}
                alt="Preview"
                className="w-16 h-16 rounded-xl object-cover border border-[#3A4F42] shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">تم تحميل الصورة من جهازك بنجاح</p>
                <p className="text-[11px] text-[#8A9B90] mt-0.5">جاهزة للحفظ والعرض في المتجر</p>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D97706] hover:underline cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>تغيير الصورة</span>
                  </button>
                  <span className="text-[#3A4F42]">•</span>
                  <button
                    type="button"
                    onClick={() => onChange('')}
                    className="text-[11px] font-bold text-[#EF4444] hover:underline cursor-pointer"
                  >
                    حذف الصورة
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-[#D97706] bg-[#D97706]/10'
                  : 'border-[#2B3C31] bg-[#141E18] hover:border-[#D97706]/70 hover:bg-[#18231C]'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-[#1A2820] text-[#D97706] flex items-center justify-center mx-auto mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-white">
                اضغط لاختيار صورة من حاسوبك أو اسحب الملف إلى هنا
              </p>
              <p className="text-[10px] text-[#8A9B90] mt-1">
                يدعم JPG، PNG، WEBP (الحد الأقصى 5 ميغابايت)
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="url"
            dir="ltr"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="flex-1 bg-[#151F19] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-hidden focus:border-[#D97706]"
          />
          {value && (
            <img
              src={value}
              alt="Preview"
              className="w-10 h-10 rounded-xl object-cover border border-[#2B3C31] shrink-0"
              onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
            />
          )}
        </div>
      )}

      {uploadError && (
        <p className="text-[11px] text-[#EF4444] font-bold flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {uploadError}
        </p>
      )}
    </div>
  );
};
