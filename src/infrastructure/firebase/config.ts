import { initializeApp, type FirebaseApp } from "firebase/app";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectStorageEmulator, getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;
let firestore: Firestore | undefined;
let auth: Auth | undefined;
let storage: FirebaseStorage | undefined;

function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirestoreInstance(): Firestore {
  if (!firestore) {
    const fbApp = getFirebaseApp();
    firestore = getFirestore(fbApp);

    if (import.meta.env.VITE_USE_EMULATORS === "true") {
      const host = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST || "localhost";
      const port = parseInt(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT || "8080", 10);
      connectFirestoreEmulator(firestore, host, port);
    }
  }
  return firestore;
}

export function getAuthInstance(): Auth {
  if (!auth) {
    const fbApp = getFirebaseApp();
    auth = getAuth(fbApp);

    if (import.meta.env.VITE_USE_EMULATORS === "true") {
      const host = import.meta.env.VITE_AUTH_EMULATOR_HOST || "localhost";
      const port = parseInt(import.meta.env.VITE_AUTH_EMULATOR_PORT || "9099", 10);
      connectAuthEmulator(auth, `http://${host}:${port}`);
    }
  }
  return auth;
}

export function getStorageInstance(): FirebaseStorage {
  if (!storage) {
    const fbApp = getFirebaseApp();
    storage = getStorage(fbApp);

    if (import.meta.env.VITE_USE_EMULATORS === "true") {
      const host = import.meta.env.VITE_STORAGE_EMULATOR_HOST || "localhost";
      const port = parseInt(import.meta.env.VITE_STORAGE_EMULATOR_PORT || "9199", 10);
      connectStorageEmulator(storage, host, port);
    }
  }
  return storage;
}

export type { FirebaseApp, Firestore, Auth, FirebaseStorage };
