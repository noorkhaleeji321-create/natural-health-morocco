import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, startTransition } from 'react';
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
import { safeGetItem, safeRemoveItem } from '../utils/storage';
import { formatThumbUrl, preloadImagesBatched } from '../lib/utils';
import { api } from '../lib/api';
import { 
  fsGetDocs, 
  fsGetDoc, 
  fsSetDoc, 
  fsDeleteDoc 
} from '../lib/firebase';

import firebaseConfigJson from '../../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: false,
      isAnonymous: true,
    },
    operationType,
    path,
  };
  console.warn('[Firestore Error Context]', JSON.stringify(errInfo));
}

export const cleanForFirestore = <T,>(obj: T): T => {
  if (obj === undefined) {
    return null as unknown as T;
  }
  if (obj === null || typeof obj !== 'object') {
    if (typeof obj === 'number' && isNaN(obj)) return 0 as unknown as T;
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined && typeof item !== 'function')
      .map((item) => cleanForFirestore(item)) as unknown as T;
  }
  if (obj instanceof Date) {
    return obj as unknown as T;
  }
  const cleaned: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const val = (obj as Record<string, any>)[key];
    if (val !== undefined && typeof val !== 'function') {
      const cleanedVal = cleanForFirestore(val);
      if (cleanedVal !== undefined) {
        cleaned[key] = cleanedVal;
      }
    }
  }
  return cleaned as T;
};

const isFirebaseConfigured = () => {
  const envKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const apiKey = (envKey && envKey !== 'your_firebase_api_key_here')
    ? envKey
    : firebaseConfigJson.apiKey;

  const envProject = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const projectId = (envProject && envProject !== 'your_firebase_project_id_here')
    ? envProject
    : firebaseConfigJson.projectId;

  return !!apiKey && !!projectId && apiKey !== 'your_firebase_api_key_here';
};

function withTimeout<T>(promise: Promise<T>, ms: number = 10000, errorMessage: string = 'Firebase connection timeout'): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(errorMessage)), ms)
  );
  return Promise.race([promise, timeout]);
}



interface StoreContextType {
  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<{ success: boolean; product?: Product; error?: string }>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<{ success: boolean; product?: Product; error?: string }>;
  deleteProduct: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Categories
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => Promise<{ success: boolean; category?: Category; error?: string }>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<{ success: boolean; category?: Category; error?: string }>;
  deleteCategory: (id: string) => Promise<{ success: boolean; error?: string }>;

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
  loadFromServer: (includeAdminBootstrap?: boolean) => Promise<boolean>;
  addOrderToLocal: (order: Order) => void;

  // Defaults Reset
  resetToDefaults: () => void;
  
  isFirestoreActive: boolean;
  isLoadingProducts: boolean;
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
  logoUrl: '',
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
  aboutImageUrl: '',
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
  PRODUCTS: 'said_store_products_v3',
  CATEGORIES: 'said_store_categories_v6',
  HERO_SLIDES: 'said_store_hero_slides_v3',
  ORDERS: 'said_store_orders_v2',
  CUSTOMERS: 'said_store_customers_v2',
  CURRENT_USER: 'said_store_current_user_v2',
  BANK_SETTINGS: 'said_store_bank_settings_v2',
  STORE_SETTINGS: 'said_store_settings_v2',
  ADMIN_AUTH: 'said_store_admin_auth_v2',
  SELLERS: 'said_store_sellers_v2',
  STORES: 'said_store_stores_v2',
};

export const mapServerProduct = (item: any, idx: number): Product => {
  const id = String(item.id || item.product_id || `prod-${idx + 1}`);
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
    isBestSeller: Boolean(item.isBestSeller ?? item.is_best_seller ?? false),
    isNew: Boolean(item.isNew ?? item.is_new ?? false),
    image: (typeof item.image === 'string' && item.image.trim() !== '' ? item.image.trim() : undefined) ||
      (typeof item.image_url === 'string' && item.image_url.trim() !== '' ? item.image_url.trim() : undefined) ||
      (Array.isArray(item.images) && typeof item.images[0] === 'string' && item.images[0].trim() !== '' ? item.images[0].trim() : undefined) ||
      '/assets/images/hero_spices_1793739545710.webp',
    images: Array.isArray(item.images) ? item.images.filter((img: any) => typeof img === 'string' && img.trim() !== '') : undefined,
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
  const [isFirestoreActive, setIsFirestoreActive] = useState(false);

  // دالة موحدة لضمان أن جميع عمليات الكتابة إلى Firestore تتم فقط عند الحاجة، مع معالجة الأخطاء وعرض تنبيه في حالة الفشل
  const syncFirestoreWrite = async (
    operationType: OperationType,
    path: string,
    writeFn: () => Promise<any>
  ): Promise<{ success: boolean; firestoreSaved?: boolean; error?: string }> => {
    if (!isFirebaseConfigured()) {
      return { success: false, firestoreSaved: false, error: 'تكوين Firebase غير متصل حالياً' };
    }
    try {
      await withTimeout(writeFn(), 10000, 'فشل الاتصال بقاعدة البيانات (انتهت مهلة الاتصال)');
      return { success: true, firestoreSaved: true };
    } catch (err: any) {
      handleFirestoreError(err, operationType, path);
      console.warn(`[StoreContext] Firestore write error at ${path}:`, err?.message || err);
      const errMsg = `🚨 علامة خطر: تعذر الاتصال بسحابة Firebase في المسار (${path}): ${err?.message || 'فشل الاتصال'}`;
      return { 
        success: false, 
        firestoreSaved: false, 
        error: errMsg 
      };
    }
  };

  // 1. Products (Loaded live from Firebase Firestore - never stale local files)
  const [products, setProducts] = useState<Product[]>([]);

  // Track initial product loading state for skeleton display while Firestore responds
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(() => isFirebaseConfigured());

  // 2. Categories (Loaded live from Firebase Firestore)
  const [categories, setCategories] = useState<Category[]>([]);

  // 3. Hero Slides
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(initialHeroSlides);

  // 4. Orders
  const [orders, setOrders] = useState<Order[]>(defaultOrders);

  // 5. Customers
  const [customers, setCustomers] = useState<Customer[]>(defaultCustomers);

  // 6. Current Logged In Customer
  const [currentUser, setCurrentUser] = useState<Customer | null>(() => {
    return safeGetItem<Customer | null>(LOCAL_STORAGE_KEYS.CURRENT_USER, null);
  });

  // 7. Bank Settings
  const [bankSettings, setBankSettings] = useState<BankSettings>(defaultBankSettings);

  // 8. Store Settings
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(defaultStoreSettings);

  // 9. Marketplace Sellers & Stores
  const [sellers, setSellers] = useState<Seller[]>(defaultSellers);

  const [stores, setStores] = useState<StoreEntity[]>(defaultStores);

  const [activeStoreSlug, setActiveStoreSlug] = useState<string | null>(null);

  // Purge any legacy stale catalog caches from browser localStorage on first boot
  useEffect(() => {
    safeRemoveItem(LOCAL_STORAGE_KEYS.PRODUCTS);
    safeRemoveItem(LOCAL_STORAGE_KEYS.CATEGORIES);
    safeRemoveItem(LOCAL_STORAGE_KEYS.HERO_SLIDES);
    safeRemoveItem(LOCAL_STORAGE_KEYS.BANK_SETTINGS);
    safeRemoveItem(LOCAL_STORAGE_KEYS.STORE_SETTINGS);
    safeRemoveItem(LOCAL_STORAGE_KEYS.ORDERS);
    safeRemoveItem(LOCAL_STORAGE_KEYS.CUSTOMERS);
    safeRemoveItem(LOCAL_STORAGE_KEYS.SELLERS);
    safeRemoveItem(LOCAL_STORAGE_KEYS.STORES);
  }, []);

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

  const inFlightFetchRef = useRef<Promise<boolean> | null>(null);
  const lastFetchTimestampRef = useRef<number>(0);
  const cancelCategoryWarmupRef = useRef<(() => void) | null>(null);
  const cancelImageWarmupRef = useRef<(() => void) | null>(null);
  const hasLoadedCatalogRef = useRef<boolean>(false);
  const retryAttemptRef = useRef<number>(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deferredSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSameContent = (a: any, b: any): boolean => {
    if (a === b) return true;
    if (!a || !b) return false;
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      if (a.length > 0 && (a[0]?.id !== b[0]?.id || a[a.length - 1]?.id !== b[b.length - 1]?.id)) {
        return false;
      }
    }
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  };

  // Reload all data from live Firebase Firestore + fast same-origin /api/bootstrap race on initial cold load
  const loadFromServer = useCallback(async (includeAdminBootstrap: boolean = false): Promise<boolean> => {
    if (inFlightFetchRef.current) {
      return inFlightFetchRef.current;
    }

    const fetchPromise = (async () => {
      try {
        const firebaseEnabled = isFirebaseConfigured();
        const isAdmin = includeAdminBootstrap || (() => {
          try {
            return sessionStorage.getItem(LOCAL_STORAGE_KEYS.ADMIN_AUTH) === 'true';
          } catch {
            return false;
          }
        })();

        const isInitialColdLoad = !hasLoadedCatalogRef.current;
        let firestoreLoadedProducts = false;
        let firestoreLoadedAny = false;
        let bootstrapApplied = false;

        // Helper to apply bootstrap payload without triggering a synchronous long main-thread commit
        const applyBootstrapData = (data: any) => {
          if (!data) return;
          if (!firestoreLoadedProducts) {
            if (Array.isArray(data.categories) && data.categories.length > 0) {
              setCategories((prev) => (isSameContent(prev, data.categories) ? prev : data.categories));
            }
            if (Array.isArray(data.products) && data.products.length > 0) {
              hasLoadedCatalogRef.current = true;
              bootstrapApplied = true;
            }
          }

          startTransition(() => {
            if (!firestoreLoadedProducts) {
              if (Array.isArray(data.products) && data.products.length > 0) {
                setProducts((prev) => (isSameContent(prev, data.products) ? prev : data.products));
              }
              if (data.storeSettings) {
                setStoreSettings((prev) => {
                  const merged = { ...prev, ...data.storeSettings };
                  return isSameContent(prev, merged) ? prev : merged;
                });
              }
              if (data.bankSettings) {
                setBankSettings((prev) => {
                  const merged = { ...defaultBankSettings, ...prev, ...data.bankSettings };
                  return isSameContent(prev, merged) ? prev : merged;
                });
              }
              if (Array.isArray(data.heroSlides) && data.heroSlides.length > 0) {
                setHeroSlides((prev) => (isSameContent(prev, data.heroSlides) ? prev : data.heroSlides));
              }
            }
            if (Array.isArray(data.orders)) {
              setOrders((prev) => mergeOrders(prev, data.orders));
            }
            if (data?.customers) {
              setCustomers((prev) => {
                const serverIds = new Set(data.customers.map((c: any) => c.id));
                const onlyLocal = prev.filter((c) => !serverIds.has(c.id));
                const merged = [...data.customers, ...onlyLocal];
                return isSameContent(prev, merged) ? prev : merged;
              });
            }
            if (data?.sellers && data.sellers.length > 0) {
              setSellers((prev) => {
                const serverIds = new Set(data.sellers!.map((s: any) => s.id));
                const onlyLocal = prev.filter((s) => !serverIds.has(s.id));
                const merged = [...data.sellers!, ...onlyLocal];
                return isSameContent(prev, merged) ? prev : merged;
              });
            }
            if (data?.stores && data.stores.length > 0) {
              setStores((prev) => {
                const serverIds = new Set(data.stores!.map((s: any) => s.id));
                const onlyLocal = prev.filter((s) => !serverIds.has(s.id));
                const merged = [...data.stores!, ...onlyLocal];
                return isSameContent(prev, merged) ? prev : merged;
              });
            }
            if (bootstrapApplied || firestoreLoadedProducts) {
              setIsLoadingProducts(false);
            }
          });
        };

        const runDirectFirestoreSync = async () => {
          if (!firebaseEnabled || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
            return;
          }
          const firestoreQueries: Promise<any>[] = [
            fsGetDocs('products'),
            fsGetDocs('categories'),
            fsGetDocs('settings'),
          ];
          if (isAdmin) {
            firestoreQueries.push(fsGetDocs('orders'));
          }

          const settledResults = await withTimeout(
            Promise.allSettled(firestoreQueries),
            20000,
            'Firebase connection timeout during load'
          ).catch((fErr) => {
            const msg = String(fErr?.message || fErr || '');
            if (msg.toLowerCase().includes('permission')) {
              handleFirestoreError(fErr, OperationType.LIST, 'products,categories,settings');
            } else {
              console.warn('[StoreContext] Direct Firestore notice:', msg);
            }
            return null;
          });

          if (settledResults && Array.isArray(settledResults)) {
            const [prodRes, catRes, settingsRes, ordersRes] = settledResults;
            const firestoreProducts =
              prodRes?.status === 'fulfilled'
                ? prodRes.value.docs.map((d: any) => ({ ...d.data(), id: d.id }))
                : null;
            const firestoreCategories =
              catRes?.status === 'fulfilled'
                ? catRes.value.docs.map((d: any) => ({ ...d.data(), id: d.id }))
                : null;

            const settingsDocs = settingsRes?.status === 'fulfilled' ? settingsRes.value.docs : [];
            const settingsDoc = settingsDocs.find((d: any) => d.id === 'main');
            const bankDoc = settingsDocs.find((d: any) => d.id === 'bank');
            const heroDoc = settingsDocs.find((d: any) => d.id === 'hero');
            const firestoreOrders =
              ordersRes?.status === 'fulfilled'
                ? ordersRes.value.docs.map((d: any) => ({ ...d.data(), id: d.id }))
                : null;

            if (firestoreProducts || firestoreCategories || settingsDocs.length > 0) {
              firestoreLoadedAny = true;
            }
            if (Array.isArray(firestoreProducts) && firestoreProducts.length > 0) {
              firestoreLoadedProducts = true;
              hasLoadedCatalogRef.current = true;
            }

            if (firestoreLoadedAny) {
              startTransition(() => {
                setIsFirestoreActive(true);
                if (Array.isArray(firestoreProducts)) {
                  setProducts((prev) => (isSameContent(prev, firestoreProducts) ? prev : firestoreProducts));
                }
                if (Array.isArray(firestoreCategories)) {
                  setCategories((prev) => (isSameContent(prev, firestoreCategories) ? prev : firestoreCategories));
                }
                if (settingsDoc && settingsDoc.data()) {
                  const fSettings = settingsDoc.data();
                  setStoreSettings((prev) => {
                    const merged = { ...prev, ...fSettings };
                    return isSameContent(prev, merged) ? prev : merged;
                  });
                }
                if (bankDoc && bankDoc.data()) {
                  const bSettings = bankDoc.data();
                  setBankSettings((prev) => {
                    const merged = { ...defaultBankSettings, ...prev, ...bSettings };
                    return isSameContent(prev, merged) ? prev : merged;
                  });
                }
                if (heroDoc && heroDoc.data() && Array.isArray(heroDoc.data().slides)) {
                  const fSlides = heroDoc.data().slides;
                  setHeroSlides((prev) => (isSameContent(prev, fSlides) ? prev : fSlides));
                }
                if (firestoreOrders && Array.isArray(firestoreOrders)) {
                  setOrders((prev) => mergeOrders(prev, firestoreOrders));
                }
                if (firestoreLoadedProducts) {
                  setIsLoadingProducts(false);
                }
              });
            }
          }
        };

        // Fast-path for cold storefront visits: fetch same-origin edge-cached /api/bootstrap FIRST
        // and avoid downloading/parsing the 214KB vendor-firebase chunk during initial LCP/TBT window.
        if (isInitialColdLoad && !isAdmin) {
          const bootstrapData = await api.getBootstrap().catch(() => null);
          if (bootstrapData && Array.isArray(bootstrapData.products) && bootstrapData.products.length > 0) {
            applyBootstrapData(bootstrapData);
            if (firebaseEnabled) {
              if (deferredSyncTimerRef.current) clearTimeout(deferredSyncTimerRef.current);
              deferredSyncTimerRef.current = setTimeout(() => {
                void runDirectFirestoreSync();
              }, 4800);
            }
          } else {
            await runDirectFirestoreSync();
          }
        } else {
          // Admin sessions & subsequent live refreshes query Firestore directly in parallel with bootstrap if needed
          const bootstrapPromise: Promise<any> | null =
            isAdmin || !firebaseEnabled
              ? api.getBootstrap().then((data) => {
                  if (data) applyBootstrapData(data);
                  return data;
                }).catch(() => null)
              : null;

          await runDirectFirestoreSync();

          if (bootstrapPromise) {
            await bootstrapPromise;
          } else if (!firestoreLoadedProducts && !hasLoadedCatalogRef.current) {
            const fallbackData = await api.getBootstrap().catch(() => null);
            if (fallbackData) applyBootstrapData(fallbackData);
          }
        }

        if (hasLoadedCatalogRef.current) {
          retryAttemptRef.current = 0;
          setIsLoadingProducts(false);
        } else if (retryAttemptRef.current < 3) {
          // Schedule automatic recovery retry if first visit failed completely due to transient cold network
          retryAttemptRef.current += 1;
          if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
          retryTimerRef.current = setTimeout(() => {
            loadFromServer();
          }, 2500);
        } else {
          setIsLoadingProducts(false);
        }

        lastFetchTimestampRef.current = Date.now();
        return hasLoadedCatalogRef.current;
      } catch (err) {
        console.warn('Database sync notice:', err);
        setIsLoadingProducts(false);
        return false;
      } finally {
        inFlightFetchRef.current = null;
      }
    })();

    inFlightFetchRef.current = fetchPromise;
    return fetchPromise;
  }, []);

  // Warm offscreen category WebP thumbnails gently AFTER Hero LCP & first 4 cards finish loading
  useEffect(() => {
    if (cancelCategoryWarmupRef.current) {
      cancelCategoryWarmupRef.current();
      cancelCategoryWarmupRef.current = null;
    }
    if (categories.length <= 4) return;

    const remainingCatThumbs = categories
      .slice(4)
      .map((c) => formatThumbUrl(c.image, 360, 70))
      .filter(Boolean);

    cancelCategoryWarmupRef.current = preloadImagesBatched(remainingCatThumbs, 4, 300, 2600);

    return () => {
      if (cancelCategoryWarmupRef.current) {
        cancelCategoryWarmupRef.current();
        cancelCategoryWarmupRef.current = null;
      }
    };
  }, [categories]);

  // Warm visible product WebP thumbnails quietly in background after initial page paint/TBT window
  useEffect(() => {
    if (cancelImageWarmupRef.current) {
      cancelImageWarmupRef.current();
      cancelImageWarmupRef.current = null;
    }
    if (products.length === 0) return;

    const prioritizedThumbUrls = [
      ...products.filter((p) => p.isBestSeller).slice(0, 12).map((p) => formatThumbUrl(p.image, 420, 72)),
      ...products.filter((p) => p.isNew).slice(0, 8).map((p) => formatThumbUrl(p.image, 420, 72)),
    ];

    cancelImageWarmupRef.current = preloadImagesBatched(prioritizedThumbUrls, 4, 350, 4200);

    return () => {
      if (cancelImageWarmupRef.current) {
        cancelImageWarmupRef.current();
        cancelImageWarmupRef.current = null;
      }
    };
  }, [products]);

  // Sync immediately on mount, periodically (5 mins), on tab focus (> 15s), and when back online
  useEffect(() => {
    loadFromServer();

    const pollTimer = setInterval(() => {
      loadFromServer();
    }, 300000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastFetchTimestampRef.current > 15000) {
        loadFromServer();
      }
    };
    const handleOnline = () => {
      loadFromServer();
    };
    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      if (deferredSyncTimerRef.current) {
        clearTimeout(deferredSyncTimerRef.current);
        deferredSyncTimerRef.current = null;
      }
      clearInterval(pollTimer);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [loadFromServer]);

  // Manual Sync helper (Deprecated)
  const syncWithFirebase = async (): Promise<{ success: boolean; count: number; message: string }> => {
    return { success: false, count: 0, message: 'ميزة Firebase غير مفعلة حالياً.' };
  };

  // Product Actions
  const addProduct = async (productData: Omit<Product, 'id'>): Promise<{ success: boolean; product?: Product; error?: string }> => {
    const newId = `prod-${Date.now()}`;
    const newProduct: Product = {
      ...productData,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    
    // 1. Update local state immediately for fast UI responsiveness
    setProducts((prev) => [newProduct, ...prev]);

    setCategories((prev) =>
      prev.map((c) =>
        c.name === newProduct.category || c.slug === newProduct.category
          ? { ...c, count: (c.count || 0) + 1 }
          : c
      )
    );

    // 2. Persist in Backend API (Node.js Express Server)
    try {
      await api.addProduct(newProduct);
    } catch (err) {
      console.warn('[StoreContext] Local API sync skipped:', err);
    }

    // 3. Persist in Firestore (Non-blocking / Graceful fallback)
    if (isFirebaseConfigured()) {
      await syncFirestoreWrite(
        OperationType.WRITE,
        `products/${newId}`,
        () => fsSetDoc('products', newId, cleanForFirestore(newProduct))
      );
    }

    return { success: true, product: newProduct };
  };

  const updateProduct = async (id: string, updates: Partial<Product>): Promise<{ success: boolean; product?: Product; error?: string }> => {
    const nowIso = new Date().toISOString();
    const currentProd = products.find((p) => p.id === id);
    if (!currentProd) {
      return { success: false, error: 'المنتج غير موجود في القائمة' };
    }

    const productToSave: Product = { ...currentProd, ...updates, updatedAt: nowIso };
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: nowIso } : p)));

    // 2. Persist in Firestore using merge so partial updates succeed cleanly with firestore/lite
    if (isFirebaseConfigured()) {
      await syncFirestoreWrite(
        OperationType.UPDATE,
        `products/${id}`,
        () => fsSetDoc('products', id, cleanForFirestore({ ...updates, updatedAt: nowIso }), true)
      );
    }

    const apiRes = await api.updateProduct(id, productToSave);
    if (!apiRes.success) {
      console.warn('[StoreContext] updateProduct backend notice:', apiRes.error);
      return {
        success: true,
        product: productToSave,
        error: apiRes.error ? `تم التحديث (تنبيه الخادم: ${apiRes.error})` : undefined,
      };
    }

    return { success: true, product: apiRes.data || productToSave };
  };

  const deleteProduct = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const toDelete = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    
    if (toDelete) {
      setCategories((prev) =>
        prev.map((c) =>
          c.name === toDelete.category || c.slug === toDelete.category
            ? { ...c, count: Math.max(0, (c.count || 0) - 1) }
            : c
        )
      );
    }

    // 2. Persist in Firestore
    if (isFirebaseConfigured()) {
      await syncFirestoreWrite(
        OperationType.DELETE,
        `products/${id}`,
        () => fsDeleteDoc('products', id)
      );
    }

    try {
      await api.deleteProduct(id);
    } catch (err) {
      console.warn('[StoreContext] Local API deleteProduct skipped:', err);
    }

    return { success: true };
  };

  // Category Actions
  const addCategory = async (categoryData: Omit<Category, 'id'>): Promise<{ success: boolean; category?: Category; error?: string }> => {
    const newId = `cat-${Date.now()}`;
    const newCategory: Category = {
      ...categoryData,
      id: newId,
      count: categoryData.count || 0,
    };
    
    // 1. Update local state
    setCategories(prev => [newCategory, ...prev]);

    // 2. Persist in Backend API (Node.js Express Server)
    try {
      await api.addCategory(newCategory);
    } catch (err) {
      console.warn('[StoreContext] Local API category sync skipped:', err);
    }

    // 3. Persist in Firestore (Non-blocking / Graceful fallback)
    if (isFirebaseConfigured()) {
      await syncFirestoreWrite(
        OperationType.WRITE,
        `categories/${newId}`,
        () => fsSetDoc('categories', newId, cleanForFirestore(newCategory))
      );
    }

    return { success: true, category: newCategory };
  };

  const updateCategory = async (id: string, updates: Partial<Category>): Promise<{ success: boolean; category?: Category; error?: string }> => {
    const currentCat = categories.find((c) => c.id === id);
    if (!currentCat) {
      return { success: false, error: 'التصنيف غير موجود' };
    }

    const categoryToSave: Category = { ...currentCat, ...updates };
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));

    // 2. Persist to Firestore using merge
    if (isFirebaseConfigured()) {
      await syncFirestoreWrite(
        OperationType.UPDATE,
        `categories/${id}`,
        () => fsSetDoc('categories', id, cleanForFirestore(updates), true)
      );
    }

    const apiRes = await api.updateCategory(id, categoryToSave);
    if (!apiRes.success) {
      return {
        success: true,
        category: categoryToSave,
        error: apiRes.error ? `تم التحديث (تنبيه الخادم: ${apiRes.error})` : undefined,
      };
    }

    return { success: true, category: apiRes.data || categoryToSave };
  };

  const deleteCategory = async (id: string): Promise<{ success: boolean; error?: string }> => {
    setCategories((prev) => prev.filter((c) => c.id !== id && c.slug !== id));
    
    // 2. Persist to Firestore
    if (isFirebaseConfigured()) {
      await syncFirestoreWrite(
        OperationType.DELETE,
        `categories/${id}`,
        () => fsDeleteDoc('categories', id)
      );
    }

    try {
      await api.deleteCategory(id);
    } catch (err) {
      console.warn('[StoreContext] Local API deleteCategory skipped:', err);
    }

    return { success: true };
  };

  // Hero Slides
  const updateHeroSlides = async (slides: HeroSlide[]): Promise<boolean> => {
    setHeroSlides(slides);
    if (isFirebaseConfigured()) {
      await syncFirestoreWrite(
        OperationType.WRITE,
        'settings/hero',
        () => fsSetDoc('settings', 'hero', { slides: cleanForFirestore(slides) })
      );
    }
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

    // 1. Update local state immediately
    setOrders((prev) => mergeOrders(prev, [newOrder]));

    // 2. Persist to Firestore
    if (isFirebaseConfigured()) {
      await syncFirestoreWrite(
        OperationType.WRITE,
        `orders/${newOrder.id}`,
        () => fsSetDoc('orders', newOrder.id, cleanForFirestore(newOrder))
      );
    }

    // 3. Persist to shared backend
    try {
      await api.createOrder(newOrder);
    } catch (err: any) {
      console.warn('[StoreContext] Failed to sync new order to server:', err.message);
    }

    return newOrder;
  };

  const addOrderToLocal = (order: Order) => {
    setOrders((prev) => mergeOrders(prev, [order]));
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, note?: string) => {
    const nowIso = new Date().toISOString();

    // 1. Update local state immediately for UI responsiveness
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              statusNote: note !== undefined ? note : o.statusNote,
              updatedAt: nowIso,
            }
          : o
      )
    );

    // 2. Sync to Firestore (Persists order status updates across sessions & devices)
    if (isFirebaseConfigured()) {
      const updates: Record<string, any> = {
        status,
        updatedAt: nowIso,
      };
      if (note !== undefined) {
        updates.statusNote = note;
      }
      await syncFirestoreWrite(
        OperationType.UPDATE,
        `orders/${orderId}`,
        () => fsSetDoc('orders', orderId, cleanForFirestore(updates), true)
      );
    }

    // 3. Sync to Backend API
    try {
      await api.updateOrderStatus(orderId, status, note);
    } catch (err: any) {
      console.warn('[StoreContext] Failed to sync order status to server:', err.message);
    }
  };

  const deleteOrder = async (orderId: string) => {
    // 1. Update local state
    setOrders((prev) => prev.filter((o) => o.id !== orderId));

    // 2. Persist in Firestore
    if (isFirebaseConfigured()) {
      await syncFirestoreWrite(
        OperationType.DELETE,
        `orders/${orderId}`,
        () => fsDeleteDoc('orders', orderId)
      );
    }

    // 3. Sync to Backend
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
  const updateBankSettings = async (updates: Partial<BankSettings>): Promise<{ success: boolean; firestoreSaved?: boolean; error?: string }> => {
    const nextSettings: BankSettings = { ...bankSettings, ...updates };
    setBankSettings(nextSettings);

    let firestoreSaved = false;
    let firestoreError = '';

    if (isFirebaseConfigured()) {
      const fsRes = await syncFirestoreWrite(
        OperationType.WRITE,
        'settings/bank',
        () => fsSetDoc('settings', 'bank', cleanForFirestore(nextSettings))
      );
      firestoreSaved = !!fsRes.firestoreSaved;
      firestoreError = fsRes.error || '';
    } else {
      firestoreError = 'تكوين Firebase غير متصل حالياً';
    }

    try {
      await api.updateBankSettings(nextSettings);
    } catch (err) {
      console.warn('[StoreContext] Server API updateBankSettings skipped:', err);
    }

    return { success: true, firestoreSaved, error: firestoreError || undefined };
  };

  // Store Settings & Admin PIN (إعدادات المتجر + كود المدير)
  const updateStoreSettings = async (updates: Partial<StoreSettings>): Promise<{ success: boolean; firestoreSaved?: boolean; error?: string }> => {
    const nextSettings: StoreSettings = { ...storeSettings, ...updates };
    setStoreSettings(nextSettings);

    let firestoreSaved = false;
    let firestoreError = '';

    if (isFirebaseConfigured()) {
      const fsRes = await syncFirestoreWrite(
        OperationType.WRITE,
        'settings/main',
        () => fsSetDoc('settings', 'main', cleanForFirestore(nextSettings))
      );
      firestoreSaved = !!fsRes.firestoreSaved;
      firestoreError = fsRes.error || '';
    } else {
      firestoreError = 'تكوين Firebase غير متصل حالياً';
    }

    try {
      await api.updateStoreSettings(nextSettings);
    } catch (err) {
      console.warn('[StoreContext] Server API updateStoreSettings skipped:', err);
    }

    return { success: true, firestoreSaved, error: firestoreError || undefined };
  };

  // Admin Auth (التحقق من كود PIN للمدير عبر خادم المتجر الرئيسي)
  const adminLogin = async (pin: string): Promise<boolean> => {
    const trimmed = pin.trim();
    if (!trimmed || trimmed === '1234') {
      console.warn('[StoreContext] PIN 1234 is explicitly forbidden.');
      return false;
    }

    // 1. Always try server backend verification first to acquire and store the secure admin session token
    try {
      const isServerValid = await api.verifyAdminPin(trimmed);
      if (isServerValid) {
        setIsAdminAuthenticated(true);
        try { sessionStorage.setItem(LOCAL_STORAGE_KEYS.ADMIN_AUTH, 'true'); } catch {}
        void loadFromServer(true);
        return true;
      }
    } catch (err) {
      console.warn('[StoreContext] Server PIN verification notice:', err);
    }

    const isPinMatching = (candidate: string) => {
      const c = (candidate || '').trim();
      if (!c || c === '1234') return false;
      const normInput = trimmed.replace(/@$/, '');
      const normCandidate = c.replace(/@$/, '');
      return trimmed === c || normInput === normCandidate;
    };

    // 2. Try Direct Firebase Firestore Read for settings/main (Realtime Cloud Check)
    if (isFirebaseConfigured()) {
      try {
        const settingsSnap = await fsGetDoc('settings', 'main');
        if (settingsSnap.exists()) {
          const fData = settingsSnap.data();
          const fPin = fData?.adminPin;
          if (fPin && isPinMatching(fPin)) {
            try { await api.verifyAdminPin(trimmed); } catch {}
            setIsAdminAuthenticated(true);
            try { sessionStorage.setItem(LOCAL_STORAGE_KEYS.ADMIN_AUTH, 'true'); } catch {}
            void loadFromServer(true);
            return true;
          }
        }
      } catch (fErr) {
        console.warn('[StoreContext] Direct Firestore PIN check notice:', fErr);
      }
    }

    // 3. Check loaded storeSettings in memory (synced from Firestore)
    if (storeSettings?.adminPin && isPinMatching(storeSettings.adminPin)) {
      try { await api.verifyAdminPin(trimmed); } catch {}
      setIsAdminAuthenticated(true);
      try { sessionStorage.setItem(LOCAL_STORAGE_KEYS.ADMIN_AUTH, 'true'); } catch {}
      void loadFromServer(true);
      return true;
    }

    return false;
  };

  const adminLogout = () => {
    setIsAdminAuthenticated(false);
    try { 
      sessionStorage.removeItem(LOCAL_STORAGE_KEYS.ADMIN_AUTH);
      sessionStorage.removeItem('said_store_admin_token');
    } catch {}
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

    setProducts((prev) => prev.filter((p) => p.id !== productId));

    if (isFirebaseConfigured()) {
      await syncFirestoreWrite(
        OperationType.DELETE,
        `products/${productId}`,
        () => fsDeleteDoc('products', productId)
      );
    }

    try {
      await api.deleteSellerProduct(productId, currentSeller.id);
    } catch (err) {
      console.warn('[StoreContext] Local API deleteSellerProduct skipped:', err);
    }

    return { success: true };
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

  const refreshData = useCallback(() => loadFromServer(isAdminAuthenticated), [loadFromServer, isAdminAuthenticated]);

  const contextValue = useMemo<StoreContextType>(
    () => ({
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
      refreshData,
      loadFromServer,
      addOrderToLocal,
      resetToDefaults,
      isFirestoreActive,
      isLoadingProducts,
    }),
    [
      products,
      categories,
      heroSlides,
      orders,
      customers,
      currentUser,
      bankSettings,
      storeSettings,
      sellers,
      stores,
      currentSeller,
      currentStore,
      activeStoreSlug,
      isAdminAuthenticated,
      refreshData,
      loadFromServer,
      isFirestoreActive,
      isLoadingProducts,
    ]
  );

  return (
    <StoreContext.Provider value={contextValue}>
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
