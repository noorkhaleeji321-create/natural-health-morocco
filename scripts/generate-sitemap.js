/**
 * Natural Health Morocco - Dynamic XML Sitemap Generator
 * Queries active Firestore products and categories and generates a standards-compliant XML sitemap.
 */
import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const BASE_URL = 'https://natural-health-morocco.online';
const TODAY = new Date().toISOString().split('T')[0];

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function getLiveStoreData() {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) throw new Error('firebase-applet-config.json not found');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    const app = initializeApp(config, 'sitemap-builder-' + Date.now());
    const db = getFirestore(app, config.firestoreDatabaseId);

    const [prodSnap, catSnap] = await Promise.all([
      getDocs(collection(db, 'products')),
      getDocs(collection(db, 'categories')),
    ]);

    const products = prodSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const categories = catSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    console.log(`[Sitemap] Fetched ${products.length} products and ${categories.length} categories from Firestore.`);
    return { products, categories };
  } catch (err) {
    console.warn('[Sitemap] Could not fetch from Firestore, checking backup fallback:', err.message);

    // Fallback: check backup files
    const backupPath = path.join(process.cwd(), 'storage', 'backups', 'backup_before_cleanup.json');
    if (fs.existsSync(backupPath)) {
      const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      const products = backup.firestore?.products || backup.sqlite?.products || [];
      const categories = backup.firestore?.categories || backup.sqlite?.categories || [];
      return { products, categories };
    }
    return { products: [], categories: [] };
  }
}

async function buildSitemap() {
  const { products, categories } = await getLiveStoreData();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <!-- Static Core Pages -->
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/products</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${BASE_URL}/order-tracking</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${BASE_URL}/policy</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
`;

  // Categories
  if (Array.isArray(categories)) {
    for (const cat of categories) {
      if (!cat.slug) continue;
      const cleanSlug = encodeURIComponent(cat.slug.trim());
      xml += `
  <!-- Category: ${escapeXml(cat.name)} -->
  <url>
    <loc>${BASE_URL}/category/${cleanSlug}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }
  }

  // Active Products
  if (Array.isArray(products)) {
    for (const prod of products) {
      if (!prod.id) continue;
      const prodUrl = `${BASE_URL}/product/${encodeURIComponent(prod.id)}`;
      const lastModDate = prod.updatedAt
        ? new Date(prod.updatedAt).toISOString().split('T')[0]
        : prod.createdAt
        ? new Date(prod.createdAt).toISOString().split('T')[0]
        : TODAY;

      let imageXml = '';
      if (prod.image) {
        const fullImg = prod.image.startsWith('http')
          ? prod.image
          : `${BASE_URL}${prod.image.startsWith('/') ? '' : '/'}${prod.image}`;
        imageXml = `
    <image:image>
      <image:loc>${escapeXml(fullImg)}</image:loc>
      <image:title>${escapeXml(prod.name || 'منتج طبيعي')}</image:title>
    </image:image>`;
      }

      xml += `
  <!-- Product: ${escapeXml(prod.name)} -->
  <url>
    <loc>${prodUrl}</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${imageXml}
  </url>`;
    }
  }

  xml += `
</urlset>
`;

  const outputPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  fs.writeFileSync(outputPath, xml, 'utf8');
  console.log(`[Sitemap] Generated successfully at ${outputPath}`);
  process.exit(0);
}

buildSitemap();
