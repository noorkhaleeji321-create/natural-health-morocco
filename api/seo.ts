import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore/lite';

const BASE_SITE_URL = 'https://www.natural-health-morocco.online';
const DEFAULT_OG_IMAGE = `${BASE_SITE_URL}/assets/aistudio/WhatsApp_Image_2026-10-28_at_19.35.25_6c594579.jpeg`;

let appPromise: Promise<any> | null = null;
let dbPromise: Promise<any> | null = null;

interface CatalogCache {
  products: Record<string, any>[];
  categories: Record<string, any>[];
  fetchedAt: number;
}

const CATALOG_MEMORY_TTL_MS = 15 * 60 * 1000;
let catalogCache: CatalogCache | null = null;
let inFlightCatalogPromise: Promise<{
  products: Record<string, any>[];
  categories: Record<string, any>[];
}> | null = null;
let templateCache: { html: string; fetchedAt: number } | null = null;

function loadFirebaseConfig(): Record<string, any> {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  if (process.env.VITE_FIREBASE_API_KEY && process.env.VITE_FIREBASE_PROJECT_ID) {
    return {
      apiKey: process.env.VITE_FIREBASE_API_KEY,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID,
      firestoreDatabaseId: process.env.VITE_FIREBASE_DATABASE_ID,
    };
  }

  throw new Error('Firebase configuration not found');
}

async function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      try {
        const config = loadFirebaseConfig();
        if (!appPromise) {
          appPromise = Promise.resolve(
            getApps().find((a) => a.name === 'vercel-seo') || initializeApp(config, 'vercel-seo')
          );
        }
        const app = await appPromise;
        return getFirestore(app, config.firestoreDatabaseId);
      } catch (err) {
        appPromise = null;
        dbPromise = null;
        throw err;
      }
    })();
  }
  return dbPromise;
}

async function getCatalog(): Promise<{
  products: Record<string, any>[];
  categories: Record<string, any>[];
}> {
  const now = Date.now();
  if (catalogCache && now - catalogCache.fetchedAt < CATALOG_MEMORY_TTL_MS) {
    return { products: catalogCache.products, categories: catalogCache.categories };
  }

  if (!inFlightCatalogPromise) {
    inFlightCatalogPromise = (async () => {
      const db = await getDb();
      const [prodSnap, catSnap] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'categories')),
      ]);

      const products = prodSnap.docs
        .map((d) => ({ ...d.data(), id: d.id } as Record<string, any>))
        .filter((p) => !p.status || p.status === 'approved');
      const categories = catSnap.docs.map((d) => ({ ...d.data(), id: d.id } as Record<string, any>));

      catalogCache = { products, categories, fetchedAt: Date.now() };
      return { products, categories };
    })().finally(() => {
      inFlightCatalogPromise = null;
    });
  }

  return inFlightCatalogPromise;
}

async function getHtmlTemplate(req: any): Promise<string> {
  const now = Date.now();
  if (templateCache && now - templateCache.fetchedAt < 300_000) {
    return templateCache.html;
  }

  const candidates = [
    path.join(process.cwd(), 'dist', 'index.html'),
    path.join(process.cwd(), 'index.html'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const content = fs.readFileSync(candidate, 'utf8');
      if (!content.includes('/src/main.tsx')) {
        templateCache = { html: content, fetchedAt: now };
        return content;
      }
    }
  }

  const host = req?.headers?.host || 'www.natural-health-morocco.online';
  const proto = String(req?.headers?.['x-forwarded-proto'] || 'https');
  const origins = [`${proto}://${host}/index.html`, `${BASE_SITE_URL}/index.html`];

  for (const url of origins) {
    try {
      const resp = await fetch(url, { headers: { Accept: 'text/html' } });
      if (resp.ok) {
        const html = await resp.text();
        if (html.includes('<div id="root"') && !html.includes('/src/main.tsx')) {
          templateCache = { html, fetchedAt: now };
          return html;
        }
      }
    } catch {
      // Try next origin
    }
  }

  throw new Error('Built index.html template unavailable');
}

function escapeHtml(unsafe: unknown): string {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toAbsoluteUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return DEFAULT_OG_IMAGE;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return DEFAULT_OG_IMAGE;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `${BASE_SITE_URL}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

function cleanText(raw?: string, fallback: string = '', maxLen: number = 160): string {
  const text = String(raw || '')
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const base = text || fallback;
  return base.length > maxLen ? `${base.slice(0, maxLen - 3).trim()}...` : base;
}

function replaceMetaAndLinks(
  html: string,
  opts: {
    title: string;
    description: string;
    canonical: string;
    ogType: string;
    ogImage: string;
    robots?: string;
    extraJsonLd?: string;
    ssrBodyHtml?: string;
  }
): string {
  const safeTitle = escapeHtml(opts.title);
  const safeDesc = escapeHtml(opts.description);
  const safeCanonical = escapeHtml(opts.canonical);
  const safeImage = escapeHtml(opts.ogImage);
  const safeOgType = escapeHtml(opts.ogType);

  let out = html;

  out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`);
  out = out.replace(
    /<link rel="canonical" href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${safeCanonical}" />`
  );
  out = out.replace(
    /<meta property="og:url" content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${safeCanonical}" />`
  );
  out = out.replace(
    /<meta name="twitter:url" content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:url" content="${safeCanonical}" />`
  );

  // Update hreflang alternates to match canonical route rather than pointing every product/category to /
  out = out.replace(
    /<link rel="alternate" hreflang="(ar|ar-MA|x-default)" href="[^"]*"\s*\/?>/gi,
    `<link rel="alternate" hreflang="$1" href="${safeCanonical}" />`
  );
  out = out.replace(
    /<link rel="alternate" hreflang="fr" href="[^"]*"\s*\/?>/i,
    `<link rel="alternate" hreflang="fr" href="${safeCanonical}?lang=fr" />`
  );

  out = out.replace(
    /<meta name="description" content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${safeDesc}" />`
  );

  if (opts.robots) {
    out = out.replace(
      /<meta name="robots" content="[^"]*"\s*\/?>/i,
      `<meta name="robots" content="${escapeHtml(opts.robots)}" />`
    );
  }

  out = out.replace(
    /<meta property="og:type" content="[^"]*"\s*\/?>/i,
    `<meta property="og:type" content="${safeOgType}" />`
  );
  out = out.replace(
    /<meta property="og:title" content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${safeTitle}" />`
  );
  out = out.replace(
    /<meta property="og:description" content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${safeDesc}" />`
  );
  out = out.replace(
    /<meta property="og:image" content="[^"]*"\s*\/?>/i,
    `<meta property="og:image" content="${safeImage}" />`
  );
  out = out.replace(
    /<meta property="og:image:alt" content="[^"]*"\s*\/?>/i,
    `<meta property="og:image:alt" content="${safeTitle}" />`
  );

  out = out.replace(
    /<meta name="twitter:title" content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${safeTitle}" />`
  );
  out = out.replace(
    /<meta name="twitter:description" content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${safeDesc}" />`
  );
  out = out.replace(
    /<meta name="twitter:image" content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image" content="${safeImage}" />`
  );

  if (opts.extraJsonLd) {
    out = out.replace('</head>', `${opts.extraJsonLd}\n  </head>`);
  }

  if (opts.ssrBodyHtml) {
    out = out.replace(
      /<div id="initial-below-hero-shell" aria-hidden="true">[\s\S]*?<\/section>\s*<\/div>\s*<\/div>\s*<\/div>\s*<script>/,
      `<div id="initial-below-hero-shell">${opts.ssrBodyHtml}</div>\n      </div>\n    </div>\n    <script>`
    );
    // Do not hide #initial-below-hero-shell before hydration when SSR content was injected for crawlers
    out = out.replace(
      /var bs = document\.getElementById\('initial-below-hero-shell'\);\s*if \(bs\) bs\.style\.display = 'none';/,
      ''
    );
  }

  return out;
}

export default async function handler(req: any, res: any) {
  try {
    const query = req?.query || {};
    const type = String(query.type || '').trim();
    const rawId = query.id ? decodeURIComponent(String(query.id)) : '';
    const rawSlug = query.slug ? decodeURIComponent(String(query.slug)) : '';
    const pageName = String(query.page || '').trim();

    const template = await getHtmlTemplate(req);

    if (type === 'product' && rawId) {
      const { products, categories } = await getCatalog();
      let product = products.find((p) => String(p.id) === rawId);
      if (!product && rawId.length <= 120) {
        try {
          const db = await getDb();
          const snap = await getDoc(doc(db, 'products', rawId));
          if (snap.exists()) {
            const pData = { ...snap.data(), id: snap.id } as Record<string, any>;
            if (!pData.status || pData.status === 'approved') {
              product = pData;
            }
          }
        } catch {
          // Ignore invalid single-doc lookup
        }
      }

      if (!product) {
        const notFoundHtml = replaceMetaAndLinks(template, {
          title: 'المنتج غير متوفر | Natural Health Morocco',
          description: 'تصفح جميع المنتجات الطبيعية المغربية الأصيلة في متجر Natural Health Morocco.',
          canonical: `${BASE_SITE_URL}/products`,
          ogType: 'website',
          ogImage: DEFAULT_OG_IMAGE,
          robots: 'noindex, follow',
        });
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
        res.end(notFoundHtml);
        return;
      }

      const productUrl = `${BASE_SITE_URL}/product/${encodeURIComponent(String(product.id))}`;
      const imageUrl = toAbsoluteUrl(
        product.image || (Array.isArray(product.images) ? product.images[0] : undefined)
      );
      const description = cleanText(
        product.description,
        `اطلب الآن ${product.name} بجودة طبيعية 100% مع توصيل سريع لجميع المدن المغربية والدفع عند الاستلام.`
      );
      const matchedCat = categories.find(
        (c) => String(c.name || '').trim() === String(product.category || '').trim()
      );
      const catSlug = matchedCat?.slug ? String(matchedCat.slug).trim() : String(product.category || '').trim();
      const catUrl = `${BASE_SITE_URL}/category/${encodeURIComponent(catSlug || 'all')}`;
      const isAvailable = product.inStock !== false && (product.stockCount ?? 1) > 0;

      const productSchema: Record<string, any> = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        image: imageUrl,
        description,
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
          availability: isAvailable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'Organization',
            name: 'Natural Health Morocco',
          },
        },
      };

      if (product.reviewsCount && product.reviewsCount > 0 && product.rating && product.rating > 0) {
        productSchema.aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: Math.min(5, Math.max(1, product.rating)),
          reviewCount: product.reviewsCount,
          bestRating: 5,
          worstRating: 1,
        };
      }

      const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: `${BASE_SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'كل المنتجات', item: `${BASE_SITE_URL}/products` },
          { '@type': 'ListItem', position: 3, name: product.category || 'المنتجات', item: catUrl },
          { '@type': 'ListItem', position: 4, name: product.name, item: productUrl },
        ],
      };

      const extraJsonLd = `    <script id="schema-product-dynamic" type="application/ld+json">${JSON.stringify(
        productSchema
      )}</script>\n    <script id="schema-breadcrumb-dynamic" type="application/ld+json">${JSON.stringify(
        breadcrumbSchema
      )}</script>`;

      const ssrBodyHtml = `<main style="max-width:64rem;margin:0 auto;padding:24px 16px;color:#F3EFE6;">
        <nav aria-label="Breadcrumb" style="font-size:12px;color:#A89C89;margin-bottom:12px;">
          <a href="/" style="color:#F59E0B;">الرئيسية</a> / <a href="/products" style="color:#F59E0B;">المنتجات</a> / <a href="${escapeHtml(
            `/category/${encodeURIComponent(catSlug || 'all')}`
          )}" style="color:#F59E0B;">${escapeHtml(product.category || '')}</a>
        </nav>
        <h1 style="font-size:24px;font-weight:800;margin:0 0 12px 0;color:#FAF5EC;">${escapeHtml(product.name)}</h1>
        <p style="font-size:18px;font-weight:700;color:#F59E0B;margin:0 0 12px 0;">${escapeHtml(product.price)} درهم ${
        product.unit ? `(${escapeHtml(product.unit)})` : ''
      }</p>
        <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(
        product.name
      )}" width="400" height="400" style="max-width:320px;width:100%;height:auto;border-radius:12px;margin-bottom:16px;" />
        <p style="font-size:14px;line-height:1.7;color:#D4C8B5;">${escapeHtml(
          cleanText(product.description, description, 400)
        )}</p>
      </main>`;

      const rendered = replaceMetaAndLinks(template, {
        title: `${product.name} | Natural Health Morocco`,
        description,
        canonical: productUrl,
        ogType: 'product',
        ogImage: imageUrl,
        robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
        extraJsonLd,
        ssrBodyHtml,
      });

      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      res.end(rendered);
      return;
    }

    if (type === 'category' && rawSlug) {
      const { products, categories } = await getCatalog();
      const normalized = rawSlug.trim();
      const category = categories.find(
        (c) =>
          String(c.slug || '').trim() === normalized || String(c.name || '').trim() === normalized
      );

      const categoryName = String(category?.name || normalized).trim();
      const categorySlug = String(category?.slug || normalized).trim();
      const categoryProducts = products.filter(
        (p) => String(p.category || '').trim() === categoryName
      );
      const categoryUrl = `${BASE_SITE_URL}/category/${encodeURIComponent(categorySlug)}`;
      const ogImage = category?.image ? toAbsoluteUrl(category.image) : DEFAULT_OG_IMAGE;
      const description = `${categoryName} — تسوق أفضل منتجات ${categoryName} الطبيعية والأصلية 100% في المغرب${
        categoryProducts.length > 0 ? ` (${categoryProducts.length} منتج متوفر)` : ''
      } مع توصيل سريع لجميع المدن والدفع عند الاستلام.`;

      const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: `${BASE_SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'كل المنتجات', item: `${BASE_SITE_URL}/products` },
          { '@type': 'ListItem', position: 3, name: categoryName, item: categoryUrl },
        ],
      };

      const itemListSchema = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: categoryName,
        description,
        url: categoryUrl,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: categoryProducts.length,
          itemListElement: categoryProducts.slice(0, 24).map((p, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            url: `${BASE_SITE_URL}/product/${encodeURIComponent(String(p.id))}`,
            name: p.name,
          })),
        },
      };

      const extraJsonLd = `    <script id="schema-breadcrumb-dynamic" type="application/ld+json">${JSON.stringify(
        breadcrumbSchema
      )}</script>\n    <script id="schema-collection-dynamic" type="application/ld+json">${JSON.stringify(
        itemListSchema
      )}</script>`;

      const linksHtml = categoryProducts
        .slice(0, 30)
        .map(
          (p) =>
            `<li style="margin:6px 0;"><a href="/product/${encodeURIComponent(
              String(p.id)
            )}" style="color:#F59E0B;">${escapeHtml(p.name)}</a> - ${escapeHtml(p.price)} درهم</li>`
        )
        .join('');

      const ssrBodyHtml = `<main style="max-width:64rem;margin:0 auto;padding:24px 16px;color:#F3EFE6;">
        <h1 style="font-size:24px;font-weight:800;margin:0 0 10px 0;color:#FAF5EC;">${escapeHtml(categoryName)}</h1>
        <p style="font-size:14px;color:#D4C8B5;margin:0 0 16px 0;">${escapeHtml(description)}</p>
        <ul style="list-style:none;padding:0;margin:0;">${linksHtml}</ul>
      </main>`;

      const rendered = replaceMetaAndLinks(template, {
        title: `${categoryName} | منتجات طبيعية 100% | Natural Health Morocco`,
        description,
        canonical: categoryUrl,
        ogType: 'website',
        ogImage,
        robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
        extraJsonLd,
        ssrBodyHtml,
      });

      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      res.end(rendered);
      return;
    }

    // Standard static store pages (/products, /order-tracking, /policy)
    let title = 'كل المنتجات الطبيعية والعطارة الأصيلة | Natural Health Morocco';
    let description =
      'اكتشف تشكيلة واسعة من أجود المنتجات الطبيعية 100% بالمغرب: خلطات صحراوية، مراهم سم النحل، زيوت طبيعية ومستحضرات تجميل أصلية مع التوصيل السريع لجميع المدن.';
    let canonical = `${BASE_SITE_URL}/products`;
    let ssrBodyHtml = '';

    if (pageName === 'products') {
      const { products, categories } = await getCatalog();
      const catLinks = categories
        .filter((c) => c.slug)
        .map(
          (c) =>
            `<a href="/category/${encodeURIComponent(String(c.slug).trim())}" style="color:#F59E0B;margin-left:12px;">${escapeHtml(
              c.name
            )}</a>`
        )
        .join('');
      const prodLinks = products
        .slice(0, 40)
        .map(
          (p) =>
            `<li style="margin:6px 0;"><a href="/product/${encodeURIComponent(
              String(p.id)
            )}" style="color:#FAF5EC;">${escapeHtml(p.name)}</a> - ${escapeHtml(p.price)} درهم</li>`
        )
        .join('');
      ssrBodyHtml = `<main style="max-width:64rem;margin:0 auto;padding:24px 16px;color:#F3EFE6;">
        <h1 style="font-size:24px;font-weight:800;margin:0 0 10px 0;">كل المنتجات الطبيعية والعطارة الأصيلة</h1>
        <p style="font-size:14px;color:#D4C8B5;margin:0 0 12px 0;">${escapeHtml(description)}</p>
        <div style="margin-bottom:16px;">${catLinks}</div>
        <ul style="list-style:none;padding:0;margin:0;">${prodLinks}</ul>
      </main>`;
    } else if (pageName === 'order-tracking') {
      title = 'تتبع طلبيتك مباشرة | Natural Health Morocco';
      description = 'خدمة تتبع الطلبيات المباشرة لزبائن متجر Natural Health Morocco برقم الطلب أو رقم الهاتف.';
      canonical = `${BASE_SITE_URL}/order-tracking`;
    } else if (pageName === 'policy') {
      title = 'سياسة الاسترجاع والخصوصية والشروط | Natural Health Morocco';
      description =
        'تعرف على سياسة الخصوصية، ضمان الجودة، شروط الاسترجاع والاستبدال، وتوصيل الطلبات لدى متجر Natural Health Morocco.';
      canonical = `${BASE_SITE_URL}/policy`;
    }

    const rendered = replaceMetaAndLinks(template, {
      title,
      description,
      canonical,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
      robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      ssrBodyHtml: ssrBodyHtml || undefined,
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.end(rendered);
  } catch (err: any) {
    console.error('[Vercel SEO] Error:', err?.message || err);
    try {
      const fallbackHtml = await getHtmlTemplate(req);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(fallbackHtml);
    } catch {
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }
}
