 import { auth,onAuthStateChanged } from "./firebase-config.js";
 import { getUserProfile } from "./js/auth.js";

    onAuthStateChanged(auth, async (user) => {
      if (!user) { window.location.href = "login.html"; return; }
      try {
        const profile = await getUserProfile(user.uid);
        window.location.href = profile.role === "provider" ? "provider-dashboard.html" : "browse.html";
      } catch {
        window.location.href = "login.html";
      }
    });