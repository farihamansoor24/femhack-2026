// ===========================================================
// Firebase configuration
// -----------------------------------------------------------
// 1. Go to https://console.firebase.google.com → create a project
// 2. Project settings → General → "Your apps" → Web app → copy the config
// 3. Paste the values below (replace every "REPLACE_ME")
// 4. In the Firebase console enable:
//      - Authentication → Sign-in method → Email/Password
//      - Firestore Database → Create database (start in test mode,
//        then apply the rules from README.md before going live)
// ===========================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

  const firebaseConfig = {
    apiKey: "AIzaSyBdlc5utTTo5kloBxQucpwja-Q0F6Wh-7I",
    authDomain: "femhack-2026-aede7.firebaseapp.com",
    projectId: "femhack-2026-aede7",
    storageBucket: "femhack-2026-aede7.firebasestorage.app",
    messagingSenderId: "43546147543",
    appId: "1:43546147543:web:bce4f7200f2aa1ea758e92",
    measurementId: "G-5Q0JVBR0WS"
  };
export const isFirebaseConfigured = !Object.values(firebaseConfig).some(
  (v) => typeof v === "string" && v.includes("REPLACE_ME")
);

let app, auth, db;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  // Keep the customer/provider logged in across refreshes.
  setPersistence(auth, browserLocalPersistence).catch(() => {});
}

export { app, auth, db };
