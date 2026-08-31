// ===========================================================
// browse.js
// ===========================================================

import { requireAuth } from "./auth.js";
import { listProviders } from "./db.js";
import { renderNav } from "./nav.js";
import { fadeIn, revealCards } from "./anim.js";

let allProviders = [];

requireAuth("customer", async ({ profile }) => {
  renderNav({ profile, active: "browse" });
  fadeIn("#browse-head");
  await loadProviders();
});

async function loadProviders() {
  const list = document.getElementById("results-list");
  try {
    allProviders = await listProviders();
    renderResults(allProviders);
  } catch (err) {
    list.innerHTML = `<div class="col-span-full font-mono text-sm text-inksoft py-10">Couldn't load providers: ${err.message}</div>`;
  }
}

function avatarBlock(p) {
  if (p.profileImageUrl) {
    return `<div class="w-14 h-14 rounded-full overflow-hidden ring-1 ring-line flex-none">
      <img src="${p.profileImageUrl}" class="w-full h-full object-cover" alt="${escapeHtml(p.name)}">
    </div>`;
  }
  return `<div class="w-14 h-14 rounded-full bg-denim text-white flex items-center justify-center font-display font-bold text-lg flex-none">
    ${initials(p.name)}
  </div>`;
}

function renderResults(providers) {
  const list = document.getElementById("results-list");
  const count = document.getElementById("result-count");
  count.textContent = `${providers.length} pro${providers.length === 1 ? "" : "s"} available`;

  if (!providers.length) {
    list.innerHTML = `<div class="col-span-full font-mono text-sm text-inksoft py-10">No providers found. Try a different search.</div>`;
    return;
  }

  list.innerHTML = providers.map(p => `
    <a href="provider.html?id=${p.uid}" class="pro-card group bg-paper border border-line rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-denim/40 transition flex flex-col gap-4">
      <div class="flex items-center gap-3.5">
        ${avatarBlock(p)}
        <div class="min-w-0">
          <div class="font-semibold text-base truncate">${escapeHtml(p.name)}</div>
          <div class="font-mono text-[11px] uppercase tracking-wide text-denim mt-0.5">${escapeHtml(p.trade || "General")}</div>
          <div class="font-mono text-xs text-ok mt-1">★ ${(p.rating || 0).toFixed(1)} (${p.reviewCount || 0})</div>
        </div>
      </div>
      <p class="text-sm text-inksoft line-clamp-2">${escapeHtml(p.bio || "No bio provided yet.")}</p>
      <div class="flex items-center justify-between pt-3 border-t border-line">
        <div><span class="font-display font-bold text-xl">$${p.hourlyRate || 0}</span><span class="font-mono text-[10px] text-inksoft ml-1">/ HR</span></div>
        <span class="text-xs font-mono uppercase tracking-wide text-white bg-neutral-800 group-hover:bg-rust px-3 py-1.5 rounded-lg">View</span>
      </div>
    </a>
  `).join("");

  revealCards("#results-list .pro-card");
}

document.getElementById("search-input").addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  const filtered = allProviders.filter(p => p.name.toLowerCase().includes(q) || (p.trade || "").toLowerCase().includes(q));
  renderResults(filtered);
});

function initials(name) { return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(); }
function escapeHtml(str) { const div = document.createElement("div"); div.textContent = str; return div.innerHTML; }
