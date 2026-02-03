import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import {
  getAuth,
  Auth,
  signInAnonymously,
  onAuthStateChanged,
  User,
} from 'firebase/auth';

// Firebase設定
// 注意: 本番環境では環境変数から読み込むことを推奨
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'YOUR_AUTH_DOMAIN',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'YOUR_STORAGE_BUCKET',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_MESSAGING_SENDER_ID',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || 'YOUR_APP_ID',
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

export const initFirebase = (): { app: FirebaseApp; db: Firestore; auth: Auth } => {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  db = getFirestore(app);
  auth = getAuth(app);

  // オフライン永続化を有効化（Web環境のみ）
  if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('複数タブが開いているため、オフライン永続化を有効にできません');
      } else if (err.code === 'unimplemented') {
        console.warn('このブラウザはオフライン永続化をサポートしていません');
      }
    });
  }

  return { app, db, auth };
};

export const getFirebaseApp = (): FirebaseApp => app;
export const getFirebaseDb = (): Firestore => db;
export const getFirebaseAuth = (): Auth => auth;

// 匿名認証でログイン（ゲストモード）
export const signInAsGuest = async (): Promise<User> => {
  const auth = getFirebaseAuth();
  const result = await signInAnonymously(auth);
  return result.user;
};

// 認証状態の監視
export const subscribeToAuthState = (
  callback: (user: User | null) => void
): (() => void) => {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
};
