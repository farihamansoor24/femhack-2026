import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// role: "customer" | "provider"
export async function registerUser({ name, email, password, role }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await setDoc(doc(db, "users", cred.user.uid), {
    uid: cred.user.uid,
    name,
    email,
    role,
    createdAt: serverTimestamp(),
  });
  // Providers get an empty profile shell right away so they show up
  // in "manage profile" even before they fill in details.
  if (role === "provider") {
    await setDoc(
      doc(db, "providers", cred.user.uid),
      {
        id: cred.user.uid,
        name,
        business: "",
        service: "",
        location: "",
        experience: 0,
        price: 0,
        priceUnit: "visit",
        bio: "",
        rating: 0,
        reviewCount: 0,
        available: true,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
  return cred.user;
}

export async function loginUser({ email, password }) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logoutUser() {
  return fbSignOut(auth);
}

export function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function fetchUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}
