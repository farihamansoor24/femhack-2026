import { getProviderById } from "../db.js";
import { db } from "../firebase-config.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { renderStars, escapeHtml, formatDateTime } from "../utils.js";
import { getState } from "../state.js";
import { fadeIn } from "../animations.js";

export async function renderProviderDetail(params, mount) {
  mount.innerHTML = `<div class="max-w-4xl mx-auto px-5 sm:px-8 py-16"><div class="skel h-64 rounded-sm"></div></div>`;

  const provider = await getProviderById(params.id);
  if (!provider) {
    mount.innerHTML = `<div class="max-w-2xl mx-auto px-5 py-24 text-center">
      <p class="font-display text-2xl mb-2">Provider not found.</p>
      <a href="#/home" data-link class="text-brass font-medium">&larr; Back to browsing</a>
    </div>`;
    return;
  }

  const { user, profile } = getState();
  const isSelf = user && profile && profile.role === "provider" && user.uid === provider.id;

  mount.innerHTML = `
    <section class="max-w-4xl mx-auto px-5 sm:px-8 py-12">
      <a href="#/home" data-link class="text-sm text-slate2 hover:text-ink">&larr; Back to browsing</a>

      <div class="mt-5 ticket pl-9 pr-6 sm:pr-8 py-8">
        <div class="ticket-notch"></div>
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <span class="chip !py-1">${escapeHtml(provider.service || "Service")}</span>
            <h1 class="font-display text-3xl mt-3">${escapeHtml(provider.business || provider.name)}</h1>
            <p class="text-slate2 mt-1">${escapeHtml(provider.name)} &middot; ${escapeHtml(provider.location || "Location not set")}</p>
            <div class="flex items-center gap-2 mt-3">
              ${renderStars(provider.rating || 0)}
              <span class="text-sm text-slate2">${(provider.rating || 0).toFixed(1)} (${provider.reviewCount || 0} reviews)</span>
            </div>
          </div>
          <div class="text-left sm:text-right">
            <p class="text-2xl font-display">Rs ${Number(provider.price || 0).toLocaleString()}</p>
            <p class="text-xs text-slate2">per ${escapeHtml(provider.priceUnit || "visit")}</p>
            <p class="text-xs font-medium mt-2 ${provider.available ? "text-forest" : "text-slate2"}">${provider.available ? "● Available now" : "○ Currently booked up"}</p>
          </div>
        </div>

        <p class="text-sm text-ink/80 mt-6 max-w-2xl leading-relaxed">${escapeHtml(provider.bio || "This provider hasn't added a bio yet.")}</p>

        <dl class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-7 pt-6 border-t border-ink/10">
          <div>
            <dt class="eyebrow">Experience</dt>
            <dd class="font-display text-lg mt-1">${Number(provider.experience || 0)} yrs</dd>
          </div>
          <div>
            <dt class="eyebrow">Service</dt>
            <dd class="font-display text-lg mt-1">${escapeHtml(provider.service || "—")}</dd>
          </div>
          <div>
            <dt class="eyebrow">Location</dt>
            <dd class="font-display text-lg mt-1">${escapeHtml((provider.location || "—").split(",")[0])}</dd>
          </div>
          <div>
            <dt class="eyebrow">Rating</dt>
            <dd class="font-display text-lg mt-1">${(provider.rating || 0).toFixed(1)} / 5</dd>
          </div>
        </dl>

        <div class="mt-8">
          ${
            isSelf
              ? `<a href="#/provider/profile" data-link class="inline-block bg-ink text-paper text-sm font-semibold px-6 py-3 rounded-sm hover:bg-ink2 transition-colors">Edit your profile</a>`
              : `<button id="btn-book" class="bg-brass text-ink text-sm font-semibold px-6 py-3 rounded-sm hover:bg-brasslight transition-colors">Book this provider</button>`
          }
        </div>
      </div>

      <div class="mt-10">
        <h2 class="font-display text-xl mb-4">Reviews</h2>
        <div id="reviews-list" class="space-y-3">
          <div class="skel h-16 rounded-sm"></div>
        </div>
      </div>
    </section>
  `;

  const bookBtn = document.getElementById("btn-book");
  if (bookBtn) {
    bookBtn.addEventListener("click", () => {
      if (!user) {
        window.location.hash = "#/login";
        return;
      }
      if (profile && profile.role !== "customer") {
        import("../utils.js").then(({ showToast }) => showToast("Log in as a customer to book a provider.", "error"));
        return;
      }
      window.location.hash = `#/booking/${provider.id}`;
    });
  }

  loadReviews(provider.id);
  fadeIn(".ticket");
}

async function loadReviews(providerId) {
  const list = document.getElementById("reviews-list");
  if (!list) return;
  const q = query(collection(db, "bookings"), where("providerId", "==", providerId));
  const snap = await getDocs(q);
  const reviews = snap.docs
    .map((d) => d.data())
    .filter((b) => b.status === "completed" && b.review)
    .sort((a, b) => new Date(b.review.createdAt) - new Date(a.review.createdAt));

  if (!reviews.length) {
    list.innerHTML = `<p class="text-sm text-slate2">No reviews yet &mdash; be the first to book and rate this provider.</p>`;
    return;
  }

  list.innerHTML = reviews
    .map(
      (b) => `
      <div class="bg-white border border-ink/10 rounded-sm p-4">
        <div class="flex items-center justify-between">
          <span>${renderStars(b.review.rating, { size: "text-sm" })}</span>
          <span class="text-xs text-slate2">${escapeHtml(b.customerName || "Customer")}</span>
        </div>
        ${b.review.comment ? `<p class="text-sm text-ink/80 mt-2">${escapeHtml(b.review.comment)}</p>` : ""}
      </div>`
    )
    .join("");
}
