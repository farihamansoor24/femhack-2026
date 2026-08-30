import { isFirebaseConfigured } from "./firebase-config.js";
import { watchAuthState, fetchUserProfile, logoutUser } from "./auth.js";
import { getState, setState, subscribe } from "./state.js";
import { registerRoute, registerNotFound, initRouter, handleRoute } from "./router.js";
import { seedProvidersIfEmpty } from "./db.js";
import { showToast } from "./utils.js";

import { renderHome } from "./ui/home.js";
import { renderProviderDetail } from "./ui/provider.js";
import { renderBooking } from "./ui/booking.js";
// import { renderLogin } from "./ui/login.js";
// import { renderRegister } from "./ui/register.js";
import { renderProviderProfile } from "./ui/provider-profile.js";
import { renderCustomerDashboard } from "./ui/customer-dashboard.js";
import { renderProviderDashboard } from "./ui/provider-dashboard.js";

// ---------- Config guard ----------
const banner = document.getElementById("config-banner");
if (!isFirebaseConfigured) {
  banner.classList.remove("hidden");
  banner.textContent =
    "Firebase isn't configured yet — open js/firebase-config.js and paste in your project's config to activate the app.";
} else {
  seedProvidersIfEmpty().catch((err) => console.error("Seeding failed:", err));
}

// ---------- Routes ----------
registerRoute("/home", renderHome);
registerRoute("/provider/profile", renderProviderProfile, { auth: true, role: "provider" });
registerRoute("/provider/:id", renderProviderDetail);
registerRoute("/booking/:providerId", renderBooking, { auth: true, role: "customer" });
// registerRoute("/login", renderLogin);
// registerRoute("/register", renderRegister);
registerRoute("/dashboard/customer", renderCustomerDashboard, { auth: true, role: "customer" });
registerRoute("/dashboard/provider", renderProviderDashboard, { auth: true, role: "provider" });
registerNotFound((mount) => {
  mount.innerHTML = `<div class="max-w-2xl mx-auto px-5 py-24 text-center">
    <p class="font-display text-2xl mb-2">Page not found.</p>
    <a href="#/home" data-link class="text-brass font-medium">&larr; Back home</a>
  </div>`;
});

// ---------- Nav sync ----------
function updateNav() {
  const { user, profile } = getState();
  const guest = document.getElementById("nav-guest");
  const userBox = document.getElementById("nav-user");
  const nameEl = document.getElementById("nav-user-name");
  const customerLinks = document.querySelectorAll('[data-auth="customer"]');
  const providerLinks = document.querySelectorAll('[data-auth="provider"]');

  if (user && profile) {
    guest?.classList.add("hidden");
    userBox?.classList.remove("hidden");
    userBox?.classList.add("flex");
    nameEl.textContent = `Hi, ${profile.name?.split(" ")[0] || "there"}`;
    customerLinks.forEach((el) => el.classList.toggle("hidden", profile.role !== "customer"));
    providerLinks.forEach((el) => el.classList.toggle("hidden", profile.role !== "provider"));
  } else {
    guest?.classList.remove("hidden");
    userBox?.classList.add("hidden");
    userBox?.classList.remove("flex");
    customerLinks.forEach((el) => el.classList.add("hidden"));
    providerLinks.forEach((el) => el.classList.add("hidden"));
  }
}
subscribe(updateNav);

document.getElementById("btn-logout")?.addEventListener("click", async () => {
  await logoutUser();
  showToast("Logged out.", "info");
  window.location.hash = "#/home";
});

// ---------- Auth wiring ----------
if (isFirebaseConfigured) {
  watchAuthState(async (user) => {
    if (user) {
      const profile = await fetchUserProfile(user.uid);
      setState({ user, profile, ready: true });
    } else {
      setState({ user: null, profile: null, ready: true });
    }
  });
} else {
  setState({ ready: true });
}

// ---------- Boot ----------
let started = false;
subscribe((s) => {
  if (s.ready && !started) {
    started = true;
    initRouter();
  } else if (started) {
    // Re-run the current route's guard whenever auth state changes later
    // (e.g. logging out while on a protected dashboard page).
    handleRoute();
  }
});
// In case auth state resolves before this subscriber attaches (rare), check once:
if (getState().ready) {
  started = true;
  initRouter();
}
// Google Login Handler
const googleAuthBtn = document.getElementById("googleAuthBtn");
if (googleAuthBtn) {
  googleAuthBtn.addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      window.location.href = "index.html";
    } catch (err) {
      const authError = document.getElementById("authError");
      if (authError) {
        authError.textContent = err.message;
        authError.classList.remove("hidden");
      }
    }
  });
}
