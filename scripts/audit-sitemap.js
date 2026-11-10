import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const BASE_URL = 'https://www.natural-health-morocco.online';

async function checkUrlHttpStatus(url) {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      const req = client.request(
        url,
        { method: 'HEAD', timeout: 8000, headers: { 'User-Agent': 'SitemapAuditor/1.0' } },
        (res) => {
          if (res.statusCode >= 200 && res.statusCode < 400) {
            resolve({ ok: true, status: res.statusCode });
          } else {
            // Fallback to GET in case HEAD is disallowed
            const getReq = client.request(
              url,
              { method: 'GET', timeout: 8000, headers: { 'User-Agent': 'SitemapAuditor/1.0' } },
              (getRes) => {
                resolve({ ok: getRes.statusCode >= 200 && getRes.statusCode < 400, status: getRes.statusCode });
              }
            );
            getReq.on('error', (err) => resolve({ ok: false, status: 0, error: err.message }));
            getReq.end();
          }
        }
      );
      req.on('error', () => {
        // Fallback to GET
        const getReq = client.request(
          url,
          { method: 'GET', timeout: 8000, headers: { 'User-Agent': 'SitemapAuditor/1.0' } },
          (getRes) => {
            resolve({ ok: getRes.statusCode >= 200 && getRes.statusCode < 400, status: getRes.statusCode });
          }
        );
        getReq.on('error', (err) => resolve({ ok: false, status: 0, error: err.message }));
        getReq.end();
      });
      req.end();
    } catch (e) {
      resolve({ ok: false, status: 0, error: e.message });
    }
  });
}

async function audit() {
  console.log('=== STARTING FINAL SITEMAP AUDIT ===\n');

  // 1. Read sitemap.xml
  const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) {
    console.error('ERROR: sitemap.xml does not exist at', sitemapPath);
    process.exit(1);
  }

  const xmlContent = fs.readFileSync(sitemapPath, 'utf8');

  // Parse loc and image:loc
  const locRegex = /<loc>(.*?)<\/loc>/g;
  const imgLocRegex = /<image:loc>(.*?)<\/image:loc>/g;
  const lastmodRegex = /<lastmod>(.*?)<\/lastmod>/g;

  const pageUrls = [];
  let match;
  while ((match = locRegex.exec(xmlContent)) !== null) {
    pageUrls.push(match[1]);
  }

  const imageUrls = [];
  while ((match = imgLocRegex.exec(xmlContent)) !== null) {
    imageUrls.push(match[1]);
  }

  const lastmods = [];
  while ((match = lastmodRegex.exec(xmlContent)) !== null) {
    lastmods.push(match[1]);
  }

  console.log(`[XML Analysis]`);
  console.log(`- Total <url> blocks: ${pageUrls.length}`);
  console.log(`- Total <image:loc> references: ${imageUrls.length}`);
  console.log(`- Total <lastmod> entries: ${lastmods.length}\n`);

  // 2. Fetch live Firestore records
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const app = initializeApp(config, 'sitemap-audit-' + Date.now());
  const db = getFirestore(app, config.firestoreDatabaseId);

  const [prodSnap, catSnap] = await Promise.all([
    getDocs(collection(db, 'products')),
    getDocs(collection(db, 'categories')),
  ]);

  const liveProducts = prodSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const liveCategories = catSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  console.log(`[Firestore Verification]`);
  console.log(`- Firestore Active Products: ${liveProducts.length}`);
  console.log(`- Firestore Categories: ${liveCategories.length}\n`);

  // 3. Breakdown of Sitemap Page URLs
  const homepageUrls = pageUrls.filter((u) => u === `${BASE_URL}/`);
  const staticUrls = pageUrls.filter((u) =>
    ['/products', '/order-tracking', '/policy'].some((p) => u === `${BASE_URL}${p}`)
  );
  const categoryUrls = pageUrls.filter((u) => u.includes('/category/'));
  const productUrls = pageUrls.filter((u) => u.includes('/product/'));

  console.log(`[URL Categorization Breakdown]`);
  console.log(`- Homepage: ${homepageUrls.length}`);
  console.log(`- Core Static Pages (/products, /order-tracking, /policy): ${staticUrls.length}`);
  console.log(`- Category Pages (/category/:slug): ${categoryUrls.length}`);
  console.log(`- Product Pages (/product/:id): ${productUrls.length}`);
  console.log(`- Total Pages: ${pageUrls.length}\n`);

  // 4. Verify Firestore match
  const missingCategories = [];
  for (const cat of liveCategories) {
    if (!cat.slug) continue;
    const expected = `${BASE_URL}/category/${encodeURIComponent(cat.slug.trim())}`;
    if (!categoryUrls.includes(expected)) {
      missingCategories.push(cat.slug);
    }
  }

  const missingProducts = [];
  for (const prod of liveProducts) {
    if (!prod.id) continue;
    const expected = `${BASE_URL}/product/${encodeURIComponent(prod.id)}`;
    if (!productUrls.includes(expected)) {
      missingProducts.push(prod.id);
    }
  }

  console.log(`[Firestore vs Sitemap Sync Check]`);
  console.log(`- Missing Category URLs in Sitemap: ${missingCategories.length}`);
  if (missingCategories.length > 0) console.log('  ->', missingCategories);
  console.log(`- Missing Product URLs in Sitemap: ${missingProducts.length}`);
  if (missingProducts.length > 0) console.log('  ->', missingProducts);
  console.log('');

  // 5. Test Image HTTP Reachability (jsDelivr CDN & local assets)
  console.log(`[Testing HTTP Status of all ${imageUrls.length} Product Image References...]`);
  let validImagesCount = 0;
  let brokenImagesCount = 0;
  const imageResults = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const imgUrl = imageUrls[i];
    const res = await checkUrlHttpStatus(imgUrl);
    if (res.ok) {
      validImagesCount++;
    } else {
      brokenImagesCount++;
      console.error(`  [BROKEN IMAGE] (${res.status}) ${imgUrl} - Error: ${res.error || 'HTTP Error'}`);
    }
    imageResults.push({ url: imgUrl, status: res.status, ok: res.ok });
  }

  console.log(`- Verified Image URLs: ${validImagesCount}/${imageUrls.length} OK (200 Status Code)\n`);

  // 6. Verify XML syntax and lastmod dates
  const invalidDates = lastmods.filter((d) => !/^\d{4}-\d{2}-\d{2}$/.test(d));
  console.log(`[Schema & XML Verification]`);
  console.log(`- Invalid lastmod dates count: ${invalidDates.length}`);
  console.log(`- Canonical www domain check: ${pageUrls.every((u) => u.startsWith(BASE_URL)) ? 'PASSED (100% www canonical)' : 'FAILED'}`);
  console.log(`- XML Escaping check: ${xmlContent.includes('& ') ? 'FAILED (Unescaped ampersand found)' : 'PASSED (Ampersands cleanly escaped)'}`);

  console.log('\n=== AUDIT COMPLETE ===');
  process.exit(0);
}

audit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
