
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-analytics.js";
  import { getFirestore, collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc,getDoc, deleteDoc, serverTimestamp, where, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
  import{ getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup,sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
  import { getStorage } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js";
  
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyBdlc5utTTo5kloBxQucpwja-Q0F6Wh-7I",
    authDomain: "femhack-2026-aede7.firebaseapp.com",
    projectId: "femhack-2026-aede7",
    storageBucket: "femhack-2026-aede7.firebasestorage.app",
    messagingSenderId: "43546147543",
    appId: "1:43546147543:web:bce4f7200f2aa1ea758e92",
    measurementId: "G-5Q0JVBR0WS"
  };

   // Initialize Firebase
   const app = initializeApp(firebaseConfig);
   const analytics = getAnalytics(app);
   const db = getFirestore(app);
   const auth = getAuth(app);
   const storage = getStorage(app);
   export { app, analytics, db, auth , getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, collection, query, orderBy, onSnapshot,doc, addDoc,serverTimestamp, updateDoc, deleteDoc, getDoc, where, getDocs, GoogleAuthProvider, signInWithPopup,storage,setDoc,sendPasswordResetEmail };
