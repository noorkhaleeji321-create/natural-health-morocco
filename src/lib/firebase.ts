import firebaseConfig from '../../firebase-applet-config.json';

let appInstance: any = null;
let dbInstance: any = null;
let authInstance: any = null;

export async function getFirebaseApp() {
  if (appInstance) return appInstance;
  const { initializeApp, getApps } = await import('firebase/app');
  const apps = getApps();
  appInstance = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
  return appInstance;
}

export async function getFirestoreDb() {
  if (dbInstance) return dbInstance;
  const app = await getFirebaseApp();
  const { initializeFirestore } = await import('firebase/firestore');
  dbInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  }, firebaseConfig.firestoreDatabaseId);
  return dbInstance;
}

export async function getFirebaseAuth() {
  if (authInstance) return authInstance;
  const app = await getFirebaseApp();
  const { getAuth } = await import('firebase/auth');
  authInstance = getAuth(app);
  return authInstance;
}

export async function fsGetDocs(colName: string) {
  const db = await getFirestoreDb();
  const { collection, getDocs } = await import('firebase/firestore');
  return getDocs(collection(db, colName));
}

export async function fsGetDoc(colName: string, docId: string) {
  const db = await getFirestoreDb();
  const { doc, getDoc } = await import('firebase/firestore');
  return getDoc(doc(db, colName, docId));
}

export async function fsSetDoc(colName: string, docId: string, data: any) {
  const db = await getFirestoreDb();
  const { doc, setDoc } = await import('firebase/firestore');
  return setDoc(doc(db, colName, docId), data);
}

export async function fsUpdateDoc(colName: string, docId: string, data: any) {
  const db = await getFirestoreDb();
  const { doc, updateDoc } = await import('firebase/firestore');
  return updateDoc(doc(db, colName, docId), data);
}

export async function fsDeleteDoc(colName: string, docId: string) {
  const db = await getFirestoreDb();
  const { doc, deleteDoc } = await import('firebase/firestore');
  return deleteDoc(doc(db, colName, docId));
}
