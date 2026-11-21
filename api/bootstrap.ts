import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';

let appPromise: Promise<any> | null = null;
let dbPromise: Promise<any> | null = null;

const BOOTSTRAP_MEMORY_TTL_MS = 30 * 1000;
let bootstrapMemoryCache: { data: Record<string, any>; fetchedAt: number } | null = null;
let inFlightBootstrapLoad: Promise<Record<string, any>> | null = null;

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
            getApps().find((a) => a.name === 'vercel-bootstrap') ||
              initializeApp(config, 'vercel-bootstrap')
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

async function fetchBootstrapPayloadFromFirestore(): Promise<Record<string, any>> {
  const db = await getDb();

  const [prodSnap, catSnap, settingsSnap] = await Promise.all([
    getDocs(collection(db, 'products')),
    getDocs(collection(db, 'categories')),
    getDocs(collection(db, 'settings')),
  ]);

  return { prodSnap, catSnap, settingsSnap };
}

export default async function handler(req: any, res: any) {
  try {
    const hasAuth = Boolean(req?.headers?.authorization);
    const forceFresh = hasAuth || String(req?.query?.fresh || '') === '1';
    const now = Date.now();

    if (
      !forceFresh &&
      bootstrapMemoryCache &&
      now - bootstrapMemoryCache.fetchedAt < BOOTSTRAP_MEMORY_TTL_MS
    ) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=45, stale-while-revalidate=60');
      res.end(JSON.stringify({ success: true, data: bootstrapMemoryCache.data }));
      return;
    }

    if (!inFlightBootstrapLoad) {
      inFlightBootstrapLoad = (async () => {
        const { prodSnap, catSnap, settingsSnap } = await fetchBootstrapPayloadFromFirestore();
        return { prodSnap, catSnap, settingsSnap };
      })().finally(() => {
        inFlightBootstrapLoad = null;
      });
    }

    const { prodSnap, catSnap, settingsSnap } = await inFlightBootstrapLoad;

    const products = prodSnap.docs
      .map((d) => ({ ...d.data(), id: d.id } as Record<string, any>))
      .filter((p) => !p.status || p.status === 'approved')
      .sort((a, b) => {
        const aHas = typeof a.sortOrder === 'number' && Number.isFinite(a.sortOrder);
        const bHas = typeof b.sortOrder === 'number' && Number.isFinite(b.sortOrder);
        if (aHas && bHas) {
          if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        } else if (aHas && !bHas) {
          return -1;
        } else if (!aHas && bHas) {
          return 1;
        }
        const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
        const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
        if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) {
          return bTime - aTime;
        }
        return String(a.id || '').localeCompare(String(b.id || ''));
      });

    const categories = catSnap.docs.map((d) => ({ ...d.data(), id: d.id } as Record<string, any>));

    const settingsDoc = settingsSnap.docs.find((d) => d.id === 'main');
    const bankDoc = settingsSnap.docs.find((d) => d.id === 'bank');
    const heroDoc = settingsSnap.docs.find((d) => d.id === 'hero');

    const rawSettings = settingsDoc ? (settingsDoc.data() as Record<string, any>) : null;
    const publicStoreSettings = rawSettings
      ? {
          storeName: rawSettings.storeName,
          storeSlogan: rawSettings.storeSlogan,
          logoUrl: rawSettings.logoUrl,
          phone: rawSettings.phone,
          whatsapp: rawSettings.whatsapp,
          address: rawSettings.address,
          city: rawSettings.city,
          openingHours: rawSettings.openingHours,
          email: rawSettings.email,
          freeShippingThreshold: rawSettings.freeShippingThreshold,
          shippingFee: rawSettings.shippingFee,
          currency: rawSettings.currency,
          announcementText: rawSettings.announcementText,
          showHeroSlider: rawSettings.showHeroSlider !== false,
          aboutImageUrl: rawSettings.aboutImageUrl,
          aboutBadgeYears: rawSettings.aboutBadgeYears,
          aboutBadgeTitle: rawSettings.aboutBadgeTitle,
          aboutBadgeSubtitle: rawSettings.aboutBadgeSubtitle,
          aboutStoryP1: rawSettings.aboutStoryP1,
          aboutStoryP2: rawSettings.aboutStoryP2,
        }
      : null;

    const rawBank = bankDoc ? (bankDoc.data() as Record<string, any>) : null;
    const publicBankSettings = rawBank
      ? {
          bankName: rawBank.bankName,
          accountHolder: rawBank.accountHolder,
          rib: rawBank.rib,
          instructions: rawBank.instructions,
          isBankTransferEnabled: rawBank.isBankTransferEnabled,
          isCodEnabled: rawBank.isCodEnabled,
          isCardEnabled: rawBank.isCardEnabled,
          isPaypalEnabled: rawBank.isPaypalEnabled,
          paymentMode: rawBank.paymentMode,
          paddleVendorId: rawBank.paddleVendorId,
          paddleClientToken: rawBank.paddleClientToken,
          cardPublishableKey: rawBank.cardPublishableKey,
          paypalClientId: rawBank.paypalClientId,
        }
      : null;

    const rawHero = heroDoc ? (heroDoc.data() as Record<string, any>) : null;
    const heroSlides = rawHero && Array.isArray(rawHero.slides) ? rawHero.slides : [];

    const payload = {
      products,
      categories,
      storeSettings: publicStoreSettings,
      bankSettings: publicBankSettings,
      heroSlides,
      orders: [],
      customers: [],
    };

    bootstrapMemoryCache = { data: payload, fetchedAt: Date.now() };

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Cache-Control',
      hasAuth ? 'no-store' : 'public, s-maxage=45, stale-while-revalidate=60'
    );
    res.end(
      JSON.stringify({
        success: true,
        data: payload,
      })
    );
  } catch (err: any) {
    console.error('[Vercel Bootstrap] Error:', err?.message || err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ success: false, error: 'Failed to load storefront data' }));
  }
}
