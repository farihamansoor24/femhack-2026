// ===========================================================
// customer-dashboard.js
// ===========================================================

import { requireAuth } from "./auth.js";
import { getBookingsForCustomer, submitReview } from "./db.js";
import { renderNav } from "./nav.js";
import { toast } from "./ui.js";
import { fadeIn, revealCards, openModal, closeModal, shake } from "./anim.js";

let currentUser, bookings = [];
let selectedRating = 0;
let activeBookingId = null;

const BADGE = {
  pending: "text-amber border-amber",
  accepted: "text-denim border-denim",
  rejected: "text-rust border-rust",
  in_progress: "text-denimlight border-denimlight",
  completed: "text-ok border-ok"
};
const LABEL = { pending: "Pending", accepted: "Accepted", rejected: "Rejected", in_progress: "In progress", completed: "Completed" };

requireAuth("customer", async ({ user, profile }) => {
  currentUser = user;
  renderNav({ profile, active: "bookings" });
  fadeIn("#dash-head");
  await load();
});

async function load() {
  const list = document.getElementById("booking-list");
  try {
    bookings = await getBookingsForCustomer(currentUser.uid);
    document.getElementById("ticket-count").textContent = `${bookings.length} ticket${bookings.length === 1 ? "" : "s"} on file`;
    renderList("all");
  } catch (err) {
    list.innerHTML = `<div class="font-mono text-sm text-inksoft py-10">Couldn't load bookings: ${err.message}</div>`;
  }
}

function renderList(filter) {
  const list = document.getElementById("booking-list");
  const items = filter === "all" ? bookings : bookings.filter(b => b.status === filter);

  if (!items.length) {
    list.innerHTML = `<div class="text-center font-mono text-sm text-inksoft py-16 bg-paper border border-line rounded-2xl">No bookings here yet.</div>`;
    return;
  }

  list.innerHTML = items.map(b => `
    <div class="booking-card bg-paper border border-line rounded-2xl shadow-sm p-6 flex flex-col gap-3">
      <div class="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <div class="font-mono text-[11px] text-inksoft tracking-wide">${b.ticketNumber || b.id}</div>
          <div class="text-lg font-semibold mt-1">${escapeHtml(b.service)}</div>
          <div class="font-mono text-xs text-inksoft mt-1">with ${escapeHtml(b.providerName)} — ${escapeHtml(b.providerTrade || "")}</div>
        </div>
        <span class="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full border bg-paper ${BADGE[b.status]}">
          <span class="w-1.5 h-1.5 rounded-full bg-current"></span>${LABEL[b.status] || b.status}
        </span>
      </div>
      ${b.description ? `<div class="text-sm text-inksoft">${escapeHtml(b.description)}</div>` : ""}
      <div class="font-mono text-xs text-inksoft">${b.preferredDate} · ${b.preferredTime}</div>
      <div class="pt-2">${reviewAction(b)}</div>
    </div>
  `).join("");

  revealCards("#booking-list .booking-card");

  document.querySelectorAll("[data-review-id]").forEach(btn => {
    btn.addEventListener("click", () => openReviewModal(btn.dataset.reviewId));
  });
}

function reviewAction(b) {
  if (b.status !== "completed") return "";
  if (b.reviewed) return `<span class="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide px-3 py-1.5 rounded-full border border-ok text-ok">Reviewed ✓</span>`;
  return `<button class="bg-neutral-800 hover:bg-rust text-white font-mono text-xs uppercase tracking-wide px-4 py-2.5 rounded-lg transition" data-review-id="${b.id}">Leave a review</button>`;
}

document.querySelectorAll(".dash-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".dash-tab").forEach(t => t.classList.remove("bg-rustdark", "text-white"));
    document.querySelectorAll(".dash-tab").forEach(t => t.classList.add("text-inksoft"));
    tab.classList.remove("text-inksoft");
    tab.classList.add("bg-rustdark", "text-white");
    renderList(tab.dataset.show);
  });
});

/* ---------------- Review modal ---------------- */
const modal = document.getElementById("review-modal");
const box = document.getElementById("review-box");

function openReviewModal(bookingId) {
  const booking = bookings.find(b => b.id === bookingId);
  if (!booking) return;
  activeBookingId = bookingId;
  selectedRating = 0;
  document.getElementById("review-context").textContent = `${booking.service} with ${booking.providerName}`;
  document.getElementById("review-comment").value = "";
  document.getElementById("review-error").classList.add("hidden");
  paintStars(0);
  openModal(modal, box);
}
function close() { closeModal(modal, box, () => { activeBookingId = null; }); }

document.getElementById("review-cancel").addEventListener("click", close);
modal.addEventListener("click", (e) => { if (e.target === modal) close(); });

document.querySelectorAll(".star-btn").forEach(star => {
  star.addEventListener("click", () => { selectedRating = Number(star.dataset.value); paintStars(selectedRating); });
});
function paintStars(value) {
  document.querySelectorAll(".star-btn").forEach(s => {
    const v = Number(s.dataset.value);
    s.classList.toggle("text-rust", v <= value);
    s.classList.toggle("text-white/15", v > value);
  });
}

document.getElementById("review-submit").addEventListener("click", async () => {
  const comment = document.getElementById("review-comment").value.trim();
  const errEl = document.getElementById("review-error");
  const btn = document.getElementById("review-submit");

  btn.disabled = true; btn.textContent = "Submitting…";
  try {
    await submitReview({
      bookingId: activeBookingId,
      customerId: currentUser.uid,
      providerId: bookings.find(b => b.id === activeBookingId).providerId,
      rating: selectedRating,
      comment
    });
    close();
    toast("Review submitted — thank you!");
    await load();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove("hidden");
    shake(box);
  } finally {
    btn.disabled = false; btn.textContent = "Submit review";
  }
});

function escapeHtml(str) { const d = document.createElement("div"); d.textContent = str || ""; return d.innerHTML; }
