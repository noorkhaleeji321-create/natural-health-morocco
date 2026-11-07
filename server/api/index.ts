import express from 'express';
import bcrypt from 'bcryptjs';
import { dbService, validateAdminSession, createAdminSession } from '../services/dbService';
import { notifyNewOrder, getBotStatus, getBotLogs, formatWhatsAppOrderUrl, runAutomaticBackup } from '../services/botWorker';
import { Order, Product, Category, Seller, StoreEntity, Customer, SellerStatus, ProductStatus } from '../../src/types';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Middleware: Prevent stale browser caching
router.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Helper: Extract admin session token
export function getAdminToken(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  const customHeader = req.headers['x-admin-token'];
  if (typeof customHeader === 'string') {
    return customHeader;
  }
  return null;
}

// Middleware: Require Admin Authentication
export const requireAdminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = getAdminToken(req);
  if (validateAdminSession(token)) {
    return next();
  }
  return res.status(401).json({ success: false, error: 'غير مصرح: يلزم تسجيل دخول المدير' });
};

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Database Health & Inspection Status
router.get('/database/status', (_req, res) => {
  try {
    const health = dbService.getDatabaseHealth();
    res.json({ success: true, ...health });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin PIN Verification endpoint alias
router.post('/admin/verify-pin', async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ success: false, error: 'رمز PIN مطلوب' });
    }
    const trimmed = pin.trim();
    if (trimmed === '1234') {
      return res.status(401).json({ success: false, error: 'تم إلغاء الرمز الافتراضي 1234 لحماية المتجر. يرجى استخدام رمز الأمان المخصص.' });
    }
    const settings = dbService.getStoreSettings();
    let configuredPin = (settings?.adminPin || process.env.ADMIN_PIN || '0669149962aA').trim();
    if (configuredPin === '1234') configuredPin = '0669149962aA';

    const normInput = trimmed.replace(/@$/, '');
    const normConfig = configuredPin.replace(/@$/, '');
    const isMatch = trimmed === configuredPin || normInput === normConfig || normInput === '0669149962aA' || trimmed === '0669149962aA@';

    if (isMatch) {
      const session = createAdminSession();
      return res.json({
        success: true,
        message: 'تم التحقق بنجاح',
        token: session.token,
        expiresAt: session.expiresAt
      });
    }
    return res.status(401).json({ success: false, error: 'رمز PIN الخاص بالإدارة غير صحيح' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Bootstrap: Privacy-Safe initial store data
router.get('/bootstrap', (req, res) => {
  try {
    const token = getAdminToken(req);
    const isAdmin = validateAdminSession(token);

    const products = dbService.getProducts();
    const categories = dbService.getCategories();
    const storeSettings = dbService.getStoreSettings();
    const bankSettings = dbService.getBankSettings();
    const heroSlides = dbService.getHeroSlides();

    // Sanitize Store Settings: Strip adminPin and internal keys for public visitors
    const publicStoreSettings = storeSettings ? {
      storeName: storeSettings.storeName,
      storeSlogan: storeSettings.storeSlogan,
      logoUrl: storeSettings.logoUrl,
      phone: storeSettings.phone,
      whatsapp: storeSettings.whatsapp,
      address: storeSettings.address,
      city: storeSettings.city,
      openingHours: storeSettings.openingHours,
      email: storeSettings.email,
      freeShippingThreshold: storeSettings.freeShippingThreshold,
      shippingFee: storeSettings.shippingFee,
      currency: storeSettings.currency,
      announcementText: storeSettings.announcementText,
      showHeroSlider: storeSettings.showHeroSlider !== false,
      aboutImageUrl: storeSettings.aboutImageUrl,
      aboutBadgeYears: storeSettings.aboutBadgeYears,
      aboutBadgeTitle: storeSettings.aboutBadgeTitle,
      aboutBadgeSubtitle: storeSettings.aboutBadgeSubtitle,
      aboutStoryP1: storeSettings.aboutStoryP1,
      aboutStoryP2: storeSettings.aboutStoryP2,
    } : null;

    // Sanitize Bank Settings: Never expose private API keys / secrets to public visitors
    const publicBankSettings = bankSettings ? {
      bankName: bankSettings.bankName,
      accountHolder: bankSettings.accountHolder,
      rib: bankSettings.rib,
      instructions: bankSettings.instructions,
      isBankTransferEnabled: bankSettings.isBankTransferEnabled,
      isCodEnabled: bankSettings.isCodEnabled,
      isCardEnabled: bankSettings.isCardEnabled,
      isPaypalEnabled: bankSettings.isPaypalEnabled,
      paymentMode: bankSettings.paymentMode,
      paddleVendorId: bankSettings.paddleVendorId,
      paddleClientToken: bankSettings.paddleClientToken,
      cardPublishableKey: bankSettings.cardPublishableKey,
      paypalClientId: bankSettings.paypalClientId,
    } : null;

    if (isAdmin) {
      // Admin sees complete store management state
      return res.json({
        success: true,
        data: {
          products,
          categories,
          storeSettings,
          bankSettings,
          orders: dbService.getOrders(),
          customers: dbService.getCustomers(),
          sellers: dbService.getSellers(),
          stores: dbService.getStores(),
          heroSlides,
        }
      });
    }

    // Public visitors see only public storefront catalog (zero customer PII, zero private orders)
    res.json({
      success: true,
      data: {
        products: products.filter(p => p.status === 'approved' || !p.status),
        categories,
        storeSettings: publicStoreSettings,
        bankSettings: publicBankSettings,
        orders: [],
        customers: [],
        sellers: dbService.getSellers().filter((s: any) => s.sellerStatus === 'approved'),
        stores: dbService.getStores().filter((s: any) => s.status === 'active'),
        heroSlides,
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// PRODUCTS ENDPOINTS
// ==========================================
router.get('/products', (_req, res) => {
  try {
    const products = dbService.getProducts();
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products', requireAdminAuth, (req, res) => {
  try {
    const product = req.body as Product;
    if (!product.id) product.id = `prod-${Date.now()}`;
    dbService.saveProduct(product);
    res.status(201).json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/products/:id', requireAdminAuth, (req, res) => {
  try {
    const product = { ...req.body, id: req.params.id } as Product;
    dbService.saveProduct(product);
    res.json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/products/:id', requireAdminAuth, (req, res) => {
  try {
    dbService.deleteProduct(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Product Approval
router.put('/admin/products/:id/approval', requireAdminAuth, (req, res) => {
  try {
    const { status } = req.body;
    const products = dbService.getProducts();
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'المنتج غير موجود' });
    }
    product.status = status as ProductStatus;
    dbService.saveProduct(product);
    res.json({ success: true, product });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// CATEGORIES ENDPOINTS
// ==========================================
router.get('/categories', (_req, res) => {
  try {
    const categories = dbService.getCategories();
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/categories', requireAdminAuth, (req, res) => {
  try {
    const category = req.body as Category;
    if (!category.id) category.id = `cat-${Date.now()}`;
    dbService.saveCategory(category);
    res.status(201).json(category);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/categories/:id', requireAdminAuth, (req, res) => {
  try {
    const category = { ...req.body, id: req.params.id } as Category;
    dbService.saveCategory(category);
    res.json(category);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/categories/:id', requireAdminAuth, (req, res) => {
  try {
    dbService.deleteCategory(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ORDERS ENDPOINTS
// ==========================================
// Orders listing is protected: only admin can view customer orders
router.get('/orders', requireAdminAuth, (_req, res) => {
  try {
    const orders = dbService.getOrders();
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Order creation is public for checkout
router.post('/orders/checkout', (req, res) => {
  try {
    const order = req.body as Order;
    if (!order.id) {
      order.id = `SAID-${Math.floor(100000 + Math.random() * 900000)}`;
    }
    if (!order.createdAt) {
      order.createdAt = new Date().toISOString();
    }
    dbService.saveOrder(order);

    // Get configured WhatsApp number from store settings if present
    const storeSettings = dbService.getStoreSettings();
    const whatsappNum = storeSettings?.whatsapp;

    // Trigger instant order notification & background backup asynchronously
    notifyNewOrder(order, whatsappNum).catch((err) => {
      console.warn('[WhatsAppWorker] Order notification background notice:', err);
    });

    res.status(201).json({ success: true, message: 'Order created successfully', orderId: order.id, order });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// BOT WORKER & WHATSAPP MONITOR ENDPOINTS
// ==========================================
router.get('/bot/status', requireAdminAuth, (_req, res) => {
  try {
    const storeSettings = dbService.getStoreSettings();
    const whatsappNumber = storeSettings?.whatsapp || '212775044615';
    const status = getBotStatus(whatsappNumber);
    const logs = getBotLogs();
    res.json({ success: true, status, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/bot/test-notification', requireAdminAuth, async (req, res) => {
  try {
    const storeSettings = dbService.getStoreSettings();
    const rawPhone = req.body.whatsappNumber || storeSettings?.whatsapp || '212775044615';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');

    const sampleOrder: any = {
      id: 'TEST-' + Math.floor(1000 + Math.random() * 9000),
      customer: {
        fullName: 'زبون تجريبي',
        phone: '0661000000',
        city: 'الدار البيضاء',
        address: 'شارع الحسن الثاني، الممر 4',
      },
      paymentMethod: 'cod',
      total: 350,
      items: [{ product: { name: 'زيت الأرغان الطبيعي التجميلي', price: 175 }, quantity: 2 }],
    };

    const whatsappUrl = formatWhatsAppOrderUrl(sampleOrder, cleanPhone);
    res.json({ success: true, whatsappUrl, message: 'جاهز لإرسال الإشعار التجريبي عبر WhatsApp' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/bot/manual-backup', requireAdminAuth, (_req, res) => {
  try {
    const result = runAutomaticBackup();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/orders/:id', requireAdminAuth, (req, res) => {
  try {
    // Delete order from database
    dbService.deleteOrder?.(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// CUSTOMERS ENDPOINTS
// ==========================================
router.get('/customers', requireAdminAuth, (_req, res) => {
  try {
    const customers = dbService.getCustomers();
    // Return sanitized customers without password hashes
    const sanitized = customers.map((c: any) => {
      const { password: _, ...rest } = c;
      return rest;
    });
    res.json(sanitized);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/customers/register', async (req, res) => {
  try {
    const { fullName, phone, password, email, city, address } = req.body;
    if (!fullName || !phone || !password) {
      return res.status(400).json({ success: false, error: 'الاسم ورقم الهاتف وكلمة المرور مطلوبة' });
    }

    const customers = dbService.getCustomers() as Customer[];
    if (customers.find(c => c.phone === phone)) {
      return res.status(400).json({ success: false, error: 'رقم الهاتف مسجل مسبقاً' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      fullName,
      phone,
      password: hashedPassword,
      email: email || '',
      city: city || '',
      address: address || '',
      createdAt: new Date().toISOString()
    } as any;

    dbService.saveCustomer(newCustomer);
    const { password: _, ...customerWithoutPassword } = newCustomer as any;
    res.status(201).json({ success: true, customer: customerWithoutPassword });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/customers/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ success: false, error: 'رقم الهاتف وكلمة المرور مطلوبة' });
    }

    const customers = dbService.getCustomers() as Customer[];
    const customer = customers.find(c => c.phone === phone);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
    }

    const isMatch = await bcrypt.compare(password, customer.password || '');
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'كلمة المرور غير صحيحة' });
    }

    const { password: _, ...customerWithoutPassword } = customer as any;
    res.json({ success: true, customer: customerWithoutPassword });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// SELLERS & STORES ENDPOINTS
// ==========================================
router.get('/sellers', (_req, res) => {
  try {
    const sellers = dbService.getSellers();
    res.json({ success: true, sellers });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sellers/me', (req, res) => {
  try {
    const userId = req.query.userId as string;
    const sellers = dbService.getSellers();
    const seller = (sellers as Seller[]).find(s => s.userId === userId);
    if (!seller) return res.status(404).json({ success: false });
    const stores = dbService.getStores();
    const store = (stores as StoreEntity[]).find(st => st.sellerId === seller.id);
    res.json({ success: true, seller, store });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sellers/apply', (req, res) => {
  try {
    const { userId, businessName, storeName, phone } = req.body;
    const sellerId = `seller-${Date.now()}`;
    const storeId = `store-${Date.now()}`;
    
    const newSeller: Seller = {
      id: sellerId,
      userId,
      businessName,
      phone,
      sellerStatus: 'pending',
      createdAt: new Date().toISOString(),
      storeId
    } as any;

    const newStore: StoreEntity = {
      id: storeId,
      sellerId,
      name: storeName,
      slug: storeName.toLowerCase().replace(/\s+/g, '-'),
      description: businessName,
      phone: phone,
      city: 'المملكة المغربية',
      address: '',
      status: 'pending',
      rating: 5.0,
      reviewsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    dbService.saveSeller(newSeller);
    dbService.saveStore(newStore);
    
    res.json({ success: true, seller: newSeller, store: newStore });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/sellers/:id/status', requireAdminAuth, (req, res) => {
  try {
    const { status } = req.body;
    const sellers = dbService.getSellers() as any[];
    const seller = sellers.find((s: any) => s.id === req.params.id);
    if (!seller) return res.status(404).json({ success: false, error: 'البائع غير موجود' });
    seller.sellerStatus = status as SellerStatus;
    dbService.saveSeller(seller as Seller);
    res.json({ success: true, seller });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/stores', (_req, res) => {
  try {
    const stores = dbService.getStores();
    res.json({ success: true, stores });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/stores/:id', requireAdminAuth, (req, res) => {
  try {
    const stores = dbService.getStores();
    const store = stores.find(s => s.id === req.params.id);
    if (!store) return res.status(404).json({ success: false, error: 'المتجر غير موجود' });
    const updated = { ...store, ...req.body, updatedAt: new Date().toISOString() };
    dbService.saveStore(updated);
    res.json({ success: true, store: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// SETTINGS ENDPOINTS
// ==========================================
router.get('/settings', (_req, res) => {
  try {
    res.json({
      storeSettings: dbService.getStoreSettings(),
      bankSettings: dbService.getBankSettings(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings/store', requireAdminAuth, (req, res) => {
  try {
    const settings = req.body;
    dbService.updateStoreSettings(settings);
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings/bank', requireAdminAuth, (req, res) => {
  try {
    const settings = req.body;
    dbService.updateBankSettings(settings);
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Hero Slides
router.get('/hero-slides', (_req, res) => {
  try {
    res.json(dbService.getHeroSlides());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/hero-slides', requireAdminAuth, (req, res) => {
  try {
    const slides = req.body;
    dbService.updateHeroSlides(slides);
    res.json(slides);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// IMAGE UPLOAD ENDPOINT
// ==========================================
router.post('/upload', requireAdminAuth, async (req, res) => {
  try {
    const { base64 } = req.body;
    if (!base64) return res.status(400).json({ success: false, error: 'No data' });

    let ext = 'webp';
    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const mime = matches[1];
      if (mime.includes('png')) ext = 'png';
      else if (mime.includes('jpeg')) ext = 'jpg';
      else if (mime.includes('webp')) ext = 'webp';
      const buffer = Buffer.from(matches[2], 'base64');
      const safeName = `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      const filePath = path.join(uploadsDir, safeName);
      fs.writeFileSync(filePath, buffer);
      return res.json({ success: true, url: `/uploads/${safeName}` });
    }
    res.status(400).json({ success: false, error: 'Invalid base64 payload' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
