export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  image: string;
  badge?: string;
  ctaText?: string;
  ctaTarget?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
  image: string;
  description: string;
}

export type UserRole = 'customer' | 'seller' | 'admin' | 'super_admin';

export type ProductStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'out_of_stock' | 'archived';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  originalPrice?: number;
  compareAtPrice?: number;
  unit: string;
  weight?: string;
  image: string;
  images?: string[];
  rating: number;
  reviewsCount: number;
  isBestSeller?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  description: string;
  origin?: string;
  inStock: boolean;
  stockCount?: number;
  stockQuantity?: number;
  createdAt?: string;
  updatedAt?: string;
  benefits?: string[];
  usage?: string;
  shortDescription?: string;
  isOrganic?: boolean;
  instructions?: string;
  // Multi-vendor marketplace fields
  sellerId?: string;
  storeId?: string;
  sellerName?: string;
  storeName?: string;
  storeSlug?: string;
  slug?: string;
  sku?: string;
  status?: ProductStatus;
  rejectionReason?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  sellerId?: string;
  storeId?: string;
  storeName?: string;
  sellerName?: string;
  selectedWeight?: string;
}

export interface MarketplaceCartItem {
  id: string;
  cartId: string;
  productId: string;
  sellerId?: string;
  storeId?: string;
  storeName?: string;
  sellerName?: string;
  quantity: number;
  unitPrice: number;
  selectedWeight?: string;
  product?: Product;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceCart {
  id: string;
  customerId: string;
  items?: MarketplaceCartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ShippingAddress {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  city: string;
  address: string;
  additionalDetails?: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type PaymentMethod = 'card' | 'paypal' | 'cod' | 'bank_transfer';

export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'refunded';

export type OrderStatus =
  | 'new'
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready_for_shipping'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export interface OrderCustomerInfo {
  fullName: string;
  phone: string;
  email?: string;
  city: string;
  address: string;
  notes?: string;
}

export interface OrderItemEntity {
  id: string;
  orderId: string;
  sellerOrderId?: string;
  productId: string;
  sellerId?: string;
  storeId?: string;
  sellerName?: string;
  storeName?: string;
  productNameSnapshot: string;
  productImageSnapshot: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  unit?: string;
  createdAt?: string;
}

export interface SellerOrder {
  id: string;
  orderId: string;
  parentOrderNumber?: string;
  sellerId: string;
  storeId?: string;
  storeName?: string;
  sellerName?: string;
  customerName?: string;
  customerPhone?: string;
  customerCity?: string;
  customerAddress?: string;
  items?: OrderItemEntity[];
  subtotal: number;
  shippingFee: number;
  total: number;
  orderStatus: OrderStatus;
  paymentStatus?: PaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Order {
  id: string;
  orderNumber?: string;
  items: CartItem[];
  customer: OrderCustomerInfo;
  customerId?: string;
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus;
  subtotal: number;
  shipping: number;
  total: number;
  createdAt: string;
  updatedAt?: string;
  status: OrderStatus;
  orderStatus?: OrderStatus;
  statusNote?: string;
  notes?: string;
  bankDetailsSnapshot?: {
    bankName: string;
    accountHolder: string;
    rib: string;
  };
  // Multi-vendor parent and child order tracking
  sellerIds?: string[];
  sellerOrders?: SellerOrder[];
  orderItems?: OrderItemEntity[];
  customerNameSnapshot?: string;
  customerPhoneSnapshot?: string;
  shippingAddressSnapshot?: string;
  aiwebcrafterSynced?: boolean;
  aiwebcrafterOrderId?: string;
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  city: string;
  address: string;
  password?: string;
  createdAt: string;
  role?: UserRole;
  sellerId?: string;
  totalOrders?: number;
  totalSpent?: number;
}

// -------------------------------------------------------------
// Multi-Vendor Marketplace Entities (Sellers & Stores)
// -------------------------------------------------------------

export type SellerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface Seller {
  id: string;
  userId: string;
  phone: string;
  businessName: string;
  sellerName?: string;
  storeName?: string;
  businessDescription?: string;
  description?: string;
  businessDocument?: string;
  city: string;
  address?: string;
  logoUrl?: string;
  coverUrl?: string;
  sellerStatus: SellerStatus;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  storeId?: string;
}

export type StoreStatus = 'pending' | 'active' | 'suspended' | 'closed';

export interface StoreEntity {
  id: string;
  sellerId: string;
  name: string;
  slug: string;
  description: string;
  slogan?: string;
  logoUrl?: string;
  coverUrl?: string;
  bannerUrl?: string;
  phone: string;
  whatsapp?: string;
  city: string;
  address: string;
  status: StoreStatus;
  rating: number;
  reviewsCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface SellerApplicationRequest {
  businessName?: string;
  sellerName?: string;
  businessDescription?: string;
  description?: string;
  businessDocument?: string;
  storeName: string;
  storeSlug?: string;
  phone: string;
  city: string;
  address?: string;
  logoUrl?: string;
  coverUrl?: string;
  bannerUrl?: string;
}

export interface BankSettings {
  bankName: string;
  accountHolder: string;
  rib: string;
  instructions: string;
  isBankTransferEnabled: boolean;
  isCodEnabled: boolean;
  isCardEnabled: boolean;
  isPaypalEnabled: boolean;
  paymentMode?: 'sandbox' | 'live';
  paddleVendorId?: string;
  paddleClientToken?: string;
  paddleApiKey?: string;
  cardPublishableKey?: string;
  cardSecretKey?: string;
  paypalClientId?: string;
  paypalClientSecret?: string;
}

export interface StoreSettings {
  storeName: string;
  storeSlogan: string;
  logoUrl?: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  openingHours: string;
  email: string;
  freeShippingThreshold: number;
  shippingFee: number;
  currency: string;
  announcementText: string;
  adminPin: string;
  // About Section customizable fields
  aboutImageUrl?: string;
  aboutBadgeYears?: string;
  aboutBadgeTitle?: string;
  aboutBadgeSubtitle?: string;
  aboutStoryP1?: string;
  aboutStoryP2?: string;
  // Banner / Slider toggle
  showHeroSlider?: boolean;
}
