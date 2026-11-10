import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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
