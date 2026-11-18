import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore/lite';

let appPromise: Promise<any> | null = null;
let dbPromise: Promise<any> | null = null;

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
            getApps().find((a) => a.name === 'vercel-track-order') ||
              initializeApp(config, 'vercel-track-order')
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

function toAsciiDigits(input: string): string {
  return String(input || '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

function normalizePhone(raw: string): string {
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

function normalizeOrderId(raw: string): string {
  return toAsciiDigits(raw).trim().toUpperCase().replace(/^#+/, '').replace(/\s+/g, '');
}

function phonesMatch(storedPhoneRaw: string, inputPhoneRaw: string): boolean {
  const a = normalizePhone(storedPhoneRaw);
  const b = normalizePhone(inputPhoneRaw);
  if (!a || !b || a.length < 6 || b.length < 6) return false;
  if (a === b) return true;
  if (a.length >= 8 && b.length >= 8) {
    return a.slice(-9) === b.slice(-9) || a.endsWith(b) || b.endsWith(a);
  }
  return false;
}

function orderMatchesTracking(order: Record<string, any>, rawOrderId: string, rawPhone: string): boolean {
  if (!order) return false;
  const queryId = normalizeOrderId(rawOrderId);
  if (!queryId) return false;

  const candidateIds = [order.id, order.orderNumber]
    .filter(Boolean)
    .map((v) => normalizeOrderId(String(v)));

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

  return phonesMatch(String(storedPhone), rawPhone);
}

function sendJson(res: any, statusCode: number, body: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.end(JSON.stringify(body));
}

export default async function handler(req: any, res: any) {
  try {
    let rawOrderId = '';
    let rawPhone = '';

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          body = {};
        }
      }
      rawOrderId = String(body?.orderId || req.query?.orderId || '').trim();
      rawPhone = String(body?.phone || req.query?.phone || '').trim();
    } else {
      rawOrderId = String(req.query?.orderId || '').trim();
      rawPhone = String(req.query?.phone || '').trim();
    }

    if (!rawOrderId || !rawPhone) {
      return sendJson(res, 400, {
        success: false,
        error: 'يرجى إدخال رقم الطلب ورقم الهاتف المسجل.',
      });
    }

    const db = await getDb();
    const cleanId = normalizeOrderId(rawOrderId);

    const directCandidates = Array.from(
      new Set([
        cleanId,
        cleanId.startsWith('SAID-') ? cleanId : `SAID-${cleanId}`,
      ].filter(Boolean))
    );

    // 1. Fast direct document lookup by known ID formats
    for (const candidateDocId of directCandidates) {
      try {
        const snap = await getDoc(doc(db, 'orders', candidateDocId));
        if (snap.exists()) {
          const order = { ...snap.data(), id: snap.id } as Record<string, any>;
          if (orderMatchesTracking(order, rawOrderId, rawPhone)) {
            return sendJson(res, 200, { success: true, order });
          }
        }
      } catch {
        // Continue to next candidate or collection scan
      }
    }

    // 2. Collection scan fallback (supports custom orderNumber or partial digits)
    const snap = await getDocs(collection(db, 'orders'));
    for (const d of snap.docs) {
      const order = { ...d.data(), id: d.id } as Record<string, any>;
      if (orderMatchesTracking(order, rawOrderId, rawPhone)) {
        return sendJson(res, 200, { success: true, order });
      }
    }

    return sendJson(res, 404, {
      success: false,
      error: 'لم يتم العثور على طلب يطابق هذا الرقم وهذا الهاتف. يرجى التأكد من صحة البيانات أو مراجعة رقم الطلب المستلم.',
    });
  } catch (err: any) {
    console.error('[Vercel Track Order] Error:', err?.message || err);
    return sendJson(res, 500, {
      success: false,
      error: 'تعذر التحقق من الطلب حالياً، يرجى المحاولة بعد لحظات.',
    });
  }
}
