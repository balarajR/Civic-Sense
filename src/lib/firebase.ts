/**
 * @file   firebase.ts
 * @module Firebase
 * @description Initializes the Firebase SDK for the CivicSense client.
 *              Configures the Firebase App and conditionally enables Analytics
 *              (only in supported browser environments).
 *
 * @author  CivicSense Team
 * @created 2025-04-28
 *
 * @dependencies firebase/app, firebase/analytics
 * @exports      app, analytics
 */

import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';

/**
 * Firebase configuration object — all values sourced from environment
 * variables to avoid hardcoded credentials (skill.md rule #8).
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

/** Firebase application instance — singleton. */
const app = initializeApp(firebaseConfig);

/**
 * Firebase Analytics instance — initialized conditionally.
 * Returns null in environments where Analytics is unsupported (CI, SSR, older browsers).
 */
let analytics = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

export { app, analytics };
