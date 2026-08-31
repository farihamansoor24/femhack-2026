// ===========================================================
// auth.js
// Wraps Firebase Auth + the users/{uid} profile document.
// Role ("customer" | "provider") lives in Firestore, not in
// Firebase Auth itself.
// ===========================================================

import { auth, db , createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,doc, setDoc, getDoc, serverTimestamp } from "./firebase-config.js";



export async function signUp(data) {
  const { name, email, password, role, trade, bio, hourlyRate } = data;

  if (!name || !email || !password || !role) {
    throw new Error("Please fill in every required field.");
  }
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }
  if (role === "provider" && (!trade || trade.trim() === "")) {
    throw new Error("Please enter your trade/service category.");
  }

  const cred = await createUserWithEmailAndPassword(auth, email, password);

  const profile = {
    uid: cred.user.uid,
    name: name.trim(),
    email: email.trim(),
    role,
    bio: (bio || "").trim(),
    profileImageUrl: "",
    createdAt: serverTimestamp()
  };
  if (role === "provider") {
    profile.trade = trade.trim();
    profile.hourlyRate = Number(hourlyRate) || 0;
    profile.rating = 0;
    profile.reviewCount = 0;
  }

  await setDoc(doc(db, "users", cred.user.uid), profile);
  return profile;
}

export async function logIn(email, password) {
  if (!email || !password) throw new Error("Enter your email and password.");
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return getUserProfile(cred.user.uid);
}

export function logOut() {
  return signOut(auth);
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) throw new Error("No profile found for this account.");
  return snap.data();
}

/**
 * Guard a page: redirects to login.html if signed out.
 * Pass requiredRole = null to allow either role through.
 */
export function requireAuth(requiredRole, onReady) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = "login.html"; return; }
    try {
      const profile = await getUserProfile(user.uid);
      if (requiredRole && profile.role !== requiredRole) {
        window.location.href = profile.role === "provider" ? "provider-dashboard.html" : "browse.html";
        return;
      }
      onReady({ user, profile });
    } catch (err) {
      console.error(err);
      window.location.href = "login.html";
    }
  });
}
