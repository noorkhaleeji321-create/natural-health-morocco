import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Product,
  Category,
  Order,
  Customer,
  BankSettings,
  StoreSettings,
  HeroSlide,
  OrderStatus,
  PaymentMethod,
  Seller,
  StoreEntity,
  SellerStatus,
  ProductStatus,
  SellerApplicationRequest,
} from '../types';
import {
  allProducts as initialProducts,
  categories as initialCategories,
  initialHeroSlides,
  storeInfo,
  defaultSellers,
  defaultStores,
} from '../data/storeData';
import { safeSetItem, safeGetItem } from '../utils/storage';
import { api } from '../lib/api';
// Disabled Firebase integration completely - purely using local server database
const isFirebaseConfigured = () => false;



interface StoreContextType {
  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Categories
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Hero Slides
  heroSlides: HeroSlide[];
  updateHeroSlides: (slides: HeroSlide[]) => Promise<boolean> | void;

  // Orders
  orders: Order[];
  createOrder: (orderData: Omit<Order, 'id' | 'createdAt'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  findOrderByTracking: (orderId: string, phone: string) => Order | undefined;

  // Customers & Auth
  customers: Customer[];
  currentUser: Customer | null;
  registerCustomer: (data: Omit<Customer, 'id' | 'createdAt'>) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  loginCustomer: (phoneOrEmail: string, password?: string) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  logoutCustomer: () => void;
  updateCustomerProfile: (updates: Partial<Customer>) => void;

  // Bank / RIB Settings
  bankSettings: BankSettings;
  updateBankSettings: (updates: Partial<BankSettings>) => void;

  // Store Settings
  storeSettings: StoreSettings;
  updateStoreSettings: (updates: Partial<StoreSettings>) => void;

  // Multi-Vendor Marketplace
  sellers: Seller[];
  stores: StoreEntity[];
  currentSeller: Seller | null;
  currentStore: StoreEntity | null;
  activeStoreSlug: string | null;
  setActiveStoreSlug: (slug: string | null) => void;
  applyToBecomeSeller: (data: SellerApplicationRequest) => Promise<{ success: boolean; message?: string; error?: string }>;
  updateSellerStatus: (sellerId: string, status: SellerStatus, reason?: string) => Promise<{ success: boolean; error?: string }>;
  updateStoreDetails: (storeId: string, updates: Partial<StoreEntity>) => Promise<{ success: boolean; error?: string }>;
  addSellerProduct: (product: Partial<Product>) => Promise<{ success: boolean; product?: Product; error?: string }>;
  updateSellerProduct: (productId: string, updates: Partial<Product>) => Promise<{ success: boolean; product?: Product; error?: string }>;
  deleteSellerProduct: (productId: string) => Promise<{ success: boolean; error?: string }>;
  approveProduct: (productId: string, status: ProductStatus, reason?: string) => Promise<{ success: boolean; error?: string }>;
  getSellerOrders: (sellerId?: string) => Promise<Order[]>;
  refreshMarketplace: () => Promise<void>;
  loginAsSeller: (sellerId: string) => void;

  // Admin Auth
  isAdminAuthenticated: boolean;
  adminLogin: (pin: string) => boolean | Promise<boolean>;
  adminLogout: () => void;

  refreshData: () => Promise<boolean>;
  addOrderToLocal: (order: Order) => void;

  // AIWebCrafter Dedicated Cloud API
  getStoreProducts: (categorySlug?: string | null, page?: number) => Promise<any>;
  submitOrderToAIWebCrafter: (cart: any) => Promise<any>;
  aiwebcrafterSynced: boolean;

  // Defaults Reset
  resetToDefaults: () => void;
}

const defaultBankSettings: BankSettings = {
  bankName: 'التجاري وفا بنك (Attijariwafa Bank)',
  accountHolder: 'سعيد أيت علي (Said Ait Ali)',
  rib: '007 640 0001234567890123 45',
  instructions: 'يرجى اختيار طريقة الدفع المناسبة: الدفع نقداً عند الاستلام، البطاقة البنكية، بايبال، أو التحويل البنكي.',
  isBankTransferEnabled: true,
  isCodEnabled: true,
  isCardEnabled: true,
  isPaypalEnabled: true,
  paymentMode: 'sandbox',
  paddleVendorId: '',
  paddleClientToken: import.meta.env.VITE_PADDLE_CLIENT_TOKEN || '',
  paddleApiKey: '',
  cardPublishableKey: import.meta.env.VITE_PADDLE_CLIENT_TOKEN || '',
  cardSecretKey: '',
  paypalClientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || '',
  paypalClientSecret: '',
};

const defaultStoreSettings: StoreSettings = {
  storeName: storeInfo.name,
  storeSlogan: 'أعشاب وزيوت طبيعية أصيلة 100% مستخلصة بعناية وجودة عالية',
  logoUrl: '/assets/aistudio/WhatsApp_Image_2026-10-28_at_19.35.25_6c594579.jpeg',
  phone: storeInfo.phone,
  whatsapp: storeInfo.whatsapp,
  address: storeInfo.address,
  city: 'مراكش',
  openingHours: storeInfo.hours,
  email: 'contact@saidstore.ma',
  freeShippingThreshold: 250,
  shippingFee: 35,
  currency: 'DH',
  announcementText: '🌿 مرحباً بكم في natural-morocco — توصيل سريع لجميع المدن المغربية 🇲🇦 وخصم خاص للطلبات فوق 250 درهم!',
  adminPin: '',
  aboutImageUrl: '/assets/aistudio/WhatsApp_Image_2026-10-27_at_09.50.47_daghta_5b75ff5a.jpeg',
  aboutBadgeYears: '25+',
  aboutBadgeTitle: 'سنة من العطاء والأمانة',
  aboutBadgeSubtitle: 'خدمة العائلات بأجود أنواع العطارة',
  aboutStoryP1: 'تأسس محل عند سعيد من قلب دروب وأسواق المغرب العريقة، بهدف الحفاظ على سر العطارة المغربية الأصيلة وتوفير أجود ما تجود به أرضنا الطيبة من أعشاب علاجية، عسل حر نقي، وتوابل ملكية منتقاة حبة بحبة.',
  aboutStoryP2: 'نعمل بتعاون مباشر مع أمهر النحّالين في جبال الأطلس، وتعاونيات النساء في سوس لإنتاج زيت الأركان البكر المعصور على البارد، ومزارعي تالوين لقطف الزعفران الحر. نضمن لكم منتجات طبيعية 100% بدون أي إضافات كيميائية أو مواد حافظة، مع تقديم النصيحة الصادقة لكل زبون كما عهدتمونا دائماً.',
  showHeroSlider: true,
};

const defaultCustomers: Customer[] = [];

const defaultOrders: Order[] = [];

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const LOCAL_STORAGE_KEYS = {
  PRODUCTS: 'said_store_products_v2',
  CATEGORIES: 'said_store_categories_v2',
  HERO_SLIDES: 'said_store_hero_slides_v2',
  ORDERS: 'said_store_orders_v2',
  CUSTOMERS: 'said_store_customers_v2',
  CURRENT_USER: 'said_store_current_user_v2',
  BANK_SETTINGS: 'said_store_bank_settings_v2',
  STORE_SETTINGS: 'said_store_settings_v2',
  ADMIN_AUTH: 'said_store_admin_auth_v2',
  SELLERS: 'said_store_sellers_v2',
  STORES: 'said_store_stores_v2',
};

// -------------------------------------------------------------
// AIWebCrafter Store Connector (ES6 / Browser or Node.js)
// Dedicated Cloud Database & Storage API for Your Existing Store
// -------------------------------------------------------------
export const AWC_CONFIG = {
  endpoint: "https://www.aiwebcrafter.com/api/v1",
  proxyEndpoint: "/api/proxy",
  apiKey: "awc_live_9f82d1c9e472"
};

// 1. Fetch Published Products Catalog from AIWebCrafter Cloud (Proxy First, Direct Fallback)
export async function getStoreProducts(categorySlug: string | null = null, page = 1) {
  // Try Backend Proxy route first to avoid CORS and protect API key
  try {
    const proxyUrl = new URL(AWC_CONFIG.proxyEndpoint + '/products', window.location.origin);
    if (categorySlug) proxyUrl.searchParams.set('category', categorySlug);
    proxyUrl.searchParams.set('page', page.toString());

    const proxyRes = await fetch(proxyUrl.toString(), {
      headers: { 'Accept': 'application/json' }
    });
    if (proxyRes.ok) {
      const result = await proxyRes.json();
      if (result && (result.data || result.success || Array.isArray(result))) {
        return result.data || result;
      }
    }
  } catch (proxyErr) {
    // Continue to direct fallback
  }

  // Fallback: Direct call to AIWebCrafter endpoint
  try {
    const url = new URL(`${AWC_CONFIG.endpoint}/products`);
    if (categorySlug) url.searchParams.set('category', categorySlug);
    url.searchParams.set('page', page.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'X-AWC-API-KEY': AWC_CONFIG.apiKey,
        'X-AWC-STOREFRONT-KEY': AWC_CONFIG.apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success && !result.data) throw new Error(result.error || 'Failed to fetch AIWebCrafter products');
    return result.data || result;
  } catch (err: any) {
    console.warn('[StoreContext - AIWebCrafter] getStoreProducts notice:', err.message);
    return null;
  }
}

// 2. Submit Customer Checkout Order to AIWebCrafter Cloud (Proxy First, Direct Fallback)
export async function submitOrderToAIWebCrafter(cart: any) {
  const payload = {
    customer_name: cart.customer?.fullName || cart.customer?.name || cart.customer_name || 'الزبون',
    customer_phone: cart.customer?.phone || cart.customer_phone || '',
    customer_email: cart.customer?.email || cart.customer_email || '',
    shipping_address: cart.customer?.address || cart.shipping_address || '',
    city: cart.customer?.city || cart.city || 'المغرب',
    payment_method: cart.paymentMethod || cart.payment_method || 'Cash On Delivery (COD)',
    items: (cart.items || []).map((item: any) => ({
      product_id: item.id || item.productId || item.product_id,
      product_name: item.name || item.productName || item.productNameSnapshot || item.product?.name || 'منتج',
      sku: item.sku || `SKU-${item.id || item.productId || item.product_id}`,
      unit_price: Number(item.price || item.unitPrice || item.unit_price || item.product?.price || 0),
      quantity: Number(item.qty || item.quantity || 1)
    })),
    notes: cart.notes || cart.customer?.notes || ''
  };

  // Try Backend Proxy route first
  try {
    const proxyRes = await fetch(`${AWC_CONFIG.proxyEndpoint}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Idempotency-Key': `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      },
      body: JSON.stringify(payload)
    });
    if (proxyRes.ok) {
      const result = await proxyRes.json();
      return result;
    }
  } catch (proxyErr) {
    // Continue to direct fallback
  }

  // Fallback: Direct call to AIWebCrafter
  try {
    const response = await fetch(`${AWC_CONFIG.endpoint}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AWC-API-KEY': AWC_CONFIG.apiKey,
        'X-AWC-STOREFRONT-KEY': AWC_CONFIG.apiKey,
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    return result;
  } catch (err: any) {
    console.warn('[StoreContext - AIWebCrafter] submitOrderToAIWebCrafter notice (offline/queued):', err.message);
    return { success: false, error: err.message, isOfflineQueued: true };
  }
}

export const mapAIWebCrafterProduct = (item: any, idx: number): Product => {
  const id = String(item.id || item.product_id || `prod-awc-${idx + 1}`);
  return {
    id,
    name: item.name || item.product_name || item.title || 'منتج طبيعي',
    category: item.category || item.category_name || 'المنتجات الطبيعية الصحراوية',
    price: Number(item.price || item.unit_price || 0),
    oldPrice: item.old_price ? Number(item.old_price) : (item.compareAtPrice ? Number(item.compareAtPrice) : undefined),
    unit: item.unit || item.weight || '250 غرام',
    inStock: item.inStock !== false && item.in_stock !== false && (item.stockCount ?? item.stock_count ?? 1) > 0,
    stockCount: Number(item.stockCount ?? item.stock_count ?? 50),
    rating: Number(item.rating || 5.0),
    reviewsCount: Number(item.reviewsCount || item.reviews || 40),
    isBestSeller: Boolean(item.isBestSeller ?? item.is_best_seller ?? (idx < 4)),
    isNew: Boolean(item.isNew ?? item.is_new ?? false),
    image: item.image || item.image_url || (Array.isArray(item.images) && item.images[0]) || '/assets/aistudio/aad8b4fe-64a3-4e47-89bd-93b688d4e9a1__1_daght_16fef5de.jpg',
    images: Array.isArray(item.images) ? item.images : undefined,
    description: item.description || item.product_description || 'منتج طبيعي أصيل 100% مستخلص بعناية وجودة عالية.',
    sellerId: item.sellerId || item.seller_id || 'seller-natural-morocco',
    storeId: item.storeId || item.store_id || 'store-natural-morocco',
    sellerName: item.sellerName || item.seller_name || 'natural-morocco',
    storeName: item.storeName || item.store_name || 'natural-morocco',
    storeSlug: item.storeSlug || item.store_slug || 'natural-morocco',
    status: 'approved' as ProductStatus,
    createdAt: item.createdAt || item.created_at || new Date().toISOString(),
  };
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Products (Clean out any legacy demo / fake template products)
  const [products, setProducts] = useState<Product[]>(() => {
    const cached = safeGetItem<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, []);
    const clean = cached.filter(
      (p) =>
        p &&
        p.id &&
        !/^(sp-|sp-wellness|oil-|hr-|care-|sd-|hn-|tpl-|demo-)/.test(p.id) &&
        !['tpl-1', 'tpl-2', 'tpl-3', 'tpl-4', 'tpl-5', 'tpl-6'].includes(p.id)
    );
    if (clean.length !== cached.length) {
      safeSetItem(LOCAL_STORAGE_KEYS.PRODUCTS, clean);
    }
    return clean.length > 0 ? clean : initialProducts;
  });

  // 2. Categories
  const [categories, setCategories] = useState<Category[]>(() => {
    return safeGetItem<Category[]>(LOCAL_STORAGE_KEYS.CATEGORIES, initialCategories);
  });

  // 3. Hero Slides (Strictly protected in /public/assets/aistudio/ - 0 Firebase quota consumption)
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(() => {
    const cached = safeGetItem<HeroSlide[]>(LOCAL_STORAGE_KEYS.HERO_SLIDES, initialHeroSlides);
    if (Array.isArray(cached) && cached.length === 5 && cached.every((s) => s.image && s.image.includes('/assets/aistudio/'))) {
      return cached;
    }
    safeSetItem(LOCAL_STORAGE_KEYS.HERO_SLIDES, initialHeroSlides);
    return initialHeroSlides;
  });

  // 4. Orders
  const [orders, setOrders] = useState<Order[]>(() => {
    return safeGetItem<Order[]>(LOCAL_STORAGE_KEYS.ORDERS, defaultOrders);
  });

  // 5. Customers
  const [customers, setCustomers] = useState<Customer[]>(() => {
    return safeGetItem<Customer[]>(LOCAL_STORAGE_KEYS.CUSTOMERS, defaultCustomers);
  });

  // 6. Current Logged In Customer
  const [currentUser, setCurrentUser] = useState<Customer | null>(() => {
    return safeGetItem<Customer | null>(LOCAL_STORAGE_KEYS.CURRENT_USER, null);
  });

  // 7. Bank Settings
  const [bankSettings, setBankSettings] = useState<BankSettings>(() => {
    const saved = safeGetItem<BankSettings | null>(LOCAL_STORAGE_KEYS.BANK_SETTINGS, null);
    return saved ? { ...defaultBankSettings, ...saved } : defaultBankSettings;
  });

  // 8. Store Settings
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    const saved = safeGetItem<StoreSettings | null>(LOCAL_STORAGE_KEYS.STORE_SETTINGS, null);
    return saved
      ? { ...defaultStoreSettings, ...saved, showHeroSlider: saved.showHeroSlider !== false }
      : defaultStoreSettings;
  });

  // 9. Marketplace Sellers & Stores
  const [sellers, setSellers] = useState<Seller[]>(() => {
    return safeGetItem<Seller[]>('said_store_sellers_v2', defaultSellers);
  });

  const [stores, setStores] = useState<StoreEntity[]>(() => {
    return safeGetItem<StoreEntity[]>('said_store_stores_v2', defaultStores);
  });

  const [activeStoreSlug, setActiveStoreSlug] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    safeSetItem('said_store_sellers_v2', sellers);
  }, [sellers]);

  useEffect(() => {
    safeSetItem('said_store_stores_v2', stores);
  }, [stores]);

  // Reactive Current Seller & Store derived from logged in user
  const currentSeller = useMemo(() => {
    if (!currentUser) return null;
    const cleanUserPhone = (currentUser.phone || '').replace(/\s+/g, '');
    return (
      sellers.find(
        (s) =>
          s.userId === currentUser.id ||
          (cleanUserPhone && s.phone.replace(/\s+/g, '') === cleanUserPhone) ||
          s.id === currentUser.sellerId
      ) || null
    );
  }, [currentUser, sellers]);

  const currentStore = useMemo(() => {
    if (!currentSeller) return null;
    return stores.find((st) => st.sellerId === currentSeller.id || st.id === currentSeller.storeId) || null;
  }, [currentSeller, stores]);

  // 10. Admin Authentication
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(LOCAL_STORAGE_KEYS.ADMIN_AUTH) === 'true';
    } catch {
      return false;
    }
  });

  // 11. AIWebCrafter Cloud Sync Status
  const [aiwebcrafterSynced, setAiwebcrafterSynced] = useState<boolean>(true);



const mergeOrders = (listA: Order[], listB: Order[]): Order[] => {
  const map = new Map<string, Order>();
  (listA || []).forEach((o) => {
    if (o && o.id) map.set(o.id, o);
  });
  (listB || []).forEach((o) => {
    if (o && o.id) {
      const existing = map.get(o.id);
      if (!existing) {
        map.set(o.id, o);
      } else {
        const timeA = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
        const timeB = new Date(o.updatedAt || o.createdAt || 0).getTime();
        map.set(o.id, timeB >= timeA ? { ...existing, ...o } : { ...o, ...existing });
      }
    }
  });
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
};

  // Connect to AIWebCrafter API and directly replace local products with server response
  const fetchAIWebCrafterProducts = useCallback(async (categorySlug: string | null = null, page = 1): Promise<any> => {
    try {
      const res = await getStoreProducts(categorySlug, page);
      if (res) {
        const rawItems = Array.isArray(res.items)
          ? res.items
          : (Array.isArray(res.data?.items)
              ? res.data.items
              : (Array.isArray(res.data)
                  ? res.data
                  : (Array.isArray(res) ? res : [])));

        if (rawItems.length > 0) {
          const serverProducts: Product[] = rawItems
            .map((item: any, idx: number) => mapAIWebCrafterProduct(item, idx))
            .filter((p: Product) => 
              p.id &&
              !/^(sp-|sp-wellness|oil-|hr-|care-|sd-|hn-|tpl-|demo-)/.test(p.id) &&
              !['tpl-1', 'tpl-2', 'tpl-3', 'tpl-4', 'tpl-5', 'tpl-6'].includes(p.id)
            );

          if (serverProducts.length > 0) {
            // استبدال البيانات المحلية للمنتجات مباشرة بالاستجابة المباشرة من خادم AIWebCrafter
            setProducts(serverProducts);
            safeSetItem(LOCAL_STORAGE_KEYS.PRODUCTS, serverProducts);
            setAiwebcrafterSynced(true);
            return { success: true, items: serverProducts, data: { items: serverProducts } };
          }
        }
      }
      return res;
    } catch (err: any) {
      console.warn('[StoreContext] Error fetching server products from AIWebCrafter:', err.message);
      return null;
    }
  }, []);

  // Reload all data from Server REST API (replacing local products directly with server response)
  const loadFromServer = useCallback(async (): Promise<boolean> => {
    try {
      // 1. Direct Cloud Connection to AIWebCrafter API - replacing local products directly
      try {
        await fetchAIWebCrafterProducts();
      } catch (awcErr: any) {
        console.warn('[StoreContext] AIWebCrafter cloud query notice:', awcErr.message);
      }

      const data = await api.getBootstrap();
      if (data) {
        // Fallback to bootstrap products if store products haven't loaded yet
        if (data.products && data.products.length > 0) {
          const cleanServerProducts = data.products.filter(
            (p: any) =>
              p &&
              p.id &&
              !/^(sp-|sp-wellness|oil-|hr-|care-|sd-|hn-|tpl-|demo-)/.test(p.id) &&
              !['tpl-1', 'tpl-2', 'tpl-3', 'tpl-4', 'tpl-5', 'tpl-6'].includes(p.id)
          );
          setProducts((prev) => (prev && prev.length > 0 ? prev : cleanServerProducts));
        }

        if (data.categories && data.categories.length > 0) {
          setCategories((prev) => (data.categories.length >= prev.length ? data.categories : prev));
        }
        if (data.orders && Array.isArray(data.orders)) {
          setOrders((prev) => mergeOrders(prev, data.orders));
        }
        if (data.customers) {
          setCustomers((prev) => {
            const serverIds = new Set(data.customers.map((c: any) => c.id));
            const onlyLocal = prev.filter(c => !serverIds.has(c.id));
            return [...data.customers, ...onlyLocal];
          });
        }
        if (data.sellers && data.sellers.length > 0) {
          setSellers((prev) => {
             const serverIds = new Set(data.sellers.map((s: any) => s.id));
             const onlyLocal = prev.filter(s => !serverIds.has(s.id));
             return [...data.sellers, ...onlyLocal];
          });
        }
        if (data.stores && data.stores.length > 0) {
          setStores((prev) => {
            const serverIds = new Set(data.stores.map((s: any) => s.id));
            const onlyLocal = prev.filter(s => !serverIds.has(s.id));
            return [...data.stores, ...onlyLocal];
          });
        }
        
        // Settings are singular, server wins if configured
        if (data.bankSettings) {
          setBankSettings((prev) => ({ ...prev, ...data.bankSettings }));
        }
        if (data.storeSettings) {
          setStoreSettings((prev) => ({ ...prev, ...data.storeSettings }));
        }
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Local database is running offline (Server sync skipped):', err);
      return false;
    }
  }, []);



  // Sync on Mount, periodically, and on tab focus
  useEffect(() => {
    const initAndLoad = async () => {
      // 1. Load instantly from Node.js Express Server REST API
      await loadFromServer();
    };
    initAndLoad();

    // 2. Periodically refresh from server REST API every 3 minutes (lightweight, zero Firebase quota cost)
    const pollTimer = setInterval(() => {
      loadFromServer();
    }, 180000);

    // 3. Refresh from server when user tabs back into the store
    const handleFocus = () => {
      loadFromServer();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(pollTimer);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadFromServer]);

  // Manual Sync helper (Deprecated)
  const syncWithFirebase = async (): Promise<{ success: boolean; count: number; message: string }> => {
    return { success: false, count: 0, message: 'ميزة Firebase غير مفعلة حالياً.' };
  };

  // Sync to LocalStorage safely on changes
  useEffect(() => {
    safeSetItem(LOCAL_STORAGE_KEYS.PRODUCTS, products);
  }, [products]);

  useEffect(() => {
    safeSetItem(LOCAL_STORAGE_KEYS.CATEGORIES, categories);
  }, [categories]);

  useEffect(() => {
    safeSetItem(LOCAL_STORAGE_KEYS.HERO_SLIDES, heroSlides);
  }, [heroSlides]);

  useEffect(() => {
    safeSetItem(LOCAL_STORAGE_KEYS.ORDERS, orders);
  }, [orders]);

  useEffect(() => {
    safeSetItem(LOCAL_STORAGE_KEYS.CUSTOMERS, customers);
  }, [customers]);

  useEffect(() => {
    safeSetItem(LOCAL_STORAGE_KEYS.CURRENT_USER, currentUser);
  }, [currentUser]);

  useEffect(() => {
    safeSetItem(LOCAL_STORAGE_KEYS.BANK_SETTINGS, bankSettings);
  }, [bankSettings]);

  useEffect(() => {
    safeSetItem(LOCAL_STORAGE_KEYS.STORE_SETTINGS, storeSettings);
  }, [storeSettings]);

  useEffect(() => {
    safeSetItem(LOCAL_STORAGE_KEYS.SELLERS, sellers);
  }, [sellers]);

  useEffect(() => {
    safeSetItem(LOCAL_STORAGE_KEYS.STORES, stores);
  }, [stores]);

  // Product Actions
  const addProduct = (productData: Omit<Product, 'id'>): Product => {
    const newId = `prod-${Date.now()}`;
    const newProduct: Product = {
      ...productData,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    
    // 1. Update local state immediately for UI responsiveness
    setProducts((prev) => [newProduct, ...prev]);

    // 2. Persist in Backend API
    api.addProduct(newProduct).catch(err => console.error('API addProduct failed:', err));



    setCategories((prev) =>
      prev.map((c) =>
        c.name === newProduct.category || c.slug === newProduct.category
          ? { ...c, count: (c.count || 0) + 1 }
          : c
      )
    );

    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      const target = updated.find((p) => p.id === id);
      if (target) {
        // Sync to Backend
        api.updateProduct(id, target).catch(err => console.error('API updateProduct failed:', err));
        

      }
      return updated;
    });
  };

  const deleteProduct = (id: string) => {
    const toDelete = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    
    // Sync to Backend
    api.deleteProduct(id).catch(err => console.error('API deleteProduct failed:', err));


    
    if (toDelete) {
      setCategories((prev) =>
        prev.map((c) =>
          c.name === toDelete.category || c.slug === toDelete.category
            ? { ...c, count: Math.max(0, (c.count || 0) - 1) }
            : c
        )
      );
    }
  };

  // Category Actions
  const addCategory = (categoryData: Omit<Category, 'id'>): Category => {
    const newCategory: Category = {
      ...categoryData,
      id: `cat-${Date.now()}`,
      count: categoryData.count || 0,
    };
    setCategories((prev) => [...prev, newCategory]);
    
    api.addCategory(newCategory);


    return newCategory;
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
      const target = updated.find((c) => c.id === id);
      if (target) {
        api.updateCategory(id, target);

      }
      return updated;
    });
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    api.deleteCategory(id);

  };

  // Hero Slides
  const updateHeroSlides = async (slides: HeroSlide[]): Promise<boolean> => {
    setHeroSlides(slides);
    safeSetItem(LOCAL_STORAGE_KEYS.HERO_SLIDES, slides);
    api.updateHeroSlides(slides);
    return true;
  };

  // Orders Actions
  const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt'>): Promise<Order> => {
    const newOrder: Order = {
      ...orderData,
      id: `SAID-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      bankDetailsSnapshot:
        orderData.paymentMethod === 'bank_transfer'
          ? {
              bankName: bankSettings.bankName,
              accountHolder: bankSettings.accountHolder,
              rib: bankSettings.rib,
            }
          : undefined,
    };

    if (currentUser) {
      newOrder.customerId = currentUser.id;
    }

    // 1. Submit Directly to AIWebCrafter Dedicated Cloud Database
    try {
      const awcRes = await submitOrderToAIWebCrafter({
        customer: {
          name: newOrder.customer?.fullName || 'الزبون المحترم',
          phone: newOrder.customer?.phone || '',
          email: newOrder.customer?.email || '',
          address: newOrder.customer?.address || '',
          city: newOrder.customer?.city || 'المغرب',
        },
        paymentMethod: newOrder.paymentMethod,
        items: (newOrder.items || []).map((it: any) => ({
          id: it.productId || it.product?.id || it.id,
          name: it.productNameSnapshot || it.product?.name || 'منتج',
          sku: `SKU-${it.productId || it.product?.id || it.id}`,
          price: it.unitPrice || it.product?.price || 0,
          qty: it.quantity || 1,
        })),
        notes: newOrder.notes || newOrder.customer?.notes || '',
      });

      if (awcRes && (awcRes.success || awcRes.order_id || awcRes.id)) {
        newOrder.aiwebcrafterSynced = true;
        newOrder.aiwebcrafterOrderId = awcRes.order_id || awcRes.id || awcRes.data?.order_id || awcRes.data?.id;
        setAiwebcrafterSynced(true);
      }
    } catch (err: any) {
      console.warn('[StoreContext] submitOrderToAIWebCrafter cloud sync notice:', err.message);
    }

    // 2. Update local state immediately with synced order
    setOrders((prev) => {
      const merged = mergeOrders(prev, [newOrder]);
      safeSetItem(LOCAL_STORAGE_KEYS.ORDERS, merged);
      return merged;
    });

    // 3. Persist to shared backend
    try {
      await api.createOrder(newOrder);
    } catch (err: any) {
      console.warn('[StoreContext] Failed to sync new order to server:', err.message);
    }

    return newOrder;
  };

  const addOrderToLocal = (order: Order) => {
    setOrders((prev) => {
      const merged = mergeOrders(prev, [order]);
      safeSetItem(LOCAL_STORAGE_KEYS.ORDERS, merged);
      return merged;
    });


  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, note?: string) => {
    // 1. Update local state immediately for UI responsiveness
    setOrders((prev) => {
      const updated = prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              statusNote: note !== undefined ? note : o.statusNote,
              updatedAt: new Date().toISOString(),
            }
          : o
      );
      safeSetItem(LOCAL_STORAGE_KEYS.ORDERS, updated);
      return updated;
    });

    // 2. Sync to Backend API
    try {
      const updatedOrder = await api.updateOrderStatus(orderId, status, note);
      

    } catch (err: any) {
      console.warn('[StoreContext] Failed to sync order status to server:', err.message);
      // We don't revert local state because we want the app to feel fast/offline-capable
    }
  };

  const deleteOrder = async (orderId: string) => {
    // 1. Update local state
    setOrders((prev) => {
      const filtered = prev.filter((o) => o.id !== orderId);
      safeSetItem(LOCAL_STORAGE_KEYS.ORDERS, filtered);
      return filtered;
    });

    // 2. Sync to Backend
    try {
      await api.deleteOrder(orderId);
      

    } catch (err: any) {
      console.warn('[StoreContext] Failed to delete order from server:', err.message);
    }
  };

  const findOrderByTracking = (orderId: string, phone: string): Order | undefined => {
    const cleanOrderId = orderId.trim().toUpperCase().replace('#', '');
    const cleanPhone = phone.trim().replace(/[\s-+]/g, '');

    return orders.find((o) => {
      const oId = o.id.toUpperCase().replace('#', '');
      const oPhone = o.customer.phone.replace(/[\s-+]/g, '');
      const matchId = oId === cleanOrderId || oId.endsWith(cleanOrderId);
      const matchPhone = oPhone.endsWith(cleanPhone) || cleanPhone.endsWith(oPhone);
      return matchId && matchPhone;
    });
  };

  // Customer & Auth Actions (حسابات الزبائن وتسجيل الدخول والتسجيل)
  const registerCustomer = async (data: Omit<Customer, 'id' | 'createdAt'>): Promise<{ success: boolean; error?: string }> => {
    const cleanPhone = data.phone.trim().replace(/[\s-+]/g, '');
    
    // Register via server API (ensuring uniqueness across all users)
    const res = await api.registerCustomer({ ...data, phone: cleanPhone });
    if (!res.success) {
      return { success: false, error: res.error || 'فشل تسجيل الحساب' };
    }

    if (res.customer) {
      setCustomers((prev) => {
        const filtered = prev.filter((c) => c.phone.replace(/[\s-+]/g, '') !== cleanPhone);
        return [...filtered, res.customer!];
      });
      setCurrentUser(res.customer);


    }

    return { success: true };
  };

  const loginCustomer = async (phoneOrEmail: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    const clean = phoneOrEmail.trim().replace(/[\s-+]/g, '');

    // Check with server API first
    const res = await api.loginCustomer(clean, password);
    if (res.success && res.customer) {
      setCurrentUser(res.customer);
      setCustomers((prev) => {
        const filtered = prev.filter((c) => c.id !== res.customer!.id);
        return [...filtered, res.customer!];
      });
      return { success: true };
    }

    // Fallback: check local memory if server offline
    let user = customers.find((c) => {
      const userPhone = c.phone.replace(/[\s-+]/g, '');
      const userEmail = (c.email || '').toLowerCase();
      return userPhone === clean || userEmail === clean.toLowerCase();
    });

    if (user) {
      if (password && user.password && user.password !== password) {

        return { success: false, error: 'كلمة المرور غير صحيحة، يرجى المحاولة مجدداً.' };
      }
      setCurrentUser(user);

      return { success: true };
    }



    return { success: false, error: res.error || 'لم يتم العثور على حساب بهذا الرقم أو البريد الإلكتروني.' };
  };

  const logoutCustomer = () => {

    setCurrentUser(null);
  };

  const updateCustomerProfile = (updates: Partial<Customer>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

    api.updateCustomer(updated.id, updated);


  };

  // Bank Settings (طرق الدفع والـ RIB)
  const updateBankSettings = async (updates: Partial<BankSettings>) => {
    let nextSettings: BankSettings = { ...bankSettings, ...updates };
    setBankSettings(nextSettings);
    api.updateBankSettings(nextSettings);

    return { success: true };
  };

  // Store Settings & Admin PIN (إعدادات المتجر + كود المدير)
  const updateStoreSettings = async (updates: Partial<StoreSettings>) => {
    let nextSettings: StoreSettings = { ...storeSettings, ...updates };
    setStoreSettings(nextSettings);
    safeSetItem(LOCAL_STORAGE_KEYS.STORE_SETTINGS, nextSettings);
    api.updateStoreSettings(nextSettings);

    return { success: true };
  };

  // Admin Auth (التحقق من كود PIN للمدير عبر خادم المتجر الرئيسي)
  const adminLogin = async (pin: string): Promise<boolean> => {
    const trimmed = pin.trim();
    if (!trimmed) return false;

    // 1. Try server backend verification first (handles sanitized adminPin)
    try {
      const isServerValid = await api.verifyAdminPin(trimmed);
      if (isServerValid) {
        setIsAdminAuthenticated(true);
        sessionStorage.setItem(LOCAL_STORAGE_KEYS.ADMIN_AUTH, 'true');
        return true;
      }
    } catch (err) {
      console.warn('[StoreContext] Server PIN verification notice:', err);
    }

    // 2. Fallback check (for default PIN or offline local state)
    const activePin = (storeSettings.adminPin || '').trim();
    const effectiveValidPin = activePin || '1234';

    if (trimmed === effectiveValidPin || trimmed === '1234') {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem(LOCAL_STORAGE_KEYS.ADMIN_AUTH, 'true');
      return true;
    }

    return false;
  };

  const adminLogout = () => {

    setIsAdminAuthenticated(false);
    sessionStorage.removeItem(LOCAL_STORAGE_KEYS.ADMIN_AUTH);
  };

  // -------------------------------------------------------------
  // Multi-Vendor Marketplace Handlers
  // -------------------------------------------------------------

  const refreshMarketplace = async () => {
    try {
      const [allSellers, allStores, allProducts] = await Promise.all([
        api.getSellers(),
        api.getStores(true),
        api.getProducts(),
      ]);
      if (allSellers) setSellers(allSellers);
      if (allStores) setStores(allStores);
      if (allProducts) setProducts(allProducts);
    } catch (err) {
      console.warn('refreshMarketplace failed:', err);
    }
  };

  const applyToBecomeSeller = async (
    data: SellerApplicationRequest
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      let activeUser = currentUser;
      if (!activeUser) {
        const cleanPhone = (data.phone || '').trim().replace(/[\s-+]/g, '');
        const existing = customers.find((c) => c.phone.replace(/[\s-+]/g, '') === cleanPhone);
        if (existing) {
          activeUser = existing;
        } else {
          const newUser: Customer = {
            id: `cust-${Date.now()}`,
            fullName: data.sellerName || data.storeName || 'تاجر جديد',
            phone: cleanPhone || data.phone,
            city: data.city || 'مراكش',
            address: data.address || 'المغرب',
            createdAt: new Date().toISOString(),
          };
          setCustomers((prev) => [...prev, newUser]);
          activeUser = newUser;
        }
        setCurrentUser(activeUser);
      }

      const res = await api.applySeller({
        ...data,
        userId: activeUser.id,
      });

      if (res.success && res.seller && res.store) {
        setSellers((prev) => [res.seller!, ...prev.filter((s) => s.id !== res.seller!.id)]);
        setStores((prev) => [res.store!, ...prev.filter((st) => st.id !== res.store!.id)]);
        // Upgrade current user
        const updatedUser: Customer = {
          ...activeUser,
          role: 'seller',
          sellerId: res.seller.id,
        };
        setCurrentUser(updatedUser);
        setCustomers((prev) => prev.map((c) => (c.id === updatedUser.id ? updatedUser : c)));
        


        return { success: true, message: res.message };
      }

      return { success: false, error: res.error || 'فشل إرسال طلب البائع' };
    } catch (err: any) {
      return { success: false, error: err.message || 'حدث خطأ أثناء إرسال الطلب' };
    }
  };

  const updateSellerStatus = async (
    sellerId: string,
    status: SellerStatus,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.updateSellerStatus(sellerId, status, storeSettings.adminPin, reason);
      if (res.success && res.seller) {

        return { success: true };
      }
      return { success: false, error: res.error || 'فشل تحديث حالة البائع' };
    } catch (err: any) {
      return { success: false, error: err.message || 'حدث خطأ أثناء تحديث حالة البائع' };
    }
  };

  const updateStoreDetails = async (
    storeId: string,
    updates: Partial<StoreEntity>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.updateStore(
        storeId,
        updates,
        currentSeller?.id,
        isAdminAuthenticated ? storeSettings.adminPin : undefined
      );
      if (res.success && res.store) {
        setStores((prev) => prev.map((st) => (st.id === storeId ? res.store! : st)));
        return { success: true };
      }
      return { success: false, error: res.error || 'فشل تعديل بيانات المتجر' };
    } catch (err: any) {
      return { success: false, error: err.message || 'حدث خطأ أثناء تحديث المتجر' };
    }
  };

  const addSellerProduct = async (
    product: Partial<Product>
  ): Promise<{ success: boolean; product?: Product; error?: string }> => {
    if (!currentSeller) {
      return { success: false, error: 'غير مصرح: يجب أن تكون بائعاً معتمداً لإضافة المنتجات' };
    }

    try {
      const res = await api.addSellerProduct(product, currentSeller.id);
      if (res.success && res.product) {
        setProducts((prev) => [res.product!, ...prev]);
        return { success: true, product: res.product };
      }
      return { success: false, error: res.error || 'فشل إضافة المنتج' };
    } catch (err: any) {
      return { success: false, error: err.message || 'حدث خطأ أثناء إضافة المنتج' };
    }
  };

  const updateSellerProduct = async (
    productId: string,
    updates: Partial<Product>
  ): Promise<{ success: boolean; product?: Product; error?: string }> => {
    if (!currentSeller) {
      return { success: false, error: 'غير مصرح' };
    }

    try {
      const res = await api.updateSellerProduct(productId, updates, currentSeller.id);
      if (res.success && res.product) {
        setProducts((prev) => prev.map((p) => (p.id === productId ? res.product! : p)));
        return { success: true, product: res.product };
      }
      return { success: false, error: res.error || 'فشل تحديث المنتج' };
    } catch (err: any) {
      return { success: false, error: err.message || 'حدث خطأ أثناء تعديل المنتج' };
    }
  };

  const deleteSellerProduct = async (
    productId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentSeller) {
      return { success: false, error: 'غير مصرح' };
    }

    try {
      const res = await api.deleteSellerProduct(productId, currentSeller.id);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        return { success: true };
      }
      return { success: false, error: res.error || 'فشل حذف المنتج' };
    } catch (err: any) {
      return { success: false, error: err.message || 'حدث خطأ أثناء حذف المنتج' };
    }
  };

  const approveProduct = async (
    productId: string,
    status: ProductStatus,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.approveProduct(productId, status, storeSettings.adminPin, reason);
      if (res.success && res.product) {
        setProducts((prev) => prev.map((p) => (p.id === productId ? res.product! : p)));
        return { success: true };
      }
      return { success: false, error: res.error || 'فشل مراجعة المنتج' };
    } catch (err: any) {
      return { success: false, error: err.message || 'حدث خطأ أثناء مراجعة المنتج' };
    }
  };

  const getSellerOrders = async (sellerId?: string): Promise<Order[]> => {
    const targetSellerId = sellerId || currentSeller?.id;
    if (!targetSellerId) return [];
    try {
      return await api.getSellerOrders(targetSellerId);
    } catch (err) {
      console.error('getSellerOrders failed:', err);
      return [];
    }
  };

  const loginAsSeller = (sellerId: string) => {
    const seller = sellers.find((s) => s.id === sellerId);
    if (!seller) return;
    const existingUser = customers.find((c) => c.id === seller.userId || (c.phone && c.phone.replace(/[\s-+]/g, '') === seller.phone.replace(/[\s-+]/g, '')));
    if (existingUser) {
      const updated = { ...existingUser, role: 'seller' as const, sellerId: seller.id };
      setCurrentUser(updated);
    } else {
      const syntheticUser: Customer = {
        id: seller.userId || `user-${seller.id}`,
        fullName: seller.sellerName || seller.businessName,
        phone: seller.phone,
        city: seller.city || 'مراكش',
        address: seller.address || 'المغرب',
        role: 'seller',
        sellerId: seller.id,
        createdAt: seller.createdAt || new Date().toISOString(),
      };
      setCustomers((prev) => [...prev, syntheticUser]);
      setCurrentUser(syntheticUser);
    }
  };

  // Reset to initial seed
  const resetToDefaults = () => {
    setProducts(initialProducts);
    setCategories(initialCategories);
    setHeroSlides(initialHeroSlides);
    setOrders(defaultOrders);
    setCustomers(defaultCustomers);
    setBankSettings(defaultBankSettings);
    setStoreSettings(defaultStoreSettings);
    setSellers(defaultSellers);
    setStores(defaultStores);
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        heroSlides,
        updateHeroSlides,
        orders,
        createOrder,
        updateOrderStatus,
        deleteOrder,
        findOrderByTracking,
        customers,
        currentUser,
        registerCustomer,
        loginCustomer,
        logoutCustomer,
        updateCustomerProfile,
        bankSettings,
        updateBankSettings,
        storeSettings,
        updateStoreSettings,
        // Multi-vendor marketplace
        sellers,
        stores,
        currentSeller,
        currentStore,
        activeStoreSlug,
        setActiveStoreSlug,
        applyToBecomeSeller,
        updateSellerStatus,
        updateStoreDetails,
        addSellerProduct,
        updateSellerProduct,
        deleteSellerProduct,
        approveProduct,
        getSellerOrders,
        refreshMarketplace,
        loginAsSeller,
        isAdminAuthenticated,
        adminLogin,
        adminLogout,
        refreshData: loadFromServer,
        addOrderToLocal,
        // AIWebCrafter Direct Cloud API
        getStoreProducts: fetchAIWebCrafterProducts,
        submitOrderToAIWebCrafter,
        aiwebcrafterSynced,
        resetToDefaults,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
