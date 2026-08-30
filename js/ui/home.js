import { getAllProviders } from "../db.js";
import { CATEGORIES } from "../seed-data.js";
import { renderStars, escapeHtml } from "../utils.js";
import { heroIntro, staggerCards } from "../animations.js";

let allProviders = [];
let activeCategory = "All";
let searchTerm = "";

export async function renderHome(params, mount) {
  mount.innerHTML = `
    <section class="max-w-6xl mx-auto px-5 sm:px-8 pt-14 sm:pt-20 pb-10">
      <div class="grid md:grid-cols-[1.3fr,1fr] gap-10 items-end">
        <div>
          <p class="hero-eyebrow eyebrow mb-3">Local trades &amp; services, on the record</p>
          <h1 class="hero-title font-display font-medium text-4xl sm:text-5xl leading-[1.05] tracking-tight">
            Find a provider you can<br class="hidden sm:block" /> actually count on.
          </h1>
          <p class="hero-sub text-slate2 mt-4 max-w-md">
            Browse vetted local providers, book in a few taps, and follow the job from request to
            completed &mdash; no more chasing WhatsApp threads.
          </p>
        </div>
        <div class="relative hidden md:flex justify-end">
          <div class="hero-stamp stamp stamp-completed !text-base !px-4 !py-2 bg-paper2 shadow-md">Guild-checked</div>
        </div>
      </div>

      <div class="hero-search mt-9 bg-white border border-ink/10 rounded-sm p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <input
          id="search-input"
          type="text"
          placeholder="Search by name, trade, or neighborhood&hellip;"
          class="flex-1 px-4 py-3 border border-ink/10 rounded-sm text-sm focus:border-brass outline-none"
        />
      </div>

      <div id="chip-rail" class="chip-rail mt-5 flex gap-2 overflow-x-auto pb-1"></div>
    </section>

    <section class="max-w-6xl mx-auto px-5 sm:px-8 pb-24">
      <div class="flex items-baseline justify-between mb-5">
        <h2 class="font-display text-2xl">Available providers</h2>
        <span id="result-count" class="text-sm text-slate2"></span>
      </div>
      <div id="provider-grid" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"></div>
      <div id="empty-state" class="hidden text-center py-20 text-slate2">
        <p class="font-display text-xl mb-1">No providers match that search.</p>
        <p class="text-sm">Try a different category or clear the search box.</p>
      </div>
    </section>
  `;

  renderChips(mount);
  document.getElementById("search-input").addEventListener("input", (e) => {
    searchTerm = e.target.value.trim().toLowerCase();
    renderGrid();
  });

  renderSkeleton();
  allProviders = await getAllProviders();
  renderGrid();
  heroIntro();
}

function renderChips(mount) {
  const rail = mount.querySelector("#chip-rail");
  const cats = ["All", ...CATEGORIES];
  rail.innerHTML = cats
    .map(
      (c) =>
        `<button data-cat="${escapeHtml(c)}" class="chip ${c === activeCategory ? "active" : ""}">${escapeHtml(c)}</button>`
    )
    .join("");
  rail.querySelectorAll("[data-cat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.cat;
      rail.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      renderGrid();
    });
  });
}

function renderSkeleton() {
  const grid = document.getElementById("provider-grid");
  if (!grid) return;
  grid.innerHTML = Array.from({ length: 6 })
    .map(() => `<div class="skel h-52 rounded-sm"></div>`)
    .join("");
}

function renderGrid() {
  const grid = document.getElementById("provider-grid");
  const empty = document.getElementById("empty-state");
  const countEl = document.getElementById("result-count");
  if (!grid) return;

  let list = allProviders;
  if (activeCategory !== "All") list = list.filter((p) => p.service === activeCategory);
  if (searchTerm) {
    list = list.filter((p) =>
      [p.name, p.business, p.service, p.location].filter(Boolean).join(" ").toLowerCase().includes(searchTerm)
    );
  }

  countEl.textContent = `${list.length} provider${list.length === 1 ? "" : "s"}`;

  if (!list.length) {
    grid.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  grid.innerHTML = list.map((p) => providerCard(p)).join("");
  grid.querySelectorAll("[data-goto]").forEach((card) => {
    card.addEventListener("click", () => {
      window.location.hash = `#/provider/${card.dataset.goto}`;
    });
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter") window.location.hash = `#/provider/${card.dataset.goto}`;
    });
  });
  staggerCards(".stagger-card");
}

function providerCard(p) {
  return `
    <article
      tabindex="0"
      role="button"
      data-goto="${p.id}"
      class="stagger-card ticket lift-card cursor-pointer pl-7 pr-5 py-5 flex flex-col gap-3"
    >
      <div class="ticket-notch"></div>
      <div class="flex items-start justify-between gap-2">
        <div>
          <p class="font-display text-lg leading-tight">${escapeHtml(p.business || p.name)}</p>
          <p class="text-xs text-slate2 mt-0.5">${escapeHtml(p.name)}</p>
        </div>
        <span class="chip !py-1 !px-2.5 shrink-0">${escapeHtml(p.service)}</span>
      </div>

      <div class="flex items-center gap-2 text-sm text-slate2">
        <span>${renderStars(p.rating || 0, { size: "text-sm" })}</span>
        <span class="ticket-id text-xs">${(p.rating || 0).toFixed(1)} &middot; ${p.reviewCount || 0} reviews</span>
      </div>

      <p class="text-sm text-slate2">${escapeHtml(p.location || "")}</p>

      <div class="flex items-center justify-between pt-2 mt-auto border-t border-ink/10">
        <span class="text-sm font-semibold">Rs ${Number(p.price || 0).toLocaleString()} <span class="text-xs font-normal text-slate2">/ ${escapeHtml(p.priceUnit || "visit")}</span></span>
        <span class="text-xs font-medium ${p.available ? "text-forest" : "text-slate2"}">${p.available ? "● Available" : "○ Booked up"}</span>
      </div>
    </article>
  `;
}
