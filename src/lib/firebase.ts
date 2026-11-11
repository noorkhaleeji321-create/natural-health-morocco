import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const apps = getApps();
const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);

// In browser and sandboxed iframe environments, WebChannel can hang or get blocked behind proxies.
// experimentalForceLongPolling: true forces clean HTTP long-polling, eliminating the 10-second backend timeout.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

