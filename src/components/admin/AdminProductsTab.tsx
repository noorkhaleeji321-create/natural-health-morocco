import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import { Product, Category } from '../../types';
import { ImageUploadField } from './ImageUploadField';

interface AdminProductsTabProps {
  products: Product[];
  categories: Category[];
  onAdd: (p: Omit<Product, 'id'>) => Product;
  onUpdate: (id: string, updates: Partial<Product>) => void;
  onDelete: (id: string) => void;
  showNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminProductsTab: React.FC<AdminProductsTabProps> = ({
  products,
  categories,
  onAdd,
  onUpdate,
  onDelete,
  showNotification,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [debouncedSearchFilter, setDebouncedSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

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
  const [image, setImage] = useState('/assets/aistudio/aad8b4fe-64a3-4e47-89bd-93b688d4e9a1__1_daght_16fef5de.jpg');
  const [description, setDescription] = useState('');
  const [stockCount, setStockCount] = useState<number | string>(50);
  const [inStock, setInStock] = useState(true);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const openNewForm = () => {
    setEditingProduct(null);
    setName('');
    setCategory(categories[0]?.name || 'التوابل المغربية');
    setPrice(50);
    setOldPrice('');
    setUnit('250 غرام');
    setImage('/assets/aistudio/aad8b4fe-64a3-4e47-89bd-93b688d4e9a1__1_daght_16fef5de.jpg');
    setDescription('');
    setStockCount(50);
    setInStock(true);
    setIsBestSeller(false);
    setIsNew(true);
    setIsFormOpen(true);
  };

  const openEditForm = (p: Product) => {
    setEditingProduct(p);
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showNotification('يرجى إدخال اسم المنتج', 'error');
      return;
    }
    if (!image.trim()) {
      showNotification('يرجى رفع أو إدخال صورة للمنتج', 'error');
      return;
    }

    if (editingProduct) {
      onUpdate(editingProduct.id, {
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
      showNotification(`تم تعديل المنتج "${name}" بنجاح!`);
    } else {
      onAdd({
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
      showNotification(`تمت إضافة المنتج الجديد "${name}" إلى المتجر!`);
    }

    setIsFormOpen(false);
  };

  const confirmDelete = () => {
    if (!productToDelete) return;
    onDelete(productToDelete.id);
    showNotification(`تم مسح المنتج "${productToDelete.name}" بنجاح.`);
    setProductToDelete(null);
  };

  const filteredProducts = products.filter((p) => {
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

      {/* Product Edit / Create Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#101713] border border-[#2E4135] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#213027] mb-4 sticky top-0 bg-[#101713] z-10">
              <h3 className="text-base sm:text-lg font-black text-white font-['Cairo'] flex items-center gap-2">
                <Package className="w-5 h-5 text-[#D97706]" />
                <span>{editingProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد للمتجر'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="w-8 h-8 rounded-full bg-[#18231C] text-[#8A9B90] hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#E5DCce] mb-1">
                    اسم المنتج <span className="text-[#D97706]">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: زعفران حر أطلسي تالوين"
                    className="w-full bg-[#151F19] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:border-[#D97706]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#E5DCce] mb-1">التصنيف</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#151F19] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:border-[#D97706]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#E5DCce] mb-1">
                    الوحدة أو الوزن <span className="text-[#D97706]">*</span>
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="250 غرام / 1 لتر / عبوة 100 غرام"
                    className="w-full bg-[#151F19] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:border-[#D97706]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#E5DCce] mb-1">
                    السعر الحالي (DH) <span className="text-[#D97706]">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={price ?? ''}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-[#151F19] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-hidden focus:border-[#D97706]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#E5DCce] mb-1">
                    السعر القديم قبل الخصم (DH - اختياري)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={oldPrice ?? ''}
                    onChange={(e) => setOldPrice(e.target.value)}
                    placeholder="مثال: 95"
                    className="w-full bg-[#151F19] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-hidden focus:border-[#D97706]"
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
                  <label className="block text-xs font-bold text-[#E5DCce] mb-1">
                    وصف المنتج وفوائده
                  </label>
                  <textarea
                    rows={3}
                    value={description ?? ''}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="وصف تفصيلي للمنتج وطرق استخدامه وفوائده الصحية..."
                    className="w-full bg-[#151F19] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:border-[#D97706]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#E5DCce] mb-1">الكمية في المخزون</label>
                  <input
                    type="number"
                    min="0"
                    value={stockCount ?? ''}
                    onChange={(e) => setStockCount(e.target.value)}
                    className="w-full bg-[#151F19] border border-[#2B3C31] rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-hidden focus:border-[#D97706]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-3 sm:pt-5">
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

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#213027] sticky bottom-0 bg-[#101713]">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold text-[#A89C89] hover:text-white bg-[#16221B] rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none bg-[#D97706] hover:bg-[#B45309] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg cursor-pointer active:scale-95"
                >
                  حفظ ونشر التغييرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Deletion Confirmation Dialog */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#121A15] border border-[#EF4444]/40 rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden">
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
              <img
                src={productToDelete.image}
                alt={productToDelete.name}
                className="w-14 h-14 rounded-xl object-cover border border-[#2F4437] shrink-0"
              />
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
          filteredProducts.map((p) => (
            <div
              key={p.id}
              className="bg-[#101713] border border-[#213027] rounded-2xl p-3.5 space-y-3 shadow-md"
            >
              <div className="flex items-start gap-3">
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-16 h-16 rounded-xl object-cover border border-[#26372D] shrink-0 bg-[#0C120F]"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] text-[#D97706] font-bold truncate">{p.category}</span>
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
          ))
        )}
      </div>

      {/* DESKTOP PRODUCTS VIEW */}
      <div className="hidden sm:block bg-[#101713] border border-[#213027] rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead>
              <tr className="text-[#8A9B90] bg-[#141D17] border-b border-[#213027]">
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
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-[#141F18] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-12 h-12 rounded-xl object-cover border border-[#26372D]"
                      />
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
