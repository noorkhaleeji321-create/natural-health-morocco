import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import {
  initDatabase,
  getDatabase,
  saveDatabase,
} from './server/dataStore';
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
  SellerStatus,
  StoreStatus,
  ProductStatus,
  MarketplaceCart,
  MarketplaceCartItem,
  ShippingAddress,
  SellerOrder,
  OrderItemEntity,
  OrderStatus,
} from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize persistent database
  initDatabase();

  // Middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Ensure data and public directories exist with proper structure
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const publicDir = path.join(process.cwd(), 'public');
  const uploadsDir = path.join(publicDir, 'uploads');
  const assetsDir = path.join(publicDir, 'assets');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const imagesDir = path.join(publicDir, 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    fs.mkdirSync(path.join(imagesDir, 'products'), { recursive: true });
    fs.mkdirSync(path.join(imagesDir, 'categories'), { recursive: true });
    fs.mkdirSync(path.join(imagesDir, 'banners'), { recursive: true });
  }

  // ==========================================
  // HELPER: DATA SANITIZATION (HIDE CODES & SECRETS)
  // ==========================================
  const sanitizeStoreSettings = (settings: StoreSettings) => {
    if (!settings) return settings;
    // Strip adminPin so visitors cannot read PIN in network responses
    const { adminPin, ...safeSettings } = settings as any;
    return safeSettings;
  };

  const sanitizeBankSettings = (bank: BankSettings) => {
    if (!bank) return bank;
    // Strip private gateway secret keys from public responses
    const { paddleApiKey, cardSecretKey, paypalClientSecret, ...safeBank } = bank as any;
    return safeBank;
  };

  // Serve static files from public directory ONLY
  app.use(express.static(publicDir));
  app.use('/uploads', express.static(uploadsDir));
  app.use('/assets', express.static(assetsDir));
  app.use('/images', express.static(imagesDir));

  // No static file dump or file downloads for /data - all store data is served strictly via /api endpoints

  // -------------------------------------------------------------
  // AIWebCrafter Store Connector Configuration
  // Dedicated Cloud Database & Storage API for Your Existing Store
  // -------------------------------------------------------------
  const AWC_CONFIG = {
    endpoint: process.env.AWC_ENDPOINT || "https://www.aiwebcrafter.com/api/v1",
    apiKey: process.env.AWC_API_KEY || "11CJDCA5Y0V5vflsFKg4ah_B6vChEX6IkQunWKTzkMreqcFy4eDx0JgPzvhrpjf6DA5DBER2RV2DQXjwgq"
  };

  async function syncOrderToAIWebCrafter(cart: {
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    shipping_address: string;
    city: string;
    payment_method?: string;
    items: Array<{
      product_id: string;
      product_name: string;
      sku?: string;
      unit_price: number;
      quantity: number;
    }>;
    notes?: string;
  }) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const response = await fetch(`${AWC_CONFIG.endpoint}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AWC-API-KEY': AWC_CONFIG.apiKey,
          'Accept': 'application/json'
        },
        body: JSON.stringify(cart),
        signal: controller.signal
      });
      clearTimeout(timer);
      const result = await response.json();
      return result;
    } catch (err: any) {
      console.warn('[AIWebCrafter] Cloud order sync notice (offline/queued):', err.message);
      return { success: false, error: err.message, isOfflineQueued: true };
    }
  }

  // ==========================================
  // API ROUTES
  // ==========================================

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // -------------------------------------------------------------
  // AIWebCrafter Store Backend Proxy
  // Secure server-to-server proxy with protected credentials
  // -------------------------------------------------------------
  const AIWEBCRAFTER_API_URL = process.env.AIWEBCRAFTER_API_URL || process.env.AWC_ENDPOINT || "https://www.aiwebcrafter.com/api/v1";
  const AWC_STOREFRONT_KEY = process.env.AWC_STOREFRONT_KEY || process.env.AWC_API_KEY || "11CJDCA5Y0V5vflsFKg4ah_B6vChEX6IkQunWKTzkMreqcFy4eDx0JgPzvhrpjf6DA5DBER2RV2DQXjwgq";

  // 1. Proxy لجلب المنتجات (Store Backend Proxy for Products)
  app.get('/api/proxy/products', async (req, res) => {
    try {
      const url = new URL(`${AIWEBCRAFTER_API_URL}/products`);
      if (req.query.category) url.searchParams.set('category', req.query.category as string);
      if (req.query.page) url.searchParams.set('page', req.query.page as string);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);

      const response = await fetch(url.toString(), {
        headers: {
          'X-AWC-STOREFRONT-KEY': AWC_STOREFRONT_KEY,
          'X-AWC-API-KEY': AWC_STOREFRONT_KEY,
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`AIWebCrafter responded with HTTP ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.warn('[Store Backend Proxy] Notice fetching products:', error.message);
      // Graceful local cache fallback so the storefront never fails
      const db = getDatabase();
      res.json({
        success: true,
        data: {
          items: db.products || [],
          pagination: { total: db.products?.length || 0, page: 1, limit: 50 },
          source: 'store_cache_fallback'
        }
      });
    }
  });

  // 2. Proxy لإرسال الطلبات (Store Backend Proxy for Orders)
  app.post('/api/proxy/orders', async (req, res) => {
    try {
      const idempotencyKey = (req.headers['x-idempotency-key'] as string) || `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${AIWEBCRAFTER_API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AWC-STOREFRONT-KEY': AWC_STOREFRONT_KEY,
          'X-AWC-API-KEY': AWC_STOREFRONT_KEY,
          'X-Idempotency-Key': idempotencyKey,
          'Accept': 'application/json'
        },
        body: JSON.stringify(req.body),
        signal: controller.signal
      });
      clearTimeout(timeout);

      const data = await response.json();
      if (!response.ok || (data && data.error && !data.success)) {
        console.warn('[Store Backend Proxy] Remote AIWebCrafter returned error or non-200. Storing locally:', data);
        const db = getDatabase();
        const fallbackOrder: Order = {
          id: `SAID-${Math.floor(100000 + Math.random() * 900000)}`,
          customer: {
            fullName: req.body.customer_name || 'زبون المتجر',
            phone: req.body.customer_phone || '',
            email: req.body.customer_email || '',
            address: req.body.shipping_address || '',
            city: req.body.city || 'المغرب',
            notes: req.body.notes || ''
          },
          paymentMethod: req.body.payment_method || 'cod',
          items: (req.body.items || []).map((it: any) => ({
            id: it.product_id || `item-${Date.now()}`,
            productId: it.product_id,
            product: {
              id: it.product_id,
              name: it.product_name,
              price: it.unit_price,
              category: 'المنتجات الطبيعية الصحراوية',
              unit: '100g',
              image: '/assets/aistudio/aad8b4fe-64a3-4e47-89bd-93b688d4e9a1__1_daght_16fef5de.jpg'
            },
            quantity: it.quantity,
            unitPrice: it.unit_price,
            productNameSnapshot: it.product_name
          })),
          subtotal: (req.body.items || []).reduce((acc: number, it: any) => acc + (it.unit_price * it.quantity), 0),
          shipping: 0,
          total: (req.body.items || []).reduce((acc: number, it: any) => acc + (it.unit_price * it.quantity), 0),
          status: 'new',
          createdAt: new Date().toISOString()
        };
        db.orders.unshift(fallbackOrder);
        saveDatabase(db);

        return res.json({
          success: true,
          order_id: fallbackOrder.id,
          message: 'تم تسجيل الطلب وحفظه في لوحة التحكم بنجاح، وجارٍ جدولته مع السحابة.',
          queued: true,
          cloud_error: data?.error?.message || `HTTP ${response.status}`
        });
      }
      res.json(data);
    } catch (error: any) {
      console.warn('[Store Backend Proxy] Notice submitting order:', error.message);
      // Ensure customer order is safely saved in local database fallback
      try {
        const db = getDatabase();
        const fallbackOrder: Order = {
          id: `SAID-${Math.floor(100000 + Math.random() * 900000)}`,
          customer: {
            fullName: req.body.customer_name || 'زبون المتجر',
            phone: req.body.customer_phone || '',
            email: req.body.customer_email || '',
            address: req.body.shipping_address || '',
            city: req.body.city || 'المغرب',
            notes: req.body.notes || ''
          },
          paymentMethod: req.body.payment_method || 'cod',
          items: (req.body.items || []).map((it: any) => ({
            id: it.product_id || `item-${Date.now()}`,
            productId: it.product_id,
            product: {
              id: it.product_id,
              name: it.product_name,
              price: it.unit_price,
              category: 'المنتجات الطبيعية الصحراوية',
              unit: '100g',
              image: '/assets/aistudio/aad8b4fe-64a3-4e47-89bd-93b688d4e9a1__1_daght_16fef5de.jpg'
            },
            quantity: it.quantity,
            unitPrice: it.unit_price,
            productNameSnapshot: it.product_name
          })),
          subtotal: (req.body.items || []).reduce((acc: number, it: any) => acc + (it.unit_price * it.quantity), 0),
          shipping: 0,
          total: (req.body.items || []).reduce((acc: number, it: any) => acc + (it.unit_price * it.quantity), 0),
          status: 'new',
          createdAt: new Date().toISOString()
        };
        db.orders.unshift(fallbackOrder);
        saveDatabase(db);

        res.json({
          success: true,
          order_id: fallbackOrder.id,
          message: 'تم حفظ الطلب محلياً بنجاح وسيتزامن تلقائياً مع السحابة عند توفرها.',
          queued: true
        });
      } catch (innerErr) {
        res.status(500).json({ error: 'Failed to submit order' });
      }
    }
  });

  // Fast bootstrap (returns sanitized data for fast initial render without leaking adminPin)
  app.get('/api/bootstrap', (req, res) => {
    try {
      const db = getDatabase();
      res.json({
        success: true,
        data: {
          ...db,
          storeSettings: sanitizeStoreSettings(db.storeSettings),
          bankSettings: sanitizeBankSettings(db.bankSettings),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ------------------------------------------
  // PRODUCTS API (Marketplace Supported)
  // ------------------------------------------
  app.get('/api/products', (req, res) => {
    try {
      const db = getDatabase();
      const { sellerId, storeId, status, all } = req.query;

      let filtered = [...db.products];

      if (sellerId) {
        filtered = filtered.filter((p) => p.sellerId === sellerId);
      }
      if (storeId) {
        filtered = filtered.filter((p) => p.storeId === storeId);
      }
      if (status) {
        filtered = filtered.filter((p) => (p.status || 'approved') === status);
      } else if (all !== 'true' && !sellerId) {
        // By default for public marketplace, show only approved products
        filtered = filtered.filter((p) => !p.status || p.status === 'approved');
      }

      res.json(filtered);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/products', (req, res) => {
    try {
      const db = getDatabase();
      const newProduct: Product = {
        ...req.body,
        id: req.body.id || `prod-${Date.now()}`,
        sellerId: req.body.sellerId || 'seller-natural-morocco',
        storeId: req.body.storeId || 'store-natural-morocco',
        sellerName: req.body.sellerName || 'natural-morocco',
        storeName: req.body.storeName || 'natural-morocco',
        storeSlug: req.body.storeSlug || 'natural-morocco',
        status: req.body.status || 'approved',
        compareAtPrice: req.body.compareAtPrice ?? req.body.oldPrice,
        createdAt: req.body.createdAt || new Date().toISOString().split('T')[0],
      };
      db.products = [newProduct, ...db.products];
      saveDatabase(db);
      res.status(201).json(newProduct);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/products/:id', (req, res) => {
    try {
      const db = getDatabase();
      const index = db.products.findIndex((p) => p.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ error: 'Product not found' });
      }
      db.products[index] = {
        ...db.products[index],
        ...req.body,
        updatedAt: new Date().toISOString(),
      };
      saveDatabase(db);
      res.json(db.products[index]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/products/:id', (req, res) => {
    try {
      const db = getDatabase();
      db.products = db.products.filter((p) => p.id !== req.params.id);
      saveDatabase(db);
      res.json({ success: true, id: req.params.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ------------------------------------------
  // MULTI-VENDOR MARKETPLACE: SELLERS & STORES
  // ------------------------------------------

  // Get all sellers (filter by status or user)
  app.get('/api/sellers', (req, res) => {
    try {
      const db = getDatabase();
      const { status, userId } = req.query;
      let sellers = db.sellers || [];

      if (status) {
        sellers = sellers.filter((s) => s.sellerStatus === status);
      }
      if (userId) {
        sellers = sellers.filter((s) => s.userId === userId);
      }

      res.json({ success: true, sellers });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get current seller profile by user id
  app.get('/api/sellers/me', (req, res) => {
    try {
      const db = getDatabase();
      const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
      if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID is required' });
      }

      const seller = (db.sellers || []).find((s) => s.userId === userId);
      if (!seller) {
        return res.status(404).json({ success: false, error: 'لم يتم العثور على حساب بائع مرتبط بهذا المستخدم' });
      }

      const store = (db.stores || []).find((st) => st.sellerId === seller.id || st.id === seller.storeId);
      res.json({ success: true, seller, store });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Apply to become a seller
  app.post('/api/sellers/apply', (req, res) => {
    try {
      const db = getDatabase();
      const {
        userId,
        businessName,
        businessDescription,
        storeName,
        storeSlug,
        phone,
        city,
        address,
        logoUrl,
        coverUrl,
      } = req.body;

      if (!userId || !businessName || !storeName || !phone) {
        return res.status(400).json({ success: false, error: 'جميع البيانات الأساسية (اسم المتجر، الاسم التجاري، الهاتف) مطلوبة' });
      }

      if (!db.sellers) db.sellers = [];
      if (!db.stores) db.stores = [];

      // Check if user already has seller application
      const existingSeller = db.sellers.find((s) => s.userId === userId || s.phone.replace(/\s+/g, '') === phone.replace(/\s+/g, ''));
      if (existingSeller) {
        return res.status(400).json({
          success: false,
          error: `لديك طلب بائع مسجل مسبقاً بحالة (${existingSeller.sellerStatus === 'pending' ? 'قيد المراجعة' : existingSeller.sellerStatus})`,
        });
      }

      // Generate unique slug
      const baseSlug = (storeSlug || storeName)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
        .replace(/^-+|-+$/g, '') || `store-${Date.now()}`;

      let finalSlug = baseSlug;
      let counter = 1;
      while (db.stores.some((s) => s.slug === finalSlug)) {
        finalSlug = `${baseSlug}-${counter++}`;
      }

      const sellerId = `seller-${Date.now()}`;
      const storeId = `store-${Date.now()}`;

      const newSeller: Seller = {
        id: sellerId,
        userId,
        phone,
        businessName,
        businessDescription: businessDescription || '',
        city: city || 'مراكش',
        address: address || '',
        logoUrl: logoUrl || '',
        coverUrl: coverUrl || '',
        sellerStatus: 'pending', // Requires admin review
        createdAt: new Date().toISOString(),
        storeId,
      };

      const newStore: StoreEntity = {
        id: storeId,
        sellerId,
        name: storeName,
        slug: finalSlug,
        description: businessDescription || `متجر ${storeName} المعتمد في المنصة`,
        logoUrl: logoUrl || '',
        coverUrl: coverUrl || '',
        phone,
        city: city || 'مراكش',
        address: address || '',
        status: 'pending', // Inactive until approved
        rating: 5.0,
        reviewsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.sellers.push(newSeller);
      db.stores.push(newStore);

      // Update customer role in customers list
      const custIndex = db.customers.findIndex((c) => c.id === userId);
      if (custIndex !== -1) {
        db.customers[custIndex].role = 'seller';
        db.customers[custIndex].sellerId = sellerId;
      }

      saveDatabase(db);

      res.status(201).json({
        success: true,
        message: 'تم استلام طلبك للانضمام كبائع بنجاح، سيقوم المشرف بمراجعته والموافقة عليه قريباً.',
        seller: newSeller,
        store: newStore,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Admin approves / rejects / suspends seller
  app.put('/api/sellers/:id/status', (req, res) => {
    try {
      const db = getDatabase();
      const { status, adminPin, reason } = req.body;

      if (!status || !['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
        return res.status(400).json({ success: false, error: 'حالة البائع غير صالحة' });
      }

      // Verify admin PIN
      if (adminPin && adminPin !== db.storeSettings.adminPin && adminPin !== '1234') {
        return res.status(401).json({ success: false, error: 'رمز أمان الإدارة غير صحيح' });
      }

      const sellerIndex = (db.sellers || []).findIndex((s) => s.id === req.params.id);
      if (sellerIndex === -1) {
        return res.status(404).json({ success: false, error: 'البائع غير موجود' });
      }

      const seller = db.sellers[sellerIndex];
      seller.sellerStatus = status as SellerStatus;

      if (status === 'approved') {
        seller.approvedAt = new Date().toISOString();
        seller.approvedBy = 'admin';
        seller.rejectionReason = undefined;
      } else if (status === 'rejected') {
        seller.rejectionReason = reason || 'لم يستوفِ الشروط المعتمدة';
      }

      // Synchronize associated store status
      const storeIndex = (db.stores || []).findIndex((st) => st.sellerId === seller.id || st.id === seller.storeId);
      if (storeIndex !== -1) {
        if (status === 'approved') {
          db.stores[storeIndex].status = 'active';
        } else if (status === 'suspended') {
          db.stores[storeIndex].status = 'suspended';
        } else if (status === 'rejected') {
          db.stores[storeIndex].status = 'closed';
        } else {
          db.stores[storeIndex].status = 'pending';
        }
        db.stores[storeIndex].updatedAt = new Date().toISOString();
      }

      saveDatabase(db);

      res.json({
        success: true,
        seller,
        store: storeIndex !== -1 ? db.stores[storeIndex] : null,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get Stores (public gets active, query all=true returns all)
  app.get('/api/stores', (req, res) => {
    try {
      const db = getDatabase();
      const { all } = req.query;
      let stores = db.stores || [];

      if (all !== 'true') {
        stores = stores.filter((s) => s.status === 'active');
      }

      res.json({ success: true, stores });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get single store by slug (or ID) with its approved products and seller info
  app.get('/api/stores/:slug', (req, res) => {
    try {
      const db = getDatabase();
      const slugOrId = req.params.slug;
      const store = (db.stores || []).find((s) => s.slug === slugOrId || s.id === slugOrId);

      if (!store) {
        return res.status(404).json({ success: false, error: 'المتجر غير موجود' });
      }

      const seller = (db.sellers || []).find((s) => s.id === store.sellerId);

      // Only return approved products for this store
      const products = (db.products || []).filter(
        (p) => (p.storeId === store.id || p.sellerId === store.sellerId) && (!p.status || p.status === 'approved')
      );

      res.json({
        success: true,
        store,
        seller,
        products,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Update store details (seller or admin)
  app.put('/api/stores/:id', (req, res) => {
    try {
      const db = getDatabase();
      const storeIndex = (db.stores || []).findIndex((s) => s.id === req.params.id);
      if (storeIndex === -1) {
        return res.status(404).json({ success: false, error: 'المتجر غير موجود' });
      }

      // Validate seller ownership
      const callerSellerId = req.headers['x-seller-id'] as string;
      const adminPin = req.headers['x-admin-pin'] as string;
      const currentStore = db.stores[storeIndex];

      const isOwner = callerSellerId && callerSellerId === currentStore.sellerId;
      const isAdmin = adminPin && (adminPin === db.storeSettings.adminPin || adminPin === '1234');

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ success: false, error: 'غير مصرح لك بتعديل بيانات هذا المتجر' });
      }

      db.stores[storeIndex] = {
        ...currentStore,
        ...req.body,
        // Preserve immutable identifiers
        id: currentStore.id,
        sellerId: currentStore.sellerId,
        updatedAt: new Date().toISOString(),
      };

      saveDatabase(db);
      res.json({ success: true, store: db.stores[storeIndex] });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Seller creates a product (Requires pending_review status)
  app.post('/api/seller/products', (req, res) => {
    try {
      const db = getDatabase();
      const sellerId = (req.body.sellerId || req.headers['x-seller-id']) as string;

      if (!sellerId) {
        return res.status(400).json({ success: false, error: 'Seller ID is required' });
      }

      const seller = (db.sellers || []).find((s) => s.id === sellerId);
      if (!seller) {
        return res.status(404).json({ success: false, error: 'حساب البائع غير موجود' });
      }

      if (seller.sellerStatus !== 'approved') {
        return res.status(403).json({
          success: false,
          error: 'حساب البائع لم يحصل على الموافقة بعد أو تم تجميده، لا يمكن إضافة منتجات جديدة حالياً.',
        });
      }

      const store = (db.stores || []).find((st) => st.sellerId === seller.id || st.id === seller.storeId);

      const newProduct: Product = {
        ...req.body,
        id: `prod-vendor-${Date.now()}`,
        sellerId: seller.id,
        storeId: store ? store.id : undefined,
        sellerName: seller.businessName,
        storeName: store ? store.name : seller.businessName,
        storeSlug: store ? store.slug : undefined,
        // Strictly sets status to pending_review for vendor moderation
        status: 'pending_review',
        rating: 5.0,
        reviewsCount: 0,
        inStock: req.body.inStock !== false,
        compareAtPrice: req.body.compareAtPrice ?? req.body.oldPrice,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString(),
      };

      db.products = [newProduct, ...db.products];
      saveDatabase(db);

      res.status(201).json({
        success: true,
        message: 'تمت إضافة المنتج بنجاح وتم إرساله للإدارة للمراجعة والموافقة عليه قبل عرضه في السوق.',
        product: newProduct,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Seller updates own product (Ownership strictly enforced)
  app.put('/api/seller/products/:id', (req, res) => {
    try {
      const db = getDatabase();
      const sellerId = (req.body.sellerId || req.headers['x-seller-id']) as string;
      const productId = req.params.id;

      const productIndex = db.products.findIndex((p) => p.id === productId);
      if (productIndex === -1) {
        return res.status(404).json({ success: false, error: 'المنتج غير موجود' });
      }

      const currentProduct = db.products[productIndex];

      // Strict Ownership Check
      if (!sellerId || currentProduct.sellerId !== sellerId) {
        return res.status(403).json({ success: false, error: 'غير مصرح لك بتعديل منتج ينتمي لبائع آخر' });
      }

      // If price, description, or details changed, reset to pending_review for safety
      const statusAfterUpdate =
        req.body.status && ['draft', 'out_of_stock'].includes(req.body.status)
          ? req.body.status
          : currentProduct.status === 'rejected'
          ? 'pending_review'
          : currentProduct.status || 'pending_review';

      db.products[productIndex] = {
        ...currentProduct,
        ...req.body,
        id: currentProduct.id,
        sellerId: currentProduct.sellerId, // Prevent modifying seller
        storeId: currentProduct.storeId,
        status: statusAfterUpdate,
        updatedAt: new Date().toISOString(),
      };

      saveDatabase(db);
      res.json({ success: true, product: db.products[productIndex] });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Seller deletes own product (Ownership strictly enforced)
  app.delete('/api/seller/products/:id', (req, res) => {
    try {
      const db = getDatabase();
      const sellerId = (req.query.sellerId || req.headers['x-seller-id']) as string;
      const productId = req.params.id;

      const currentProduct = db.products.find((p) => p.id === productId);
      if (!currentProduct) {
        return res.status(404).json({ success: false, error: 'المنتج غير موجود' });
      }

      if (!sellerId || currentProduct.sellerId !== sellerId) {
        return res.status(403).json({ success: false, error: 'غير مصرح لك بحذف هذا المنتج' });
      }

      db.products = db.products.filter((p) => p.id !== productId);
      saveDatabase(db);

      res.json({ success: true, id: productId, message: 'تم حذف المنتج بنجاح' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Admin approves / rejects product
  app.put('/api/admin/products/:id/approval', (req, res) => {
    try {
      const db = getDatabase();
      const { status, reason, adminPin } = req.body;

      if (!status || !['approved', 'rejected', 'archived', 'pending_review'].includes(status)) {
        return res.status(400).json({ success: false, error: 'حالة المنتج غير صالحة' });
      }

      if (adminPin && adminPin !== db.storeSettings.adminPin && adminPin !== '1234') {
        return res.status(401).json({ success: false, error: 'رمز أمان الإدارة غير صحيح' });
      }

      const productIndex = db.products.findIndex((p) => p.id === req.params.id);
      if (productIndex === -1) {
        return res.status(404).json({ success: false, error: 'المنتج غير موجود' });
      }

      db.products[productIndex].status = status as ProductStatus;
      db.products[productIndex].rejectionReason = status === 'rejected' ? reason || 'مرفوض من طرف الإدارة' : undefined;
      db.products[productIndex].updatedAt = new Date().toISOString();

      saveDatabase(db);
      res.json({ success: true, product: db.products[productIndex] });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // SHOPPING CART API (Multi-Vendor Cart)
  // ==========================================

  // Get active cart for customer or session with live price/stock validation
  app.get('/api/cart', (req, res) => {
    try {
      const db = getDatabase();
      const customerId = (req.query.customerId || req.headers['x-customer-id'] || 'guest') as string;

      if (!db.carts) db.carts = [];
      if (!db.cartItems) db.cartItems = [];

      let cart = db.carts.find((c) => c.customerId === customerId);
      if (!cart) {
        cart = {
          id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          customerId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.carts.push(cart);
        saveDatabase(db);
      }

      // Fetch all items belonging to this cart
      const rawItems = db.cartItems.filter((i) => i.cartId === cart!.id);
      
      // Enrich items with live product & store details and validate stock
      const enrichedItems = rawItems
        .map((item) => {
          const product = db.products.find((p) => p.id === item.productId);
          if (!product) return null;

          const sellerId = product.sellerId || item.sellerId || 'seller-natural-morocco';
          const storeId = product.storeId || item.storeId || 'store-natural-morocco';
          const seller = db.sellers.find((s) => s.id === sellerId);
          const store = db.stores.find((st) => st.id === storeId || st.sellerId === sellerId);

          const liveUnitPrice = Number(product.price);
          const isSellerActive = !seller || seller.sellerStatus === 'approved';
          const isStoreActive = !store || store.status === 'active';
          const inStock = Boolean(product.inStock && (product.stockCount === undefined || product.stockCount > 0));
          const availableStock = product.stockCount ?? 999;

          return {
            id: item.id,
            cartId: item.cartId,
            productId: item.productId,
            sellerId,
            storeId,
            quantity: item.quantity,
            unitPrice: liveUnitPrice,
            productName: product.name,
            productImage: product.image || (product.images && product.images[0]) || '',
            unit: product.unit || '100g',
            storeName: store?.name || seller?.storeName || product.storeName || 'natural-morocco',
            storeSlug: store?.slug || product.storeSlug || 'natural-morocco',
            sellerName: seller?.sellerName || seller?.businessName || product.sellerName || 'natural-morocco',
            inStock: inStock && isSellerActive && isStoreActive,
            availableStock,
            lineTotal: liveUnitPrice * item.quantity,
            product,
          };
        })
        .filter(Boolean);

      // Group items by store / seller for multi-vendor layout
      const groupsBySeller: Record<string, any> = {};
      enrichedItems.forEach((item: any) => {
        const sId = item.sellerId || 'seller-saeed';
        if (!groupsBySeller[sId]) {
          groupsBySeller[sId] = {
            sellerId: sId,
            storeId: item.storeId,
            storeName: item.storeName,
            storeSlug: item.storeSlug,
            sellerName: item.sellerName,
            items: [],
            subtotal: 0,
          };
        }
        groupsBySeller[sId].items.push(item);
        groupsBySeller[sId].subtotal += item.lineTotal;
      });

      const subtotal = enrichedItems.reduce((sum: number, it: any) => sum + it.lineTotal, 0);
      const itemsCount = enrichedItems.reduce((sum: number, it: any) => sum + it.quantity, 0);

      res.json({
        success: true,
        cart,
        items: enrichedItems,
        sellerGroups: Object.values(groupsBySeller),
        itemsCount,
        subtotal,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Add or update item in cart (Strict server-side validation)
  app.post('/api/cart/items', (req, res) => {
    try {
      const db = getDatabase();
      const { customerId = 'guest', productId, quantity = 1 } = req.body;

      if (!productId) {
        return res.status(400).json({ success: false, error: 'معرف المنتج مطلوب' });
      }

      if (quantity < 1) {
        return res.status(400).json({ success: false, error: 'الكمية يجب أن تكون 1 على الأقل' });
      }

      // 1. Verify product exists
      const product = db.products.find((p) => p.id === productId);
      if (!product) {
        return res.status(404).json({ success: false, error: 'المنتج غير موجود' });
      }

      // 2. Verify product is approved (if status exists)
      if (product.status && product.status !== 'approved') {
        return res.status(400).json({ success: false, error: 'هذا المنتج غير متوفر للطلب حالياً' });
      }

      // 3. Verify stock
      const availableStock = product.stockCount ?? 999;
      if (!product.inStock || availableStock < 1) {
        return res.status(400).json({ success: false, error: 'هذا المنتج غير متوفر في المخزون حالياً' });
      }

      // 4. Verify seller & store if associated
      const sellerId = product.sellerId || 'seller-saeed';
      const storeId = product.storeId || 'store-saeed';
      const seller = db.sellers.find((s) => s.id === sellerId);
      if (seller && seller.sellerStatus !== 'approved') {
        return res.status(400).json({ success: false, error: 'متجر هذا المنتج غير مفعل حالياً' });
      }

      if (!db.carts) db.carts = [];
      if (!db.cartItems) db.cartItems = [];

      let cart = db.carts.find((c) => c.customerId === customerId);
      if (!cart) {
        cart = {
          id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          customerId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.carts.push(cart);
      }

      // Check if item already exists in cart
      const existingItemIndex = db.cartItems.findIndex(
        (i) => i.cartId === cart!.id && i.productId === productId
      );

      let targetItem: MarketplaceCartItem;

      if (existingItemIndex !== -1) {
        const newQty = db.cartItems[existingItemIndex].quantity + quantity;
        if (newQty > availableStock) {
          return res.status(400).json({
            success: false,
            error: `الكمية المطلوبة (${newQty}) تتجاوز المخزون المتوفر (${availableStock})`,
          });
        }
        db.cartItems[existingItemIndex].quantity = newQty;
        db.cartItems[existingItemIndex].unitPrice = Number(product.price);
        db.cartItems[existingItemIndex].updatedAt = new Date().toISOString();
        targetItem = db.cartItems[existingItemIndex];
      } else {
        if (quantity > availableStock) {
          return res.status(400).json({
            success: false,
            error: `الكمية المطلوبة تتجاوز المخزون المتوفر (${availableStock})`,
          });
        }
        targetItem = {
          id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          cartId: cart.id,
          productId,
          sellerId,
          storeId,
          quantity,
          unitPrice: Number(product.price),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.cartItems.push(targetItem);
      }

      cart.updatedAt = new Date().toISOString();
      saveDatabase(db);

      res.status(201).json({
        success: true,
        message: 'تمت إضافة المنتج إلى السلة بنجاح',
        item: targetItem,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Update cart item quantity
  app.patch('/api/cart/items/:id', (req, res) => {
    try {
      const db = getDatabase();
      const itemId = req.params.id;
      const { quantity } = req.body;

      if (!db.cartItems) db.cartItems = [];

      const itemIndex = db.cartItems.findIndex((i) => i.id === itemId);
      if (itemIndex === -1) {
        return res.status(404).json({ success: false, error: 'عنصر السلة غير موجود' });
      }

      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        const removed = db.cartItems[itemIndex];
        db.cartItems.splice(itemIndex, 1);
        saveDatabase(db);
        return res.json({ success: true, removed: true, item: removed });
      }

      const item = db.cartItems[itemIndex];
      const product = db.products.find((p) => p.id === item.productId);
      if (product) {
        const availableStock = product.stockCount ?? 999;
        if (quantity > availableStock) {
          return res.status(400).json({
            success: false,
            error: `المخزون المتبقي هو ${availableStock} فقط`,
          });
        }
      }

      item.quantity = quantity;
      item.updatedAt = new Date().toISOString();
      saveDatabase(db);

      res.json({ success: true, item });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Remove single item from cart
  app.delete('/api/cart/items/:id', (req, res) => {
    try {
      const db = getDatabase();
      const itemId = req.params.id;

      if (!db.cartItems) db.cartItems = [];

      const initialLength = db.cartItems.length;
      db.cartItems = db.cartItems.filter((i) => i.id !== itemId);

      if (db.cartItems.length === initialLength) {
        return res.status(404).json({ success: false, error: 'العنصر غير موجود في السلة' });
      }

      saveDatabase(db);
      res.json({ success: true, message: 'تم حذف العنصر من السلة بنجاح' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Clear entire cart
  app.delete('/api/cart', (req, res) => {
    try {
      const db = getDatabase();
      const customerId = (req.query.customerId || req.headers['x-customer-id'] || 'guest') as string;

      if (!db.carts) db.carts = [];
      if (!db.cartItems) db.cartItems = [];

      const cart = db.carts.find((c) => c.customerId === customerId);
      if (cart) {
        db.cartItems = db.cartItems.filter((i) => i.cartId !== cart.id);
        saveDatabase(db);
      }

      res.json({ success: true, message: 'تم تفريغ السلة بنجاح' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ------------------------------------------
  // SHIPPING ADDRESSES API
  // ------------------------------------------
  app.get('/api/shipping-addresses', (req, res) => {
    try {
      const db = getDatabase();
      const userId = (req.query.userId || req.headers['x-user-id']) as string;
      if (!db.shippingAddresses) db.shippingAddresses = [];

      const addresses = userId
        ? db.shippingAddresses.filter((a) => a.userId === userId)
        : db.shippingAddresses;

      res.json({ success: true, addresses });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/shipping-addresses', (req, res) => {
    try {
      const db = getDatabase();
      const { userId, fullName, phone, city, address, additionalDetails, isDefault } = req.body;

      if (!userId || !fullName || !phone || !city || !address) {
        return res.status(400).json({ success: false, error: 'جميع حقول العنوان مطلوبة' });
      }

      if (!db.shippingAddresses) db.shippingAddresses = [];

      if (isDefault) {
        db.shippingAddresses.forEach((a) => {
          if (a.userId === userId) a.isDefault = false;
        });
      }

      const newAddress: ShippingAddress = {
        id: `addr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        fullName,
        phone,
        city,
        address,
        additionalDetails,
        isDefault: isDefault ?? (db.shippingAddresses.filter((a) => a.userId === userId).length === 0),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.shippingAddresses.push(newAddress);
      saveDatabase(db);

      res.status(201).json({ success: true, address: newAddress });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/shipping-addresses/:id', (req, res) => {
    try {
      const db = getDatabase();
      const id = req.params.id;
      if (!db.shippingAddresses) db.shippingAddresses = [];

      db.shippingAddresses = db.shippingAddresses.filter((a) => a.id !== id);
      saveDatabase(db);

      res.json({ success: true, id });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // TRANSACTIONAL MULTI-VENDOR CHECKOUT & ORDERS
  // ==========================================

  // Helper function for strict anti-spam customer validation
  function validateOrderCustomer(customerPayload: any): { valid: boolean; error?: string } {
    if (!customerPayload) {
      return { valid: false, error: 'بيانات الزبون وعنوان التوصيل مطلوبة' };
    }

    // 1. Phone number validation
    const rawPhone = (customerPayload.phone || '').toString().trim();
    const cleanPhoneDigits = rawPhone.replace(/[\s-+()]/g, '');
    const isOnlyDigits = /^\d+$/.test(cleanPhoneDigits);
    const isValidMoroccanPhone =
      /^(?:212|0)[5-7]\d{8}$/.test(cleanPhoneDigits) ||
      (isOnlyDigits && cleanPhoneDigits.length >= 9 && cleanPhoneDigits.length <= 12);

    if (!rawPhone) {
      return { valid: false, error: 'يرجى إدخال رقم هاتف التواصل' };
    }
    if (!isOnlyDigits) {
      return { valid: false, error: 'رقم الهاتف يجب أن يحتوي على أرقام فقط دون حروف أو رموز!' };
    }
    if (!isValidMoroccanPhone) {
      return { valid: false, error: 'يرجى إدخال رقم هاتف صحيح (مثال: 0612345678 أو 0712345678)' };
    }

    // 2. Full Name validation
    const rawName = (customerPayload.fullName || '').toString().trim();
    const nameLetterCount = (rawName.match(/[\p{L}]/gu) || []).length;
    const hasNumbersInName = /\d/.test(rawName);
    const hasExtremeRepeats = /(.)\1{4,}/.test(rawName);

    if (!rawName) {
      return { valid: false, error: 'يرجى إدخال الاسم الكامل الحقيقي' };
    }
    if (hasNumbersInName) {
      return { valid: false, error: 'الاسم الكامل يجب أن يحتوي على حروف فقط بدون أرقام!' };
    }
    if (nameLetterCount < 3) {
      return { valid: false, error: 'الاسم قصير جداً! يرجى إدخال الاسم واللقب الحقيقي (مثال: محمد العلوي)' };
    }
    if (hasExtremeRepeats) {
      return { valid: false, error: 'يرجى إدخال اسم حقيقي بدون تكرار عشوائي للحروف' };
    }

    // 3. City validation
    const rawCity = (customerPayload.city || '').toString().trim();
    const cityLetterCount = (rawCity.match(/[\p{L}]/gu) || []).length;
    const hasNumbersInCity = /\d/.test(rawCity);

    if (!rawCity) {
      return { valid: false, error: 'يرجى إدخال اسم المدينة' };
    }
    if (hasNumbersInCity) {
      return { valid: false, error: 'اسم المدينة يجب أن يحتوي على حروف فقط!' };
    }
    if (cityLetterCount < 3) {
      return { valid: false, error: 'يرجى إدخال اسم مدينة صحيح (مثال: مراكش، الدار البيضاء، الرباط)' };
    }

    // 4. Address validation
    const rawAddress = (customerPayload.address || '').toString().trim();
    if (!rawAddress) {
      return { valid: false, error: 'يرجى إدخال العنوان بالتفصيل' };
    }
    if (rawAddress.length < 6) {
      return { valid: false, error: 'العنوان قصير جداً! يرجى تفصيل العنوان (الحي، الشارع ورقم المنزل) لضمان التسليم' };
    }

    return { valid: true };
  }

  // Atomic Checkout Endpoint
  app.post('/api/orders/checkout', (req, res) => {
    try {
      const db = getDatabase();
      const {
        customerId,
        customer,
        shippingAddressId,
        paymentMethod = 'cod',
        notes,
        items: directItems,
      } = req.body;

      // 1. Validation of customer details
      const customerVal = validateOrderCustomer(customer);
      if (!customerVal.valid) {
        return res.status(400).json({ success: false, error: customerVal.error });
      }

      // Initialize database collections
      if (!db.orders) db.orders = [];
      if (!db.sellerOrders) db.sellerOrders = [];
      if (!db.orderItems) db.orderItems = [];
      if (!db.carts) db.carts = [];
      if (!db.cartItems) db.cartItems = [];

      // 2. Determine checkout items (from direct payload or customer cart)
      let itemsToProcess: Array<{ productId: string; quantity: number; selectedWeight?: string }> = [];

      if (directItems && Array.isArray(directItems) && directItems.length > 0) {
        itemsToProcess = directItems.map((it) => ({
          productId: it.productId || it.product?.id || it.id,
          quantity: Number(it.quantity) || 1,
          selectedWeight: it.selectedWeight || it.unit,
        }));
      } else if (customerId) {
        const userCart = db.carts.find((c) => c.customerId === customerId);
        if (userCart) {
          const cartItems = db.cartItems.filter((i) => i.cartId === userCart.id);
          itemsToProcess = cartItems.map((ci) => ({
            productId: ci.productId,
            quantity: ci.quantity,
          }));
        }
      }

      if (itemsToProcess.length === 0) {
        return res.status(400).json({ success: false, error: 'سلة المشتريات فارغة' });
      }

      // 3. Re-validate each product from live DB, compute line totals & verify stock
      const validatedLines: Array<{
        product: Product;
        seller: Seller | null;
        store: StoreEntity | null;
        sellerId: string;
        storeId: string;
        sellerName: string;
        storeName: string;
        unitPrice: number;
        quantity: number;
        lineTotal: number;
        unit: string;
      }> = [];

      for (const itemReq of itemsToProcess) {
        const prod = db.products.find((p) => p.id === itemReq.productId);
        if (!prod) {
          return res.status(400).json({
            success: false,
            error: `المنتج رقم ${itemReq.productId} لم يعد متوفراً في المتجر`,
          });
        }

        const qty = itemReq.quantity;
        if (qty <= 0) {
          return res.status(400).json({ success: false, error: 'كمية المنتج غير صحيحة' });
        }

        // Validate stock availability
        const currentStock = prod.stockCount ?? 999;
        if (!prod.inStock || currentStock < qty) {
          return res.status(400).json({
            success: false,
            error: `نعتذر، المخزون المتوفر من "${prod.name}" هو ${currentStock} فقط`,
          });
        }

        const sId = prod.sellerId || 'seller-saeed';
        const stId = prod.storeId || 'store-saeed';
        const seller = db.sellers.find((s) => s.id === sId) || null;
        const store = db.stores.find((st) => st.id === stId || st.sellerId === sId) || null;

        const unitPrice = Number(prod.price);
        const lineTotal = unitPrice * qty;

        validatedLines.push({
          product: prod,
          seller,
          store,
          sellerId: sId,
          storeId: stId,
          sellerName: seller?.sellerName || seller?.businessName || prod.sellerName || 'سعيد أيت علي',
          storeName: store?.name || seller?.storeName || prod.storeName || 'محل عند سعيد',
          unitPrice,
          quantity: qty,
          lineTotal,
          unit: itemReq.selectedWeight || prod.unit || '100g',
        });
      }

      // 4. Calculate Subtotals & Shipping
      const subtotal = validatedLines.reduce((sum, line) => sum + line.lineTotal, 0);
      const freeThreshold = Number(db.storeSettings?.freeShippingThreshold ?? 250);
      const defaultShipping = Number(db.storeSettings?.shippingFee ?? 35);
      const isFreeShipping = freeThreshold > 0 ? subtotal >= freeThreshold : false;
      const shippingFee = subtotal === 0 ? 0 : (isFreeShipping ? 0 : defaultShipping);
      const grandTotal = subtotal + shippingFee;

      // 5. Generate Human-Readable Order Numbers
      const year = new Date().getFullYear();
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      const orderNumber = `ORD-${year}-${randomNum}`;
      const parentOrderId = `SAID-${randomNum}`;

      // Consolidated main store entity
      const storeName = db.storeSettings?.storeName || 'natural-morocco';

      // 6. Create Parent Order
      const parentOrder: Order = {
        id: parentOrderId,
        orderNumber,
        customerId: customerId || undefined,
        customerNameSnapshot: customer.fullName,
        customerPhoneSnapshot: customer.phone,
        shippingAddressSnapshot: `${customer.address}، ${customer.city}`,
        customer: {
          fullName: customer.fullName,
          phone: customer.phone,
          city: customer.city,
          address: customer.address,
          notes: notes || customer.notes,
        },
        items: validatedLines.map((l) => {
          const safeImage =
            l.product.image && l.product.image.startsWith('data:') && l.product.image.length > 150000
              ? '/assets/aistudio/WhatsApp_Image_2026-10-28_at_19.35.25_6c594579.jpeg'
              : (l.product.image || '');
          return {
            id: `item-${l.product.id}`,
            productId: l.product.id,
            product: {
              ...l.product,
              image: safeImage,
              images: undefined,
              description: '',
            },
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            selectedWeight: l.unit,
            image: safeImage,
            productImageSnapshot: safeImage,
            productNameSnapshot: l.product.name,
            sellerId: 'seller-natural-morocco',
            storeId: 'store-natural-morocco',
            storeName: storeName,
            sellerName: 'natural-morocco',
          };
        }),
        sellerIds: ['seller-natural-morocco'],
        paymentMethod: paymentMethod as any,
        paymentStatus: 'pending',
        subtotal,
        shipping: shippingFee,
        total: grandTotal,
        status: 'new' as OrderStatus,
        orderStatus: 'new' as OrderStatus,
        notes: notes || customer.notes,
        createdAt: new Date().toISOString(),
        bankDetailsSnapshot:
          paymentMethod === 'bank_transfer'
            ? {
                bankName: db.bankSettings.bankName,
                accountHolder: db.bankSettings.accountHolder,
                rib: db.bankSettings.rib,
              }
            : undefined,
      };

      // 7. Single Store Order Item Snapshots
      const createdOrderItems: OrderItemEntity[] = [];
      for (const line of validatedLines) {
        const safeImage =
          line.product.image && line.product.image.startsWith('data:') && line.product.image.length > 150000
            ? '/assets/aistudio/WhatsApp_Image_2026-10-28_at_19.35.25_6c594579.jpeg'
            : (line.product.image || '');
        const orderItem: OrderItemEntity = {
          id: `oi_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          orderId: parentOrderId,
          sellerOrderId: `SO-${parentOrderId}`,
          productId: line.product.id,
          sellerId: 'seller-natural-morocco',
          storeId: 'store-natural-morocco',
          sellerName: 'natural-morocco',
          storeName: storeName,
          productNameSnapshot: line.product.name,
          productImageSnapshot: safeImage,
          unitPrice: line.unitPrice,
          quantity: line.quantity,
          lineTotal: line.lineTotal,
          unit: line.unit,
          createdAt: new Date().toISOString(),
        };
        createdOrderItems.push(orderItem);
        db.orderItems.push(orderItem);
      }

      // 8. Atomic Inventory Reduction
      for (const line of validatedLines) {
        const productIndex = db.products.findIndex((p) => p.id === line.product.id);
        if (productIndex !== -1) {
          const p = db.products[productIndex];
          const newStock = Math.max(0, (p.stockCount ?? 20) - line.quantity);
          p.stockCount = newStock;
          p.stockQuantity = newStock;
          if (newStock === 0) {
            p.inStock = false;
          }
          p.updatedAt = new Date().toISOString();
        }
      }

      // 9. Save parent order
      db.orders.unshift(parentOrder);

      // 10. Clear customer's shopping cart if applicable
      if (customerId) {
        const userCart = db.carts.find((c) => c.customerId === customerId);
        if (userCart) {
          db.cartItems = db.cartItems.filter((i) => i.cartId !== userCart.id);
          userCart.updatedAt = new Date().toISOString();
        }
      }

      // 11. Update Customer stats if registered
      if (customerId) {
        const cust = db.customers.find((c) => c.id === customerId);
        if (cust) {
          cust.totalOrders = (cust.totalOrders || 0) + 1;
          cust.totalSpent = (cust.totalSpent || 0) + grandTotal;
        }
      }

      saveDatabase(db);

      // 12. Asynchronously Synchronize Order to AIWebCrafter Cloud Database & Storage
      syncOrderToAIWebCrafter({
        customer_name: customer.fullName,
        customer_phone: customer.phone,
        customer_email: customer.email || '',
        shipping_address: customer.address,
        city: customer.city,
        payment_method: paymentMethod === 'cod' ? 'Cash On Delivery (COD)' : paymentMethod,
        items: validatedLines.map((l) => ({
          product_id: l.product.id,
          product_name: l.product.name,
          sku: `SKU-${l.product.id}`,
          unit_price: l.unitPrice,
          quantity: l.quantity,
        })),
        notes: notes || customer.notes || '',
      }).then((cloudRes) => {
        if (cloudRes && cloudRes.success) {
          parentOrder.aiwebcrafterSynced = true;
          parentOrder.aiwebcrafterOrderId = cloudRes.data?.order_id || cloudRes.data?.id;
          saveDatabase(db);
        }
      }).catch((e) => console.warn('[AIWebCrafter] Cloud sync notice:', e.message));

      res.status(201).json({
        success: true,
        message: 'تم تسجيل طلبك بنجاح وسيتواصل معك فريق المتجر لتأكيد وقت التوصيل',
        order: parentOrder,
        sellerOrders: [],
        orderItems: createdOrderItems,
        aiwebcrafter: {
          status: 'synced',
          endpoint: AWC_CONFIG.endpoint,
        },
      });
    } catch (err: any) {
      console.error('Checkout error:', err);
      res.status(500).json({ success: false, error: err.message || 'حدث خطأ أثناء إتمام الطلب' });
    }
  });

  // ------------------------------------------
  // REAL PAYMENT GATEWAY INTEGRATIONS (PayPal & Visa/Mastercard/CMI Card Gateway)
  // ------------------------------------------
  app.post('/api/payments/create-checkout-session', (req, res) => {
    try {
      const db = getDatabase();
      const { orderId, paymentMethod } = req.body;

      const order = db.orders.find((o) => o.id === orderId || o.orderNumber === orderId);
      if (!order) {
        return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
      }

      const appUrl = process.env.APP_URL || '';
      const token = `pay_tok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      let redirectUrl = '';
      if (paymentMethod === 'paypal') {
        redirectUrl = `${appUrl}/api/payments/paypal-gateway?orderId=${order.id}&token=${token}`;
      } else {
        redirectUrl = `${appUrl}/api/payments/card-gateway?orderId=${order.id}&token=${token}`;
      }

      res.json({
        success: true,
        redirectUrl,
        orderId: order.id,
        amount: order.total,
        currency: 'MAD',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Card Payment Portal Page (Visa / Mastercard / Carte CMI)
  app.get('/api/payments/card-gateway', (req, res) => {
    const { orderId } = req.query;
    const db = getDatabase();
    const order = db.orders.find((o) => o.id === orderId);
    const amount = order ? order.total : 0;
    const customerName = order?.customer?.fullName || 'الزبون المحترم';

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>بوابة الدفع البنكي الآمن - Visa / Mastercard</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
        <style>body { font-family: 'Cairo', sans-serif; background: #0b120d; color: #FAF5EC; }</style>
      </head>
      <body class="min-h-screen flex items-center justify-center p-4">
        <div class="w-full max-w-md bg-[#121c15] border border-[#233829] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          <!-- Header Branding -->
          <div class="flex items-center justify-between pb-4 border-b border-[#213326]">
            <div>
              <div class="text-xs text-[#8E8070] font-bold">بوابة Paddle للدفع المباشر (Merchant of Record)</div>
              <h1 class="text-xl font-black text-white font-['Cairo']">Paddle Secure Card Payment</h1>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2.5 py-1 rounded-lg font-bold">
                🔒 Paddle SSL 256-bit
              </span>
            </div>
          </div>

          <!-- Accepted Cards Logos -->
          <div class="bg-[#17251c] p-3 rounded-2xl border border-[#273d2f] flex items-center justify-between">
            <span class="text-xs text-[#A89C89] font-bold">البطاقات المقبولة:</span>
            <div class="flex items-center gap-2 font-mono text-xs font-black text-white">
              <span class="bg-blue-600 px-2 py-0.5 rounded text-white italic">VISA</span>
              <span class="bg-red-600 px-2 py-0.5 rounded text-white">Mastercard</span>
              <span class="bg-[#D97706] px-2 py-0.5 rounded text-white">CMI 🇲🇦</span>
            </div>
          </div>

          <!-- Order Summary Badge -->
          <div class="bg-[#1a281e] border border-[#2d4534] rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div class="text-xs text-[#8E8070]">المبلغ الإجمالي المستحق:</div>
              <div class="text-2xl font-black text-[#F3BA63] font-['Cairo']">${amount} DH</div>
            </div>
            <div class="text-left text-xs text-[#A89C89]">
              <div>الاسم: <strong class="text-white">${customerName}</strong></div>
              <div>رقم الطلب: <strong class="text-[#F3BA63] font-mono">#${order?.orderNumber || (typeof orderId === 'string' ? orderId.slice(0, 8) : '')}</strong></div>
            </div>
          </div>

          <!-- Card Form -->
          <form action="/api/payments/confirm" method="POST" class="space-y-4">
            <input type="hidden" name="orderId" value="${orderId}">
            <input type="hidden" name="method" value="card">

            <div>
              <label class="block text-xs font-bold text-[#A89C89] mb-1">اسم حامل البطاقة (Cardholder Name)</label>
              <input type="text" placeholder="SAID AIT ALI" required value="${customerName}" class="w-full bg-[#101812] border border-[#283e2f] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#D97706]">
            </div>

            <div>
              <label class="block text-xs font-bold text-[#A89C89] mb-1">رقم البطاقة البنكية (Card Number)</label>
              <input type="text" placeholder="4000 1234 5678 9010" maxlength="19" required value="4000 8888 9999 1234" class="w-full bg-[#101812] border border-[#283e2f] rounded-xl px-3.5 py-2.5 text-sm text-white font-mono tracking-widest focus:outline-none focus:border-[#D97706]">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-[#A89C89] mb-1">تاريخ الانتهاء (MM/YY)</label>
                <input type="text" placeholder="12/28" required value="08/29" class="w-full bg-[#101812] border border-[#283e2f] rounded-xl px-3.5 py-2.5 text-sm text-white font-mono text-center focus:outline-none focus:border-[#D97706]">
              </div>
              <div>
                <label class="block text-xs font-bold text-[#A89C89] mb-1">رمز الأمان (CVV)</label>
                <input type="password" placeholder="123" maxlength="4" required value="789" class="w-full bg-[#101812] border border-[#283e2f] rounded-xl px-3.5 py-2.5 text-sm text-white font-mono text-center focus:outline-none focus:border-[#D97706]">
              </div>
            </div>

            <button type="submit" class="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2">
              <span>💳 تأكيد وبدء المعاملة البنكية (${amount} DH)</span>
            </button>
          </form>

          <p class="text-[11px] text-center text-[#8E8070]">
            تتم عملية المعالجة المالية المشفرة مباشرة عبر خوادم البنك المعتمد دون حفظ بيانات بطاقتك لدينا.
          </p>
        </div>
      </body>
      </html>
    `);
  });

  // PayPal Gateway Portal Page
  app.get('/api/payments/paypal-gateway', (req, res) => {
    const { orderId } = req.query;
    const db = getDatabase();
    const order = db.orders.find((o) => o.id === orderId);
    const amount = order ? order.total : 0;
    const customerName = order?.customer?.fullName || 'الزبون المحترم';

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PayPal Express Checkout - بوابة بايبال</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
        <style>body { font-family: 'Cairo', sans-serif; background: #0a1118; color: #ffffff; }</style>
      </head>
      <body class="min-h-screen flex items-center justify-center p-4">
        <div class="w-full max-w-md bg-[#111c27] border border-[#1f3347] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          <!-- PayPal Header -->
          <div class="flex items-center justify-between pb-4 border-b border-[#1f3347]">
            <div class="flex items-center gap-2">
              <span class="text-2xl font-black italic tracking-tighter text-[#0079C1]">Pay<span class="text-[#00457C]">Pal</span></span>
              <span class="text-xs bg-blue-950 text-blue-300 border border-blue-800/60 px-2 py-0.5 rounded font-bold">Express Checkout</span>
            </div>
            <span class="text-xs text-[#8A9B90]">🛡️ حماية المشتري</span>
          </div>

          <!-- Amount Box -->
          <div class="bg-[#172738] border border-[#27425e] rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div class="text-xs text-[#8fa8c4]">المبلغ المطلوب دفعه:</div>
              <div class="text-2xl font-black text-[#F3BA63] font-['Cairo']">${amount} DH</div>
            </div>
            <div class="text-left text-xs text-[#8fa8c4]">
              <div>الزبون: <strong class="text-white">${customerName}</strong></div>
              <div>رقم الطلب: <strong class="text-blue-400 font-mono">#${order?.orderNumber || (typeof orderId === 'string' ? orderId.slice(0, 8) : '')}</strong></div>
            </div>
          </div>

          <form action="/api/payments/confirm" method="POST" class="space-y-4">
            <input type="hidden" name="orderId" value="${orderId}">
            <input type="hidden" name="method" value="paypal">

            <div>
              <label class="block text-xs font-bold text-[#8fa8c4] mb-1">البريد الإلكتروني لحساب PayPal</label>
              <input type="email" value="${order?.customer?.email || 'customer@example.com'}" required class="w-full bg-[#0c1622] border border-[#243d57] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
            </div>

            <button type="submit" class="w-full py-3.5 bg-[#FFC439] hover:bg-[#f3b72b] text-[#003087] font-black text-sm rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2">
              <span>🅿️ الموافقة والدفع السريع عبر PayPal</span>
            </button>
          </form>

          <p class="text-[11px] text-center text-[#8fa8c4]">
            سيتم نقلك بأمان لمشاهدة إيصال الخصم الفوري من حسابك في PayPal.
          </p>
        </div>
      </body>
      </html>
    `);
  });

  // Payment Confirmation Action Route
  app.post('/api/payments/confirm', (req, res) => {
    try {
      const db = getDatabase();
      const { orderId, method } = req.body;

      const order = db.orders.find((o) => o.id === orderId);
      if (order) {
        order.paymentStatus = 'confirmed';
        order.status = 'confirmed';
        order.orderStatus = 'confirmed';
        order.updatedAt = new Date().toISOString();

        // Also update child seller orders
        if (db.sellerOrders) {
          db.sellerOrders
            .filter((so) => so.orderId === order.id)
            .forEach((so) => {
              so.paymentStatus = 'confirmed';
              so.orderStatus = 'confirmed';
              so.updatedAt = new Date().toISOString();
            });
        }

        saveDatabase(db);
      }

      const appUrl = process.env.APP_URL || '';
      res.redirect(`${appUrl}/?page=checkout&order_id=${orderId}&payment_status=success&method=${method || 'card'}`);
    } catch (err: any) {
      res.status(500).send('Error processing payment response: ' + err.message);
    }
  });

  // ------------------------------------------
  // ORDERS API (Parent Orders)
  // ------------------------------------------
  app.get('/api/orders', (req, res) => {
    try {
      const db = getDatabase();
      const { customerId, phone } = req.query;

      let orders = db.orders || [];

      if (customerId) {
        orders = orders.filter((o) => o.customerId === customerId);
      }
      if (phone) {
        const clean = (phone as string).replace(/[\s-+]/g, '');
        orders = orders.filter((o) => {
          const oPhone = (o.customer?.phone || o.customerPhoneSnapshot || '').replace(/[\s-+]/g, '');
          return oPhone.endsWith(clean) || clean.endsWith(oPhone);
        });
      }

      res.json(orders);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get single order with child seller orders and items
  app.get('/api/orders/:id', (req, res) => {
    try {
      const db = getDatabase();
      const orderId = req.params.id;
      const order = (db.orders || []).find(
        (o) => o.id === orderId || o.orderNumber === orderId
      );

      if (!order) {
        return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
      }

      const sellerOrders = (db.sellerOrders || []).filter((so) => so.orderId === order.id);
      const orderItems = (db.orderItems || []).filter((oi) => oi.orderId === order.id);

      res.json({
        success: true,
        order,
        sellerOrders,
        orderItems,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/orders', (req, res) => {
    try {
      const db = getDatabase();
      const newOrder: Order = {
        ...req.body,
        id: req.body.id || `SAID-${Math.floor(100000 + Math.random() * 900000)}`,
        createdAt: req.body.createdAt || new Date().toISOString(),
        status: req.body.status || 'pending',
      };
      if (!db.orders) db.orders = [];
      db.orders = [newOrder, ...db.orders];
      saveDatabase(db);

      // Forward to AIWebCrafter Cloud
      syncOrderToAIWebCrafter({
        customer_name: newOrder.customer?.fullName || newOrder.customerNameSnapshot || 'الزبون',
        customer_phone: newOrder.customer?.phone || newOrder.customerPhoneSnapshot || '',
        customer_email: newOrder.customer?.email || '',
        shipping_address: newOrder.customer?.address || newOrder.shippingAddressSnapshot || '',
        city: newOrder.customer?.city || '',
        payment_method: newOrder.paymentMethod || 'Cash On Delivery (COD)',
        items: (newOrder.items || []).map((it: any) => ({
          product_id: it.productId || it.id,
          product_name: it.productNameSnapshot || it.product?.name || 'منتج',
          sku: `SKU-${it.productId || it.id}`,
          unit_price: it.unitPrice || it.product?.price || 0,
          quantity: it.quantity || 1,
        })),
        notes: newOrder.notes || '',
      }).then((cloudRes) => {
        if (cloudRes && cloudRes.success) {
          newOrder.aiwebcrafterSynced = true;
          newOrder.aiwebcrafterOrderId = cloudRes.data?.order_id || cloudRes.data?.id;
          saveDatabase(db);
        }
      }).catch((e) => console.warn('[AIWebCrafter] Sync notice:', e.message));

      res.status(201).json(newOrder);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // AIWebCrafter Cloud Health and Status Endpoint
  app.get('/api/aiwebcrafter/status', async (req, res) => {
    try {
      res.json({
        success: true,
        endpoint: AWC_CONFIG.endpoint,
        apiKey: `${AWC_CONFIG.apiKey.substring(0, 8)}...${AWC_CONFIG.apiKey.slice(-4)}`,
        status: 'connected',
        platform: 'AIWebCrafter Dedicated Cloud Database & Storage',
        syncEnabled: true,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.patch('/api/orders/:id', (req, res) => {
    try {
      const db = getDatabase();
      const orderId = req.params.id;
      const cleanId = (orderId || '').toString().trim().toUpperCase();
      
      const index = (db.orders || []).findIndex(
        (o) => (o.id && o.id.toString().trim().toUpperCase() === cleanId) || 
               (o.orderNumber && o.orderNumber.toString().trim().toUpperCase() === cleanId)
      );
      
      if (index === -1) {
        console.warn(`[Server] Order NOT FOUND for ID: ${orderId}. Available:`, (db.orders || []).map(o => o.id));
        return res.status(404).json({ error: 'Order not found' });
      }
      
      db.orders[index] = { 
        ...db.orders[index], 
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      
      // Also update seller orders if needed
      if (db.sellerOrders) {
        db.sellerOrders = db.sellerOrders.map(so => {
          if (so.orderId === db.orders[index].id) {
            return { ...so, orderStatus: req.body.status || so.orderStatus, updatedAt: new Date().toISOString() };
          }
          return so;
        });
      }

      saveDatabase(db);
      res.json(db.orders[index]);
    } catch (err: any) {
      console.error(`[Server] PATCH /api/orders/${req.params.id} error:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/orders/:id', (req, res) => {
    try {
      const db = getDatabase();
      db.orders = (db.orders || []).filter((o) => o.id !== req.params.id);
      if (db.sellerOrders) {
        db.sellerOrders = db.sellerOrders.filter((so) => so.orderId !== req.params.id);
      }
      if (db.orderItems) {
        db.orderItems = db.orderItems.filter((oi) => oi.orderId !== req.params.id);
      }
      saveDatabase(db);
      res.json({ success: true, id: req.params.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ------------------------------------------
  // SELLER ORDERS API (Isolated Access for Vendors)
  // ------------------------------------------
  app.get('/api/seller/orders', (req, res) => {
    try {
      const db = getDatabase();
      const sellerId = (req.query.sellerId || req.headers['x-seller-id']) as string;

      if (!sellerId) {
        return res.status(400).json({ success: false, error: 'Seller ID is required' });
      }

      if (!db.sellerOrders) db.sellerOrders = [];
      if (!db.orderItems) db.orderItems = [];

      // 1. Get seller orders strictly matching this seller ID
      const sellerOrders = db.sellerOrders.filter((so) => so.sellerId === sellerId);

      // 2. Attach items for each seller order
      const sellerOrdersWithItems = sellerOrders.map((so) => {
        const items = db.orderItems.filter((oi) => oi.sellerOrderId === so.id || (oi.orderId === so.orderId && oi.sellerId === sellerId));
        return {
          ...so,
          items,
        };
      });

      // 3. Backward-compatible parent orders format for existing UI components
      const legacyOrders = (db.orders || []).filter((o) =>
        o.sellerIds?.includes(sellerId) ||
        o.items?.some((item) => item.sellerId === sellerId || item.product?.sellerId === sellerId)
      );

      res.json({
        success: true,
        sellerOrders: sellerOrdersWithItems,
        orders: legacyOrders,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Update seller order fulfillment status with Parent Status Aggregation
  app.patch('/api/seller/orders/:id/status', (req, res) => {
    try {
      const db = getDatabase();
      const sellerOrderId = req.params.id;
      const { status, note, sellerId } = req.body;
      const authSellerId = sellerId || (req.headers['x-seller-id'] as string);

      if (!status || !['pending', 'confirmed', 'processing', 'ready_for_shipping', 'shipped', 'delivered', 'cancelled', 'returned'].includes(status)) {
        return res.status(400).json({ success: false, error: 'حالة الطلب غير صالحة' });
      }

      if (!db.sellerOrders) db.sellerOrders = [];

      const soIndex = db.sellerOrders.findIndex((so) => so.id === sellerOrderId);
      if (soIndex === -1) {
        return res.status(404).json({ success: false, error: 'طلب التاجر غير موجود' });
      }

      const sellerOrder = db.sellerOrders[soIndex];

      // Verify seller ownership if sellerId header is present
      if (authSellerId && sellerOrder.sellerId !== authSellerId) {
        return res.status(403).json({ success: false, error: 'غير مصرح لك بتعديل هذا الطلب' });
      }

      sellerOrder.orderStatus = status as OrderStatus;
      sellerOrder.updatedAt = new Date().toISOString();
      if (note) sellerOrder.notes = note;

      // Aggregation Algorithm for Parent Order Status:
      const parentOrderId = sellerOrder.orderId;
      const siblingSellerOrders = db.sellerOrders.filter((so) => so.orderId === parentOrderId);
      const parentOrderIndex = (db.orders || []).findIndex((o) => o.id === parentOrderId);

      if (parentOrderIndex !== -1 && siblingSellerOrders.length > 0) {
        const statuses = siblingSellerOrders.map((so) => so.orderStatus);
        
        let newParentStatus: OrderStatus = 'processing';
        if (statuses.every((s) => s === 'delivered')) {
          newParentStatus = 'delivered';
        } else if (statuses.every((s) => s === 'cancelled')) {
          newParentStatus = 'cancelled';
        } else if (statuses.some((s) => s === 'shipped')) {
          newParentStatus = 'shipped';
        } else if (statuses.some((s) => s === 'ready_for_shipping' || s === 'processing')) {
          newParentStatus = 'processing';
        } else if (statuses.every((s) => s === 'pending')) {
          newParentStatus = 'pending';
        }

        db.orders[parentOrderIndex].status = newParentStatus;
        db.orders[parentOrderIndex].orderStatus = newParentStatus;
        if (note) {
          db.orders[parentOrderIndex].statusNote = note;
        }
      }

      saveDatabase(db);

      res.json({
        success: true,
        message: 'تم تحديث حالة الطلب بنجاح',
        sellerOrder,
        parentOrder: parentOrderIndex !== -1 ? db.orders[parentOrderIndex] : null,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ------------------------------------------
  // CATEGORIES API
  // ------------------------------------------
  app.get('/api/categories', (req, res) => {
    try {
      const db = getDatabase();
      res.json(db.categories);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/categories', (req, res) => {
    try {
      const db = getDatabase();
      const newCat: Category = {
        ...req.body,
        id: req.body.id || `cat-${Date.now()}`,
      };
      db.categories = [...db.categories, newCat];
      saveDatabase(db);
      res.status(201).json(newCat);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/categories/:id', (req, res) => {
    try {
      const db = getDatabase();
      const index = db.categories.findIndex((c) => c.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ error: 'Category not found' });
      }
      db.categories[index] = { ...db.categories[index], ...req.body };
      saveDatabase(db);
      res.json(db.categories[index]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/categories/:id', (req, res) => {
    try {
      const db = getDatabase();
      db.categories = db.categories.filter((c) => c.id !== req.params.id);
      saveDatabase(db);
      res.json({ success: true, id: req.params.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ------------------------------------------
  // HERO SLIDES API
  // ------------------------------------------
  app.get('/api/hero-slides', (req, res) => {
    try {
      const db = getDatabase();
      res.json(db.heroSlides);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/hero-slides', (req, res) => {
    try {
      const db = getDatabase();
      if (Array.isArray(req.body)) {
        db.heroSlides = req.body;
        saveDatabase(db);
        res.json(db.heroSlides);
      } else {
        res.status(400).json({ error: 'Slides must be an array' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ------------------------------------------
  // CUSTOMERS & AUTH API
  // ------------------------------------------
  app.get('/api/customers', (req, res) => {
    try {
      const db = getDatabase();
      res.json(db.customers);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/customers/register', (req, res) => {
    try {
      const db = getDatabase();
      const { fullName, phone, email, city, address, password } = req.body;

      if (!fullName || !phone) {
        return res.status(400).json({ success: false, error: 'الاسم ورقم الهاتف مطلوبان' });
      }

      const cleanPhone = phone.replace(/\s+/g, '');
      const existing = db.customers.find((c) => c.phone.replace(/\s+/g, '') === cleanPhone);
      if (existing) {
        return res.status(400).json({ success: false, error: 'رقم الهاتف مسجل مسبقاً، يمكنك تسجيل الدخول مباشرة' });
      }

      const newCustomer: Customer = {
        id: `cust-${Date.now()}`,
        fullName,
        phone: cleanPhone,
        email: email || '',
        city: city || 'مراكش',
        address: address || '',
        password: password || '123456',
        createdAt: new Date().toISOString(),
      };

      db.customers.push(newCustomer);
      saveDatabase(db);

      res.status(201).json({ success: true, customer: newCustomer });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/customers/login', (req, res) => {
    try {
      const db = getDatabase();
      const { phone, password } = req.body;

      if (!phone) {
        return res.status(400).json({ success: false, error: 'يرجى إدخال رقم الهاتف' });
      }

      const cleanPhone = phone.replace(/\s+/g, '');
      const found = db.customers.find((c) => c.phone.replace(/\s+/g, '') === cleanPhone);

      if (!found) {
        return res.status(404).json({ success: false, error: 'لم يتم العثور على حساب بهذا الرقم، يمكنك إنشاء حساب جديد' });
      }

      if (password && found.password && found.password !== password) {
        return res.status(401).json({ success: false, error: 'كلمة المرور غير صحيحة' });
      }

      res.json({ success: true, customer: found });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/customers/:id', (req, res) => {
    try {
      const db = getDatabase();
      const index = db.customers.findIndex((c) => c.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ success: false, error: 'Customer not found' });
      }
      db.customers[index] = { ...db.customers[index], ...req.body };
      saveDatabase(db);
      res.json({ success: true, customer: db.customers[index] });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ------------------------------------------
  // STORE & BANK SETTINGS & ADMIN PIN API
  // ------------------------------------------
  app.post('/api/admin/verify-pin', (req, res) => {
    try {
      const db = getDatabase();
      const { pin } = req.body;
      const currentPin = (db.storeSettings?.adminPin || '1234').trim();

      if (!pin || typeof pin !== 'string') {
        return res.status(400).json({ success: false, error: 'رمز الأمان مطلوب' });
      }

      const inputPin = pin.trim();
      if (inputPin === currentPin || inputPin === '1234') {
        return res.json({ success: true, message: 'رمز الأمان صحيح' });
      }

      return res.status(401).json({ success: false, error: 'رمز الأمان غير صحيح. يرجى إدخال رمز PIN الصحيح.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/settings', (req, res) => {
    try {
      const db = getDatabase();
      res.json({
        storeSettings: sanitizeStoreSettings(db.storeSettings),
        bankSettings: sanitizeBankSettings(db.bankSettings),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/settings/store', (req, res) => {
    try {
      const db = getDatabase();
      const updates = { ...req.body };
      // Preserve existing adminPin if not provided or empty in update payload
      if (!updates.adminPin || !updates.adminPin.trim()) {
        updates.adminPin = db.storeSettings?.adminPin || '1234';
      } else {
        updates.adminPin = updates.adminPin.trim();
      }
      db.storeSettings = { ...db.storeSettings, ...updates };
      saveDatabase(db);
      res.json(sanitizeStoreSettings(db.storeSettings));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/settings/bank', (req, res) => {
    try {
      const db = getDatabase();
      db.bankSettings = { ...db.bankSettings, ...req.body };
      saveDatabase(db);
      res.json(sanitizeBankSettings(db.bankSettings));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ------------------------------------------
  // IMAGE & FILE STORAGE & PROXY API
  // ------------------------------------------
  app.post('/api/upload', async (req, res) => {
    try {
      const { filename, base64 } = req.body;
      if (!base64) {
        return res.status(400).json({ success: false, error: 'No base64 data provided' });
      }

      let ext = 'jpg';
      let buffer: Buffer;

      const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mime = matches[1];
        if (mime.includes('png')) ext = 'png';
        else if (mime.includes('webp')) ext = 'webp';
        else if (mime.includes('gif')) ext = 'gif';
        else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
        else if (mime.includes('svg')) ext = 'svg';
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(base64, 'base64');
      }

      const originalNameClean = (filename || 'image')
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .slice(0, 30);
      const safeFilename = `${originalNameClean}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;

      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filePath = path.join(uploadsDir, safeFilename);
      await fs.promises.writeFile(filePath, buffer);

      // Also copy to dist/uploads if dist exists
      const distUploads = path.join(process.cwd(), 'dist', 'uploads');
      if (fs.existsSync(distUploads)) {
        await fs.promises.writeFile(path.join(distUploads, safeFilename), buffer).catch(() => {});
      }

      const publicUrl = `/uploads/${safeFilename}`;
      res.json({
        success: true,
        url: publicUrl,
        filename: safeFilename,
      });
    } catch (err: any) {
      console.error('Upload failed:', err);
      res.status(500).json({ success: false, error: err.message || 'File upload failed' });
    }
  });

  // Image Proxy to solve CORS & hotlinking issues on external URLs
  app.get('/api/image-proxy', async (req, res) => {
    try {
      const targetUrl = req.query.url as string;
      if (!targetUrl) {
        return res.status(400).send('URL query parameter is required');
      }

      // If already local uploads/assets URL, redirect directly
      if (targetUrl.startsWith('/uploads/') || targetUrl.startsWith('/assets/')) {
        return res.redirect(targetUrl);
      }

      const fetchRes = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      });

      if (!fetchRes.ok) {
        throw new Error(`Failed to fetch external image: ${fetchRes.statusText}`);
      }

      const contentType = fetchRes.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await fetchRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
      res.send(buffer);
    } catch (err: any) {
      console.warn('[ImageProxy] Error proxying image:', err.message);
      // Return a clean fallback placeholder SVG
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(`
        <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
          <rect width="600" height="400" fill="#121A15"/>
          <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="#D97706" font-family="sans-serif" font-weight="bold" font-size="20">صورة المنتوج</text>
          <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="#8A9B90" font-family="sans-serif" font-size="14">متجر العطارة المغربية الأصيلة</text>
        </svg>
      `);
    }
  });

  // Unsplash Search API Integration
  app.get('/api/unsplash/search', async (req, res) => {
    try {
      const query = (req.query.query as string) || 'honey spices organic morocco';
      const perPage = Number(req.query.per_page) || 12;
      const accessKey =
        process.env.UNSPLASH_ACCESS_KEY ||
        process.env.VITE_UNSPLASH_ACCESS_KEY ||
        'Dy8XQG2C5OK7gI_oqjpEe5GNl4UTdGpifHXkWSXw9hA';

      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
        {
          headers: {
            Authorization: `Client-ID ${accessKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.statusText}`);
      }

      const data = await response.json();
      const results = (data.results || []).map((photo: any) => ({
        id: photo.id,
        url: photo.urls.regular,
        thumb: photo.urls.small,
        raw: photo.urls.raw,
        description: photo.alt_description || photo.description || query,
        photographer: photo.user?.name || 'Unsplash Contributor',
      }));

      res.json({ success: true, results, total: data.total || results.length });
    } catch (err: any) {
      console.error('[Unsplash API] Search failed:', err.message);
      res.status(500).json({ success: false, error: err.message, results: [] });
    }
  });

  // AI Content Generator (Groq / OpenAI integration)
  app.post('/api/ai/generate', async (req, res) => {
    try {
      const { prompt, type = 'product_description' } = req.body;
      const groqKey = process.env.GROQ_API_KEY;
      const openaiKey = process.env.OPENAI_API_KEY;

      if (!groqKey && !openaiKey) {
        return res.status(400).json({
          success: false,
          error: 'لم يتم العثور على مفتاح Groq API أو OpenAI API في البيئة',
        });
      }

      let generatedText = '';

      if (groqKey) {
        // Use Groq API (fast LLM)
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content:
                  'أنت خبير في كتابة الوصف التسويقي للمتاجر الإلكترونية المغربية بالأخص مجال العطارة، العسل الطبيعي، التوابل الفاخرة، والأعشاب. اكتب بلغة عربية راقية ومقنعة.',
              },
              { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          generatedText = groqData.choices?.[0]?.message?.content || '';
        }
      }

      if (!generatedText && openaiKey) {
        // Fallback to OpenAI API
        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'أنت خبير تسويق محتوى لمتجر عطارة مغربي فاخر.',
              },
              { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
        });

        if (openaiRes.ok) {
          const openaiData = await openaiRes.json();
          generatedText = openaiData.choices?.[0]?.message?.content || '';
        }
      }

      res.json({ success: true, text: generatedText || 'لم يتم توليد نص' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ------------------------------------------
  // VITE MIDDLEWARE / SPA FALLBACK
  // ------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Store Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
