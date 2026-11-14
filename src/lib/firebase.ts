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

export async function getFirestoreDb() {
  if (dbInstance) return dbInstance;
  if (!dbPromise) {
    dbPromise = (async () => {
      try {
        const app = await getFirebaseApp();
        const { getFirestore } = await import('firebase/firestore/lite');
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

export async function fsGetDocs(colName: string) {
  const db = await getFirestoreDb();
  const { collection, getDocs } = await import('firebase/firestore/lite');
  return getDocs(collection(db, colName));
}

export async function fsGetDoc(colName: string, docId: string) {
  const db = await getFirestoreDb();
  const { doc, getDoc } = await import('firebase/firestore/lite');
  return getDoc(doc(db, colName, docId));
}

export async function fsSetDoc(colName: string, docId: string, data: any, merge: boolean = false) {
  const db = await getFirestoreDb();
  const { doc, setDoc } = await import('firebase/firestore/lite');
  return merge ? setDoc(doc(db, colName, docId), data, { merge: true }) : setDoc(doc(db, colName, docId), data);
}

export async function fsUpdateDoc(colName: string, docId: string, data: any) {
  const db = await getFirestoreDb();
  const { doc, updateDoc } = await import('firebase/firestore/lite');
  return updateDoc(doc(db, colName, docId), data);
}

export async function fsDeleteDoc(colName: string, docId: string) {
  const db = await getFirestoreDb();
  const { doc, deleteDoc } = await import('firebase/firestore/lite');
  return deleteDoc(doc(db, colName, docId));
}
