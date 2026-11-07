/**
 * Client-Side Dynamic SEO Manager for Natural Health Morocco
 * Manages document title, meta descriptions, canonical URLs, OpenGraph tags,
 * and Schema.org JSON-LD structured data (Product, Offer, BreadcrumbList, etc.)
 */
import { Product } from '../types';

export const BASE_SITE_URL = 'https://natural-health-morocco.online';
export const DEFAULT_OG_IMAGE = `${BASE_SITE_URL}/assets/aistudio/WhatsApp_Image_2026-10-28_at_19.35.25_6c594579.jpeg`;

export const DEFAULT_META = {
  title: 'natural-morocco | دليل أسرار العافية الطبيعية ومنتجات الصحة 100% بالمغرب',
  description:
    'دليل أسرار العافية الطبيعية في المغرب. نقدم لكم أفضل المنتجات الطبيعية 100% للعناية بالجسم والصحة، بما في ذلك خلطات زيادة الوزن والتسمين الطبيعي، مراهم وكريمات تسكين آلام المفاصل والروماتيزم بـ سم النحل، والزيوت الطبيعية للمساج والعناية بالصحة. جودة عالية وتوصيل سريع لجميع المدن المغربية.',
  canonical: `${BASE_SITE_URL}/`,
};

function setMetaTag(selector: string, attrName: string, attrValue: string, content: string) {
  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonical(url: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = url;
}

function setJsonLd(id: string, schema: object | null) {
  const existing = document.getElementById(id);
  if (!schema) {
    if (existing) existing.remove();
    return;
  }

  const script = existing || document.createElement('script');
  script.id = id;
  script.setAttribute('type', 'application/ld+json');
  script.textContent = JSON.stringify(schema, null, 2);
  if (!existing) {
    document.head.appendChild(script);
  }
}

/**
 * Update SEO metadata and Structured Data for a specific Product
 */
export function updateProductSeo(product: Product) {
  if (!product || !product.id) return;

  const title = `${product.name} | Natural Health Morocco`;
  const cleanDesc = (product.description || '')
    .replace(/<[^>]*>?/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160) || `اطلب الآن ${product.name} بجودة عالية وتوصيل سريع لجميع المدن المغربية والدفع عند الاستلام.`;

  const productUrl = `${BASE_SITE_URL}/product/${encodeURIComponent(product.id)}`;
  const imageUrl = product.image
    ? product.image.startsWith('http')
      ? product.image
      : `${BASE_SITE_URL}${product.image.startsWith('/') ? '' : '/'}${product.image}`
    : DEFAULT_OG_IMAGE;

  // Title & Canonical
  document.title = title;
  setCanonical(productUrl);

  // Meta description & robots
  setMetaTag('meta[name="description"]', 'name', 'description', cleanDesc);
  setMetaTag('meta[name="robots"]', 'name', 'robots', 'index, follow, max-image-preview:large');

  // OpenGraph
  setMetaTag('meta[property="og:title"]', 'property', 'og:title', title);
  setMetaTag('meta[property="og:description"]', 'property', 'og:description', cleanDesc);
  setMetaTag('meta[property="og:url"]', 'property', 'og:url', productUrl);
  setMetaTag('meta[property="og:image"]', 'property', 'og:image', imageUrl);
  setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'product');

  // Twitter
  setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', title);
  setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', cleanDesc);
  setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', imageUrl);

  // Strict Structured Data (No fake reviews or fake ratings)
  const isAvailable = product.inStock !== false && (product.stockCount ?? 1) > 0;
  const productSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: imageUrl,
    description: cleanDesc,
    sku: product.sku || product.id,
    category: product.category,
    brand: {
      '@type': 'Brand',
      name: 'Natural Health Morocco',
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'MAD',
      price: product.price,
      itemCondition: 'https://schema.org/NewCondition',
      availability: isAvailable
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Natural Health Morocco',
      },
    },
  };

  // Only include genuine aggregateRating if reviews count is positive and verified
  if (product.reviewsCount && product.reviewsCount > 0 && product.rating && product.rating > 0) {
    productSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Math.min(5, Math.max(1, product.rating)),
      reviewCount: product.reviewsCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // Breadcrumbs Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'الرئيسية',
        item: `${BASE_SITE_URL}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'كل المنتجات',
        item: `${BASE_SITE_URL}/products`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.category,
        item: `${BASE_SITE_URL}/category/${encodeURIComponent(product.category)}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: product.name,
        item: productUrl,
      },
    ],
  };

  setJsonLd('schema-product-dynamic', productSchema);
  setJsonLd('schema-breadcrumb-dynamic', breadcrumbSchema);
}

/**
 * Update SEO metadata for a Category view
 */
export function updateCategorySeo(categoryName: string, categorySlug: string, count?: number) {
  const title = `${categoryName} | منتجات طبيعية 100% | Natural Health Morocco`;
  const desc = `تسوق أفضل منتجات ${categoryName} الطبيعية والأصلية في المغرب. جودة مضمونة${
    count ? ` (${count} منتج متوفر)` : ''
  } مع توصيل سريع لجميع المدن والدفع عند الاستلام.`;

  const categoryUrl = `${BASE_SITE_URL}/category/${encodeURIComponent(categorySlug)}`;

  document.title = title;
  setCanonical(categoryUrl);

  setMetaTag('meta[name="description"]', 'name', 'description', desc);
  setMetaTag('meta[property="og:title"]', 'property', 'og:title', title);
  setMetaTag('meta[property="og:description"]', 'property', 'og:description', desc);
  setMetaTag('meta[property="og:url"]', 'property', 'og:url', categoryUrl);
  setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'website');

  setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', title);
  setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', desc);

  // Clear product schema and set category breadcrumb
  setJsonLd('schema-product-dynamic', null);

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'الرئيسية',
        item: `${BASE_SITE_URL}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'كل المنتجات',
        item: `${BASE_SITE_URL}/products`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: categoryName,
        item: categoryUrl,
      },
    ],
  };

  setJsonLd('schema-breadcrumb-dynamic', breadcrumbSchema);
}

/**
 * Update SEO for Static/Standard Store Pages
 */
export function updatePageSeo(pageName: string) {
  setJsonLd('schema-product-dynamic', null);

  let title = DEFAULT_META.title;
  let description = DEFAULT_META.description;
  let canonical = DEFAULT_META.canonical;

  if (pageName === 'products') {
    title = 'كل المنتجات الطبيعية والعطارة الأصيلة | Natural Health Morocco';
    description =
      'اكتشف تشكيلة واسعة من أجود المنتجات الطبيعية 100% بالمغرب: خلطات صحراوية، مراهم سم النحل، زيوت طبيعية ومستحضرات تجميل أصلية مع التوصيل السريع لجميع المدن.';
    canonical = `${BASE_SITE_URL}/products`;
  } else if (pageName === 'order-tracking') {
    title = 'تتبع طلبيتك مباشرة | Natural Health Morocco';
    description = 'خدمة تتبع الطلبيات المباشرة لزبائن متجر Natural Health Morocco برقم الطلب أو رقم الهاتف.';
    canonical = `${BASE_SITE_URL}/order-tracking`;
  } else if (pageName === 'policy' || pageName === 'terms') {
    title = 'سياسة الاسترجاع والخصوصية والشروط | Natural Health Morocco';
    description = 'تعرف على سياسة الخصوصية، ضمان الجودة، شروط الاسترجاع والاستبدال، وتوصيل الطلبات لدى متجر Natural Health Morocco.';
    canonical = `${BASE_SITE_URL}/policy`;
  } else if (pageName === 'cart') {
    title = 'سلة المشتريات | Natural Health Morocco';
    description = 'سلة المشتريات لمتجر Natural Health Morocco - استكمل طلبك الآن مع الدفع عند الاستلام.';
    canonical = `${BASE_SITE_URL}/cart`;
  }

  document.title = title;
  setCanonical(canonical);
  setMetaTag('meta[name="description"]', 'name', 'description', description);
  setMetaTag('meta[property="og:title"]', 'property', 'og:title', title);
  setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
  setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonical);
  setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'website');

  setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', title);
  setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);

  // Breadcrumb
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'الرئيسية',
        item: `${BASE_SITE_URL}/`,
      },
      ...(pageName !== 'home'
        ? [
            {
              '@type': 'ListItem',
              position: 2,
              name: pageName === 'products' ? 'كل المنتجات' : pageName === 'order-tracking' ? 'تتبع الطلبية' : pageName,
              item: canonical,
            },
          ]
        : []),
    ],
  };

  setJsonLd('schema-breadcrumb-dynamic', breadcrumbSchema);
}
