// ===========================================================
// provider.js
// ===========================================================

import { requireAuth } from "./auth.js";
import { getProvider, createBooking } from "./db.js";
import { renderNav } from "./nav.js";
import { toast } from "./ui.js";
import { fadeIn, shake, pulse } from "./anim.js";

const params = new URLSearchParams(window.location.search);
const providerId = params.get("id");

let currentUser, currentProfile, provider;

requireAuth("customer", async ({ user, profile }) => {
  currentUser = user;
  currentProfile = profile;
  renderNav({ profile, active: "browse" });

  if (!providerId) {
    document.getElementById("page-body").innerHTML = `<div class="max-w-6xl mx-auto px-6 py-10 font-mono text-sm text-inksoft">No provider selected. <a href="browse.html" class="text-denim underline">Back to search</a>.</div>`;
    return;
  }
  try {
    provider = await getProvider(providerId);
    render();
  } catch (err) {
    document.getElementById("page-body").innerHTML = `<div class="max-w-6xl mx-auto px-6 py-10 font-mono text-sm text-inksoft">${err.message}</div>`;
  }
});

function avatarBlock(p) {
  if (p.profileImageUrl) {
    return `<div class="w-20 h-20 rounded-full overflow-hidden ring-1 ring-line flex-none">
      <img src="${p.profileImageUrl}" class="w-full h-full object-cover" alt="${escapeHtml(p.name)}">
    </div>`;
  }
  return `<div class="w-20 h-20 rounded-full bg-denim text-white flex items-center justify-center font-display font-bold text-2xl flex-none">
    ${initials(p.name)}
  </div>`;
}

function render() {
  const body = document.getElementById("page-body");
  body.innerHTML = `
    <header class="border-b border-line bg-paper">
      <div class="max-w-6xl mx-auto px-6 py-10 flex items-center gap-5 flex-wrap" id="pro-head">
        ${avatarBlock(provider)}
        <div>
          <span class="font-mono text-[11px] uppercase tracking-wide text-rust">${escapeHtml(provider.trade || "General")}</span>
          <h1 class="font-display font-extrabold text-3xl sm:text-4xl mt-1">${escapeHtml(provider.name)}</h1>
          <div class="font-mono text-sm text-ok mt-2">★ ${(provider.rating || 0).toFixed(1)} (${provider.reviewCount || 0} reviews) · $${provider.hourlyRate || 0}/hr</div>
        </div>
      </div>
    </header>

    <div class="max-w-6xl mx-auto px-6 py-10 pb-24 grid lg:grid-cols-[1fr_360px] gap-10 items-start">
      <div id="about-block">
        <h3 class="text-lg font-semibold mb-3">About</h3>
        <p class="text-inksoft text-[15px] max-w-[60ch] leading-relaxed">${escapeHtml(provider.bio || "This provider hasn't added a bio yet.")}</p>
      </div>

      <aside class="bg-paper border border-line rounded-2xl shadow-sm p-6" id="booking-panel">
        <div id="form-error" class="hidden mb-4 rounded-xl border border-rust bg-rust/10 text-rust font-mono text-xs px-4 py-3"></div>
        <div id="form-success" class="hidden mb-4 rounded-xl border border-ok bg-ok/10 text-ok font-mono text-xs px-4 py-3"></div>

        <form id="booking-form" novalidate class="space-y-4">
          <h3 class="text-lg font-semibold">Request a booking</h3>

          <div>
            <label class="block font-mono text-[11px] uppercase tracking-wide text-inksoft mb-1.5" for="service">Service needed</label>
            <input type="text" id="service" placeholder="e.g. Fix leaking kitchen faucet"
              class="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm bg-canvas text-ink placeholder:text-inksoft/60 focus:outline-none focus:ring-2 focus:ring-denim focus:border-denim">
            <p class="hidden field-error mt-1.5 text-xs font-mono text-rust" id="service-error">Please describe the service you need.</p>
          </div>

          <div>
            <label class="block font-mono text-[11px] uppercase tracking-wide text-inksoft mb-1.5" for="description">Details (optional)</label>
            <textarea id="description" rows="3" placeholder="Any extra context for the provider…"
              class="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm bg-canvas text-ink placeholder:text-inksoft/60 focus:outline-none focus:ring-2 focus:ring-denim focus:border-denim resize-y"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-mono text-[11px] uppercase tracking-wide text-inksoft mb-1.5" for="date">Preferred date</label>
              <input type="date" id="date" class="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm bg-canvas text-ink placeholder:text-inksoft/60 focus:outline-none focus:ring-2 focus:ring-denim focus:border-denim">
              <p class="hidden field-error mt-1.5 text-xs font-mono text-rust" id="date-error">Pick a valid, upcoming date.</p>
            </div>
            <div>
              <label class="block font-mono text-[11px] uppercase tracking-wide text-inksoft mb-1.5" for="time">Preferred time</label>
              <input type="time" id="time" class="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm bg-canvas text-ink placeholder:text-inksoft/60 focus:outline-none focus:ring-2 focus:ring-denim focus:border-denim">
              <p class="hidden field-error mt-1.5 text-xs font-mono text-rust" id="time-error">Pick a time.</p>
            </div>
          </div>

          <button type="submit" class="w-full bg-rustdark hover:bg-rust text-white font-mono text-sm uppercase tracking-wide py-3 rounded-lg transition">Submit booking request</button>
        </form>
      </aside>
    </div>
  `;

  fadeIn("#pro-head");
  fadeIn("#about-block", { delay: .1 });
  fadeIn("#booking-panel", { delay: .15, x: 14, y: 0 });
  wireForm();
}

function wireForm() {
  const form = document.getElementById("booking-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const service = document.getElementById("service").value.trim();
    const description = document.getElementById("description").value.trim();
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;

    let valid = true;
    valid = setErr("service", !service) && valid;
    valid = setErr("date", !isFutureOrToday(date)) && valid;
    valid = setErr("time", !time) && valid;
    if (!valid) { shake(form); return; }

    const btn = form.querySelector("button");
    btn.disabled = true; btn.textContent = "Submitting…";

    try {
      const { ticketNumber } = await createBooking({
        customer: { uid: currentUser.uid, name: currentProfile.name },
        provider, service, description, preferredDate: date, preferredTime: time
      });
      showSuccess(`Booking request sent — ticket ${ticketNumber}. The provider will respond soon.`);
      pulse(document.getElementById("booking-panel"), 1.015);
      toast("Booking request submitted");
      form.reset();
      btn.textContent = "Request sent ✓";
      setTimeout(() => { window.location.href = "customer-dashboard.html"; }, 1200);
    } catch (err) {
      showError(err.message);
      shake(form);
      btn.disabled = false; btn.textContent = "Submit booking request";
    }
  });
}

function setErr(id, isBad) { document.getElementById(id + "-error").classList.toggle("hidden", !isBad); return !isBad; }
function isFutureOrToday(dateStr) {
  if (!dateStr) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return new Date(dateStr + "T00:00:00") >= today;
}
function showError(msg) { document.getElementById("form-success").classList.add("hidden"); const el = document.getElementById("form-error"); el.textContent = msg; el.classList.remove("hidden"); }
function showSuccess(msg) { document.getElementById("form-error").classList.add("hidden"); const el = document.getElementById("form-success"); el.textContent = msg; el.classList.remove("hidden"); }
function initials(name) { return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(); }
function escapeHtml(str) { const d = document.createElement("div"); d.textContent = str; return d.innerHTML; }
