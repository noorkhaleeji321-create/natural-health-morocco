import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Category } from '../../types';
import { ImageUploadField } from './ImageUploadField';

interface AdminCategoriesTabProps {
  categories: Category[];
  onAdd: (c: Omit<Category, 'id'>) => Category;
  onUpdate: (id: string, updates: Partial<Category>) => void;
  onDelete: (id: string) => void;
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

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [image, setImage] = useState('/assets/aistudio/aad8b4fe-64a3-4e47-89bd-93b688d4e9a1__1_daght_16fef5de.jpg');
  const [description, setDescription] = useState('');

  const openNew = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setImage('/assets/aistudio/aad8b4fe-64a3-4e47-89bd-93b688d4e9a1__1_daght_16fef5de.jpg');
    setDescription('');
    setIsFormOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditingCategory(c);
    setName(c.name || '');
    setSlug(c.slug || '');
    setImage(c.image || '');
    setDescription(c.description || '');
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showNotification('اسم التصنيف مطلوب', 'error');
      return;
    }

    const calculatedSlug = slug.trim() || name.trim().toLowerCase().replace(/\s+/g, '-');

    if (editingCategory) {
      onUpdate(editingCategory.id, {
        name,
        slug: calculatedSlug,
        image,
        description,
      });
      showNotification(`تم تعديل تصنيف "${name}" بنجاح!`);
    } else {
      onAdd({
        name,
        slug: calculatedSlug,
        image,
        description,
        count: 0,
      });
      showNotification(`تمت إضافة التصنيف الجديد "${name}"!`);
    }

    setIsFormOpen(false);
  };

  const confirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    onDelete(categoryToDelete.id);
    showNotification(`تم حذف التصنيف "${categoryToDelete.name}".`);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#101713] border border-[#2E4135] rounded-3xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#213027] mb-4">
              <h3 className="text-base font-bold text-white font-['Cairo']">
                {editingCategory ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-[#8A9B90] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-[#E5DCce] mb-1">
                  اسم التصنيف <span className="text-[#D97706]">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: البخور واللبان الحر"
                  className="w-full bg-[#151F19] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:border-[#D97706]"
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
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="مثال: bakhoor-oud"
                  className="w-full bg-[#151F19] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-hidden focus:border-[#D97706]"
                />
              </div>

              <ImageUploadField
                label="صورة التصنيف"
                value={image}
                onChange={setImage}
                required
              />

              <div>
                <label className="block text-xs font-bold text-[#E5DCce] mb-1">وصف مختصر</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف مختصر لمعروضات هذا التصنيف..."
                  className="w-full bg-[#151F19] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:border-[#D97706]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#213027]">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#A89C89] hover:text-white cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-[#D97706] hover:bg-[#B45309] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Deletion Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#121A15] border border-[#EF4444]/40 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative overflow-hidden">
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
              <img
                src={categoryToDelete.image}
                alt={categoryToDelete.name}
                className="w-14 h-14 rounded-xl object-cover border border-[#2F4437] shrink-0"
              />
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
        {categories.map((c) => (
          <div
            key={c.id}
            className="bg-[#101713] border border-[#213027] rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="h-40 relative">
                <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
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
        ))}
      </div>
    </div>
  );
};
