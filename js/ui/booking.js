import { getProviderById, createBooking } from "../db.js";
import { getState } from "../state.js";
import { escapeHtml, validateRequired, markFieldError, showToast, todayISO } from "../utils.js";
import { fadeIn } from "../animations.js";

export async function renderBooking(params, mount) {
  mount.innerHTML = `<div class="max-w-2xl mx-auto px-5 py-16"><div class="skel h-96 rounded-sm"></div></div>`;

  const provider = await getProviderById(params.providerId);
  if (!provider) {
    mount.innerHTML = `<div class="max-w-2xl mx-auto px-5 py-24 text-center">
      <p class="font-display text-2xl mb-2">Provider not found.</p>
      <a href="#/home" data-link class="text-brass font-medium">&larr; Back to browsing</a>
    </div>`;
    return;
  }

  const { user, profile } = getState();

  mount.innerHTML = `
    <section class="max-w-2xl mx-auto px-5 sm:px-8 py-12">
      <a href="#/provider/${provider.id}" data-link class="text-sm text-slate2 hover:text-ink">&larr; Back to profile</a>

      <div class="mt-5 ticket pl-9 pr-6 sm:pr-8 py-8">
        <div class="ticket-notch"></div>
        <p class="eyebrow mb-2">New booking request</p>
        <h1 class="font-display text-2xl">${escapeHtml(provider.business || provider.name)}</h1>
        <p class="text-sm text-slate2 mt-1">${escapeHtml(provider.service)} &middot; ${escapeHtml(provider.location || "")}</p>

        <form id="booking-form" novalidate class="mt-7 space-y-5">
          <div>
            <label class="text-sm font-medium block mb-1.5" for="service">Service</label>
            <input id="service" name="service" type="text" value="${escapeHtml(provider.service)}" readonly
              class="w-full px-4 py-3 border border-ink/10 rounded-sm text-sm bg-paper2/60 text-slate2" />
          </div>

          <div class="grid sm:grid-cols-2 gap-5">
            <div>
              <label class="text-sm font-medium block mb-1.5" for="date">Date</label>
              <input id="date" name="date" type="date" min="${todayISO()}" required
                class="w-full px-4 py-3 border border-ink/10 rounded-sm text-sm focus:border-brass outline-none" />
              <p class="text-xs text-rust mt-1 hidden" data-error-for="date">Please choose a date.</p>
            </div>
            <div>
              <label class="text-sm font-medium block mb-1.5" for="time">Time</label>
              <input id="time" name="time" type="time" required
                class="w-full px-4 py-3 border border-ink/10 rounded-sm text-sm focus:border-brass outline-none" />
              <p class="text-xs text-rust mt-1 hidden" data-error-for="time">Please choose a time.</p>
            </div>
          </div>

          <div>
            <label class="text-sm font-medium block mb-1.5" for="location">Location</label>
            <input id="location" name="location" type="text" required placeholder="House / street, area, city"
              class="w-full px-4 py-3 border border-ink/10 rounded-sm text-sm focus:border-brass outline-none" />
            <p class="text-xs text-rust mt-1 hidden" data-error-for="location">Please add a location.</p>
          </div>

          <div>
            <label class="text-sm font-medium block mb-1.5" for="description">What do you need done?</label>
            <textarea id="description" name="description" rows="4" required placeholder="Describe the job&hellip;"
              class="w-full px-4 py-3 border border-ink/10 rounded-sm text-sm focus:border-brass outline-none resize-none"></textarea>
            <p class="text-xs text-rust mt-1 hidden" data-error-for="description">Please describe the job.</p>
          </div>

          <button type="submit" id="submit-btn" class="w-full bg-brass text-ink font-semibold py-3.5 rounded-sm hover:bg-brasslight transition-colors">
            Submit booking request
          </button>
        </form>
      </div>
    </section>
  `;

  const form = document.getElementById("booking-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!user) {
      showToast("Please log in to book a provider.", "error");
      window.location.hash = "#/login";
      return;
    }
    if (profile && profile.role !== "customer") {
      showToast("Only customer accounts can submit bookings.", "error");
      return;
    }

    const fields = ["date", "time", "location", "description"];
    const { valid, errors, values } = validateRequired(form, fields);
    fields.forEach((f) => {
      markFieldError(form, f, errors.includes(f));
      const errEl = form.querySelector(`[data-error-for="${f}"]`);
      if (errEl) errEl.classList.toggle("hidden", !errors.includes(f));
    });
    if (!valid) {
      showToast("Please fill in every field before submitting.", "error");
      return;
    }

    const submitBtn = document.getElementById("submit-btn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting\u2026";

    try {
      const { bookingId } = await createBooking({
        customerId: user.uid,
        customerName: profile?.name || user.displayName || "Customer",
        providerId: provider.id,
        providerName: provider.business || provider.name,
        service: provider.service,
        date: values.date,
        time: values.time,
        location: values.location,
        description: values.description,
      });
      showToast(`Booking submitted \u2014 ticket ${bookingId}`, "success");
      window.location.hash = "#/dashboard/customer";
    } catch (err) {
      console.error(err);
      showToast("Could not submit the booking. Please try again.", "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit booking request";
    }
  });

  fadeIn(".ticket");
}
