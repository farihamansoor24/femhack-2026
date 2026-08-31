// ===========================================================
// js/browse.js - Category Filter & Search Logic
// ===========================================================

import { requireAuth } from "./auth.js";
import { listProviders } from "./db.js";
import { renderNav } from "./nav.js";
import { fadeIn } from "./anim.js";

let allProviders = [];
let selectedCategory = "all";
let searchQuery = "";

requireAuth("customer", async ({ profile }) => {
  renderNav({ profile, active: "browse" });
  fadeIn("#browse-head");
  await loadProviders();
  setupFilterEvents();
});

async function loadProviders() {
  const list = document.getElementById("results-list");
  try {
    const data = await listProviders();
    allProviders = Array.isArray(data) ? data : [];
    filterAndRender();
  } catch (err) {
    if (list) {
      list.innerHTML = `<div class="col-span-full font-mono text-sm text-inksoft py-10">Couldn't load providers: ${escapeHtml(err.message)}</div>`;
    }
  }
}

function setupFilterEvents() {
  const searchInput = document.getElementById("search-input");
  const categorySelect = document.getElementById("category-filter");
  const pillButtons = document.querySelectorAll(".pill-btn");

  // Search input listener
  searchInput?.addEventListener("input", (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    filterAndRender();
  });

  // Category select dropdown listener
  categorySelect?.addEventListener("change", (e) => {
    selectedCategory = e.target.value.toLowerCase();
    updatePillStyles(selectedCategory);
    filterAndRender();
  });

  // Category quick-pills listeners
  pillButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedCategory = btn.dataset.category.toLowerCase();
      if (categorySelect) categorySelect.value = selectedCategory;
      updatePillStyles(selectedCategory);
      filterAndRender();
    });
  });
}

function updatePillStyles(activeCat) {
  document.querySelectorAll(".pill-btn").forEach((btn) => {
    const cat = btn.dataset.category.toLowerCase();
    if (cat === activeCat) {
      btn.className = "pill-btn bg-rust text-white font-mono text-xs uppercase px-3 py-1.5 rounded-full border border-rust transition cursor-pointer";
    } else {
      btn.className = "pill-btn bg-canvas text-inksoft hover:text-ink font-mono text-xs uppercase px-3 py-1.5 rounded-full border border-line transition cursor-pointer";
    }
  });
}

function filterAndRender() {
  const filtered = allProviders.filter((p) => {
    const name = (p.name || "").toLowerCase();
    const trade = (p.trade || "").toLowerCase();
    const bio = (p.bio || "").toLowerCase();

    const matchesCategory =
      selectedCategory === "all" || trade.includes(selectedCategory);

    const matchesSearch =
      !searchQuery ||
      name.includes(searchQuery) ||
      trade.includes(searchQuery) ||
      bio.includes(searchQuery);

    return matchesCategory && matchesSearch;
  });

  renderResults(filtered);
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

  if (count) {
    count.textContent = `${providers.length} pro${providers.length === 1 ? "" : "s"} available`;
  }

  if (!providers.length) {
    list.innerHTML = `<div class="col-span-full font-mono text-sm text-inksoft py-10 text-center bg-paper border border-line rounded-2xl">No providers found. Try selecting another category or keyword.</div>`;
    return;
  }

  list.innerHTML = providers.map((p) => {
    const pId = p.uid || p.id;
    const rating = p.rating ? Number(p.rating).toFixed(1) : "0.0";
    
    return `
      <a href="provider.html?id=${escapeHtml(pId)}" class="pro-card group bg-paper border border-line rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-denim/40 transition flex flex-col gap-4">
        <div class="flex items-center gap-3.5">
          ${avatarBlock(p)}
          <div class="min-w-0">
            <div class="font-semibold text-base truncate">${escapeHtml(p.name || "Anonymous Pro")}</div>
            <div class="font-mono text-[11px] uppercase tracking-wide text-denim mt-0.5">${escapeHtml(p.trade || "General")}</div>
            <div class="font-mono text-xs text-ok mt-1">★ ${rating} (${p.reviewCount || 0})</div>
          </div>
        </div>
        <p class="text-sm text-inksoft line-clamp-2">${escapeHtml(p.bio || "No bio provided yet.")}</p>
        <div class="flex items-center justify-between pt-3 border-t border-line">
          <div>
            <span class="font-display font-bold text-xl">$${p.hourlyRate || 0}</span>
            <span class="font-mono text-[10px] text-inksoft ml-1">/ HR</span>
          </div>
          <span class="text-xs font-mono uppercase tracking-wide text-white bg-neutral-800 group-hover:bg-rust px-3 py-1.5 rounded-lg transition">View</span>
        </div>
      </a>
    `;
  }).join("");

  // GSAP clean animation fix to avoid blur/invisible glitches:
  if (window.gsap) {
    gsap.fromTo(".pro-card", 
      { opacity: 0, y: 15 }, 
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, clearProps: "all" }
    );
  }
}

function initials(name) {
  return (name || "P")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}