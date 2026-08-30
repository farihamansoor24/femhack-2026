import { listenProviderBookings, updateBookingStatus } from "../db.js";
import { getState } from "../state.js";
import { STATUS_META, escapeHtml, formatDate, formatDateTime, showToast } from "../utils.js";
import { staggerCards, stampBounce } from "../animations.js";

let unsubscribe = null;

export async function renderProviderDashboard(params, mount) {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  const { user } = getState();

  mount.innerHTML = `
    <section class="max-w-4xl mx-auto px-5 sm:px-8 py-12">
      <div class="flex items-center justify-between mb-8">
        <div>
          <p class="eyebrow mb-2">Job requests</p>
          <h1 class="font-display text-3xl">Your bookings</h1>
        </div>
        <a href="#/provider/profile" data-link class="text-sm font-medium border border-ink/20 px-4 py-2 rounded-sm hover:bg-ink hover:text-paper transition-colors">Edit profile</a>
      </div>
      <div id="filter-row" class="flex gap-2 mb-6 flex-wrap"></div>
      <div id="booking-list" class="space-y-4">
        <div class="skel h-28 rounded-sm"></div>
        <div class="skel h-28 rounded-sm"></div>
      </div>
    </section>
  `;

  let activeFilter = "all";
  let allBookings = [];

  const filters = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "accepted", label: "Accepted" },
    { key: "in_progress", label: "In progress" },
    { key: "completed", label: "Completed" },
    { key: "rejected", label: "Rejected" },
  ];
  const filterRow = document.getElementById("filter-row");
  filterRow.innerHTML = filters
    .map((f) => `<button data-filter="${f.key}" class="chip ${f.key === "all" ? "active" : ""}">${f.label}</button>`)
    .join("");
  filterRow.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeFilter = btn.dataset.filter;
      filterRow.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      renderList(allBookings, activeFilter);
    });
  });

  unsubscribe = listenProviderBookings(user.uid, (bookings) => {
    allBookings = bookings;
    renderList(allBookings, activeFilter);
  });
}

function renderList(bookings, filter) {
  const list = document.getElementById("booking-list");
  if (!list) return;

  const shown = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  if (!shown.length) {
    list.innerHTML = `
      <div class="text-center py-16 border border-dashed border-ink/15 rounded-sm">
        <p class="font-display text-xl mb-1">No bookings here.</p>
        <p class="text-sm text-slate2">New requests will show up automatically.</p>
      </div>`;
    return;
  }

  list.innerHTML = shown.map((b) => bookingTicket(b)).join("");
  staggerCards("#booking-list .stagger-card");

  list.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const { action, docId, from } = btn.dataset;
      btn.disabled = true;
      const prevLabel = btn.textContent;
      btn.textContent = "Updating\u2026";
      try {
        await updateBookingStatus(docId, from, action);
        showToast(`Booking marked ${STATUS_META[action]?.label.toLowerCase() || action}.`, "success");
        const stampEl = document.querySelector(`[data-stamp-for="${docId}"]`);
        if (stampEl) stampBounce(stampEl);
      } catch (err) {
        showToast(err.message || "Could not update the booking.", "error");
        btn.disabled = false;
        btn.textContent = prevLabel;
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
          <p class="font-display text-lg mt-1">${escapeHtml(b.customerName)}</p>
          <p class="text-sm text-slate2">${escapeHtml(b.service)} &middot; ${formatDate(b.date)} at ${escapeHtml(b.time)}</p>
        </div>
        <span class="stamp ${meta.stampClass}" data-stamp-for="${b.id}">${meta.label}</span>
      </div>

      <div class="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-ink/80">
        <p><span class="text-slate2">Location:</span> ${escapeHtml(b.location)}</p>
        <p><span class="text-slate2">Requested:</span> ${formatDateTime(b.createdAt)}</p>
      </div>
      <p class="text-sm text-ink/80 mt-2">${escapeHtml(b.description)}</p>

      <div class="mt-4 pt-4 border-t border-ink/10 flex flex-wrap gap-2.5">
        ${actionButtons(b)}
      </div>
    </article>
  `;
}

function actionButtons(b) {
  const docId = b.id;
  if (b.status === "pending") {
    return `
      <button data-action="accepted" data-doc-id="${docId}" data-from="pending"
        class="text-sm font-semibold bg-forest text-paper px-4 py-2 rounded-sm hover:opacity-90 transition-opacity">
        Accept
      </button>
      <button data-action="rejected" data-doc-id="${docId}" data-from="pending"
        class="text-sm font-semibold bg-rust text-paper px-4 py-2 rounded-sm hover:opacity-90 transition-opacity">
        Reject
      </button>`;
  }
  if (b.status === "accepted") {
    return `<button data-action="in_progress" data-doc-id="${docId}" data-from="accepted"
      class="text-sm font-semibold bg-brass text-ink px-4 py-2 rounded-sm hover:bg-brasslight transition-colors">
      Start progress
    </button>`;
  }
  if (b.status === "in_progress") {
    return `<button data-action="completed" data-doc-id="${docId}" data-from="in_progress"
      class="text-sm font-semibold bg-ink text-paper px-4 py-2 rounded-sm hover:bg-ink2 transition-colors">
      Mark completed
    </button>`;
  }
  if (b.status === "completed") {
    return `<span class="text-sm text-forest font-medium">Job complete${b.review ? " &middot; reviewed" : " &middot; awaiting customer review"}</span>`;
  }
  if (b.status === "rejected") {
    return `<span class="text-sm text-slate2">Request declined</span>`;
  }
  return "";
}
