// ===========================================================
// js/login.js
// ===========================================================

import { auth, onAuthStateChanged, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup, serverTimestamp, setDoc, doc, db } from "./firebase-config.js";
import { signUp, logIn, getUserProfile } from "./auth.js";
import { fadeIn, shake } from "./anim.js";

fadeIn("#auth-card", { duration: .5 });

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const profile = await getUserProfile(user.uid);
      window.location.href = profile.role === "provider" ? "provider-dashboard.html" : "browse.html";
    } catch { /* mid-signup, stay put */ }
  }
});

const errorBanner = document.getElementById("error-banner");
const successBanner = document.getElementById("success-banner");

function showError(msg) {
  successBanner.classList.add("hidden");
  errorBanner.textContent = msg;
  errorBanner.classList.remove("hidden");
  shake(errorBanner);
}
function showSuccess(msg) {
  errorBanner.classList.add("hidden");
  successBanner.textContent = msg;
  successBanner.classList.remove("hidden");
}
function clearBanners() {
  errorBanner.classList.add("hidden");
  successBanner.classList.add("hidden");
}

/* ---------------- Tabs ---------------- */
const ACTIVE_TAB = ["bg-rustdark", "text-white"];
const INACTIVE_TAB = ["text-inksoft"];

document.querySelectorAll(".auth-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    clearBanners();
    document.querySelectorAll(".auth-tab").forEach(t => {
      t.classList.remove(...ACTIVE_TAB);
      t.classList.add(...INACTIVE_TAB);
    });
    tab.classList.remove(...INACTIVE_TAB);
    tab.classList.add(...ACTIVE_TAB);

    document.querySelectorAll(".auth-panel").forEach(p => p.classList.add("hidden"));
    const panel = document.getElementById(tab.dataset.tab + "-panel");
    panel.classList.remove("hidden");
    fadeIn(panel, { duration: .35, y: 10 });
  });
});
// initialize active tab styling
document.querySelector('.auth-tab[data-tab="login"]').classList.add(...ACTIVE_TAB);

/* ---------------- Role toggle ---------------- */
const providerFields = document.getElementById("provider-fields");
const roleInput = document.getElementById("signup-role");
document.querySelectorAll(".role-option").forEach(opt => {
  opt.addEventListener("click", () => {
    document.querySelectorAll(".role-option").forEach(o => {
      o.classList.remove("border-rust", "bg-rust/10", "text-rust");
      o.classList.add("border-line", "text-inksoft");
    });
    opt.classList.remove("border-line", "text-inksoft");
    opt.classList.add("border-rust", "bg-rust/10", "text-rust");
    roleInput.value = opt.dataset.role;
    if (opt.dataset.role === "provider") {
      providerFields.classList.remove("hidden");
      fadeIn(providerFields, { duration: .35, y: 8 });
    } else {
      providerFields.classList.add("hidden");
    }
  });
});

/* ---------------- Validation helpers ---------------- */
function setFieldError(inputId, show) {
  const err = document.getElementById(inputId + "-error");
  if (err) err.classList.toggle("hidden", !show);
}
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ---------------- Log in ---------------- */
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  clearBanners();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  let valid = true;
  const emailOk = emailRe.test(email);
  setFieldError("login-email", !emailOk); if (!emailOk) valid = false;
  setFieldError("login-password", !password); if (!password) valid = false;
  if (!valid) { shake(document.getElementById("login-form")); return; }

  const btn = e.target.querySelector("button");
  btn.disabled = true; btn.textContent = "Logging in…";
  try {
    const profile = await logIn(email, password);
    window.location.href = profile.role === "provider" ? "provider-dashboard.html" : "browse.html";
  } catch (err) {
    showError(friendlyError(err));
    btn.disabled = false; btn.textContent = "Log in";
  }
});

/* ---------------- Sign up ---------------- */
document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  clearBanners();

  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  const role = roleInput.value;
  const tradeSelect = document.getElementById("signup-trade");
  const trade = tradeSelect ? tradeSelect.value.toLowerCase().trim() : "";
  const bio = document.getElementById("signup-bio").value.trim();
  const hourlyRate = document.getElementById("signup-rate").value;

  let valid = true;
  setFieldError("signup-name", !name); if (!name) valid = false;
  const emailOk = emailRe.test(email);
  setFieldError("signup-email", !emailOk); if (!emailOk) valid = false;
  const passOk = password.length >= 6;
  setFieldError("signup-password", !passOk); if (!passOk) valid = false;
  
  if (role === "provider") {
    setFieldError("signup-trade", !trade); 
    if (!trade) valid = false;
  }
  
  if (!valid) { shake(document.getElementById("signup-form")); return; }

  const btn = e.target.querySelector("button");
  btn.disabled = true; btn.textContent = "Creating account…";
  try {
    await signUp({ name, email, password, role, trade, bio, hourlyRate });
    showSuccess("Account created — redirecting…");
    setTimeout(() => { window.location.href = role === "provider" ? "provider-dashboard.html" : "browse.html"; }, 700);
  } catch (err) {
    showError(friendlyError(err));
    btn.disabled = false; btn.textContent = "Create account";
  }
});

function friendlyError(err) {
  const code = err && err.code;
  if (code === "auth/email-already-in-use") return "That email is already registered — try logging in instead.";
  if (code === "auth/invalid-email") return "That email address doesn't look right.";
  if (code === "auth/weak-password") return "Password is too weak — use at least 6 characters.";
  if (["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"].includes(code)) return "Incorrect email or password.";
  return err.message || "Something went wrong. Please try again.";
}

// ------------ Forgot Password Modal ------------
document.addEventListener('DOMContentLoaded', () => {
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const modal = document.getElementById('forgot-password-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const resetForm = document.getElementById('forgot-password-form');
  const resetEmailInput = document.getElementById('reset-email');
  const statusMsg = document.getElementById('modalStatus');

  forgotPasswordLink?.addEventListener('click', (e) => {
    e.preventDefault();
    modal.classList.remove('hidden');
  });

  closeModalBtn?.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });

  resetForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = resetEmailInput.value.trim();

    if (!email && statusMsg) {
      statusMsg.textContent = 'Please enter a valid email address.';
      statusMsg.classList.remove('hidden');
      return;
    }

    try { 
      if (statusMsg) {
        statusMsg.textContent = 'Sending reset email...';
        statusMsg.classList.remove('hidden');
      }
      await sendPasswordResetEmail(auth, email);
      if (statusMsg) {
        statusMsg.textContent = 'Reset link sent! Check your inbox.';
        statusMsg.classList.remove('hidden');
      }
      setTimeout(() => {
        modal.classList.add('hidden');
      }, 2000);
    } catch (error) {
      console.error('Password reset error:', error);
      if (statusMsg) {
        statusMsg.textContent = error.message || 'Failed to send reset email.';
        statusMsg.classList.remove('hidden');
      }
    }
  });
});

// -------- Google Authentication -----------------------
const googleBtn = document.getElementById('google-auth-btn');

googleBtn?.addEventListener('click', async () => {
  const googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: "select_account"
  });
  try {
    await signInWithPopup(auth, googleProvider);
    const profile = {
      uid: auth.currentUser.uid,
      name: auth.currentUser.displayName,
      email: auth.currentUser.email,
      role: roleInput.value,
      createdAt: serverTimestamp()
    };
    if (roleInput.value === "provider") {
      profile.trade = '';
      profile.hourlyRate = 0;
      profile.rating = 0;
      profile.reviewCount = 0;
    }

    await setDoc(doc(db, "users", auth.currentUser.uid), profile);

    showSuccess('User has been logged in successfully!.');
    if (roleInput.value === 'customer') {
      window.location.href = "customer-dashboard.html";
    } else {
      window.location.href = "edit-profile.html";
    }
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    showError('Google Sign-In Error: ' + (error.message || ''));
  }
});