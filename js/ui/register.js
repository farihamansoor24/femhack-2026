import { registerUser } from "../auth.js";
import { validateRequired, markFieldError, showToast } from "../utils.js";
import { fadeIn } from "../animations.js";
import { db, auth, signInWithPopup, GoogleAuthProvider } from "../firebase-config.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let selectedRole = "customer";

// Role Selection Logic
document.querySelectorAll(".role-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedRole = btn.dataset.role;
    document.querySelectorAll(".role-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// Form Submission & Redirect Fix
const form = document.getElementById("register-form");
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fields = ["name", "email", "password"];
    const { valid, errors, values } = validateRequired(form, fields);
    
    fields.forEach((f) => markFieldError(form, f, errors.includes(f)));
    if (!valid) {
      showToast("Please fill in every field.", "error");
      return;
    }
    if (values.password.length < 6) {
      markFieldError(form, "password", true);
      showToast("Password must be at least 6 characters.", "error");
      return;
    }

    const btn = document.getElementById("submit-btn");
    btn.disabled = true;
    btn.textContent = "Creating account\u2026";

    try {
      await registerUser({ 
        name: values.name, 
        email: values.email, 
        password: values.password, 
        role: selectedRole 
      });
      
      showToast("Account created. Welcome to Guildwork!", "success");

      // FIX: Full page redirect for Multi-Page App (Hash redirect remove kiya)
      setTimeout(() => {
        if (selectedRole === "provider") {
          window.location.href = "provider-profile.html";
        } else {
          window.location.href = "index.html";
        }
      }, 500);

    } catch (err) {
      showToast(friendlyAuthError(err), "error");
      btn.disabled = false;
      btn.textContent = "Create account";
    }
  });
}

fadeIn(".ticket");

function friendlyAuthError(err) {
  const code = err?.code || "";
  if (code.includes("email-already-in-use")) return "That email is already registered. Try logging in instead.";
  if (code.includes("invalid-email")) return "That email address doesn't look right.";
  if (code.includes("weak-password")) return "Please choose a stronger password.";
  return "Couldn't create your account. Please try again.";
}

// Google Login Handler Fix
const googleAuthBtn = document.getElementById("googleAuthBtn");
if (googleAuthBtn) {
  googleAuthBtn.addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();
    try {
      // 1. First Sign In with Google
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 2. Set Firestore documents after popup completes
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: user.displayName || "User",
        email: user.email,
        role: selectedRole,
        createdAt: serverTimestamp(),
      }, { merge: true });

      if (selectedRole === "provider") {
        await setDoc(
          doc(db, "providers", user.uid),
          {
            id: user.uid,
            name: user.displayName || "User",
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

      showToast("Signed in successfully!", "success");

      // 3. Page Redirect
      setTimeout(() => {
        if (selectedRole === "provider") {
          window.location.href = "provider-profile.html";
        } else {
          window.location.href = "index.html";
        }
      }, 500);

    } catch (err) {
      console.error(err);
      showToast(err.message || "Google Authentication failed.", "error");
    }
  });
}