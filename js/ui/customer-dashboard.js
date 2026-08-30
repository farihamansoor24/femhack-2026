import { listenCustomerBookings, submitReview } from "../db.js";
import { getState } from "../state.js";
import { STATUS_META, escapeHtml, formatDate, formatDateTime, showToast, renderStars } from "../utils.js";
import { staggerCards, stampBounce } from "../animations.js";

let unsubscribe = null;

export async function renderCustomerDashboard(params, mount) {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  const { user } = getState();

  mount.innerHTML = `
    <section class="max-w-4xl mx-auto px-5 sm:px-8 py-12">
      <p class="eyebrow mb-2">Your tickets</p>
      <h1 class="font-display text-3xl mb-8">My bookings</h1>
      <div id="booking-list" class="space-y-4">
        <div class="skel h-28 rounded-sm"></div>
        <div class="skel h-28 rounded-sm"></div>
      </div>
    </section>
  `;

  unsubscribe = listenCustomerBookings(user.uid, (bookings) => {
    renderList(bookings);
  });
}

function renderList(bookings) {
  const list = document.getElementById("booking-list");
  if (!list) return;

  if (!bookings.length) {
    list.innerHTML = `
      <div class="text-center py-16 border border-dashed border-ink/15 rounded-sm">
        <p class="font-display text-xl mb-1">No bookings yet.</p>
        <p class="text-sm text-slate2 mb-5">Browse providers and submit your first request.</p>
        <a href="#/home" data-link class="inline-block bg-ink text-paper text-sm font-semibold px-5 py-2.5 rounded-sm">Browse providers</a>
      </div>`;
    return;
  }

  list.innerHTML = bookings.map((b) => bookingTicket(b)).join("");
  staggerCards("#booking-list .stagger-card");

  bookings.forEach((b) => {
    const form = document.getElementById(`review-form-${b.id}`);
    if (!form) return;
    let selectedRating = 0;
    const stars = form.querySelectorAll("[data-star]");
    stars.forEach((star) => {
      star.addEventListener("click", () => {
        selectedRating = Number(star.dataset.star);
        stars.forEach((s) => s.classList.toggle("star-off", Number(s.dataset.star) > selectedRating));
      });
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!selectedRating) {
        showToast("Please choose a star rating.", "error");
        return;
      }
      const comment = form.elements.comment.value.trim();
      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      btn.textContent = "Submitting\u2026";
      try {
        await submitReview(b.id, b.providerId, { rating: selectedRating, comment });
        showToast("Thanks for the review!", "success");
      } catch (err) {
        showToast(err.message || "Could not submit review.", "error");
        btn.disabled = false;
        btn.textContent = "Submit review";
      }
    });
  });
}

function bookingTicket(b) {
  const meta = STATUS_META[b.status] || STATUS_META.pending;
  return `
    <article class="stagger-card ticket pl-9 pr-5 sm:pr-7 py-6">
      <div class="ticket-notch"></div>
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="ticket-id text-xs text-slate2">${escapeHtml(b.bookingId)}</p>
          <p class="font-display text-lg mt-1">${escapeHtml(b.providerName)}</p>
          <p class="text-sm text-slate2">${escapeHtml(b.service)} &middot; ${formatDate(b.date)} at ${escapeHtml(b.time)}</p>
        </div>
        <span class="stamp ${meta.stampClass}" data-stamp>${meta.label}</span>
      </div>

      <div class="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-ink/80">
        <p><span class="text-slate2">Location:</span> ${escapeHtml(b.location)}</p>
        <p><span class="text-slate2">Requested:</span> ${formatDateTime(b.createdAt)}</p>
      </div>
      <p class="text-sm text-ink/80 mt-2">${escapeHtml(b.description)}</p>

      ${reviewSection(b)}
    </article>
  `;
}

function reviewSection(b) {
  if (b.status !== "completed") return "";
  if (b.review) {
    return `
      <div class="mt-4 pt-4 border-t border-ink/10">
        <p class="text-xs eyebrow mb-1">Your review</p>
        <div class="flex items-center gap-2">
          ${renderStars(b.review.rating, { size: "text-sm" })}
        </div>
        ${b.review.comment ? `<p class="text-sm text-ink/80 mt-1">${escapeHtml(b.review.comment)}</p>` : ""}
      </div>`;
  }
  return `
    <form id="review-form-${b.id}" class="mt-4 pt-4 border-t border-ink/10 space-y-3">
      <p class="text-xs eyebrow">Rate this job</p>
      <div class="star-row text-2xl">
        ${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-star="${n}" class="star-off leading-none">★</button>`).join("")}
      </div>
      <textarea name="comment" rows="2" placeholder="Optional comment&hellip;"
        class="w-full px-3 py-2 border border-ink/10 rounded-sm text-sm focus:border-brass outline-none resize-none"></textarea>
      <button type="submit" class="text-sm font-semibold bg-ink text-paper px-4 py-2 rounded-sm hover:bg-ink2 transition-colors">Submit review</button>
    </form>
  `;
}
