import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Package, RefreshCw, AlertCircle, ArrowUp, ArrowDown, ChevronsUp, Check } from 'lucide-react';
import { Product, Category } from '../../types';
import { ImageUploadField } from './ImageUploadField';
import { formatImageUrl, handleImageError, sortProductsByDisplayOrder } from '../../lib/utils';

interface AdminProductsTabProps {
  products: Product[];
  categories: Category[];
  onAdd: (p: Omit<Product, 'id'>) => Promise<{ success: boolean; product?: Product; error?: string }>;
  onUpdate: (id: string, updates: Partial<Product>) => Promise<{ success: boolean; product?: Product; error?: string }>;
  onMoveOrder?: (id: string, targetIndex: number) => Promise<{ success: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
  showNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminProductsTab: React.FC<AdminProductsTabProps> = ({
  products,
  categories,
  onAdd,
  onUpdate,
  onMoveOrder,
  onDelete,
  showNotification,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [rankInputs, setRankInputs] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [debouncedSearchFilter, setDebouncedSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const modalBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFormOpen && modalBodyRef.current) {
      modalBodyRef.current.scrollTop = 0;
    }
  }, [isFormOpen]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchFilter(searchFilter);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchFilter]);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'التوابل المغربية');
  const [price, setPrice] = useState<number | string>(50);
  const [oldPrice, setOldPrice] = useState<number | string>('');
  const [unit, setUnit] = useState('250 غرام');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [stockCount, setStockCount] = useState<number | string>(50);
  const [inStock, setInStock] = useState(true);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const openNewForm = () => {
    setEditingProduct(null);
    setSaveError(null);
    setName('');
    setCategory(categories[0]?.name || '');
    setPrice(50);
    setOldPrice('');
    setUnit('250 غرام');
    setImage('');
    setDescription('');
    setStockCount(50);
    setInStock(true);
    setIsBestSeller(false);
    setIsNew(true);
    setIsFormOpen(true);
  };

  const openEditForm = (p: Product) => {
    setEditingProduct(p);
    setSaveError(null);
    setName(p.name || '');
    setCategory(p.category || categories[0]?.name || 'التوابل المغربية');
    setPrice(p.price ?? 50);
    setOldPrice(p.oldPrice ?? '');
    setUnit(p.unit || '250 غرام');
    setImage(p.image || '');
    setDescription(p.description || '');
    setStockCount(p.stockCount ?? 50);
    setInStock(Boolean(p.inStock));
    setIsBestSeller(Boolean(p.isBestSeller));
    setIsNew(Boolean(p.isNew));
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    if (!name.trim()) {
      showNotification('يرجى إدخال اسم المنتج', 'error');
      return;
    }
    if (!image.trim()) {
      showNotification('يرجى رفع أو إدخال صورة للمنتج', 'error');
      return;
    }

    setIsSaving(true);
    try {
      if (editingProduct) {
        const res = await onUpdate(editingProduct.id, {
          name,
          category,
          price: Number(price),
          oldPrice: oldPrice !== '' ? Number(oldPrice) : undefined,
          unit,
          image,
          description,
          stockCount: Number(stockCount),
          inStock,
          isBestSeller,
          isNew,
        });

        if (res.success) {
          showNotification(`تم تعديل المنتج "${name}" بنجاح في قاعدة البيانات والسحابة!`, 'success');
          setIsFormOpen(false);
        } else {
          setSaveError(res.error || 'فشل تحديث المنتج في قاعدة البيانات.');
          showNotification(res.error || 'تعذر حفظ البيانات في السيرفر', 'error');
        }
      } else {
        const res = await onAdd({
          name,
          category,
          price: Number(price),
          oldPrice: oldPrice !== '' ? Number(oldPrice) : undefined,
          unit,
          image,
          description,
          rating: 5.0,
          reviewsCount: 1,
          stockCount: Number(stockCount),
          inStock,
          isBestSeller,
          isNew,
        });

        if (res.success) {
          showNotification(`تمت إضافة المنتج الجديد "${name}" وحفظه بسلاسة!`, 'success');
          setIsFormOpen(false);
        } else {
          setSaveError(res.error || 'فشل حفظ المنتج في قاعدة البيانات.');
          showNotification(res.error || 'تعذر حفظ المنتج الجديد', 'error');
        }
      }
    } catch (err: any) {
      setSaveError(err.message || 'حدث خطأ غير متوقع أثناء الحفظ.');
      showNotification('خطأ أثناء حفظ المنتج', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    const res = await onDelete(productToDelete.id);
    if (res.success) {
      showNotification(`تم مسح المنتج "${productToDelete.name}" بنجاح.`, 'success');
    } else {
      showNotification(`تعذر مسح المنتج: ${res.error}`, 'error');
    }
    setProductToDelete(null);
  };

  const orderedProducts = useMemo(() => sortProductsByDisplayOrder(products), [products]);

  const masterRankMap = useMemo(() => {
    const map = new Map<string, number>();
    orderedProducts.forEach((p, idx) => map.set(p.id, idx + 1));
    return map;
  }, [orderedProducts]);

  const handleMove = async (p: Product, targetIndex: number, label?: string) => {
    if (!onMoveOrder || reorderingId) return;
    const clamped = Math.max(0, Math.min(orderedProducts.length - 1, targetIndex));
    setReorderingId(p.id);
    try {
      const res = await onMoveOrder(p.id, clamped);
      if (res.success) {
        setRankInputs((prev) => {
          const copy = { ...prev };
          delete copy[p.id];
          return copy;
        });
        showNotification(
          label || `تم نقل "${p.name}" إلى الترتيب #${clamped + 1} وحفظه بنجاح!`,
          'success'
        );
      } else {
        showNotification(res.error || 'تعذر تحديث ترتيب المنتج', 'error');
      }
    } finally {
      setReorderingId(null);
    }
  };

  const handleJumpToRank = (p: Product) => {
    const raw = rankInputs[p.id];
    const parsed = parseInt(String(raw || '').trim(), 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      showNotification('أدخل رقم ترتيب صحيح يبدأ من 1', 'error');
      return;
    }
    const targetIdx = Math.min(orderedProducts.length - 1, parsed - 1);
    handleMove(p, targetIdx);
  };

  const filteredProducts = orderedProducts.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(debouncedSearchFilter.toLowerCase()) ||
      p.description.toLowerCase().includes(debouncedSearchFilter.toLowerCase());
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      {/* Action Header & Responsive Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-[#101713] border border-[#213027] p-3.5 sm:p-5 rounded-2xl">
        <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={openNewForm}
            className="flex-1 sm:flex-none bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة منتج جديد</span>
          </button>
          <span className="text-xs text-[#8A9B90] shrink-0 font-bold">
            <strong className="text-[#F59E0B] font-mono">{products.length}</strong> منتج
          </span>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full sm:w-auto">
          <div className="relative">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="w-full sm:w-48 bg-[#151F19] border border-[#26372D] rounded-xl px-3 py-2 pr-8 text-xs text-white placeholder-[#776B5A] focus:outline-hidden focus:border-[#D97706]"
            />
            <Search className="w-3.5 h-3.5 text-[#776B5A] absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-44 bg-[#151F19] border border-[#26372D] rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#D97706]"
          >
            <option value="all">جميع التصنيفات</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ordering Guide Note */}
      {onMoveOrder && (
        <div className="bg-[#121C16] border border-[#D97706]/30 rounded-2xl px-4 py-2.5 text-[11px] sm:text-xs text-[#E5DCce] flex flex-wrap items-center justify-between gap-2">
          <span>
            ✨ <strong className="text-[#F3BA63]">ترتيب ظهور المنتجات للزبائن:</strong> أول{' '}
            <strong className="text-[#10B981] font-mono">20</strong> منتجاً (#1 إلى #20) تظهر أولاً في المتجر. يمكنك الضغط على{' '}
            <strong className="text-[#F3BA63]">للأول</strong> أو الأسهم أو كتابة رقم الترتيب مباشرة.
          </span>
        </div>
      )}

      {/* Product Edit / Create Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm overflow-y-auto flex items-start justify-center p-3 sm:p-6 pt-20 sm:pt-28 pb-12 animate-in fade-in">
          <div className="bg-[#101713] border border-[#2E4135] rounded-3xl max-w-2xl sm:max-w-3xl w-full max-h-[78vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-[#213027] bg-[#121B16]">
              <h3 className="text-base sm:text-lg font-bold text-white font-['Cairo'] flex items-center gap-2">
                <Package className="w-5 h-5 text-[#D97706]" />
                <span>{editingProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد للمتجر'}</span>
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
            <div className="overflow-y-auto flex-1 p-5 sm:p-6 min-h-0">
              {saveError && (
                <div className="mb-4 p-3 rounded-2xl bg-[#2A1515] border border-[#EF4444]/40 text-[#FCA5A5] text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#E5DCce] mb-1">
                      اسم المنتج <span className="text-[#D97706]">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثال: زعفران حر أطلسي تالوين"
                      className="w-full bg-[#151F19] border border-[#2B3C31] rounded-xl px-4 py-3 text-white focus:outline-hidden focus:border-[#D97706]"
                      required
                    />
                  </div>

                <div>
                  <label className="block text-xs font-bold text-[#E5DCce] mb-0.5">التصنيف</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#151F19] border border-[#2B3C31] rounded-xl px-3 py-1.5 text-white focus:outline-hidden focus:border-[#D97706]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#E5DCce] mb-0.5">
                    الوحدة أو الوزن <span className="text-[#D97706]">*</span>
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="250 غرام / 1 لتر"
                    className="w-full bg-[#151F19] border border-[#2B3C31] rounded-xl px-3 py-1.5 text-white focus:outline-hidden focus:border-[#D97706]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#E5DCce] mb-0.5">
                    السعر الحالي (DH) <span className="text-[#D97706]">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={price ?? ''}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-[#151F19] border border-[#2B3C31] rounded-xl px-3 py-1.5 text-white font-mono focus:outline-hidden focus:border-[#D97706]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#E5DCce] mb-0.5">
                    السعر القديم (DH - اختياري)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={oldPrice ?? ''}
                    onChange={(e) => setOldPrice(e.target.value)}
                    placeholder="95"
                    className="w-full bg-[#151F19] border border-[#2B3C31] rounded-xl px-3 py-1.5 text-white font-mono focus:outline-hidden focus:border-[#D97706]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <ImageUploadField
                    label="صورة المنتج"
                    value={image || ''}
                    onChange={setImage}
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#E5DCce] mb-0.5">
                    وصف المنتج وفوائده
                  </label>
                  <textarea
                    rows={2}
                    value={description ?? ''}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="وصف تفصيلي للمنتج..."
                    className="w-full bg-[#151F19] border border-[#2B3C31] rounded-xl px-3 py-1.5 text-white focus:outline-hidden focus:border-[#D97706]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#E5DCce] mb-0.5">الكمية في المخزون</label>
                  <input
                    type="number"
                    min="0"
                    value={stockCount ?? ''}
                    onChange={(e) => setStockCount(e.target.value)}
                    className="w-full bg-[#151F19] border border-[#2B3C31] rounded-xl px-3 py-1.5 text-white font-mono focus:outline-hidden focus:border-[#D97706]"
                  />
                </div>

                <div className="sm:col-span-2 flex flex-wrap items-center gap-4 pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStock}
                      onChange={(e) => setInStock(e.target.checked)}
                      className="w-4 h-4 accent-[#D97706]"
                    />
                    <span className="text-xs font-bold text-white">متوفر للبيع</span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isBestSeller}
                      onChange={(e) => setIsBestSeller(e.target.checked)}
                      className="w-4 h-4 accent-[#D97706]"
                    />
                    <span className="text-xs font-bold text-white">الأكثر طلباً</span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isNew}
                      onChange={(e) => setIsNew(e.target.checked)}
                      className="w-4 h-4 accent-[#D97706]"
                    />
                    <span className="text-xs font-bold text-white">منتج جديد</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 mt-3 border-t border-[#213027]">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#A89C89] hover:text-white bg-[#16221B] rounded-xl cursor-pointer disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-[#D97706] hover:bg-[#B45309] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSaving ? 'جاري الحفظ والربط مع السحابة...' : 'حفظ ونشر التغييرات'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      )}

      {/* Product Deletion Confirmation Dialog */}
      {productToDelete && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#121A15] border border-[#EF4444]/40 rounded-3xl p-6 max-w-md w-full shadow-2xl relative z-[100000] overflow-hidden">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#2D1515] border border-[#EF4444]/40 text-[#EF4444] flex items-center justify-center shrink-0 shadow-lg">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white font-['Cairo']">
                  تأكيد مسح المنتج
                </h3>
                <p className="text-xs text-[#FCA5A5] mt-0.5 font-bold">
                  واش فعلاً بغيتي تمسح هاد المنتج من المتجر؟
                </p>
              </div>
            </div>

            <div className="bg-[#17231B] border border-[#283B2F] rounded-2xl p-3 mb-4 flex items-center gap-3">
              {productToDelete.image && productToDelete.image.trim() !== '' ? (
                <img
                  src={formatImageUrl(productToDelete.image)}
                  alt={productToDelete.name}
                  className="w-14 h-14 rounded-xl object-cover border border-[#2F4437] shrink-0"
                  onError={handleImageError}
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-[#1D2A21] border border-[#2F4437] shrink-0 flex items-center justify-center text-[#D97706]">
                  <Package className="w-6 h-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white font-['Cairo'] truncate">
                  {productToDelete.name}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-[#A89C89]">
                  <span>{productToDelete.category}</span>
                  <span>•</span>
                  <span className="font-mono font-bold text-[#F59E0B]">{productToDelete.price} DH</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#2A1515]/60 border border-[#EF4444]/20 rounded-xl mb-5">
              <p className="text-[11px] text-[#FCA5A5] leading-relaxed">
                ⚠️ <strong>تنبيه:</strong> سيتم حذف هذا المنتج بشكل نهائي من المتجر وقاعدة البيانات ولن يظهر للزبائن مرة أخرى.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="flex-1 bg-[#1A261F] hover:bg-[#23332A] text-[#FAF5EC] font-bold py-2.5 rounded-xl text-xs border border-[#2F4437] transition-colors cursor-pointer"
              >
                إلغاء / تراجع
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold py-2.5 rounded-xl text-xs shadow-lg shadow-red-900/30 flex items-center justify-center gap-1.5 transition-transform hover:scale-101 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، مسح المنتج</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE PRODUCTS VIEW */}
      <div className="block sm:hidden space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="bg-[#101713] border border-[#213027] rounded-2xl p-8 text-center text-[#8A9B90] text-xs">
            لا توجد منتجات مطابقة لعملية البحث
          </div>
        ) : (
          filteredProducts.map((p) => {
            const rank = masterRankMap.get(p.id) || 1;
            const isTop20 = rank <= 20;
            const isFirst = rank === 1;
            const isLast = rank === orderedProducts.length;
            const isBusy = reorderingId === p.id;
            return (
              <div
                key={p.id}
                className="bg-[#101713] border border-[#213027] rounded-2xl p-3.5 space-y-3 shadow-md"
              >
                <div className="flex items-start gap-3">
                  {formatImageUrl(p.image) ? (
                    <img
                      src={formatImageUrl(p.image)}
                      alt={p.name}
                      className="w-16 h-16 rounded-xl object-cover border border-[#26372D] shrink-0 bg-[#0C120F]"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-[#0C120F] border border-[#26372D] shrink-0 flex items-center justify-center text-[#8A9B90]">
                      <Package className="w-6 h-6 text-[#D97706]/70" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md border shrink-0 ${
                            isTop20
                              ? 'bg-[#D97706]/20 text-[#F3BA63] border-[#D97706]/40'
                              : 'bg-[#16221B] text-[#8A9B90] border-[#26372D]'
                          }`}
                        >
                          #{rank}
                        </span>
                        <span className="text-[10px] text-[#D97706] font-bold truncate">{p.category}</span>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                          p.inStock
                            ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30'
                            : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30'
                        }`}
                      >
                        {p.inStock ? 'متوفر' : 'نفذ'}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-white font-['Cairo'] line-clamp-1 mt-0.5">
                      {p.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono font-black text-xs text-[#F59E0B]">{p.price} DH</span>
                      {p.oldPrice && (
                        <span className="line-through text-[10px] text-[#6B7870] font-mono">{p.oldPrice} DH</span>
                      )}
                      <span className="text-[10px] text-[#8A9B90]">/ {p.unit}</span>
                    </div>
                  </div>
                </div>

                {onMoveOrder && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1C2821]">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isFirst || isBusy}
                        onClick={() => handleMove(p, 0, `تم وضع "${p.name}" في أول القائمة (#1)!`)}
                        className="px-2.5 py-1.5 rounded-xl bg-[#D97706]/15 hover:bg-[#D97706] text-[#F3BA63] hover:text-white border border-[#D97706]/40 font-bold text-[11px] flex items-center gap-1 transition-colors disabled:opacity-35 cursor-pointer"
                        title="إرسال إلى أول القائمة (#1)"
                      >
                        <ChevronsUp className="w-3.5 h-3.5" />
                        <span>للأول</span>
                      </button>
                      <button
                        type="button"
                        disabled={isFirst || isBusy}
                        onClick={() => handleMove(p, rank - 2)}
                        className="p-1.5 rounded-xl bg-[#17241D] hover:bg-[#203127] text-white border border-[#2E4135] disabled:opacity-35 cursor-pointer"
                        aria-label="رفع درجة للأعلى"
                        title="رفع للأعلى"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isLast || isBusy}
                        onClick={() => handleMove(p, rank)}
                        className="p-1.5 rounded-xl bg-[#17241D] hover:bg-[#203127] text-white border border-[#2E4135] disabled:opacity-35 cursor-pointer"
                        aria-label="إنزال درجة للأسفل"
                        title="إنزال للأسفل"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-[#8A9B90]">الرقم:</span>
                      <input
                        type="number"
                        min={1}
                        max={orderedProducts.length}
                        value={rankInputs[p.id] ?? String(rank)}
                        onChange={(e) =>
                          setRankInputs((prev) => ({ ...prev, [p.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleJumpToRank(p);
                          }
                        }}
                        className="w-12 bg-[#151F19] border border-[#2B3C31] rounded-lg px-1.5 py-1 text-center text-xs font-mono text-white focus:outline-hidden focus:border-[#D97706]"
                        aria-label={`رقم ترتيب ${p.name}`}
                      />
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleJumpToRank(p)}
                        className="p-1.5 rounded-lg bg-[#1E3328] hover:bg-[#10B981] text-[#34D399] hover:text-white border border-[#10B981]/30 cursor-pointer disabled:opacity-40"
                        title="تطبيق رقم الترتيب"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[#1C2821] text-xs">
                  <span className="text-[#8A9B90] text-[11px]">
                    المخزون: <strong className="text-white font-mono">{p.stockCount ?? 50}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditForm(p)}
                      className="px-3 py-1.5 rounded-xl bg-[#17241D] hover:bg-[#203127] text-[#F3BA63] font-bold text-xs flex items-center gap-1.5 transition-colors border border-[#2E4135] active:scale-95"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductToDelete(p)}
                      className="px-3 py-1.5 rounded-xl bg-[#2A1515] hover:bg-[#3B1C1C] text-[#EF4444] font-bold text-xs flex items-center gap-1.5 transition-colors border border-[#EF4444]/30 active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>مسح</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP PRODUCTS VIEW */}
      <div className="hidden sm:block bg-[#101713] border border-[#213027] rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead>
              <tr className="text-[#8A9B90] bg-[#141D17] border-b border-[#213027]">
                {onMoveOrder && <th className="p-4 font-bold text-center">الترتيب</th>}
                <th className="p-4 font-bold">المنتج</th>
                <th className="p-4 font-bold">التصنيف</th>
                <th className="p-4 font-bold">السعر</th>
                <th className="p-4 font-bold">الوحدة</th>
                <th className="p-4 font-bold">المخزون</th>
                <th className="p-4 font-bold">الحالة</th>
                <th className="p-4 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#18231C]">
              {filteredProducts.map((p) => {
                const rank = masterRankMap.get(p.id) || 1;
                const isTop20 = rank <= 20;
                const isFirst = rank === 1;
                const isLast = rank === orderedProducts.length;
                const isBusy = reorderingId === p.id;
                return (
                  <tr key={p.id} className="hover:bg-[#141F18] transition-colors">
                    {onMoveOrder && (
                      <td className="p-3 align-middle">
                        <div className="flex flex-col items-center gap-1.5 min-w-[130px]">
                          <div className="flex items-center gap-1">
                            <span
                              className={`text-xs font-mono font-black px-2 py-0.5 rounded-md border ${
                                isTop20
                                  ? 'bg-[#D97706]/20 text-[#F3BA63] border-[#D97706]/40'
                                  : 'bg-[#16221B] text-[#8A9B90] border-[#26372D]'
                              }`}
                              title={isTop20 ? 'يظهر ضمن أول 20 منتجاً في الصفحة الرئيسية' : 'ترتيب العرض'}
                            >
                              #{rank}
                            </span>
                            {isTop20 && (
                              <span className="text-[9px] font-bold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 px-1.5 py-0.5 rounded-full">
                                أول 20
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={isFirst || isBusy}
                              onClick={() => handleMove(p, 0, `تم وضع "${p.name}" في أول القائمة (#1)!`)}
                              className="px-2 py-1 rounded-lg bg-[#D97706]/15 hover:bg-[#D97706] text-[#F3BA63] hover:text-white border border-[#D97706]/40 text-[10px] font-bold flex items-center gap-0.5 transition-colors disabled:opacity-35 cursor-pointer"
                              title="وضع في أول القائمة (#1)"
                            >
                              <ChevronsUp className="w-3 h-3" />
                              <span>للأول</span>
                            </button>
                            <button
                              type="button"
                              disabled={isFirst || isBusy}
                              onClick={() => handleMove(p, rank - 2)}
                              className="p-1 rounded-lg bg-[#17241D] hover:bg-[#203127] text-white border border-[#2E4135] disabled:opacity-35 cursor-pointer"
                              title="رفع للأعلى"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={isLast || isBusy}
                              onClick={() => handleMove(p, rank)}
                              className="p-1 rounded-lg bg-[#17241D] hover:bg-[#203127] text-white border border-[#2E4135] disabled:opacity-35 cursor-pointer"
                              title="إنزال للأسفل"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={1}
                              max={orderedProducts.length}
                              value={rankInputs[p.id] ?? String(rank)}
                              onChange={(e) =>
                                setRankInputs((prev) => ({ ...prev, [p.id]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleJumpToRank(p);
                                }
                              }}
                              className="w-12 bg-[#151F19] border border-[#2B3C31] rounded-md px-1 py-0.5 text-center text-[11px] font-mono text-white focus:outline-hidden focus:border-[#D97706]"
                              aria-label={`رقم ترتيب ${p.name}`}
                            />
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleJumpToRank(p)}
                              className="p-1 rounded-md bg-[#1E3328] hover:bg-[#10B981] text-[#34D399] hover:text-white border border-[#10B981]/30 cursor-pointer disabled:opacity-40"
                              title="نقل لهذا الرقم"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {formatImageUrl(p.image) ? (
                          <img
                            src={formatImageUrl(p.image)}
                            alt={p.name}
                            className="w-12 h-12 rounded-xl object-cover border border-[#26372D]"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-[#0C120F] border border-[#26372D] flex items-center justify-center text-[#8A9B90] shrink-0">
                            <Package className="w-5 h-5 text-[#D97706]/70" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-white font-['Cairo']">{p.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            {p.isBestSeller && (
                              <span className="text-[10px] bg-[#D97706]/20 text-[#F59E0B] px-1.5 py-0.2 rounded-sm font-bold">
                                الأكثر طلباً
                              </span>
                            )}
                            {p.isNew && (
                              <span className="text-[10px] bg-[#10B981]/20 text-[#10B981] px-1.5 py-0.2 rounded-sm font-bold">
                                جديد
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-[#C4B7A4]">{p.category}</td>
                    <td className="p-4 font-mono font-bold text-[#F59E0B]">
                      {p.price} DH
                      {p.oldPrice && (
                        <span className="line-through text-xs text-[#6B7870] mr-2">{p.oldPrice} DH</span>
                      )}
                    </td>
                    <td className="p-4 text-[#A89C89]">{p.unit}</td>
                    <td className="p-4 font-mono text-white">{p.stockCount ?? 50}</td>
                    <td className="p-4">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          p.inStock
                            ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30'
                            : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30'
                        }`}
                      >
                        {p.inStock ? 'متوفر' : 'غير متوفر'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(p)}
                          className="p-2 rounded-lg bg-[#17241D] hover:bg-[#203127] text-[#F3BA63] transition-colors cursor-pointer"
                          title="تعديل المنتج"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setProductToDelete(p)}
                          className="p-2 rounded-lg bg-[#2A1515] hover:bg-[#3B1C1C] text-[#EF4444] transition-colors cursor-pointer"
                          title="مسح المنتج"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
