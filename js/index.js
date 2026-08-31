// ===========================================================
// js/index.js - Guest Home Page Logic with GSAP ScrollTrigger & Hover Effects
// ===========================================================

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { auth, db, doc, getDoc } from "./firebase-config.js";
import { listProviders } from "./db.js";
import { renderNav } from "./nav.js";

// Register ScrollTrigger plugin if available
if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
}

let providerDataList = [];

document.addEventListener("DOMContentLoaded", async () => {
  renderNav({ profile: null, active: "home" });
  initAnimations();

  onAuthStateChanged(auth, async (user) => {
    const ctaContainer = document.getElementById("hero-cta-buttons");

    if (user) {
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          const profile = { uid: user.uid, ...userSnap.data() };
          renderNav({ profile, active: "home" });
        }
      } catch (err) {
        console.warn("Could not load user profile for nav:", err);
      }

      if (ctaContainer) {
        ctaContainer.innerHTML = `
          <a href="#providers-section" class="bg-rustdark hover:bg-rust text-white font-mono text-sm uppercase tracking-wide px-8 py-3.5 rounded-xl transition shadow-lg">Browse & Book Services</a>
          <a href="customer-dashboard.html" class="border border-line hover:border-inksoft bg-canvas text-ink font-mono text-sm uppercase tracking-wide px-8 py-3.5 rounded-xl transition">Go to My Dashboard</a>
        `;
      }
    } else {
      renderNav({ profile: null, active: "home" });
    }
  });

  await loadFeaturedProviders();
  setupModalEvents();
});

// GSAP Page Load & Hero Scroll Animations
function initAnimations() {
  if (window.gsap) {
    gsap.from(".hero-animate > *", {
      duration: 0.8,
      y: 30,
      opacity: 0,
      stagger: 0.15,
      ease: "power2.out"
    });

    if (window.ScrollTrigger) {
      gsap.from(".stats-grid > div", {
        scrollTrigger: {
          trigger: ".stats-grid",
          start: "top 85%",
        },
        duration: 0.8,
        y: 30,
        opacity: 0,
        stagger: 0.1,
        ease: "power2.out"
      });
    }
  }
}

// Fetch and Render 6 Providers with GSAP ScrollTrigger & Hover Animations
async function loadFeaturedProviders() {
  const grid = document.getElementById("featured-providers-grid");
  if (!grid) return;

  try {
    const allProviders = await listProviders();
    providerDataList = Array.isArray(allProviders) ? allProviders : [];

    if (providerDataList.length === 0) {
      grid.innerHTML = `<div class="col-span-full text-center font-mono text-sm text-inksoft py-10 bg-paper border border-line rounded-2xl">No active service providers currently available.</div>`;
      return;
    }

    const topProviders = providerDataList.slice(0, 6);

    grid.innerHTML = topProviders.map((p) => {
      const pId = p.uid || p.id;
      const name = p.name || 'Anonymous Provider';
      const trade = p.trade || 'General Service';
      const rate = p.hourlyRate || '0';
      const bio = p.bio || 'Available for service requests.';
      const rating = p.rating ? Number(p.rating).toFixed(1) : 'New';
      const reviewCount = p.reviewCount || 0;

      const avatar = p.profileImageUrl 
        ? `<img src="${p.profileImageUrl}" class="w-12 h-12 rounded-full object-cover border border-line flex-shrink-0" alt="${escapeHtml(name)}">`
        : `<div class="w-12 h-12 rounded-full bg-denim/20 text-ink font-bold font-mono text-sm flex items-center justify-center border border-line flex-shrink-0">
            ${escapeHtml(name.slice(0, 2).toUpperCase())}
           </div>`;

      return `
        <div data-provider-id="${escapeHtml(pId)}" class="provider-card opacity-0 bg-paper border border-line rounded-2xl p-6 flex flex-col justify-between shadow-sm cursor-pointer transition-colors duration-300">
          <div>
            <div class="flex items-start justify-between gap-3 mb-4">
              <div class="flex items-center gap-3 overflow-hidden">
                ${avatar}
                <div class="truncate">
                  <h3 class="font-bold text-base text-ink truncate">${escapeHtml(name)}</h3>
                  <span class="font-mono text-xs text-rust uppercase tracking-wide block truncate">${escapeHtml(trade)}</span>
                </div>
              </div>
              <span class="font-mono text-xs text-ok font-semibold bg-ok/10 border border-ok/30 px-2 py-1 rounded-md whitespace-nowrap">
                $${escapeHtml(rate)}/hr
              </span>
            </div>

            <p class="text-inksoft text-sm line-clamp-2 mb-4 break-words overflow-hidden">
              ${escapeHtml(bio)}
            </p>
          </div>

          <div class="pt-4 border-t border-line flex justify-between items-center mt-auto">
            <span class="font-mono text-xs text-amber flex items-center gap-1">
              ★ ${rating} <span class="text-inksoft">(${reviewCount})</span>
            </span>
            <button type="button" class="card-btn font-mono text-xs uppercase tracking-wide text-rust font-semibold hover:underline">
              View Profile &rarr;
            </button>
          </div>
        </div>
      `;
    }).join("");

    // GSAP ScrollTrigger Animation (Triggers when user scrolls to provider section)
    if (window.gsap && window.ScrollTrigger) {
      gsap.fromTo(".provider-card", 
        { y: 50, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.7, 
          stagger: 0.12, 
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#featured-providers-grid",
            start: "top 85%", // Triggers animation when section enters viewport
            toggleActions: "play none none none"
          }
        }
      );
    } else if (window.gsap) {
      gsap.to(".provider-card", { opacity: 1, y: 0, stagger: 0.1 });
    }

    // Interactive GSAP Card Hover Animations & Modal Click Listeners
    document.querySelectorAll(".provider-card").forEach(card => {
      // Hover In: Lift card up, slight scale, border change & button slide
      card.addEventListener("mouseenter", () => {
        gsap.to(card, { 
          y: -8, 
          scale: 1.02, 
          borderColor: "#E2703F", 
          boxShadow: "0px 10px 25px rgba(226, 112, 63, 0.15)",
          duration: 0.3, 
          ease: "power2.out" 
        });

        const btn = card.querySelector(".card-btn");
        if (btn) {
          gsap.to(btn, { x: 5, duration: 0.2, ease: "power1.out" });
        }
      });

      // Hover Out: Reset card to initial position
      card.addEventListener("mouseleave", () => {
        gsap.to(card, { 
          y: 0, 
          scale: 1, 
          borderColor: "#2C3833", 
          boxShadow: "0px 0px 0px rgba(0,0,0,0)",
          duration: 0.3, 
          ease: "power2.out" 
        });

        const btn = card.querySelector(".card-btn");
        if (btn) {
          gsap.to(btn, { x: 0, duration: 0.2, ease: "power1.out" });
        }
      });

      // Click event for profile modal
      card.addEventListener("click", () => {
        const id = card.dataset.providerId;
        openProviderProfileModal(id);
      });
    });

  } catch (err) {
    console.error("Error loading providers UI:", err);
    grid.innerHTML = `<div class="col-span-full font-mono text-sm text-rust py-8 text-center">Unable to load providers right now.</div>`;
  }
}

// Open Provider Profile Modal with GSAP Animation
function openProviderProfileModal(providerId) {
  const provider = providerDataList.find(p => (p.uid || p.id) === providerId);
  if (!provider) return;

  const modal = document.getElementById("provider-modal");
  const modalContent = document.getElementById("modal-content");
  const modalBody = document.getElementById("modal-body");

  const avatar = provider.profileImageUrl 
    ? `<img src="${provider.profileImageUrl}" class="w-16 h-16 rounded-full object-cover border-2 border-rust">`
    : `<div class="w-16 h-16 rounded-full bg-denim text-white text-xl font-bold font-display flex items-center justify-center border-2 border-line">
        ${(provider.name || 'P').slice(0, 2).toUpperCase()}
       </div>`;

  modalBody.innerHTML = `
    <div class="flex items-center gap-4 mb-5">
      ${avatar}
      <div>
        <h2 class="font-display font-extrabold text-2xl text-ink uppercase">${escapeHtml(provider.name)}</h2>
        <span class="font-mono text-xs text-rust uppercase tracking-wide font-semibold">${escapeHtml(provider.trade || 'General Provider')}</span>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3 mb-5 p-3 bg-canvas border border-line rounded-xl text-center">
      <div>
        <span class="block font-mono text-[10px] uppercase text-inksoft">Hourly Rate</span>
        <span class="font-display font-bold text-xl text-ok">$${provider.hourlyRate || 0}/hr</span>
      </div>
      <div>
        <span class="block font-mono text-[10px] uppercase text-inksoft">Rating</span>
        <span class="font-display font-bold text-xl text-amber">★ ${provider.rating ? Number(provider.rating).toFixed(1) : 'New'}</span>
      </div>
    </div>

    <div class="mb-6">
      <h4 class="font-mono text-xs uppercase tracking-wide text-inksoft mb-1">About Provider</h4>
      <p class="text-ink text-sm leading-relaxed">${escapeHtml(provider.bio || 'No detailed bio provided yet.')}</p>
    </div>

    <div class="flex gap-3">
      <a href="customer-dashboard.html" class="w-full bg-rustdark hover:bg-rust text-white text-center font-mono text-xs uppercase tracking-wide py-3 rounded-lg transition">
        Book This Provider
      </a>
    </div>
  `;

  modal.classList.remove("hidden");
  if (window.gsap) {
    gsap.to(modal, { duration: 0.25, opacity: 1, ease: "power2.out" });
    gsap.fromTo(modalContent, 
      { scale: 0.85, y: 30 },
      { duration: 0.35, scale: 1, y: 0, ease: "back.out(1.4)" }
    );
  } else {
    modal.classList.remove("opacity-0");
  }
}

// Close Modal Helper
function setupModalEvents() {
  const modal = document.getElementById("provider-modal");
  const modalContent = document.getElementById("modal-content");
  const closeBtn = document.getElementById("close-modal-btn");

  const closeModal = () => {
    if (window.gsap) {
      gsap.to(modalContent, { duration: 0.2, scale: 0.9, y: 20, ease: "power2.in" });
      gsap.to(modal, {
        duration: 0.2,
        opacity: 0,
        onComplete: () => modal.classList.add("hidden")
      });
    } else {
      modal.classList.add("hidden");
    }
  };

  closeBtn?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str || "";
  return d.innerHTML;
}