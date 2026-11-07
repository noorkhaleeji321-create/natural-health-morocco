import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { Category } from '../../types';
import { ImageUploadField } from './ImageUploadField';
import { formatImageUrl, handleImageError } from '../../lib/utils';

interface AdminCategoriesTabProps {
  categories: Category[];
  onAdd: (c: Omit<Category, 'id'>) => Promise<{ success: boolean; category?: Category; error?: string }>;
  onUpdate: (id: string, updates: Partial<Category>) => Promise<{ success: boolean; category?: Category; error?: string }>;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
  showNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminCategoriesTab: React.FC<AdminCategoriesTabProps> = ({
  categories,
  onAdd,
  onUpdate,
  onDelete,
  showNotification,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [image, setImage] = useState('/assets/aistudio/aad8b4fe-64a3-4e47-89bd-93b688d4e9a1__1_daght_16fef5de.jpg');
  const [description, setDescription] = useState('');

  const modalBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFormOpen && modalBodyRef.current) {
      modalBodyRef.current.scrollTop = 0;
    }
  }, [isFormOpen]);

  const openNew = () => {
    setEditingCategory(null);
    setSaveError(null);
    setName('');
    setSlug('');
    setImage('');
    setDescription('');
    setIsFormOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditingCategory(c);
    setSaveError(null);
    setName(c.name || '');
    setSlug(c.slug || '');
    setImage(c.image || '');
    setDescription(c.description || '');
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    if (!name.trim()) {
      showNotification('اسم التصنيف مطلوب', 'error');
      return;
    }

    const calculatedSlug = slug.trim() || name.trim().toLowerCase().replace(/\s+/g, '-');
    setIsSaving(true);

    try {
      if (editingCategory) {
        const res = await onUpdate(editingCategory.id, {
          name,
          slug: calculatedSlug,
          image,
          description,
        });

        if (res.success) {
          showNotification(`تم تعديل تصنيف "${name}" بنجاح!`, 'success');
          setIsFormOpen(false);
        } else {
          setSaveError(res.error || 'فشل تحديث التصنيف في قاعدة البيانات.');
          showNotification(res.error || 'خطأ أثناء تحديث التصنيف', 'error');
        }
      } else {
        const res = await onAdd({
          name,
          slug: calculatedSlug,
          image,
          description,
          count: 0,
        });

        if (res.success) {
          showNotification(`تمت إضافة التصنيف الجديد "${name}"!`, 'success');
          setIsFormOpen(false);
        } else {
          setSaveError(res.error || 'فشل إضافة التصنيف في قاعدة البيانات.');
          showNotification(res.error || 'خطأ أثناء إضافة التصنيف', 'error');
        }
      }
    } catch (err: any) {
      setSaveError(err.message || 'حدث خطأ غير متوقع أثناء حفظ التصنيف.');
      showNotification('خطأ في الاتصال بالخادم', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    const res = await onDelete(categoryToDelete.id);
    if (res.success) {
      showNotification(`تم حذف التصنيف "${categoryToDelete.name}".`, 'success');
    } else {
      showNotification(`تعذر حذف التصنيف: ${res.error}`, 'error');
    }
    setCategoryToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={openNew}
          className="bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة تصنيف جديد</span>
        </button>
        <span className="text-xs text-[#8A9B90]">
          إجمالي التصنيفات: <strong className="text-white font-mono">{categories.length}</strong>
        </span>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm overflow-y-auto flex items-start justify-center p-3 sm:p-6 pt-20 sm:pt-28 pb-12 animate-in fade-in">
          <div className="bg-[#101713] border border-[#2E4135] rounded-3xl max-w-2xl sm:max-w-3xl w-full max-h-[78vh] flex flex-col shadow-2xl relative overflow-hidden">
            {/* Modal Header */}
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-[#213027] bg-[#121B16]">
              <h3 className="text-base sm:text-lg font-bold text-white font-['Cairo'] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D97706]" />
                <span>{editingCategory ? 'تعديل بيانات التصنيف' : 'إضافة تصنيف جديد للمتجر'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="w-8 h-8 rounded-full bg-[#18231C] text-[#8A9B90] hover:text-white flex items-center justify-center cursor-pointer text-xs font-bold transition-colors"
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Body */}
            <form
              onSubmit={handleSave}
              className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-4 text-xs sm:text-sm"
            >
              {saveError && (
                <div className="p-3 rounded-2xl bg-[#2A1515] border border-[#EF4444]/40 text-[#FCA5A5] text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              {/* 2-Column Wide Grid Layout ("3ard") Like Products with margin-top 50px (pushed down) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginTop: '50px' }}>
                <div>
                  <label className="block text-xs font-bold text-[#E5DCce] mb-1">
                    اسم التصنيف <span className="text-[#D97706]">*</span>
                  </label>
                  <input
                    type="text"
                    value={name ?? ''}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: البخور واللبان الحر"
                    className="w-full bg-[#151F19] border border-[#2B3C31] rounded-xl px-4 py-3 text-white focus:outline-hidden focus:border-[#D97706]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#E5DCce] mb-1">
                    الاسم اللاتيني / المعرف (Slug)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={slug ?? ''}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="مثال: bakhoor-oud"
                    className="w-full bg-[#151F19] border border-[#2B3C31] rounded-xl px-4 py-3 text-white font-mono focus:outline-hidden focus:border-[#D97706]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <ImageUploadField
                    label="صورة التصنيف"
                    value={image ?? ''}
                    onChange={setImage}
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#E5DCce] mb-1">وصف مختصر</label>
                  <textarea
                    rows={3}
                    value={description ?? ''}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="وصف مختصر لمعروضات هذا التصنيف..."
                    className="w-full bg-[#151F19] border border-[#2B3C31] rounded-xl px-4 py-3 text-white focus:outline-hidden focus:border-[#D97706]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-[#213027]">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-[#A89C89] hover:text-white bg-[#16221B] rounded-xl cursor-pointer disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-[#D97706] hover:bg-[#B45309] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSaving ? 'جاري الحفظ والتأكيد...' : 'حفظ وتأكيد'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Deletion Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-[#121A15] border border-[#EF4444]/40 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative z-[100000] overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-[#EF4444] via-[#DC2626] to-[#B91C1C]" />

            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#2D1515] border border-[#EF4444]/40 text-[#EF4444] flex items-center justify-center shrink-0 shadow-lg">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white font-['Cairo']">
                  تأكيد مسح التصنيف
                </h3>
                <p className="text-xs text-[#FCA5A5] mt-0.5 font-bold">
                  واش فعلاً بغيتي تمسح هاد التصنيف؟
                </p>
              </div>
            </div>

            <div className="bg-[#17231B] border border-[#283B2F] rounded-2xl p-3 mb-4 flex items-center gap-3">
              {categoryToDelete.image && categoryToDelete.image.trim() !== '' ? (
                <img
                  src={formatImageUrl(categoryToDelete.image)}
                  alt={categoryToDelete.name}
                  className="w-14 h-14 rounded-xl object-cover border border-[#2F4437] shrink-0"
                  onError={handleImageError}
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-[#1E2B23] border border-[#2F4437] shrink-0 flex items-center justify-center text-[#D97706]">
                  <Sparkles className="w-6 h-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white font-['Cairo'] truncate">
                  {categoryToDelete.name}
                </h4>
                <p className="text-[11px] text-[#A89C89] mt-0.5 font-mono">
                  {categoryToDelete.slug} ({categoryToDelete.count} منتج)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="flex-1 bg-[#1A261F] hover:bg-[#23332A] text-[#FAF5EC] font-bold py-2.5 rounded-xl text-xs border border-[#2F4437] transition-colors cursor-pointer"
              >
                إلغاء / تراجع
              </button>
              <button
                type="button"
                onClick={confirmDeleteCategory}
                className="flex-1 bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold py-2.5 rounded-xl text-xs shadow-lg shadow-red-900/30 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، مسح التصنيف</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((c) => {
          const formattedCatImg = formatImageUrl(c.image);
          return (
            <div
              key={c.id}
              className="bg-[#101713] border border-[#213027] rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="h-40 relative">
                  {formattedCatImg ? (
                    <img
                      src={formattedCatImg}
                      alt={c.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        handleImageError(e);
                        // Optional: if handleImageError is not enough, show fallback div
                        // But handleImageError sets a valid local image.
                      }}
                    />
                  ) : null}
                  <div
                    className={`admin-cat-fallback w-full h-full bg-[#15201A] items-center justify-center text-[#D97706]/70 ${
                      formattedCatImg ? 'hidden' : 'flex'
                    }`}
                  >
                    <Sparkles className="w-10 h-10" />
                  </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#101713] via-transparent to-transparent" />
                <span className="absolute bottom-3 right-3 bg-[#101713]/90 text-[#F3BA63] text-xs font-bold px-2.5 py-1 rounded-lg border border-[#28392F]">
                  {c.count} منتج
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-base font-black text-white font-['Cairo'] mb-1">{c.name}</h3>
                <p className="text-xs text-[#8A9B90] line-clamp-2">{c.description}</p>
              </div>
            </div>

            <div className="p-4 bg-[#141D17] border-t border-[#213027] flex items-center justify-between">
              <span className="font-mono text-xs text-[#7A8B80]">slug: {c.slug}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(c)}
                  className="p-2 rounded-lg bg-[#19271E] hover:bg-[#223328] text-[#F3BA63] transition-colors cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryToDelete(c)}
                  className="p-2 rounded-lg bg-[#2A1515] hover:bg-[#3B1B1B] text-[#EF4444] transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
    </div>
  );
};
