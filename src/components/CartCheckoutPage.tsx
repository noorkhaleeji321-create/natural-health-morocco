import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Truck,
  ShieldCheck,
  Building2,
  Banknote,
  CheckCircle,
  Copy,
  Check,
  User,
  Phone,
  MapPin,
  FileText,
  AlertCircle,
  Clock,
  Sparkles,
  MessageCircle,
  Store as StoreIcon,
  Package,
  Bookmark,
  ExternalLink,
  CreditCard,
} from 'lucide-react';
import { CartItem, PaymentMethod, Order, SellerOrder, ShippingAddress } from '../types';
import { storeInfo } from '../data/storeData';
import { useStore } from '../context/StoreContext';
import { api } from '../lib/api';

interface CartCheckoutPageProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onNavigateToProducts: () => void;
  onNavigateToHome: () => void;
  onTrackOrder?: (orderId: string, phone: string) => void;
  onNavigateToAccount?: () => void;
}

type Stage = 'cart' | 'checkout' | 'review' | 'success';

export const CartCheckoutPage: React.FC<CartCheckoutPageProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onNavigateToProducts,
  onNavigateToHome,
  onTrackOrder,
  onNavigateToAccount,
}) => {
  const {
    bankSettings,
    storeSettings,
    createOrder,
    currentUser,
    stores,
    sellers,
    addOrderToLocal,
    refreshData,
  } = useStore();

  // Navigation within checkout flow
  const [stage, setStage] = useState<Stage>('cart');

  // Customer Form State
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [city, setCity] = useState(currentUser?.city || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [notes, setNotes] = useState('');

  // Saved Shipping Addresses
  const [savedAddresses, setSavedAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [saveNewAddress, setSaveNewAddress] = useState(false);

  // Synchronize with logged in customer if available
  useEffect(() => {
    if (currentUser) {
      if (!fullName && currentUser.fullName) setFullName(currentUser.fullName);
      if (!phone && currentUser.phone) setPhone(currentUser.phone);
      if (!city && currentUser.city) setCity(currentUser.city);
      if (!address && currentUser.address) setAddress(currentUser.address);

      // Fetch saved shipping addresses
      api.getShippingAddresses(currentUser.id)
        .then((res) => {
          if (res.success && res.addresses && res.addresses.length > 0) {
            setSavedAddresses(res.addresses);
          }
        })
        .catch(console.warn);
    }
  }, [currentUser]);

  // Active Payment Options from Admin Control Panel
  const isCodActive = bankSettings.isCodEnabled !== false;
  const isCardActive = bankSettings.isCardEnabled === true;
  const isPaypalActive = bankSettings.isPaypalEnabled === true;
  const isBankTransferActive = bankSettings.isBankTransferEnabled === true;

  // Payment Method Initialization & Auto-Fallbacks
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => {
    if (isCodActive) return 'cod';
    if (isCardActive) return 'card';
    if (isPaypalActive) return 'paypal';
    if (isBankTransferActive) return 'bank_transfer';
    return 'cod';
  });

  useEffect(() => {
    if (paymentMethod === 'cod' && !isCodActive) {
      if (isCardActive) setPaymentMethod('card');
      else if (isPaypalActive) setPaymentMethod('paypal');
      else if (isBankTransferActive) setPaymentMethod('bank_transfer');
    } else if (paymentMethod === 'card' && !isCardActive) {
      if (isCodActive) setPaymentMethod('cod');
      else if (isPaypalActive) setPaymentMethod('paypal');
      else if (isBankTransferActive) setPaymentMethod('bank_transfer');
    } else if (paymentMethod === 'paypal' && !isPaypalActive) {
      if (isCodActive) setPaymentMethod('cod');
      else if (isCardActive) setPaymentMethod('card');
      else if (isBankTransferActive) setPaymentMethod('bank_transfer');
    } else if (paymentMethod === 'bank_transfer' && !isBankTransferActive) {
      if (isCodActive) setPaymentMethod('cod');
      else if (isCardActive) setPaymentMethod('card');
      else if (isPaypalActive) setPaymentMethod('paypal');
    }
  }, [bankSettings, paymentMethod, isCodActive, isCardActive, isPaypalActive, isBankTransferActive]);

  // Check URL params for successful return from payment gateway
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment_status');
    const orderIdParam = params.get('order_id');

    if (paymentStatus === 'success' && orderIdParam) {
      api.getOrderById(orderIdParam).then((res) => {
        if (res && res.order) {
          setOrderNumber(res.order.id);
          setConfirmedOrder(res.order);
          setChildOrders(res.sellerOrders || []);
          addOrderToLocal(res.order);
          onClearCart();
          setStage('success');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }).catch(console.warn);
    }
  }, [addOrderToLocal, onClearCart]);

  // Order Result State
  const [orderNumber, setOrderNumber] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [childOrders, setChildOrders] = useState<SellerOrder[]>([]);
  const [copiedRib, setCopiedRib] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Multi-vendor grouping
  const sellerGroups = useMemo(() => {
    const groups: Record<string, {
      sellerId: string;
      storeId?: string;
      storeName: string;
      storeSlug?: string;
      sellerName?: string;
      city?: string;
      items: CartItem[];
      subtotal: number;
    }> = {};

    items.forEach((item) => {
      const sId = item.product.sellerId || 'seller-saeed';
      const store = stores.find((st) => st.id === item.product.storeId || st.sellerId === sId);
      const seller = sellers.find((s) => s.id === sId);
      const storeName = store?.name || seller?.storeName || seller?.businessName || 'محل عند سعيد (المتجر الرئيسي)';
      const storeSlug = store?.slug || (sId === 'seller-saeed' ? 'said-store' : '');
      const sellerName = seller?.sellerName || seller?.businessName || 'سعيد أيت علي';
      const storeCity = store?.city || seller?.city || 'مراكش';

      if (!groups[sId]) {
        groups[sId] = {
          sellerId: sId,
          storeId: store?.id,
          storeName,
          storeSlug,
          sellerName,
          city: storeCity,
          items: [],
          subtotal: 0,
        };
      }
      groups[sId].items.push(item);
      groups[sId].subtotal += item.product.price * item.quantity;
    });

    return Object.values(groups);
  }, [items, stores, sellers]);

  const hasMultipleVendors = sellerGroups.length > 1;

  // Calculations from reactive settings
  const subtotal = items.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );
  const freeShippingThreshold = storeSettings.freeShippingThreshold || 250;
  const isFreeShipping = subtotal >= freeShippingThreshold;
  const shippingCost = items.length === 0 ? 0 : isFreeShipping ? 0 : (storeSettings.shippingFee || 35);
  const total = subtotal + shippingCost;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  // Copy RIB Helper
  const handleCopyRib = () => {
    navigator.clipboard.writeText(bankSettings.rib.replace(/\s+/g, ''));
    setCopiedRib(true);
    setTimeout(() => setCopiedRib(false), 2500);
  };

  // Strict Anti-Spam Validation
  const validateCustomerInfo = () => {
    const errors: Record<string, string> = {};

    // 1. Phone Number Validation (Digits only, valid length, valid Moroccan phone pattern)
    const rawPhone = phone.trim();
    const cleanPhoneDigits = rawPhone.replace(/[\s-+()]/g, '');
    const isOnlyDigits = /^\d+$/.test(cleanPhoneDigits);
    const isValidMoroccanPhone =
      /^(?:212|0)[5-7]\d{8}$/.test(cleanPhoneDigits) ||
      (isOnlyDigits && cleanPhoneDigits.length >= 9 && cleanPhoneDigits.length <= 12);

    if (!rawPhone) {
      errors.phone = 'يرجى إدخال رقم الهاتف للتواصل معك لتأكيد الطلب';
    } else if (!isOnlyDigits) {
      errors.phone = 'رقم الهاتف يجب أن يحتوي على أرقام فقط دون حروف أو رموز!';
    } else if (!isValidMoroccanPhone) {
      errors.phone = 'يرجى إدخال رقم هاتف صحيح (مثال: 0612345678 أو 0712345678)';
    }

    // 2. Full Name Validation (Must not contain numbers or random keyboard smash)
    const nameTrimmed = fullName.trim();
    const nameLetterCount = (nameTrimmed.match(/[\p{L}]/gu) || []).length;
    const hasNumbersInName = /\d/.test(nameTrimmed);
    const hasExtremeRepeats = /(.)\1{4,}/.test(nameTrimmed);

    if (!nameTrimmed) {
      errors.fullName = 'يرجى إدخال الاسم الكامل الحقيقي';
    } else if (hasNumbersInName) {
      errors.fullName = 'الاسم الكامل يجب أن يحتوي على حروف فقط بدون أرقام!';
    } else if (nameLetterCount < 3) {
      errors.fullName = 'الاسم قصير جداً! يرجى كتابة الاسم واللقب الحقيقي (مثال: محمد العلوي)';
    } else if (hasExtremeRepeats) {
      errors.fullName = 'يرجى إدخال اسم حقيقي بدون تكرار عشوائي للحروف';
    }

    // 3. City Validation (Must not contain numbers or gibberish)
    const cityTrimmed = city.trim();
    const cityLetterCount = (cityTrimmed.match(/[\p{L}]/gu) || []).length;
    const hasNumbersInCity = /\d/.test(cityTrimmed);

    if (!cityTrimmed) {
      errors.city = 'يرجى إدخال اسم مدينتك أو اختيارها من القائمة';
    } else if (hasNumbersInCity) {
      errors.city = 'اسم المدينة يجب أن يحتوي على حروف فقط بدون أرقام!';
    } else if (cityLetterCount < 3) {
      errors.city = 'يرجى إدخال اسم مدينة صحيح (مثال: مراكش، الدار البيضاء، الرباط)';
    }

    // 4. Address Validation
    const addressTrimmed = address.trim();
    if (!addressTrimmed) {
      errors.address = 'يرجى إدخال العنوان بالتفصيل (الحي، الشارع، رقم المنزل)';
    } else if (addressTrimmed.length < 6) {
      errors.address = 'العنوان قصير جداً! المرجو تفصيل العنوان (الحي ورقم المنزل) لضمان التسليم';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSelectSavedAddress = (addr: ShippingAddress) => {
    setSelectedAddressId(addr.id);
    setFullName(addr.fullName);
    setPhone(addr.phone);
    setCity(addr.city);
    setAddress(addr.address);
    setFormErrors({});
  };

  const handleProceedToCheckout = () => {
    setStage('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateCustomerInfo()) {
      setStage('review');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleConfirmOrder = async () => {
    // Re-verify anti-spam customer details before submitting
    if (!validateCustomerInfo()) {
      setStage('checkout');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setIsSubmitting(true);
    try {
      // Save shipping address if option selected
      if (saveNewAddress && currentUser?.id) {
        api.addShippingAddress(currentUser.id, {
          fullName,
          phone,
          city,
          address,
          isDefault: savedAddresses.length === 0,
        }).catch(console.warn);
      }

      // Atomic Server Checkout (calculates real prices & breaks down child orders per vendor)
      const res = await api.checkoutOrder({
        customerId: currentUser?.id,
        customer: {
          fullName,
          phone,
          city,
          address,
          notes,
          email: currentUser?.email,
        },
        paymentMethod: paymentMethod,
        notes,
        items: items.map((i) => {
          const safeImage =
            i.product.image && i.product.image.startsWith('data:') && i.product.image.length > 150000
              ? '/assets/aistudio/WhatsApp_Image_2026-10-28_at_19.35.25_6c594579.jpeg'
              : (i.product.image || '');
          return {
            productId: i.product.id,
            quantity: i.quantity,
            selectedWeight: i.selectedWeight || i.product.unit,
            product: {
              id: i.product.id,
              name: i.product.name,
              price: i.product.price,
              category: i.product.category,
              unit: i.product.unit,
              image: safeImage,
            },
            image: safeImage,
            productImageSnapshot: safeImage,
            productNameSnapshot: i.product.name,
            unitPrice: i.product.price,
          };
        }),
      });

      if (res.success && res.order) {
        // If payment method is Card or PayPal, create checkout session and redirect to real gateway
        if (paymentMethod === 'card' || paymentMethod === 'paypal') {
          try {
            const sessRes = await fetch('/api/payments/create-checkout-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: res.order.id, paymentMethod }),
            }).then((r) => r.json());

            if (sessRes && sessRes.redirectUrl) {
              onClearCart();
              window.location.href = sessRes.redirectUrl;
              return;
            }
          } catch (e) {
            console.warn('Payment session redirect error:', e);
          }
        }

        setOrderNumber(res.order.id);
        setConfirmedOrder(res.order);
        setChildOrders(res.sellerOrders || []);
        addOrderToLocal(res.order);
        refreshData().catch(console.warn);
        onClearCart();
        setStage('success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    } catch (err) {
      console.warn('Atomic checkout fallback to local store:', err);
    } finally {
      setIsSubmitting(false);
    }

    // Fallback to local store context
    const created = await createOrder({
      customer: {
        fullName,
        phone,
        city,
        address,
        notes,
        email: currentUser?.email,
      },
      items: items.map((i) => {
        const safeImage =
          i.product.image && i.product.image.startsWith('data:') && i.product.image.length > 150000
            ? '/assets/aistudio/WhatsApp_Image_2026-10-28_at_19.35.25_6c594579.jpeg'
            : (i.product.image || '');
        return {
          productId: i.product.id,
          quantity: i.quantity,
          selectedWeight: i.selectedWeight || i.product.unit,
          product: {
            ...i.product,
            image: safeImage,
            images: undefined,
            description: '',
          },
          image: safeImage,
          productImageSnapshot: safeImage,
          productNameSnapshot: i.product.name,
          unitPrice: i.product.price,
        };
      }),
      total,
      subtotal,
      shipping: shippingCost,
      paymentMethod,
      status: 'new',
    });

    setOrderNumber(created.id);
    setConfirmedOrder(created);

    // Sync order directly to AIWebCrafter Cloud
    api.submitToAIWebCrafter({
      customer: {
        name: fullName,
        phone,
        email: currentUser?.email || '',
        address,
        city,
      },
      paymentMethod: paymentMethod === 'cod' ? 'Cash On Delivery (COD)' : paymentMethod,
      items: items.map((i) => ({
        id: i.product.id,
        name: i.product.name,
        price: i.product.price,
        qty: i.quantity,
      })),
      notes,
    }).catch((err) => console.warn('[AIWebCrafter] Cloud fallback sync notice:', err));

    onClearCart();
    setStage('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinishShopping = () => {
    onClearCart();
    setStage('cart');
    setFullName('');
    setPhone('');
    setCity('');
    setAddress('');
    setNotes('');
    setPaymentMethod('cod');
    onNavigateToProducts();
  };

  const getWhatsAppMessageUrl = () => {
    const activeOrder = confirmedOrder;
    const orderIdToUse = activeOrder?.id || orderNumber;
    const orderTotal = activeOrder?.total ?? total;
    const orderSubtotal = activeOrder?.subtotal ?? subtotal;
    const orderShipping = activeOrder?.shipping ?? shippingCost;
    const custName = activeOrder?.customer?.fullName || fullName;
    const custPhone = activeOrder?.customer?.phone || phone;
    const custCity = activeOrder?.customer?.city || city;
    const custAddress = activeOrder?.customer?.address || address;

    const itemsList = (activeOrder?.items || items)
      .map((i: any) => {
        const pName = i.product?.name || i.productName || 'منتج طبيعي';
        const pPrice = i.unitPrice || i.product?.price || 0;
        const pQty = i.quantity || 1;
        const pUnit = i.selectedWeight || i.unit || '';
        return `• ${pName} ${pUnit ? `(${pUnit})` : ''} - الكمية: ${pQty} × ${pPrice} DH`;
      })
      .join('%0A');

    const paymentText =
      paymentMethod === 'cod' ? 'الدفع نقداً عند الاستلام' : 'التحويل البنكي المباشر (Virement)';

    const shippingText = orderShipping === 0 ? 'مجاني 🚚' : `${orderShipping} DH`;

    const text = `السلام عليكم ورحمة الله،%0Aأود تأكيد طلبي من *عِطارة عند سعيد*%0A%0A*رقم الطلب:* %23${orderIdToUse}%0A*الاسم:* ${encodeURIComponent(custName)}%0A*الهاتف:* ${encodeURIComponent(custPhone)}%0A*المدينة:* ${encodeURIComponent(custCity)}%0A*العنوان:* ${encodeURIComponent(custAddress)}${notes ? `%0A*ملاحظات:* ${encodeURIComponent(notes)}` : ''}%0A*طريقة الدفع:* ${encodeURIComponent(paymentText)}%0A%0A*تفاصيل المنتجات:*%0A${itemsList}%0A%0A*مجموع المنتجات:* ${orderSubtotal} DH%0A*مصاريف التوصيل:* ${encodeURIComponent(shippingText)}%0A*المجموع الإجمالي المستحق:* *${orderTotal} DH*`;

    const cleanPhone = (storeSettings.whatsapp || storeInfo.whatsapp).replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  // Moroccan Cities list for quick pick
  const popularCities = [
    'الدار البيضاء',
    'مراكش',
    'الرباط',
    'فاس',
    'طنجة',
    'أكادير',
    'مكناس',
    'وجدة',
    'القنيطرة',
    'تطوان',
    'العيون',
    'الناظور',
  ];

  // ----------------------------------------------------
  // STEP 4: SUCCESS PAGE (Unified Single Store Receipt)
  // ----------------------------------------------------
  if (stage === 'success') {
    const orderToDisplay = confirmedOrder;
    const finalSubtotal = orderToDisplay?.subtotal ?? subtotal;
    const finalShipping = orderToDisplay?.shipping ?? shippingCost;
    const finalTotal = orderToDisplay?.total ?? total;
    const displayId = orderToDisplay?.id || orderNumber;
    const displayCustomer = orderToDisplay?.customer || {
      fullName,
      phone,
      city,
      address,
      notes,
    };
    const displayItems = orderToDisplay?.items || items;

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-16">
        <div className="bg-[#101713] border border-[#213027] rounded-3xl p-6 sm:p-12 text-center shadow-2xl relative overflow-hidden">
          {/* Subtle glow accent */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#D97706]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[#1B3629]/40 rounded-full blur-3xl pointer-events-none" />

          {/* Success Icon */}
          <div className="relative inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-[#14291F] rounded-full text-[#10B981] mb-6 border border-[#10B981]/40 shadow-xl">
            <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>

          <div className="inline-block bg-[#1B2921] border border-[#D97706]/30 text-[#F59E0B] text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full mb-3">
            تم تسجيل طلبك بنجاح بارك الله فيك!
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-[#FAF5EC] font-['Cairo'] mb-2">
            شكراً لثقتكم في عِطارة عند سعيد
          </h1>

          <p className="text-sm sm:text-base text-[#A89C89] max-w-xl mx-auto leading-relaxed mb-6">
            تم استلام طلبيتك بنجاح وهي الآن قيد التجهيز بعناية في ورشتنا بمدينة مراكش. سنتواصل معكم هاتفياً لتأكيد وقت الشحن والتسليم.
          </p>

          {/* Single Consolidated Order Badge Card */}
          <div className="bg-[#17221C] border border-[#293A30] rounded-2xl p-5 sm:p-7 max-w-2xl mx-auto mb-8 text-right shadow-lg">
            <div className="flex items-center justify-between border-b border-[#213027] pb-4 mb-4">
              <div>
                <span className="text-xs text-[#8A9B90] block">رقم الطلب (Order ID):</span>
                <span className="text-xl sm:text-2xl font-black text-[#F59E0B] font-mono tracking-wider">
                  #{displayId}
                </span>
              </div>
              <span className="bg-[#1A3828] text-[#34D399] text-xs font-bold px-3 py-1.5 rounded-full border border-[#10B981]/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span>قيد التجهيز 📦</span>
              </span>
            </div>

            {/* Customer Details */}
            <div className="space-y-2.5 text-xs sm:text-sm text-[#C4B7A4] pb-4 border-b border-[#213027]">
              <div className="flex justify-between">
                <span className="text-[#8A9B90]">الاسم الكامل:</span>
                <span className="font-bold text-white">{displayCustomer.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A9B90]">رقم الهاتف:</span>
                <span className="font-mono text-white" dir="ltr">{displayCustomer.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A9B90]">المدينة والعنوان:</span>
                <span className="text-white">{displayCustomer.city} {displayCustomer.address ? `- ${displayCustomer.address}` : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A9B90]">طريقة الدفع:</span>
                <span className="font-bold text-[#F3BA63]">
                  {paymentMethod === 'cod' ? 'الدفع نقداً عند الاستلام (Cash)' : 'التحويل البنكي المباشر'}
                </span>
              </div>
            </div>

            {/* Items List Snapshot */}
            {displayItems && displayItems.length > 0 && (
              <div className="py-4 border-b border-[#213027] space-y-2">
                <h4 className="text-xs font-bold text-[#FAF5EC] flex items-center gap-1.5 mb-2 font-['Cairo']">
                  <Package className="w-4 h-4 text-[#D97706]" />
                  <span>المنتجات المطلوبة ({displayItems.length}):</span>
                </h4>
                <div className="space-y-2 bg-[#0E1511] p-3 rounded-xl border border-[#1E2E25]">
                  {displayItems.map((it: any, idx: number) => {
                    const itemName = it.product?.name || it.productName || 'منتج طبيعي';
                    const itemQty = it.quantity || 1;
                    const itemPrice = it.unitPrice || it.product?.price || 0;
                    const itemWeight = it.selectedWeight || it.product?.unit || '';
                    const itemImg = it.product?.image || '';

                    return (
                      <div key={idx} className="flex items-center justify-between text-xs py-1">
                        <div className="flex items-center gap-2">
                          {itemImg && (
                            <img src={itemImg} alt={itemName} className="w-9 h-9 rounded-lg object-cover border border-[#28382E]" />
                          )}
                          <div>
                            <p className="font-bold text-white">{itemName}</p>
                            <p className="text-[11px] text-[#8A9B90]">
                              الكمية: {itemQty} {itemWeight ? `• ${itemWeight}` : ''} × {itemPrice} DH
                            </p>
                          </div>
                        </div>
                        <span className="font-bold font-mono text-[#F3BA63]">{itemQty * itemPrice} DH</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Financial Summary */}
            <div className="pt-4 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-[#8A9B90]">
                <span>مجموع المنتجات:</span>
                <span className="font-bold text-white font-mono">{finalSubtotal} DH</span>
              </div>

              <div className="flex justify-between text-[#8A9B90]">
                <span>ثمن التوصيل (لباب البيت):</span>
                <span className="font-bold font-mono text-[#34D399]">
                  {finalShipping === 0 ? 'مجاني 🚚 (توفير 35 DH)' : `${finalShipping} DH`}
                </span>
              </div>

              <div className="flex justify-between pt-3 border-t border-[#26372D] text-base sm:text-lg">
                <span className="font-black text-white">المجموع الإجمالي الواجب أداؤه:</span>
                <span className="font-black text-[#F59E0B] text-xl font-mono">{finalTotal} DH</span>
              </div>
            </div>

            {/* Bank details reminder if bank transfer */}
            {paymentMethod === 'bank_transfer' && (
              <div className="mt-5 p-4 rounded-xl bg-[#121A16] border border-[#D97706]/40 text-right">
                <div className="flex items-center gap-2 text-xs font-bold text-[#F59E0B] mb-2">
                  <Building2 className="w-4 h-4" />
                  <span>تذكير بمعلومات التحويل البنكي:</span>
                </div>
                <div className="text-xs text-[#E5DCce] space-y-1">
                  <p><strong>البنك:</strong> {bankSettings.bankName}</p>
                  <p><strong>صاحب الحساب:</strong> {bankSettings.accountHolder}</p>
                  <p className="font-mono text-[11px] sm:text-xs text-[#F3BA63] tracking-wider break-all">
                    <strong>RIB (24 رقم):</strong> {bankSettings.rib}
                  </p>
                </div>
                <p className="text-[11px] text-[#A89C89] mt-2">
                  {bankSettings.instructions || `يرجى إرسال صورة وصل التحويل عبر الواتساب مع ذكر رقم الطلب (#${displayId}) لتأكيد الشحن الفوري.`}
                </p>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 max-w-lg mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* WhatsApp Confirmation */}
              <a
                href={getWhatsAppMessageUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-black font-black text-xs sm:text-sm px-4 py-3.5 rounded-xl shadow-lg transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>تأكيد الطلب عبر الواتساب</span>
              </a>

              {/* Track Order CTA */}
              {onTrackOrder && (
                <button
                  type="button"
                  onClick={() => onTrackOrder(displayId, displayCustomer.phone)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-xs sm:text-sm px-4 py-3.5 rounded-xl shadow-lg transition-colors cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  <span>تتبع حالة هذا الطلب</span>
                </button>
              )}
            </div>

            {/* Back to Shopping */}
            <button
              type="button"
              onClick={handleFinishShopping}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#1C2620] hover:bg-[#25352C] text-[#FAF5EC] font-bold text-xs sm:text-sm px-4 py-3.5 rounded-xl border border-[#2E3F35] transition-colors cursor-pointer"
            >
              <span>متابعة التسوق</span>
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // EMPTY CART STATE
  // ----------------------------------------------------
  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-24 text-center">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#121A16] border border-[#212E27] rounded-full flex items-center justify-center mx-auto mb-6 text-[#786C5A] shadow-xl">
          <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-[#FAF5EC] font-['Cairo'] mb-3">
          سلة التسوق فارغة حالياً
        </h1>
        <p className="text-sm sm:text-base text-[#A89C89] max-w-md mx-auto leading-relaxed mb-8">
          لم تقم بإضافة أي منتج إلى سلتك بعد. استكشف تشكيلتنا الواسعة من العسل الحر، التوابل الملكية، الزيوت الطبيعية، والأعشاب الطبية.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onNavigateToProducts}
            className="inline-flex items-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-sm sm:text-base px-7 py-3.5 rounded-xl shadow-lg transition-all hover:scale-105"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>تصفح جميع المنتجات الآن</span>
          </button>
          <button
            onClick={onNavigateToHome}
            className="inline-flex items-center gap-2 bg-[#141E19] hover:bg-[#1D2B23] text-[#FAF5EC] font-bold text-sm sm:text-base px-6 py-3.5 rounded-xl border border-[#223128] transition-colors"
          >
            <span>العودة للرئيسية</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12">
      {/* Page Title & Breadcrumb Header */}
      <div className="mb-6 sm:mb-10 pb-4 sm:pb-6 border-b border-[#212F27]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#D97706] mb-1">
              <Sparkles className="w-4 h-4" />
              <span>{storeSettings.storeName} — منتجات طبيعية 100% ورعاية صحية متكاملة</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-[#FAF5EC] font-['Cairo'] tracking-tight">
              {stage === 'cart'
                ? 'سلة التسوق'
                : stage === 'checkout'
                ? 'إتمام الطلب ومعلومات التوصيل'
                : 'مراجعة وتأكيد الطلب النهائي'}
            </h1>
          </div>

          {/* Stepper Progress Badges */}
          <div className="flex items-center gap-1.5 sm:gap-3 bg-[#111915] p-1.5 sm:p-2 rounded-2xl border border-[#223128] text-xs font-bold">
            <button
              onClick={() => setStage('cart')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors ${
                stage === 'cart'
                  ? 'bg-[#D97706] text-white shadow-md'
                  : 'text-[#A89C89] hover:text-white'
              }`}
            >
              <span>1. السلة</span>
              <span className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center text-[10px] font-mono">
                {items.length}
              </span>
            </button>

            <span className="text-[#3A4E42]">›</span>

            <button
              onClick={() => {
                if (stage === 'review') setStage('checkout');
              }}
              disabled={stage === 'cart'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors ${
                stage === 'checkout'
                  ? 'bg-[#D97706] text-white shadow-md'
                  : stage === 'review'
                  ? 'text-[#F3BA63] hover:text-white'
                  : 'text-[#5B6D62] cursor-not-allowed'
              }`}
            >
              <span>2. المعلومات والدفع</span>
            </button>

            <span className="text-[#3A4E42]">›</span>

            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${
                stage === 'review'
                  ? 'bg-[#D97706] text-white shadow-md'
                  : 'text-[#5B6D62]'
              }`}
            >
              <span>3. التأكيد</span>
            </div>
          </div>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="mt-4 p-3 rounded-xl bg-[#111915] border border-[#223128] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#D97706]" />
            {isFreeShipping ? (
              <span className="text-[#34D399] font-bold">
                مبروك! لقد حصلت على توصيل مجاني 🚚 لجميع مدن المغرب.
              </span>
            ) : (
              <span className="text-[#C4B7A4]">
                أضف منتجات بقيمة{' '}
                <strong className="text-[#F59E0B] font-mono font-bold">
                  {remainingForFreeShipping} DH
                </strong>{' '}
                إضافية للحصول على{' '}
                <strong className="text-white">توصيل مجاني</strong>.
              </span>
            )}
          </div>
          <div className="w-full sm:w-48 bg-[#1A2620] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#D97706] h-full transition-all duration-500 rounded-full"
              style={{
                width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ======================================================== */}
        {/* RIGHT / MAIN COLUMN: Changes based on stage */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 space-y-6">
          {/* STAGE 1: CART ITEMS TABLE */}
          {stage === 'cart' && (
            <div className="bg-[#101713] border border-[#213027] rounded-2xl overflow-hidden shadow-lg">
              <div className="p-4 sm:p-5 border-b border-[#213027] bg-[#141E18] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#D97706]" />
                  <h2 className="font-bold text-base sm:text-lg text-[#FAF5EC] font-['Cairo']">
                    المنتجات المضافة ({items.length})
                  </h2>
                </div>
                <button
                  onClick={onClearCart}
                  className="text-xs text-[#EF4444] hover:text-[#F87171] flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-[#EF4444]/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>تفريغ السلة</span>
                </button>
              </div>

              {/* Single Consolidated Items List */}
              <div className="p-4 sm:p-5 space-y-3">
                <div className="space-y-3">
                  {items.map(({ product, quantity }) => {
                    const itemTotal = product.price * quantity;
                    return (
                      <div
                        key={product.id}
                        className="p-3 sm:p-4 rounded-xl bg-[#121A16] border border-[#1E2C23] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#141E18] transition-colors"
                      >
                        {/* Product Thumbnail & Name */}
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-[#0C120F] shrink-0 border border-[#26372D]">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="min-w-0">
                            <span className="text-[10px] sm:text-xs text-[#D97706] font-bold block">
                              {product.category}
                            </span>
                            <h3 className="font-bold text-xs sm:text-sm text-[#FAF5EC] font-['Cairo'] line-clamp-1">
                              {product.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs sm:text-sm font-black text-[#F3BA63] font-mono">
                                {product.price} DH
                              </span>
                              <span className="text-[10px] sm:text-xs text-[#8F8372]">
                                / {product.unit}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quantity Controls & Item Subtotal */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1C2821]">
                          <div className="flex items-center bg-[#17231C] border border-[#27392E] rounded-xl p-1">
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#111A15] hover:bg-[#D97706] text-[#FAF5EC] transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>

                            <span className="w-8 sm:w-10 text-center font-black text-xs sm:text-sm font-mono text-white">
                              {quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#111A15] hover:bg-[#D97706] text-[#FAF5EC] transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="text-left min-w-[70px]">
                            <span className="text-[10px] text-[#8A9B90] block">المجموع:</span>
                            <span className="font-black text-xs sm:text-sm text-[#F59E0B] font-mono">
                              {itemTotal} DH
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => onRemoveItem(product.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                            title="حذف المنتج من السلة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cart Footer Actions */}
              <div className="p-4 sm:p-5 bg-[#121A15] border-t border-[#213027] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onNavigateToProducts}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#F3BA63] hover:text-[#D97706] transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  <span>إضافة المزيد من المنتجات</span>
                </button>

                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  className="inline-flex items-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-sm sm:text-base px-6 py-3 rounded-xl shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <span>متابعة إتمام الطلب</span>
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>
            </div>
          )}

          {/* STAGE 2: CHECKOUT FORM (معلومات الزبون + العناوين + طريقة الدفع) */}
          {stage === 'checkout' && (
            <form onSubmit={handleProceedToReview} className="space-y-6">
              {/* Customer Info Card */}
              <div className="bg-[#101713] border border-[#213027] rounded-2xl p-5 sm:p-6 shadow-lg">
                <div className="flex items-center justify-between pb-3 mb-5 border-b border-[#213027]">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-[#D97706]" />
                    <h2 className="font-bold text-base sm:text-lg text-[#FAF5EC] font-['Cairo']">
                      معلومات الزبون والتوصيل
                    </h2>
                  </div>
                  {currentUser && (
                    <span className="text-xs text-[#34D399] bg-[#16291F] px-2.5 py-1 rounded-full border border-[#10B981]/30">
                      حساب مسجل ✓
                    </span>
                  )}
                </div>

                {/* Saved Addresses Picker (if customer has saved addresses) */}
                {savedAddresses.length > 0 && (
                  <div className="mb-5 p-3.5 rounded-xl bg-[#141F19] border border-[#26382D] space-y-2">
                    <span className="text-xs font-bold text-[#F3BA63] flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>اختر من عناوينك المحفوظة:</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {savedAddresses.map((addr) => (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => handleSelectSavedAddress(addr)}
                          className={`p-2.5 rounded-lg border text-right transition-all text-xs ${
                            selectedAddressId === addr.id
                              ? 'bg-[#1E2E25] border-[#D97706] text-white shadow-xs'
                              : 'bg-[#111A15] border-[#223127] text-[#A89C89] hover:border-[#D97706]/50'
                          }`}
                        >
                          <p className="font-bold text-white">{addr.fullName} ({addr.city})</p>
                          <p className="text-[11px] text-[#A89C89] truncate">{addr.address}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#E5DCce] mb-1.5">
                      الاسم الكامل <span className="text-[#EF4444]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => {
                          const valueWithoutNumbers = e.target.value.replace(/[0-9]/g, '');
                          setFullName(valueWithoutNumbers);
                          if (formErrors.fullName) {
                            setFormErrors((prev) => ({ ...prev, fullName: '' }));
                          }
                        }}
                        placeholder="مثال: محمد العلوي"
                        className={`w-full bg-[#151F19] border ${
                          formErrors.fullName ? 'border-[#EF4444]' : 'border-[#26372D]'
                        } rounded-xl px-4 py-3 text-sm text-[#FAF5EC] placeholder-[#6E6455] focus:outline-hidden focus:border-[#D97706]`}
                      />
                    </div>
                    {formErrors.fullName && (
                      <p className="text-[#EF4444] text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.fullName}
                      </p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#E5DCce] mb-1.5">
                      رقم الهاتف (للاتصال والتأكيد) <span className="text-[#EF4444]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9+]*"
                        dir="ltr"
                        value={phone}
                        onChange={(e) => {
                          const onlyDigitsAndPlus = e.target.value.replace(/[^0-9+]/g, '');
                          setPhone(onlyDigitsAndPlus);
                          if (formErrors.phone) {
                            setFormErrors((prev) => ({ ...prev, phone: '' }));
                          }
                        }}
                        placeholder="0612345678"
                        className={`w-full bg-[#151F19] border ${
                          formErrors.phone ? 'border-[#EF4444]' : 'border-[#26372D]'
                        } rounded-xl px-4 py-3 text-sm text-right text-[#FAF5EC] placeholder-[#6E6455] focus:outline-hidden focus:border-[#D97706] font-mono`}
                      />
                    </div>
                    {formErrors.phone && (
                      <p className="text-[#EF4444] text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.phone}
                      </p>
                    )}
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#E5DCce] mb-1.5">
                      المدينة <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => {
                        const valueWithoutNumbers = e.target.value.replace(/[0-9]/g, '');
                        setCity(valueWithoutNumbers);
                        if (formErrors.city) {
                          setFormErrors((prev) => ({ ...prev, city: '' }));
                        }
                      }}
                      placeholder="مثال: مراكش، الدار البيضاء، الرباط..."
                      className={`w-full bg-[#151F19] border ${
                        formErrors.city ? 'border-[#EF4444]' : 'border-[#26372D]'
                      } rounded-xl px-4 py-3 text-sm text-[#FAF5EC] placeholder-[#6E6455] focus:outline-hidden focus:border-[#D97706]`}
                    />
                    {formErrors.city && (
                      <p className="text-[#EF4444] text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.city}
                      </p>
                    )}

                    {/* Quick City Pills */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {popularCities.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setCity(c);
                            if (formErrors.city) {
                              setFormErrors((prev) => ({ ...prev, city: '' }));
                            }
                          }}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                            city === c
                              ? 'bg-[#D97706] text-white border-[#D97706]'
                              : 'bg-[#151F19] text-[#A89C89] border-[#223128] hover:border-[#D97706]/40 hover:text-white'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Detailed Address */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#E5DCce] mb-1.5">
                      العنوان بالتفصيل (الحي، الشارع، رقم المنزل/العمارة){' '}
                      <span className="text-[#EF4444]">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        if (formErrors.address) {
                          setFormErrors((prev) => ({ ...prev, address: '' }));
                        }
                      }}
                      placeholder="مثال: حي سيدي يوسف بن علي، درب الجديد رقم 42"
                      className={`w-full bg-[#151F19] border ${
                        formErrors.address ? 'border-[#EF4444]' : 'border-[#26372D]'
                      } rounded-xl px-4 py-3 text-sm text-[#FAF5EC] placeholder-[#6E6455] focus:outline-hidden focus:border-[#D97706]`}
                    />
                    {formErrors.address && (
                      <p className="text-[#EF4444] text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.address}
                      </p>
                    )}
                  </div>

                  {/* Save address checkbox for logged in users */}
                  {currentUser && (
                    <label className="flex items-center gap-2 text-xs text-[#C4B7A4] cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={saveNewAddress}
                        onChange={(e) => setSaveNewAddress(e.target.checked)}
                        className="rounded text-[#D97706] focus:ring-0 bg-[#151F19] border-[#26372D]"
                      />
                      <span>حفظ هذا العنوان في دفتر عناويني للطلبات القادمة</span>
                    </label>
                  )}

                  {/* Special Notes */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#E5DCce] mb-1.5 flex items-center justify-between">
                      <span>ملاحظات إضافية للتوصيل (اختياري)</span>
                      <span className="text-[11px] text-[#8A9B90] font-normal">
                        مثال: وقت مفضل للاتصال
                      </span>
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="مثال: المرجو الاتصال بي بعد الساعة الخامسة مساءً"
                      className="w-full bg-[#151F19] border border-[#26372D] rounded-xl px-4 py-2.5 text-sm text-[#FAF5EC] placeholder-[#6E6455] focus:outline-hidden focus:border-[#D97706]"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Methods Card */}
              <div className="bg-[#101713] border border-[#213027] rounded-2xl p-5 sm:p-6 shadow-lg">
                <div className="flex items-center gap-2 pb-3 mb-5 border-b border-[#213027]">
                  <CreditCard className="w-5 h-5 text-[#D97706]" />
                  <h2 className="font-bold text-base sm:text-lg text-[#FAF5EC] font-['Cairo']">
                    طريقة الأداء والدفع الإلكتروني
                  </h2>
                </div>

                <div className="space-y-3">
                  {/* Option 1: Credit / Debit Card (Visa, Mastercard, CMI) */}
                  {isCardActive && (
                    <label
                      onClick={() => setPaymentMethod('card')}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        paymentMethod === 'card'
                          ? 'bg-[#18261F] border-[#D97706] shadow-md'
                          : 'bg-[#131C17] border-[#233128] hover:border-[#D97706]/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        className="mt-1 text-[#D97706] focus:ring-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-white flex items-center gap-2">
                            <span>الدفع بالبطاقة البنكية (Carte Bancaire Visa / Mastercard)</span>
                          </span>
                          <span className="text-[10px] bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 px-2 py-0.5 rounded-full font-bold">
                            بوابة Paddle الآمنة 🔒
                          </span>
                        </div>
                        <p className="text-xs text-[#A89C89] mt-1 leading-relaxed">
                          دفع إلكتروني فوري وآمن مباشرة عبر نظام Paddle المعالج المعتمد للبطاقات (Visa / Mastercard) بدون أية مسؤولية شخصية.
                        </p>
                        <div className="flex items-center gap-2 mt-2 font-mono text-[10px] text-white">
                          <span className="bg-blue-600 px-1.5 py-0.5 rounded font-bold italic">VISA</span>
                          <span className="bg-red-600 px-1.5 py-0.5 rounded font-bold">Mastercard</span>
                          <span className="bg-[#D97706] px-1.5 py-0.5 rounded font-bold">CMI 🇲🇦</span>
                        </div>
                      </div>
                    </label>
                  )}

                  {/* Option 2: PayPal */}
                  {isPaypalActive && (
                    <label
                      onClick={() => setPaymentMethod('paypal')}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        paymentMethod === 'paypal'
                          ? 'bg-[#18261F] border-[#D97706] shadow-md'
                          : 'bg-[#131C17] border-[#233128] hover:border-[#D97706]/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="paypal"
                        checked={paymentMethod === 'paypal'}
                        onChange={() => setPaymentMethod('paypal')}
                        className="mt-1 text-[#D97706] focus:ring-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-white">
                            الدفع السريع عبر حساب بايبال (PayPal Express Checkout)
                          </span>
                          <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800/60 px-2 py-0.5 rounded-full font-bold">
                            حماية المشتري 🌐
                          </span>
                        </div>
                        <p className="text-xs text-[#A89C89] mt-1 leading-relaxed">
                          استخدام حسابك في PayPal لإتمام الشراء بأمان وحماية مشتريات عالمية.
                        </p>
                      </div>
                    </label>
                  )}

                  {/* Option 3: COD (Cash on Delivery) */}
                  {isCodActive && (
                    <label
                      onClick={() => setPaymentMethod('cod')}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        paymentMethod === 'cod'
                          ? 'bg-[#18261F] border-[#D97706] shadow-md'
                          : 'bg-[#131C17] border-[#233128] hover:border-[#D97706]/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="mt-1 text-[#D97706] focus:ring-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-white">
                            💵 الدفع نقداً عند الاستلام (Paiement Cash à la Livraison - COD)
                          </span>
                          <span className="text-[10px] bg-[#D97706]/20 text-[#F59E0B] border border-[#D97706]/40 px-2 py-0.5 rounded-full font-bold">
                            الخيار الأكثر طلباً ⭐
                          </span>
                        </div>
                        <p className="text-xs text-[#A89C89] mt-1 leading-relaxed">
                          ادفع نقداً لمندوب التوصيل بعد استلام ومعاينة طردك لباب منزلك.
                        </p>
                      </div>
                    </label>
                  )}

                  {/* Option 4: Bank Transfer */}
                  {isBankTransferActive && (
                    <label
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        paymentMethod === 'bank_transfer'
                          ? 'bg-[#18261F] border-[#D97706] shadow-md'
                          : 'bg-[#131C17] border-[#233128] hover:border-[#D97706]/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank_transfer"
                        checked={paymentMethod === 'bank_transfer'}
                        onChange={() => setPaymentMethod('bank_transfer')}
                        className="mt-1 text-[#D97706] focus:ring-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-white">
                            🏦 التحويل البنكي المباشر (Virement RIB)
                          </span>
                          <span className="text-[10px] bg-[#16291F] text-[#34D399] border border-[#10B981]/30 px-2 py-0.5 rounded-full font-bold">
                            تأكيد سريع 📋
                          </span>
                        </div>
                        <p className="text-xs text-[#A89C89] mt-1 leading-relaxed">
                          تحويل إلى الحساب البنكي الرسمي وإرسال صورة الوصل عبر الواتساب.
                        </p>
                      </div>
                    </label>
                  )}
                </div>

                {/* Bank Account Details Card (shown when bank transfer is selected) */}
                {paymentMethod === 'bank_transfer' && (
                  <div className="mt-5 p-4 sm:p-5 rounded-xl bg-[#141F1A] border border-[#D97706]/40 text-right space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#223329]">
                      <div className="flex items-center gap-2 text-sm font-bold text-[#F3BA63]">
                        <Building2 className="w-4 h-4 text-[#D97706]" />
                        <span>معلومات الحساب البنكي الرسمي ({storeSettings.storeName}):</span>
                      </div>
                      <span className="text-[11px] text-[#A89C89]">المغرب 🇲🇦</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[#8A9B90] block">اسم البنك:</span>
                        <strong className="text-white text-sm">{bankSettings.bankName}</strong>
                      </div>

                      <div>
                        <span className="text-[#8A9B90] block">اسم صاحب الحساب:</span>
                        <strong className="text-white text-sm">
                          {bankSettings.accountHolder}
                        </strong>
                      </div>
                    </div>

                    {/* 24-digit Moroccan RIB with Copy button */}
                    <div className="pt-2 border-t border-[#223329]">
                      <span className="text-xs text-[#8A9B90] block mb-1">
                        رقم الحساب البنكي (RIB) المكون من 24 رقماً:
                      </span>
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#0C1410] border border-[#273B2F]">
                        <span
                          dir="ltr"
                          className="font-mono text-xs sm:text-sm font-black text-[#F59E0B] tracking-wider select-all"
                        >
                          {bankSettings.rib}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyRib}
                          className="inline-flex items-center gap-1 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold px-3 py-1.5 rounded-md transition-colors shrink-0 cursor-pointer"
                        >
                          {copiedRib ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>تم النسخ!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>نسخ RIB</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-[#A89C89] mt-2 leading-relaxed">
                        {bankSettings.instructions || '💡 يمكنك نسخ الـ RIB والقيام بالتحويل عبر تطبيق بنكك. بعد تأكيد الطلب، سيظهر لك زر لإرسال وصل التحويل مباشرة عبر الواتساب.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Actions */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStage('cart')}
                  className="inline-flex items-center gap-1.5 bg-[#141F19] hover:bg-[#1D2B23] text-[#E5DCce] font-bold text-sm px-5 py-3 rounded-xl border border-[#23332A] transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  <span>الرجوع لتعديل السلة</span>
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-sm sm:text-base px-7 py-3.5 rounded-xl shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <span>متابعة مراجعة الطلب</span>
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>
            </form>
          )}

          {/* STAGE 3: ORDER REVIEW (تأكيد الطلب) */}
          {stage === 'review' && (
            <div className="space-y-6">
              {/* Order Confirmation Card */}
              <div className="bg-[#101713] border border-[#213027] rounded-2xl p-5 sm:p-6 shadow-lg space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#213027]">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-[#D97706]" />
                    <h2 className="font-bold text-base sm:text-lg text-[#FAF5EC] font-['Cairo']">
                      الملخص النهائي للطلب
                    </h2>
                  </div>
                  <span className="text-xs text-[#F3BA63] bg-[#1B2921] px-3 py-1 rounded-full border border-[#D97706]/30">
                    خطوة أخيرة قبل التسجيل
                  </span>
                </div>

                {/* 1. Products and Quantities Summary */}
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#D97706] mb-3 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4" />
                    <span>المنتجات المطلوبة ({items.length} منتجات):</span>
                  </h3>

                  <div className="bg-[#141E18] rounded-xl p-3.5 border border-[#223228] space-y-2.5">
                    <div className="divide-y divide-[#1D2A22]">
                      {items.map(({ product, quantity }) => (
                        <div
                          key={product.id}
                          className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded-lg bg-black/40 border border-[#27382E]"
                            />
                            <div>
                              <p className="font-bold text-white font-['Cairo']">{product.name}</p>
                              <p className="text-[11px] text-[#A89C89]">
                                الكمية: <strong className="text-[#F3BA63]">{quantity}</strong> ×{' '}
                                {product.price} DH ({product.unit})
                              </p>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-[#F59E0B]">
                            {product.price * quantity} DH
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Customer & Delivery Information */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs sm:text-sm font-bold text-[#D97706] flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      <span>معلومات التوصيل:</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setStage('checkout')}
                      className="text-xs text-[#F3BA63] underline hover:text-[#D97706]"
                    >
                      تعديل
                    </button>
                  </div>

                  <div className="bg-[#141E18] rounded-xl p-4 border border-[#223228] text-xs sm:text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#8A9B90]">الاسم الكامل:</span>
                      <strong className="text-white">{fullName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8A9B90]">رقم الهاتف:</span>
                      <strong className="text-white font-mono" dir="ltr">
                        {phone}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8A9B90]">المدينة:</span>
                      <strong className="text-white">{city}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8A9B90]">العنوان بالتفصيل:</span>
                      <strong className="text-white text-right max-w-xs">{address}</strong>
                    </div>
                    {notes && (
                      <div className="flex justify-between pt-2 border-t border-[#1F2C23]">
                        <span className="text-[#8A9B90]">ملاحظات:</span>
                        <span className="text-[#C4B7A4] text-right max-w-xs">{notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Payment Method */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs sm:text-sm font-bold text-[#D97706] flex items-center gap-1.5">
                      <Banknote className="w-4 h-4" />
                      <span>طريقة الدفع:</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setStage('checkout')}
                      className="text-xs text-[#F3BA63] underline hover:text-[#D97706]"
                    >
                      تغيير
                    </button>
                  </div>

                  <div className="bg-[#141E18] rounded-xl p-4 border border-[#223228] flex items-center justify-between">
                    <div>
                      <strong className="text-white text-sm block">
                        {paymentMethod === 'cod' ? 'الدفع نقداً عند الاستلام' : 'التحويل البنكي (Virement)'}
                      </strong>
                      <p className="text-xs text-[#A89C89] mt-0.5">
                        {paymentMethod === 'cod'
                          ? 'تسليم المبلغ لمندوب التوصيل بعد معاينة البضاعة.'
                          : `تحويل إلى ${bankSettings.bankName} (RIB: ${bankSettings.rib.slice(0, 10)}...)`}
                      </p>
                    </div>
                    <span className="bg-[#1C2C23] text-[#34D399] text-xs font-bold px-3 py-1 rounded-full border border-[#10B981]/30">
                      محدد
                    </span>
                  </div>
                </div>

                {/* Final Notice & Guarantees */}
                <div className="p-3.5 rounded-xl bg-[#17231B] border border-[#26372D] flex items-start gap-2.5 text-xs text-[#C4B7A4]">
                  <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    بالضغط على <strong>&ldquo;تأكيد الطلب&rdquo;</strong>، سيتم تسجيل طلبك وتجهيز بضاعتك بعناية من طرف فريق المتجر فوراً، ولن يتم خصم أي مبالغ إلكترونية دون علمك، وضمان الجودة مكفول 100%.
                  </p>
                </div>

                {/* Confirmation Button */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStage('checkout')}
                    className="inline-flex items-center gap-1.5 bg-[#141F19] hover:bg-[#1D2B23] text-[#E5DCce] font-bold text-sm px-5 py-3 rounded-xl border border-[#23332A] transition-colors"
                  >
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    <span>رجوع للمعلومات</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleConfirmOrder}
                    className={`inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-black font-black text-sm sm:text-base px-8 py-3.5 rounded-xl shadow-xl transition-all hover:scale-[1.02] cursor-pointer ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>{isSubmitting ? 'جاري تسجيل الطلب...' : 'تأكيد الطلب الآن'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* LEFT COLUMN: ORDER SUMMARY SIDEBAR (Stickied) */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="bg-[#101713] border border-[#213027] rounded-2xl p-5 sm:p-6 shadow-xl">
            <h2 className="font-bold text-base sm:text-lg text-[#FAF5EC] font-['Cairo'] pb-3 mb-4 border-b border-[#213027] flex items-center justify-between">
              <span>ملخص الحساب</span>
              <span className="text-xs text-[#D97706] font-mono">{items.length} أصناف في {sellerGroups.length} طرد</span>
            </h2>

            {/* Vendor breakdown summary */}
            {hasMultipleVendors && (
              <div className="mb-4 p-3 rounded-xl bg-[#141F18] border border-[#243429] space-y-1.5 text-xs">
                <span className="text-[11px] text-[#A89C89] font-bold block mb-1">تفصيل الطرود حسب البائعين:</span>
                {sellerGroups.map((g) => (
                  <div key={g.sellerId} className="flex justify-between text-[#C4B7A4]">
                    <span className="truncate max-w-[180px]">📦 {g.storeName}:</span>
                    <span className="font-mono text-white font-bold">{g.subtotal} DH</span>
                  </div>
                ))}
              </div>
            )}

            {/* Calculations Breakdown */}
            <div className="space-y-3 text-xs sm:text-sm text-[#C4B7A4]">
              <div className="flex justify-between items-center">
                <span className="text-[#8A9B90]">مجموع السلة:</span>
                <span className="font-bold font-mono text-white text-sm">{subtotal} DH</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#8A9B90]">مصاريف الشحن والتوصيل:</span>
                {isFreeShipping ? (
                  <span className="text-[#34D399] font-bold flex items-center gap-1">
                    <span>مجاني</span>
                    <Truck className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className="font-bold font-mono text-white">{shippingCost} DH</span>
                )}
              </div>

              <div className="pt-3 border-t border-[#213027] flex justify-between items-center text-base sm:text-lg">
                <span className="font-black text-white font-['Cairo']">المجموع الإجمالي:</span>
                <span className="font-black font-mono text-[#F59E0B] text-xl sm:text-2xl">
                  {total} DH
                </span>
              </div>
            </div>

            {/* Quick Action Button if on Cart Stage */}
            {stage === 'cart' && (
              <button
                type="button"
                onClick={handleProceedToCheckout}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-sm sm:text-base py-3.5 rounded-xl shadow-lg transition-all hover:scale-[1.01] cursor-pointer"
              >
                <span>متابعة إتمام الطلب</span>
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              </button>
            )}

            {/* Guarantees Badges */}
            <div className="mt-6 pt-4 border-t border-[#1C2821] grid grid-cols-2 gap-2 text-[11px] text-[#A89C89]">
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[#141D18]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                <span>أصلي ومضمون 100%</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[#141D18]">
                <Truck className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                <span>شحن سريع لجميع المدن</span>
              </div>
            </div>
          </div>

          {/* Help & Contact Notice */}
          <div className="bg-[#101713] border border-[#213027] rounded-2xl p-4 text-xs text-[#8A9B90] flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-white">هل تحتاج لمساعدة في الطلب؟</p>
              <p className="text-[11px] text-[#A89C89]">فريق عند سعيد في خدمتك هاتفياً أو عبر الواتساب</p>
            </div>
            <a
              href={`https://wa.me/${storeInfo.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#18261F] hover:bg-[#22352B] text-[#34D399] font-bold px-3 py-2 rounded-xl border border-[#283C30] transition-colors shrink-0 flex items-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>واتساب</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
