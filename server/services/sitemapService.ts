import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const BASE_URL = 'https://www.natural-health-morocco.online';

let sitemapAppPromise: Promise<any> | null = null;
let sitemapDbPromise: Promise<any> | null = null;

function loadFirebaseConfig(): Record<string, any> {
  const candidates = [
    path.join(process.cwd(), 'firebase-applet-config.json'),
  ];
  try {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    candidates.push(path.resolve(currentDir, '../../firebase-applet-config.json'));
  } catch {
    // Ignore when import.meta.url is unavailable in bundled CJS
  }

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        return JSON.parse(fs.readFileSync(candidate, 'utf8'));
      }
    } catch {
      // Try next candidate
    }
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

  throw new Error('Firebase configuration not found for dynamic sitemap');
}

async function getSitemapFirestoreDb() {
  if (!sitemapDbPromise) {
    sitemapDbPromise = (async () => {
      try {
        const config = loadFirebaseConfig();
        const { initializeApp, getApps } = await import('firebase/app');
        const { getFirestore } = await import('firebase/firestore/lite');

        if (!sitemapAppPromise) {
          sitemapAppPromise = Promise.resolve(
            getApps().find((a) => a.name === 'sitemap-service') ||
              initializeApp(config, 'sitemap-service')
          );
        }
        const app = await sitemapAppPromise;
        return getFirestore(app, config.firestoreDatabaseId);
      } catch (err) {
        sitemapAppPromise = null;
        sitemapDbPromise = null;
        throw err;
      }
    })();
  }
  return sitemapDbPromise;
}

function escapeXml(unsafe: unknown): string {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatIsoDate(value: unknown, fallback: string): string {
  if (!value) return fallback;
  try {
    const parsed = new Date(String(value));
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  } catch {
    // Fallback to today
  }
  return fallback;
}

export async function generateDynamicSitemapXml(): Promise<{
  xml: string;
  productCount: number;
  categoryCount: number;
}> {
  const today = new Date().toISOString().split('T')[0];
  const db = await getSitemapFirestoreDb();
  const { collection, getDocs } = await import('firebase/firestore/lite');

  const [prodSnap, catSnap] = await Promise.all([
    getDocs(collection(db, 'products')),
    getDocs(collection(db, 'categories')),
  ]);

  const products = prodSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Record<string, any>));
  const categories = catSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Record<string, any>));

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <!-- Static Core Pages -->
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/products</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${BASE_URL}/order-tracking</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${BASE_URL}/policy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
`;

  let includedCategories = 0;
  for (const cat of categories) {
    if (!cat.slug || typeof cat.slug !== 'string' || !cat.slug.trim()) continue;
    const cleanSlug = encodeURIComponent(cat.slug.trim());
    const catLastMod = formatIsoDate(cat.updatedAt || cat.createdAt, today);
    includedCategories++;
    xml += `
  <!-- Category: ${escapeXml(cat.name || cat.slug)} -->
  <url>
    <loc>${BASE_URL}/category/${cleanSlug}</loc>
    <lastmod>${catLastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }

  let includedProducts = 0;
  for (const prod of products) {
    if (!prod.id) continue;
    includedProducts++;
    const prodUrl = `${BASE_URL}/product/${encodeURIComponent(String(prod.id))}`;
    const lastModDate = formatIsoDate(prod.updatedAt || prod.createdAt, today);

    const rawImg =
      (typeof prod.image === 'string' && prod.image.trim()) ||
      (Array.isArray(prod.images) && typeof prod.images[0] === 'string' && prod.images[0].trim()) ||
      '';

    let imageXml = '';
    if (rawImg && !rawImg.startsWith('data:') && !rawImg.startsWith('blob:')) {
      const fullImg = rawImg.startsWith('http://') || rawImg.startsWith('https://')
        ? rawImg
        : `${BASE_URL}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`;
      imageXml = `
    <image:image>
      <image:loc>${escapeXml(fullImg)}</image:loc>
      <image:title>${escapeXml(prod.name || 'منتج طبيعي')}</image:title>
    </image:image>`;
    }

    xml += `
  <!-- Product: ${escapeXml(prod.name || prod.id)} -->
  <url>
    <loc>${prodUrl}</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${imageXml}
  </url>`;
  }

  xml += `
</urlset>
`;

  return {
    xml,
    productCount: includedProducts,
    categoryCount: includedCategories,
  };
}
