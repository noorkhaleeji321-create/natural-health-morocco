import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';

const BASE_URL = 'https://www.natural-health-morocco.online';

let appPromise: Promise<any> | null = null;
let dbPromise: Promise<any> | null = null;
const SITEMAP_MEMORY_TTL_MS = 30 * 60 * 1000;
let sitemapMemoryCache: { xml: string; fetchedAt: number } | null = null;
let inFlightSitemapPromise: Promise<string> | null = null;

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
            getApps().find((a) => a.name === 'vercel-sitemap') ||
              initializeApp(config, 'vercel-sitemap')
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

export default async function handler(_req: any, res: any) {
  try {
    const now = Date.now();
    if (sitemapMemoryCache && now - sitemapMemoryCache.fetchedAt < SITEMAP_MEMORY_TTL_MS) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      res.end(sitemapMemoryCache.xml);
      return;
    }

    if (!inFlightSitemapPromise) {
      inFlightSitemapPromise = (async () => {
        const today = new Date().toISOString().split('T')[0];
        const db = await getDb();

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

    for (const cat of categories) {
      if (!cat.slug || typeof cat.slug !== 'string' || !cat.slug.trim()) continue;
      const cleanSlug = encodeURIComponent(cat.slug.trim());
      const catLastMod = formatIsoDate(cat.updatedAt || cat.createdAt, today);
      xml += `
  <!-- Category: ${escapeXml(cat.name || cat.slug)} -->
  <url>
    <loc>${BASE_URL}/category/${cleanSlug}</loc>
    <lastmod>${catLastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }

    for (const prod of products) {
      if (!prod.id) continue;
      const prodUrl = `${BASE_URL}/product/${encodeURIComponent(String(prod.id))}`;
      const lastModDate = formatIsoDate(prod.updatedAt || prod.createdAt, today);

      const rawImg =
        (typeof prod.image === 'string' && prod.image.trim()) ||
        (Array.isArray(prod.images) && typeof prod.images[0] === 'string' && prod.images[0].trim()) ||
        '';

      let imageXml = '';
      if (rawImg && !rawImg.startsWith('data:') && !rawImg.startsWith('blob:')) {
        const fullImg =
          rawImg.startsWith('http://') || rawImg.startsWith('https://')
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
        sitemapMemoryCache = { xml, fetchedAt: Date.now() };
        return xml;
      })().finally(() => {
        inFlightSitemapPromise = null;
      });
    }

    const xml = await inFlightSitemapPromise;
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.end(xml);
  } catch (err: any) {
    console.error('[Vercel Sitemap] Error:', err?.message || err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end('Failed to generate sitemap');
  }
}
