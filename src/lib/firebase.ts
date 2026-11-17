import firebaseConfig from '../../firebase-applet-config.json';

let appInstance: any = null;
let appPromise: Promise<any> | null = null;

let dbInstance: any = null;
let dbPromise: Promise<any> | null = null;

let authInstance: any = null;
let authPromise: Promise<any> | null = null;

export async function getFirebaseApp() {
  if (appInstance) return appInstance;
  if (!appPromise) {
    appPromise = (async () => {
      try {
        const { initializeApp, getApps } = await import('firebase/app');
        const apps = getApps();
        appInstance = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
        return appInstance;
      } catch (err) {
        appPromise = null;
        throw err;
      }
    })();
  }
  return appPromise;
}

function isOfflineBrowser(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function isRetryableFirestoreError(err: any): boolean {
  const code = String(err?.code || '').toLowerCase();
  const msg = String(err?.message || '').toLowerCase();
  if (code.includes('permission-denied') || code.includes('unauthenticated') || code.includes('invalid-argument')) {
    return false;
  }
  return (
    code === 'unknown' ||
    code === 'unavailable' ||
    code === 'deadline-exceeded' ||
    code === 'aborted' ||
    msg.includes('failed to fetch') ||
    msg.includes('request failed with error') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    msg.includes('network')
  );
}

async function withFirestoreRetry<T>(operation: () => Promise<T>, maxRetries: number = 2): Promise<T> {
  if (isOfflineBrowser()) {
    throw new Error('the client is offline');
  }
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries || isOfflineBrowser() || !isRetryableFirestoreError(err)) {
        throw err;
      }
      const delayMs = 250 * Math.pow(2, attempt) + Math.floor(Math.random() * 120);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

export async function getFirestoreDb() {
  if (dbInstance) return dbInstance;
  if (!dbPromise) {
    dbPromise = (async () => {
      try {
        const app = await getFirebaseApp();
        const { getFirestore, setLogLevel } = await import('firebase/firestore/lite');
        setLogLevel('silent');
        dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
        return dbInstance;
      } catch (err) {
        dbPromise = null;
        throw err;
      }
    })();
  }
  return dbPromise;
}

export async function getFirebaseAuth() {
  if (authInstance) return authInstance;
  if (!authPromise) {
    authPromise = (async () => {
      try {
        const app = await getFirebaseApp();
        const { getAuth } = await import('firebase/auth');
        authInstance = getAuth(app);
        return authInstance;
      } catch (err) {
        authPromise = null;
        throw err;
      }
    })();
  }
  return authPromise;
}

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    if (isOfflineBrowser()) return false;
    const db = await getFirestoreDb();
    const { doc, getDoc } = await import('firebase/firestore/lite');
    await getDoc(doc(db, 'settings', 'main'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is offline; using fallback if available.');
    }
    return false;
  }
}

export async function fsGetDocs(colName: string) {
  return withFirestoreRetry(async () => {
    const db = await getFirestoreDb();
    const { collection, getDocs } = await import('firebase/firestore/lite');
    return getDocs(collection(db, colName));
  });
}

export async function fsGetDoc(colName: string, docId: string) {
  return withFirestoreRetry(async () => {
    const db = await getFirestoreDb();
    const { doc, getDoc } = await import('firebase/firestore/lite');
    return getDoc(doc(db, colName, docId));
  });
}

export async function fsSetDoc(colName: string, docId: string, data: any, merge: boolean = false) {
  if (isOfflineBrowser()) {
    throw new Error('the client is offline');
  }
  const db = await getFirestoreDb();
  const { doc, setDoc } = await import('firebase/firestore/lite');
  return merge ? setDoc(doc(db, colName, docId), data, { merge: true }) : setDoc(doc(db, colName, docId), data);
}

export async function fsUpdateDoc(colName: string, docId: string, data: any) {
  if (isOfflineBrowser()) {
    throw new Error('the client is offline');
  }
  const db = await getFirestoreDb();
  const { doc, updateDoc } = await import('firebase/firestore/lite');
  return updateDoc(doc(db, colName, docId), data);
}

export async function fsDeleteDoc(colName: string, docId: string) {
  if (isOfflineBrowser()) {
    throw new Error('the client is offline');
  }
  const db = await getFirestoreDb();
  const { doc, deleteDoc } = await import('firebase/firestore/lite');
  return deleteDoc(doc(db, colName, docId));
}
