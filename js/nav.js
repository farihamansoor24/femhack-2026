// ===========================================================
// nav.js — renders the top nav into #nav-root
// ===========================================================

import { logOut } from "./auth.js";

function avatarHtml(profile, size = "w-9 h-9 text-xs") {
  const name = profile?.name || "User";
  if (profile.profileImageUrl) {
    return `<div class="${size} rounded-full overflow-hidden ring-1 ring-line flex-none">
      <img src="${profile.profileImageUrl}" class="w-full h-full object-cover" alt="${escapeHtml(profile.name)}">
    </div>`;
  }
  return `<div class="${size} rounded-full bg-denim text-white flex items-center justify-center font-display font-bold flex-none">
    ${initials(profile.name)}
  </div>`;
}

export function renderNav({ profile = null, active } = {}) {
  const root = document.getElementById("nav-root");
  if (!root) return;

  const isLoggedIn = Boolean(profile);
  const isProvider = profile?.role === "provider";
  
  const home = isLoggedIn 
    ? (isProvider ? "provider-dashboard.html" : "browse.html")
    : "index.html";

  // Guest vs Logged-in links
  const links = !isLoggedIn
    ? [
        { href: "index.html", label: "Home", key: "home" },
        { href: "browse.html", label: "Browse Pros", key: "browse" }
      ]
    : isProvider
    ? [{ href: "provider-dashboard.html", label: "Dashboard", key: "dashboard" }]
    : [
        { href: "browse.html", label: "Find Pros", key: "browse" },
        { href: "customer-dashboard.html", label: "My Bookings", key: "bookings" }
      ];

  // Right side buttons (Guest vs User Profile)
  const authControlsHtml = isLoggedIn
    ? `<div class="flex items-center gap-3">
        <a href="edit-profile.html" class="flex items-center gap-2 group" title="Edit profile">
          <span class="hidden sm:block font-mono text-xs text-inksoft group-hover:text-ink transition">${escapeHtml(profile.name || "User")}</span>
          ${avatarHtml(profile)}
        </a>
        <button id="logout-btn" class="px-3 py-2 rounded-lg border border-line text-xs font-mono uppercase tracking-wide text-inksoft hover:text-ink hover:border-ink transition">
          Log out
        </button>
      </div>`
    : `<div class="flex items-center gap-2">
        <a href="login.html" class="px-3.5 py-2 rounded-lg bg-rustdark hover:bg-rust text-white font-mono text-xs uppercase tracking-wide transition">
          Log in / Sign up
        </a>
      </div>`;

  root.innerHTML = `
    <nav class="sticky top-0 z-50 bg-paper/90 backdrop-blur border-b border-line">
      <div class="max-w-6xl mx-auto px-5 sm:px-6 py-3 flex items-center justify-between gap-4">
        <a href="${home}" class="flex flex-col leading-none">
          <span class="font-display font-extrabold text-2xl tracking-tight text-ink">GUILDWORK</span>
          <span class="hidden sm:block font-mono text-[9px] tracking-[0.22em] text-inksoft mt-0.5">FIELD SERVICES, ON DEMAND</span>
        </a>

        <ul class="hidden md:flex items-center gap-1">
          ${links.map(l => `
            <li>
              <a href="${l.href}" class="px-3 py-2 rounded-lg text-sm font-medium transition
                ${active === l.key ? "text-ink bg-canvas" : "text-inksoft hover:text-ink hover:bg-canvas"}">
                ${l.label}
              </a>
            </li>`).join("")}
        </ul>

        ${authControlsHtml}
      </div>

      <ul class="md:hidden flex items-center gap-1 px-5 pb-3 overflow-x-auto">
        ${links.map(l => `
          <li>
            <a href="${l.href}" class="whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium
              ${active === l.key ? "text-ink bg-canvas" : "text-inksoft"}">${l.label}</a>
          </li>`).join("")}
      </ul>
    </nav>
  `;

  if (isLoggedIn) {
    document.getElementById("logout-btn")?.addEventListener("click", async () => {
      await logOut();
      window.location.href = "login.html";
    });
  }
}

function initials(name) { return (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(); }
function escapeHtml(str) { const d = document.createElement("div"); d.textContent = str || ""; return d.innerHTML; }