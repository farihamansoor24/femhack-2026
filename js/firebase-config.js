// ===========================================================
// firebase-config.js
// Replace the values below with YOUR Firebase project's config.
// Firebase Console -> Project Settings -> General -> Your apps -> SDK setup and config
// ===========================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup  } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import { getFirestore,doc, setDoc, getDoc, serverTimestamp,collection, addDoc, updateDoc, getDocs,
  query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
// import { firebaseConfig } from "./js/firebase-config.js";
  const firebaseConfig = {
    apiKey: "AIzaSyBdlc5utTTo5kloBxQucpwja-Q0F6Wh-7I",
    authDomain: "femhack-2026-aede7.firebaseapp.com",
    projectId: "femhack-2026-aede7",
    storageBucket: "femhack-2026-aede7.firebasestorage.app",
    messagingSenderId: "43546147543",
    appId: "1:43546147543:web:bce4f7200f2aa1ea758e92",
    measurementId: "G-5Q0JVBR0WS"
  };


const app = initializeApp(firebaseConfig);

 const auth = getAuth(app);
 const db = getFirestore(app);
export { db,auth, getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup ,
  doc, setDoc, getDoc, serverTimestamp,getFirestore,collection, addDoc, updateDoc, getDocs,
  query, where, orderBy}