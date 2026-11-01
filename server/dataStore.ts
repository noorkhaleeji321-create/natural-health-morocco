import fs from 'fs';
import path from 'path';
import {
  Product,
  Category,
  HeroSlide,
  Order,
  Customer,
  StoreSettings,
  BankSettings,
  Seller,
  StoreEntity,
  MarketplaceCart,
  MarketplaceCartItem,
  ShippingAddress,
  SellerOrder,
  OrderItemEntity,
} from '../src/types';
import {
  allProducts,
  categories,
  initialHeroSlides,
  storeInfo,
  storeBankInfo,
  defaultSellers,
  defaultStores,
} from '../src/data/storeData';

export interface DatabaseSchema {
  products: Product[];
  categories: Category[];
  heroSlides: HeroSlide[];
  orders: Order[];
  customers: Customer[];
  storeSettings: StoreSettings;
  bankSettings: BankSettings;
  sellers: Seller[];
  stores: StoreEntity[];
  carts?: MarketplaceCart[];
  cartItems?: MarketplaceCartItem[];
  shippingAddresses?: ShippingAddress[];
  sellerOrders?: SellerOrder[];
  orderItems?: OrderItemEntity[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

const defaultStoreSettings: StoreSettings = {
  storeName: storeInfo.name,
  storeSlogan: storeInfo.tagline,
  logoUrl: '/assets/aistudio/WhatsApp_Image_2026-10-28_at_19.35.25_6c594579.jpeg',
  phone: storeInfo.phone,
  whatsapp: storeInfo.whatsapp,
  address: storeInfo.address,
  city: storeInfo.city,
  openingHours: storeInfo.hours,
  email: storeInfo.email,
  freeShippingThreshold: 250,
  shippingFee: 35,
  currency: 'DH',
  announcementText: '🌿 مرحباً بكم في natural-morocco — جودة أصيلة وتوصيل لجميع مدن المغرب 🇲🇦',
  adminPin: '1234',
  showHeroSlider: true,
};

const defaultBankSettings: BankSettings = {
  bankName: storeBankInfo.bankName,
  accountHolder: storeBankInfo.accountHolder,
  rib: storeBankInfo.rib,
  instructions: 'يرجى اختيار طريقة الدفع المناسبة: الدفع نقداً عند الاستلام، البطاقة البنكية، بايبال، أو التحويل البنكي.',
  isBankTransferEnabled: true,
  isCodEnabled: true,
  isCardEnabled: true,
  isPaypalEnabled: true,
  paymentMode: 'sandbox',
  paddleVendorId: process.env.PADDLE_VENDOR_ID || '123456',
  paddleClientToken: process.env.VITE_PADDLE_CLIENT_TOKEN || 'live_sample_token',
  paddleApiKey: process.env.PADDLE_API_KEY || 'pdl_sample_key',
  cardPublishableKey: process.env.VITE_PADDLE_CLIENT_TOKEN || 'pdl_sample_key',
  cardSecretKey: process.env.PADDLE_API_KEY || 'pdl_sample_secret',
  paypalClientId: process.env.VITE_PAYPAL_CLIENT_ID || 'client_id_sample',
  paypalClientSecret: process.env.PAYPAL_SECRET_KEY || 'secret_sample',
};

const defaultCustomers: Customer[] = [];

const defaultOrders: Order[] = [];

let inMemoryDb: DatabaseSchema | null = null;

// Helper to filter out any fake or dummy products
function filterFakeProducts(prods: Product[]): Product[] {
  if (!prods || !Array.isArray(prods)) return [];
  return prods.filter(
    (p) =>
      p &&
      p.id &&
      !/^(sp-|sp-wellness|oil-|hr-|care-|sd-|hn-|tpl-|demo-)/.test(p.id) &&
      !['tpl-1', 'tpl-2', 'tpl-3', 'tpl-4', 'tpl-5', 'tpl-6'].includes(p.id)
  );
}

export function initDatabase(): DatabaseSchema {
  // Always initialize clean in-memory database with authentic store products only
  const cleanProducts = filterFakeProducts(allProducts).map((p) => ({
    ...p,
    sellerId: p.sellerId || 'seller-natural-morocco',
    storeId: p.storeId || 'store-natural-morocco',
    sellerName: p.sellerName || 'natural-morocco',
    storeName: p.storeName || 'natural-morocco',
    storeSlug: p.storeSlug || 'natural-morocco',
    status: p.status || 'approved',
    compareAtPrice: p.compareAtPrice ?? p.oldPrice,
  }));

  inMemoryDb = {
    products: cleanProducts,
    categories: categories,
    heroSlides: initialHeroSlides,
    orders: defaultOrders,
    customers: defaultCustomers,
    storeSettings: defaultStoreSettings,
    bankSettings: defaultBankSettings,
    sellers: defaultSellers,
    stores: defaultStores,
    carts: [],
    shippingAddresses: [],
    sellerOrders: [],
    orderItems: [],
  };

  return inMemoryDb;
}

export function getDatabase(): DatabaseSchema {
  if (!inMemoryDb) {
    return initDatabase();
  }
  return inMemoryDb;
}

const IMAGES_DIR = path.join(process.cwd(), 'public', 'images');
const PRODUCTS_IMG_DIR = path.join(IMAGES_DIR, 'products');
const CATEGORIES_IMG_DIR = path.join(IMAGES_DIR, 'categories');
const BANNERS_IMG_DIR = path.join(IMAGES_DIR, 'banners');

export function ensureDirectoriesExist() {
  const dirs = [
    DATA_DIR,
    UPLOADS_DIR,
    IMAGES_DIR,
    PRODUCTS_IMG_DIR,
    CATEGORIES_IMG_DIR,
    BANNERS_IMG_DIR,
  ];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {
        // ignore
      }
    }
  }
}

// In-Memory save: No disk file dump / internal file logging to prevent file locking and download errors
export function saveDatabase(data: DatabaseSchema): boolean {
  try {
    if (data.products) {
      data.products = filterFakeProducts(data.products);
    }
    inMemoryDb = data;
    return true;
  } catch (err) {
    console.error('Failed to update in-memory database:', err);
    return false;
  }
}

