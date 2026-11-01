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
  ProductStatus,
  SellerApplicationRequest,
  MarketplaceCart,
  MarketplaceCartItem,
  ShippingAddress,
  SellerOrder,
  OrderItemEntity,
  OrderStatus,
  PaymentMethod,
} from '../types';
import {
  AWC_CONFIG,
  getStoreProducts as getAWCStoreProducts,
  submitOrderToAIWebCrafter,
  checkAIWebCrafterConnection,
} from './aiwebcrafterConnector';

export interface BootstrapData {
  products: Product[];
  categories: Category[];
  heroSlides: HeroSlide[];
  orders: Order[];
  customers: Customer[];
  storeSettings: StoreSettings;
  bankSettings: BankSettings;
  sellers?: Seller[];
  stores?: StoreEntity[];
}

export const api = {
  // Bootstrap: get all initial store data in a single request
  async getBootstrap(): Promise<BootstrapData | null> {
    try {
      const res = await fetch('/api/bootstrap');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || null;
    } catch (err) {
      console.warn('[API] getBootstrap failed:', err);
      return null;
    }
  },

  // Products
  async getProducts(): Promise<Product[]> {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[API] getProducts failed:', err);
      return [];
    }
  },

  async addProduct(product: Partial<Product>): Promise<Product | null> {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('[API] addProduct failed:', err);
      return null;
    }
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<Product | null> {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('[API] updateProduct failed:', err);
      return null;
    }
  },

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch (err) {
      console.error('[API] deleteProduct failed:', err);
      return false;
    }
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[API] getCategories failed:', err);
      return [];
    }
  },

  async addCategory(cat: Partial<Category>): Promise<Category | null> {
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cat),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('[API] addCategory failed:', err);
      return null;
    }
  },

  async updateCategory(id: string, cat: Partial<Category>): Promise<Category | null> {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cat),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('[API] updateCategory failed:', err);
      return null;
    }
  },

  async deleteCategory(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch (err) {
      console.error('[API] deleteCategory failed:', err);
      return false;
    }
  },

  // Hero Slides
  async getHeroSlides(): Promise<HeroSlide[]> {
    try {
      const res = await fetch('/api/hero-slides');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[API] getHeroSlides failed:', err);
      return [];
    }
  },

  async updateHeroSlides(slides: HeroSlide[]): Promise<HeroSlide[] | null> {
    try {
      const res = await fetch('/api/hero-slides', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slides),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('[API] updateHeroSlides failed:', err);
      return null;
    }
  },

  // Orders
  async getOrders(): Promise<Order[]> {
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[API] getOrders failed:', err);
      return [];
    }
  },

  async createOrder(order: Partial<Order>): Promise<Order | null> {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('[API] createOrder failed:', err);
      return null;
    }
  },

  async updateOrderStatus(id: string, status: Order['status'], statusNote?: string): Promise<Order | null> {
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, statusNote }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      return await res.json();
    } catch (err: any) {
      console.error(`[API] updateOrderStatus failed for ID: ${id}, Status: ${status}. Error:`, err.message || err);
      return null;
    }
  },

  async deleteOrder(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch (err) {
      console.error('[API] deleteOrder failed:', err);
      return false;
    }
  },

  // Customers
  async getCustomers(): Promise<Customer[]> {
    try {
      const res = await fetch('/api/customers');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[API] getCustomers failed:', err);
      return [];
    }
  },

  async registerCustomer(customerData: Partial<Customer>): Promise<{ success: boolean; customer?: Customer; error?: string }> {
    try {
      const res = await fetch('/api/customers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'فشل الاتصال بالخادم' };
    }
  },

  async loginCustomer(phone: string, password?: string): Promise<{ success: boolean; customer?: Customer; error?: string }> {
    try {
      const res = await fetch('/api/customers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'فشل الاتصال بالخادم' };
    }
  },

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer | null> {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      return json.customer || null;
    } catch (err) {
      console.error('[API] updateCustomer failed:', err);
      return null;
    }
  },

  // Admin Authentication
  async verifyAdminPin(pin: string): Promise<boolean> {
    try {
      const res = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      return Boolean(data.success);
    } catch (err) {
      console.warn('[API] verifyAdminPin failed:', err);
      return false;
    }
  },

  // Settings
  async getSettings(): Promise<{ storeSettings: StoreSettings; bankSettings: BankSettings } | null> {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[API] getSettings failed:', err);
      return null;
    }
  },

  async updateStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings | null> {
    try {
      const res = await fetch('/api/settings/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('[API] updateStoreSettings failed:', err);
      return null;
    }
  },

  async updateBankSettings(settings: Partial<BankSettings>): Promise<BankSettings | null> {
    try {
      const res = await fetch('/api/settings/bank', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('[API] updateBankSettings failed:', err);
      return null;
    }
  },

  // Upload image to server storage
  async uploadImage(base64Data: string, filename?: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64: base64Data, filename }),
      });
      const json = await res.json();
      return json;
    } catch (err: any) {
      console.error('[API] uploadImage failed:', err);
      return { success: false, error: err.message || 'فشل رفع الصورة للخادم' };
    }
  },

  // ------------------------------------------
  // MULTI-VENDOR MARKETPLACE API METHODS
  // ------------------------------------------

  // Sellers
  async getSellers(status?: string, userId?: string): Promise<Seller[]> {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (userId) params.append('userId', userId);
      const res = await fetch(`/api/sellers?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.sellers || [];
    } catch (err) {
      console.error('[API] getSellers failed:', err);
      return [];
    }
  },

  async getCurrentSeller(userId: string): Promise<{ seller: Seller | null; store: StoreEntity | null }> {
    try {
      const res = await fetch(`/api/sellers/me?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) return { seller: null, store: null };
      const json = await res.json();
      return { seller: json.seller || null, store: json.store || null };
    } catch (err) {
      console.error('[API] getCurrentSeller failed:', err);
      return { seller: null, store: null };
    }
  },

  async applySeller(data: SellerApplicationRequest & { userId: string }): Promise<{ success: boolean; message?: string; seller?: Seller; store?: StoreEntity; error?: string }> {
    try {
      const res = await fetch('/api/sellers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (err: any) {
      console.error('[API] applySeller failed:', err);
      return { success: false, error: err.message || 'فشل إرسال طلب الانضمام كبائع' };
    }
  },

  async updateSellerStatus(id: string, status: SellerStatus, adminPin?: string, reason?: string): Promise<{ success: boolean; seller?: Seller; store?: StoreEntity; error?: string }> {
    try {
      const res = await fetch(`/api/sellers/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminPin, reason }),
      });
      return await res.json();
    } catch (err: any) {
      console.error('[API] updateSellerStatus failed:', err);
      return { success: false, error: err.message || 'فشل تحديث حالة البائع' };
    }
  },

  // Stores
  async getStores(all?: boolean): Promise<StoreEntity[]> {
    try {
      const res = await fetch(`/api/stores${all ? '?all=true' : ''}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.stores || [];
    } catch (err) {
      console.error('[API] getStores failed:', err);
      return [];
    }
  },

  async getStoreBySlug(slug: string): Promise<{ store: StoreEntity; seller?: Seller; products: Product[] } | null> {
    try {
      const res = await fetch(`/api/stores/${encodeURIComponent(slug)}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.success ? { store: json.store, seller: json.seller, products: json.products || [] } : null;
    } catch (err) {
      console.error('[API] getStoreBySlug failed:', err);
      return null;
    }
  },

  async updateStore(id: string, data: Partial<StoreEntity>, sellerId?: string, adminPin?: string): Promise<{ success: boolean; store?: StoreEntity; error?: string }> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sellerId) headers['x-seller-id'] = sellerId;
      if (adminPin) headers['x-admin-pin'] = adminPin;

      const res = await fetch(`/api/stores/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (err: any) {
      console.error('[API] updateStore failed:', err);
      return { success: false, error: err.message || 'فشل تحديث بيانات المتجر' };
    }
  },

  // Seller Products
  async addSellerProduct(product: Partial<Product>, sellerId: string): Promise<{ success: boolean; product?: Product; error?: string }> {
    try {
      const res = await fetch('/api/seller/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-seller-id': sellerId,
        },
        body: JSON.stringify({ ...product, sellerId }),
      });
      return await res.json();
    } catch (err: any) {
      console.error('[API] addSellerProduct failed:', err);
      return { success: false, error: err.message || 'فشل إرسال المنتج للمراجعة' };
    }
  },

  async updateSellerProduct(id: string, product: Partial<Product>, sellerId: string): Promise<{ success: boolean; product?: Product; error?: string }> {
    try {
      const res = await fetch(`/api/seller/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-seller-id': sellerId,
        },
        body: JSON.stringify({ ...product, sellerId }),
      });
      return await res.json();
    } catch (err: any) {
      console.error('[API] updateSellerProduct failed:', err);
      return { success: false, error: err.message || 'فشل تحديث المنتج' };
    }
  },

  async deleteSellerProduct(id: string, sellerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/seller/products/${id}?sellerId=${encodeURIComponent(sellerId)}`, {
        method: 'DELETE',
        headers: { 'x-seller-id': sellerId },
      });
      return await res.json();
    } catch (err: any) {
      console.error('[API] deleteSellerProduct failed:', err);
      return { success: false, error: err.message || 'فشل حذف المنتج' };
    }
  },

  // Admin Product Approval
  async approveProduct(id: string, status: ProductStatus, adminPin: string, reason?: string): Promise<{ success: boolean; product?: Product; error?: string }> {
    try {
      const res = await fetch(`/api/admin/products/${id}/approval`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminPin, reason }),
      });
      return await res.json();
    } catch (err: any) {
      console.error('[API] approveProduct failed:', err);
      return { success: false, error: err.message || 'فشل مراجعة المنتج' };
    }
  },

  // Seller Orders
  async getSellerOrders(sellerId: string): Promise<Order[]> {
    try {
      const res = await fetch(`/api/seller/orders?sellerId=${encodeURIComponent(sellerId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.orders || [];
    } catch (err) {
      console.error('[API] getSellerOrders failed:', err);
      return [];
    }
  },

  async getSellerOrdersDetailed(sellerId: string): Promise<{ success: boolean; sellerOrders: (SellerOrder & { items: OrderItemEntity[] })[]; orders: Order[] }> {
    try {
      const res = await fetch(`/api/seller/orders?sellerId=${encodeURIComponent(sellerId)}`, {
        headers: { 'x-seller-id': sellerId },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return {
        success: true,
        sellerOrders: json.sellerOrders || [],
        orders: json.orders || [],
      };
    } catch (err) {
      console.error('[API] getSellerOrdersDetailed failed:', err);
      return { success: false, sellerOrders: [], orders: [] };
    }
  },

  async updateSellerOrderStatus(sellerOrderId: string, status: OrderStatus | string, sellerId?: string, note?: string): Promise<{ success: boolean; sellerOrder?: SellerOrder; parentOrder?: Order; error?: string }> {
    try {
      const res = await fetch(`/api/seller/orders/${sellerOrderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-seller-id': sellerId || '',
        },
        body: JSON.stringify({ status, note, sellerId }),
      });
      return await res.json();
    } catch (err: any) {
      console.error('[API] updateSellerOrderStatus failed:', err);
      return { success: false, error: err.message || 'فشل تحديث حالة الطلب' };
    }
  },

  // ------------------------------------------
  // MULTI-VENDOR CART API
  // ------------------------------------------
  async getCart(customerId: string): Promise<{
    success: boolean;
    cart: MarketplaceCart;
    items: Array<MarketplaceCartItem & { productName: string; productImage: string; unit: string; storeName: string; storeSlug: string; sellerName: string; inStock: boolean; availableStock: number; lineTotal: number; product: Product }>;
    sellerGroups: Array<{
      sellerId: string;
      storeId: string;
      storeName: string;
      storeSlug: string;
      sellerName: string;
      items: any[];
      subtotal: number;
    }>;
    itemsCount: number;
    subtotal: number;
  } | null> {
    try {
      const res = await fetch(`/api/cart?customerId=${encodeURIComponent(customerId)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.warn('[API] getCart failed:', err);
      return null;
    }
  },

  async addToCart(customerId: string, productId: string, quantity: number = 1): Promise<{ success: boolean; item?: MarketplaceCartItem; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, productId, quantity }),
      });
      return await res.json();
    } catch (err: any) {
      console.error('[API] addToCart failed:', err);
      return { success: false, error: err.message || 'فشل إضافة المنتج للسلة' };
    }
  },

  async updateCartItem(itemId: string, quantity: number): Promise<{ success: boolean; item?: MarketplaceCartItem; error?: string }> {
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      return await res.json();
    } catch (err: any) {
      console.error('[API] updateCartItem failed:', err);
      return { success: false, error: err.message || 'فشل تحديث الكمية' };
    }
  },

  async removeFromCart(itemId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, { method: 'DELETE' });
      return await res.json();
    } catch (err: any) {
      console.error('[API] removeFromCart failed:', err);
      return { success: false, error: err.message || 'فشل حذف العنصر من السلة' };
    }
  },

  async clearCart(customerId: string): Promise<{ success: boolean }> {
    try {
      const res = await fetch(`/api/cart?customerId=${encodeURIComponent(customerId)}`, { method: 'DELETE' });
      return await res.json();
    } catch (err) {
      console.error('[API] clearCart failed:', err);
      return { success: false };
    }
  },

  // ------------------------------------------
  // SHIPPING ADDRESSES API
  // ------------------------------------------
  async getShippingAddresses(userId: string): Promise<{ success: boolean; addresses: ShippingAddress[] }> {
    try {
      const res = await fetch(`/api/shipping-addresses?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) return { success: false, addresses: [] };
      const json = await res.json();
      return {
        success: true,
        addresses: json.addresses || [],
      };
    } catch (err) {
      console.warn('[API] getShippingAddresses failed:', err);
      return { success: false, addresses: [] };
    }
  },

  async addShippingAddress(userIdOrAddress: string | Partial<ShippingAddress>, maybeAddress?: Partial<ShippingAddress>): Promise<{ success: boolean; address?: ShippingAddress; error?: string }> {
    try {
      const addressData: Partial<ShippingAddress> = typeof userIdOrAddress === 'string'
        ? { userId: userIdOrAddress, ...maybeAddress }
        : userIdOrAddress;

      const res = await fetch('/api/shipping-addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressData),
      });
      return await res.json();
    } catch (err: any) {
      console.error('[API] addShippingAddress failed:', err);
      return { success: false, error: err.message || 'فشل حفظ العنوان' };
    }
  },

  async deleteShippingAddress(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/shipping-addresses/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch (err) {
      console.error('[API] deleteShippingAddress failed:', err);
      return false;
    }
  },

  // ------------------------------------------
  // ATOMIC CHECKOUT API
  // ------------------------------------------
  async checkoutOrder(payload: {
    customerId?: string;
    customer: {
      fullName: string;
      phone: string;
      city: string;
      address: string;
      notes?: string;
      email?: string;
    };
    shippingAddressId?: string;
    paymentMethod: PaymentMethod;
    notes?: string;
    items?: Array<{ productId: string; quantity: number; selectedWeight?: string }>;
  }): Promise<{
    success: boolean;
    order?: Order;
    sellerOrders?: SellerOrder[];
    orderItems?: OrderItemEntity[];
    message?: string;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      // Synchronize with AIWebCrafter Cloud Database & Storage
      if (data && data.success && payload.items) {
        submitOrderToAIWebCrafter({
          customer: {
            name: payload.customer.fullName,
            phone: payload.customer.phone,
            email: payload.customer.email || '',
            address: payload.customer.address,
            city: payload.customer.city,
          },
          paymentMethod: payload.paymentMethod === 'cod' ? 'Cash On Delivery (COD)' : payload.paymentMethod,
          items: payload.items.map((it: any) => ({
            id: it.productId,
            name: it.product?.name || `Product #${it.productId}`,
            sku: `SKU-${it.productId}`,
            price: it.unitPrice || it.product?.price || 0,
            qty: it.quantity || 1,
          })),
          notes: payload.notes || payload.customer.notes || '',
        }).then((awcRes) => {
          if (awcRes && awcRes.success) {
            console.log('[AIWebCrafter] Order synced successfully to cloud database:', awcRes);
          }
        }).catch((e) => {
          console.warn('[AIWebCrafter] Cloud sync notice:', e.message);
        });
      }

      return data;
    } catch (err: any) {
      console.error('[API] checkoutOrder failed:', err);
      return { success: false, error: err.message || 'فشل إتمام الطلب' };
    }
  },

  // ------------------------------------------
  // AIWEBCRAFTER CLOUD CONNECTOR METHODS
  // ------------------------------------------
  async getAIWebCrafterProducts(categorySlug: string | null = null, page = 1) {
    return await getAWCStoreProducts(categorySlug, page);
  },

  async submitToAIWebCrafter(cart: any) {
    return await submitOrderToAIWebCrafter(cart);
  },

  async checkAIWebCrafterStatus() {
    return await checkAIWebCrafterConnection();
  },

  async getOrderById(orderId: string): Promise<{
    success: boolean;
    order?: Order;
    sellerOrders?: SellerOrder[];
    orderItems?: OrderItemEntity[];
  }> {
    try {
      const res = await fetch(`/api/orders`);
      if (!res.ok) return { success: false };
      const orders: Order[] = await res.json();
      const match = orders.find((o) => o.id === orderId || o.orderNumber === orderId);
      return match ? { success: true, order: match } : { success: false };
    } catch (err: any) {
      console.error('[API] getOrderById failed:', err);
      return { success: false };
    }
  },

  // Search Unsplash photos helper
  async searchUnsplash(query: string, perPage: number = 12): Promise<{ id: string; url: string; thumb: string; description: string; photographer: string }[]> {
    try {
      const res = await fetch(`/api/unsplash/search?query=${encodeURIComponent(query)}&per_page=${perPage}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.results || [];
    } catch (err) {
      console.error('[API] searchUnsplash failed:', err);
      return [];
    }
  },

  // AI Content Generator helper
  async generateAIContent(prompt: string): Promise<string> {
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const json = await res.json();
      return json.text || '';
    } catch (err) {
      console.error('[API] generateAIContent failed:', err);
      return '';
    }
  },
};
