// ===========================================================
// provider-dashboard.js
// ===========================================================

import { requireAuth } from "./auth.js";
import { getBookingsForProvider, updateBookingStatus } from "./db.js";
import { renderNav } from "./nav.js";
import { toast } from "./ui.js";
import { fadeIn, revealCards, pulse } from "./anim.js";

let currentUser, bookings = [];

const BADGE = {
  pending: "text-amber border-amber",
  accepted: "text-denim border-denim",
  rejected: "text-rust border-rust",
  in_progress: "text-denimlight border-denimlight",
  completed: "text-ok border-ok"
};
const LABEL = { pending: "Pending", accepted: "Accepted", rejected: "Rejected", in_progress: "In progress", completed: "Completed" };

requireAuth("provider", async ({ user, profile }) => {
  currentUser = user;
  renderNav({ profile, active: "dashboard" });
  fadeIn("#dash-head");
  await load();
});

async function load() {
  const list = document.getElementById("booking-list");
  try {
    bookings = await getBookingsForProvider(currentUser.uid);
    document.getElementById("ticket-count").textContent = `${bookings.length} request${bookings.length === 1 ? "" : "s"} on file`;
    const activeTab = document.querySelector(".dash-tab.bg-rustdark")?.dataset.show || "all";
    renderList(activeTab);
  } catch (err) {
    list.innerHTML = `<div class="font-mono text-sm text-inksoft py-10">Couldn't load requests: ${err.message}</div>`;
  }
}

function renderList(filter) {
  const list = document.getElementById("booking-list");
  const items = filter === "all" ? bookings : bookings.filter(b => b.status === filter);

  if (!items.length) {
    list.innerHTML = `<div class="text-center font-mono text-sm text-inksoft py-16 bg-paper border border-line rounded-2xl">No requests in this category yet.</div>`;
    return;
  }

  list.innerHTML = items.map(b => `
    <div class="booking-card bg-paper border border-line rounded-2xl shadow-sm p-6 flex flex-col gap-3">
      <div class="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <div class="font-mono text-[11px] text-inksoft tracking-wide">${b.ticketNumber || b.id}</div>
          <div class="text-lg font-semibold mt-1">${escapeHtml(b.service)}</div>
          <div class="font-mono text-xs text-inksoft mt-1">for ${escapeHtml(b.customerName)}</div>
        </div>
        <span class="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full border bg-paper ${BADGE[b.status]}">
          <span class="w-1.5 h-1.5 rounded-full bg-current"></span>${LABEL[b.status] || b.status}
        </span>
      </div>
      ${b.description ? `<div class="text-sm text-inksoft">${escapeHtml(b.description)}</div>` : ""}
      <div class="font-mono text-xs text-inksoft">${b.preferredDate} · ${b.preferredTime}</div>
      <div class="flex gap-2.5 flex-wrap pt-2">${actionsFor(b)}</div>
    </div>
  `).join("");

  revealCards("#booking-list .booking-card");

  document.querySelectorAll("[data-action]").forEach(btn => {
    btn.addEventListener("click", () => handleAction(btn.dataset.bookingId, btn.dataset.action, btn.closest(".booking-card")));
  });
}

function actionsFor(b) {
  switch (b.status) {
    case "pending":
      return `
        <button class="bg-rustdark hover:bg-rust text-white font-mono text-xs uppercase tracking-wide px-4 py-2.5 rounded-lg transition" data-booking-id="${b.id}" data-action="accepted">Accept</button>
        <button class="border border-line hover:border-ink text-inksoft hover:text-ink font-mono text-xs uppercase tracking-wide px-4 py-2.5 rounded-lg transition" data-booking-id="${b.id}" data-action="rejected">Reject</button>`;
    case "accepted":
      return `<button class="bg-neutral-800 hover:bg-denim text-white font-mono text-xs uppercase tracking-wide px-4 py-2.5 rounded-lg transition" data-booking-id="${b.id}" data-action="in_progress">Start job (In progress)</button>`;
    case "in_progress":
      return `<button class="bg-neutral-800 hover:bg-ok text-white font-mono text-xs uppercase tracking-wide px-4 py-2.5 rounded-lg transition" data-booking-id="${b.id}" data-action="completed">Mark completed</button>`;
    case "rejected":
      return `<span class="font-mono text-xs text-inksoft">This request was rejected — no further action.</span>`;
    case "completed":
      return `<span class="font-mono text-xs text-inksoft">Closed out — waiting on customer review.</span>`;
    default: return "";
  }
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

async function handleAction(bookingId, newStatus, cardEl) {
  try {
    await updateBookingStatus(bookingId, newStatus);
    if (cardEl) pulse(cardEl, 1.015);
    toast(actionToast(newStatus));
    await load();
  } catch (err) {
    toast(err.message, "error");
  }
}

function actionToast(status) {
  return { accepted: "Request accepted", rejected: "Request rejected", in_progress: "Job marked in progress", completed: "Job marked completed" }[status] || "Updated";
}

function escapeHtml(str) { const d = document.createElement("div"); d.textContent = str || ""; return d.innerHTML; }
