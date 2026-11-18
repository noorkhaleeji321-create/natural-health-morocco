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

function toAsciiDigits(input: string): string {
  return String(input || '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

export function normalizeTrackingPhone(raw: string): string {
  let digits = toAsciiDigits(raw).replace(/\D/g, '');
  if (digits.startsWith('00212') && digits.length >= 13) {
    digits = digits.slice(5);
  } else if (digits.startsWith('212') && digits.length >= 11) {
    digits = digits.slice(3);
  }
  if (digits.startsWith('0') && digits.length >= 9) {
    digits = digits.slice(1);
  }
  return digits;
}

export function normalizeTrackingOrderId(raw: string): string {
  return toAsciiDigits(raw).trim().toUpperCase().replace(/^#+/, '').replace(/\s+/g, '');
}

export function doesOrderMatchTracking(order: Record<string, any>, rawOrderId: string, rawPhone: string): boolean {
  if (!order) return false;
  const queryId = normalizeTrackingOrderId(rawOrderId);
  if (!queryId) return false;

  const candidateIds = [order.id, order.orderNumber]
    .filter(Boolean)
    .map((v) => normalizeTrackingOrderId(String(v)));

  const idMatched = candidateIds.some((oId) => {
    if (oId === queryId) return true;
    if (oId === `SAID-${queryId}`) return true;
    if (queryId.length >= 4 && (oId.endsWith(`-${queryId}`) || oId.endsWith(queryId))) return true;
    return false;
  });

  if (!idMatched) return false;

  const storedPhone =
    order.customer?.phone ||
    order.customerPhoneSnapshot ||
    order.phone ||
    '';

  const a = normalizeTrackingPhone(String(storedPhone));
  const b = normalizeTrackingPhone(String(rawPhone));
  if (!a || !b || a.length < 6 || b.length < 6) return false;
  if (a === b) return true;
  if (a.length >= 8 && b.length >= 8) {
    return a.slice(-9) === b.slice(-9) || a.endsWith(b) || b.endsWith(a);
  }
  return false;
}

/**
 * Finds a single order in live Firestore matching both order ID and customer phone.
 */
export async function findLiveFirestoreOrderByTracking(rawOrderId: string, rawPhone: string): Promise<any | null> {
  const db = getDbInstance();
  if (!db) return null;
  try {
    const cleanId = normalizeTrackingOrderId(rawOrderId);
    const directCandidates = Array.from(
      new Set([
        cleanId,
        cleanId.startsWith('SAID-') ? cleanId : `SAID-${cleanId}`,
      ].filter(Boolean))
    );

    for (const candidateDocId of directCandidates) {
      try {
        const snap = await getDoc(doc(db, 'orders', candidateDocId));
        if (snap.exists()) {
          const order = { ...snap.data(), id: snap.id };
          if (doesOrderMatchTracking(order, rawOrderId, rawPhone)) {
            return order;
          }
        }
      } catch {
        // Continue to next candidate
      }
    }

    const snap = await getDocs(collection(db, 'orders'));
    for (const d of snap.docs) {
      const order = { ...d.data(), id: d.id };
      if (doesOrderMatchTracking(order, rawOrderId, rawPhone)) {
        return order;
      }
    }
    return null;
  } catch (err: any) {
    console.warn('[FirebaseAdmin] Order tracking lookup warning:', err?.message || err);
    return null;
  }
}

