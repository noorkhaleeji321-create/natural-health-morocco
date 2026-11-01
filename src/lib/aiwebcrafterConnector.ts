// -------------------------------------------------------------
// AIWebCrafter Store Connector (ES6 / Browser or Node.js)
// Dedicated Cloud Database & Storage API for Your Existing Store
// -------------------------------------------------------------

import { Product } from '../types';

export const AWC_CONFIG = {
  endpoint: "https://www.aiwebcrafter.com/api/v1",
  proxyEndpoint: "/api/proxy",
  apiKey: "11CJDCA5Y0V5vflsFKg4ah_B6vChEX6IkQunWKTzkMreqcFy4eDx0JgPzvhrpjf6DA5DBER2RV2DQXjwgq"
};

export interface AIWebCrafterCartItem {
  id: string;
  name: string;
  sku?: string;
  price: number;
  qty: number;
}

export interface AIWebCrafterCart {
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
  };
  paymentMethod?: string;
  items: AIWebCrafterCartItem[];
  notes?: string;
}

// 1. Fetch Published Products Catalog from AIWebCrafter Cloud
export async function getStoreProducts(categorySlug: string | null = null, page = 1) {
  // Try proxy first if in browser
  try {
    if (typeof window !== 'undefined') {
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
    }
  } catch (proxyErr) {
    // Continue to direct fallback
  }

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
    if (!result.success && !result.data) throw new Error(result.error || 'Failed to retrieve products from AIWebCrafter');
    return result.data || result;
  } catch (err: any) {
    console.warn('[AIWebCrafter] getStoreProducts notice:', err.message);
    return null;
  }
}

// 2. Submit Customer Checkout Order to AIWebCrafter Cloud
export async function submitOrderToAIWebCrafter(cart: AIWebCrafterCart) {
  const payload = {
    customer_name: cart.customer.name,
    customer_phone: cart.customer.phone,
    customer_email: cart.customer.email || '',
    shipping_address: cart.customer.address,
    city: cart.customer.city,
    payment_method: cart.paymentMethod || 'Cash On Delivery (COD)',
    items: cart.items.map(item => ({
      product_id: item.id,
      product_name: item.name,
      sku: item.sku || `SKU-${item.id}`,
      unit_price: item.price,
      quantity: item.qty
    })),
    notes: cart.notes || ''
  };

  // Try proxy first if in browser
  try {
    if (typeof window !== 'undefined') {
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
    }
  } catch (proxyErr) {
    // Continue to direct fallback
  }

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
    console.warn('[AIWebCrafter] submitOrderToAIWebCrafter notice (offline/queued):', err.message);
    return {
      success: false,
      error: err.message,
      isOfflineQueued: true
    };
  }
}

// 3. Health & Connectivity Check
export async function checkAIWebCrafterConnection(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${AWC_CONFIG.endpoint}/health`, {
      headers: {
        'X-AWC-API-KEY': AWC_CONFIG.apiKey,
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);
    return { connected: res.ok, latencyMs: Date.now() - start };
  } catch (err: any) {
    return { connected: false, error: err.message };
  }
}
