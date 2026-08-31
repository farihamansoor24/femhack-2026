 import { auth,onAuthStateChanged } from "./firebase-config.js";
//  import { getUserProfile } from "./auth.js";
import { listProviders } from "./db.js";
import { renderNav } from "./nav.js";
    // onAuthStateChanged(auth, async (user) => {
    //   if (!user) { window.location.href = "login.html"; return; }
    //   try {
    //     const profile = await getUserProfile(user.uid);
    //     window.location.href = profile.role === "provider" ? "provider-dashboard.html" : "browse.html";
    //   } catch {
    //     window.location.href = "login.html";
    //   }
    // });


document.addEventListener("DOMContentLoaded", async () => {
  // 1. Render navbar header
  renderNav({ active: "home" });

  // 2. Adjust hero CTA based on auth state
  onAuthStateChanged(auth, (user) => {
    const ctaContainer = document.getElementById("hero-cta-buttons");
    if (user && ctaContainer) {
      ctaContainer.innerHTML = `
        <a href="browse.html" class="bg-rustdark hover:bg-rust text-white font-mono text-sm uppercase tracking-wide px-8 py-3.5 rounded-xl transition shadow-lg">Browse & Book Services</a>
        <a href="customer-dashboard.html" class="border border-line hover:border-inksoft bg-canvas text-ink font-mono text-sm uppercase tracking-wide px-8 py-3.5 rounded-xl transition">Go to My Dashboard</a>
      `;
    }
  });

  // 3. Fetch and display top 3 featured providers
  loadFeaturedProviders();
});

async function loadFeaturedProviders() {
  const grid = document.getElementById("featured-providers-grid");
  if (!grid) return;

  try {
    const allProviders = await listProviders();
    
    if (!allProviders || allProviders.length === 0) {
      grid.innerHTML = `<div class="col-span-full text-center font-mono text-sm text-inksoft py-10 bg-paper border border-line rounded-2xl">No active service providers currently available.</div>`;
      return;
    }

    // Display top 3 providers
    const topProviders = allProviders.slice(0, 3);

    grid.innerHTML = topProviders.map(p => `
      <div class="bg-paper border border-line rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:border-rust/50 transition">
        <div>
          <div class="flex justify-between items-start gap-2 mb-3">
            <div>
              <h3 class="font-bold text-lg text-ink">${escapeHtml(p.name || 'Anonymous Provider')}</h3>
              <span class="font-mono text-xs text-rust uppercase tracking-wide">${escapeHtml(p.trade || 'General Provider')}</span>
            </div>
            <span class="font-mono text-xs text-ok font-semibold bg-ok/10 border border-ok/30 px-2.5 py-1 rounded-md">
              $${p.hourlyRate || '0'}/hr
            </span>
          </div>
          <p class="text-inksoft text-sm line-clamp-3 mb-4">${escapeHtml(p.bio || 'Available for service requests.')}</p>
        </div>

        <div class="pt-4 border-t border-line flex justify-between items-center">
          <span class="font-mono text-xs text-amber flex items-center gap-1">
            ★ ${p.rating ? p.rating.toFixed(1) : 'New'} <span class="text-inksoft">(${p.reviewCount || 0})</span>
          </span>
          <a href="browse.html" class="font-mono text-xs uppercase tracking-wide text-ink hover:text-rust transition">
            Book Now &rarr;
          </a>
        </div>
      </div>
    `).join("");

  } catch (err) {
    console.error("Error loading featured providers:", err);
    grid.innerHTML = `<div class="col-span-full font-mono text-sm text-rust py-8 text-center">Unable to load featured providers right now.</div>`;
  }
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str || "";
  return d.innerHTML;
}
