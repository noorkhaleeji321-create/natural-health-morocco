import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';

let firestoreDb: any = null;

function getDbInstance() {
  if (firestoreDb) return firestoreDb;
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) return null;
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp(config);
    firestoreDb = getFirestore(app, config.firestoreDatabaseId);
    return firestoreDb;
  } catch (err) {
    console.warn('[FirebaseAdmin] Failed to initialize Firestore on server:', err);
    return null;
  }
}

/**
 * Fetches the live, secure admin PIN directly from Firebase Firestore (settings/main)
 */
export async function getLiveFirestoreAdminPin(): Promise<string | null> {
  const db = getDbInstance();
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'settings', 'main'));
    if (snap.exists()) {
      const data = snap.data();
      const pin = data?.adminPin;
      if (pin && typeof pin === 'string') {
        return pin.trim();
      }
    }
    return null;
  } catch (err: any) {
    console.warn('[FirebaseAdmin] Error reading adminPin from Firestore:', err?.message || err);
    return null;
  }
}

let cachedCatalog: {
  expiresAt: number;
  data: {
    products: any[];
    categories: any[];
    storeSettings: any | null;
    bankSettings: any | null;
    heroSlides: any[] | null;
  };
} | null = null;

/**
 * Server-side Firestore catalog fallback for /api/bootstrap when client-side direct Firestore access fails
 */
export async function getLiveFirestoreStorefrontFallback() {
  if (cachedCatalog && cachedCatalog.expiresAt > Date.now()) {
    return cachedCatalog.data;
  }
  const db = getDbInstance();
  if (!db) return null;
  try {
    const [prodSnap, catSnap, settingsSnap] = await Promise.all([
      getDocs(collection(db, 'products')),
      getDocs(collection(db, 'categories')),
      getDocs(collection(db, 'settings')),
    ]);

    const products = prodSnap.docs.map((d) => ({ ...d.data(), id: d.id }));
    const categories = catSnap.docs.map((d) => ({ ...d.data(), id: d.id }));
    const settingsDoc = settingsSnap.docs.find((d) => d.id === 'main');
    const bankDoc = settingsSnap.docs.find((d) => d.id === 'bank');
    const heroDoc = settingsSnap.docs.find((d) => d.id === 'hero');

    const data = {
      products,
      categories,
      storeSettings: settingsDoc ? settingsDoc.data() : null,
      bankSettings: bankDoc ? bankDoc.data() : null,
      heroSlides: heroDoc && Array.isArray(heroDoc.data()?.slides) ? heroDoc.data().slides : null,
    };

    cachedCatalog = {
      expiresAt: Date.now() + 30_000,
      data,
    };
    return data;
  } catch (err: any) {
    console.warn('[FirebaseAdmin] Storefront fallback fetch warning:', err?.message || err);
    return cachedCatalog?.data || null;
  }
}
