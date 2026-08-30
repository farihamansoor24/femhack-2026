import { getProviderById, upsertProviderProfile } from "../db.js";
import { getState } from "../state.js";
import { CATEGORIES } from "../seed-data.js";
import { validateRequired, markFieldError, showToast, escapeHtml } from "../utils.js";
import { fadeIn } from "../animations.js";

export async function renderProviderProfile(params, mount) {
  const { user } = getState();
  mount.innerHTML = `<div class="max-w-2xl mx-auto px-5 py-16"><div class="skel h-96 rounded-sm"></div></div>`;

  const existing = (await getProviderById(user.uid)) || {};

  mount.innerHTML = `
    <section class="max-w-2xl mx-auto px-5 sm:px-8 py-12">
      <div class="ticket pl-9 pr-6 sm:pr-8 py-8">
        <div class="ticket-notch"></div>
        <p class="eyebrow mb-2">Your public listing</p>
        <h1 class="font-display text-2xl mb-6">Manage your profile</h1>

        <form id="profile-form" novalidate class="space-y-5">
          <div class="grid sm:grid-cols-2 gap-5">
            <div>
              <label class="text-sm font-medium block mb-1.5" for="business">Business name</label>
              <input id="business" name="business" type="text" required value="${escapeHtml(existing.business || "")}"
                class="w-full px-4 py-3 border border-ink/10 rounded-sm text-sm focus:border-brass outline-none" />
            </div>
            <div>
              <label class="text-sm font-medium block mb-1.5" for="service">Service category</label>
              <select id="service" name="service" required
                class="w-full px-4 py-3 border border-ink/10 rounded-sm text-sm focus:border-brass outline-none">
                <option value="" disabled ${!existing.service ? "selected" : ""}>Choose one&hellip;</option>
                ${CATEGORIES.map((c) => `<option value="${c}" ${existing.service === c ? "selected" : ""}>${c}</option>`).join("")}
              </select>
            </div>
          </div>

          <div>
            <label class="text-sm font-medium block mb-1.5" for="location">Location</label>
            <input id="location" name="location" type="text" required placeholder="Area, city" value="${escapeHtml(existing.location || "")}"
              class="w-full px-4 py-3 border border-ink/10 rounded-sm text-sm focus:border-brass outline-none" />
          </div>

          <div class="grid sm:grid-cols-3 gap-5">
            <div>
              <label class="text-sm font-medium block mb-1.5" for="experience">Experience (yrs)</label>
              <input id="experience" name="experience" type="number" min="0" required value="${existing.experience ?? ""}"
                class="w-full px-4 py-3 border border-ink/10 rounded-sm text-sm focus:border-brass outline-none" />
            </div>
            <div>
              <label class="text-sm font-medium block mb-1.5" for="price">Price (Rs)</label>
              <input id="price" name="price" type="number" min="0" required value="${existing.price ?? ""}"
                class="w-full px-4 py-3 border border-ink/10 rounded-sm text-sm focus:border-brass outline-none" />
            </div>
            <div>
              <label class="text-sm font-medium block mb-1.5" for="priceUnit">Per</label>
              <select id="priceUnit" name="priceUnit"
                class="w-full px-4 py-3 border border-ink/10 rounded-sm text-sm focus:border-brass outline-none">
                <option value="visit" ${existing.priceUnit === "visit" ? "selected" : ""}>Visit</option>
                <option value="job" ${existing.priceUnit === "job" ? "selected" : ""}>Job</option>
                <option value="hour" ${existing.priceUnit === "hour" ? "selected" : ""}>Hour</option>
                <option value="sqft" ${existing.priceUnit === "sqft" ? "selected" : ""}>Sq. ft</option>
              </select>
            </div>
          </div>

          <div>
            <label class="text-sm font-medium block mb-1.5" for="bio">About / bio</label>
            <textarea id="bio" name="bio" rows="4" placeholder="What you do, how you work, what makes you reliable&hellip;"
              class="w-full px-4 py-3 border border-ink/10 rounded-sm text-sm focus:border-brass outline-none resize-none">${escapeHtml(existing.bio || "")}</textarea>
          </div>

          <label class="flex items-center gap-2.5 text-sm font-medium">
            <input id="available" name="available" type="checkbox" ${existing.available !== false ? "checked" : ""}
              class="w-4 h-4 accent-brass" />
            Currently available for new bookings
          </label>

          <button type="submit" id="submit-btn" class="w-full bg-brass text-ink font-semibold py-3.5 rounded-sm hover:bg-brasslight transition-colors">
            Save profile
          </button>
        </form>
      </div>
    </section>
  `;

  const form = document.getElementById("profile-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fields = ["business", "service", "location", "experience", "price"];
    const { valid, errors, values } = validateRequired(form, fields);
    fields.forEach((f) => markFieldError(form, f, errors.includes(f)));
    if (!valid) {
      showToast("Please fill in every required field.", "error");
      return;
    }

    const btn = document.getElementById("submit-btn");
    btn.disabled = true;
    btn.textContent = "Saving\u2026";
    try {
      await upsertProviderProfile(user.uid, {
        name: user.displayName || existing.name || "Provider",
        business: values.business,
        service: values.service,
        location: values.location,
        experience: Number(values.experience),
        price: Number(values.price),
        priceUnit: form.elements.priceUnit.value,
        bio: form.elements.bio.value.trim(),
        available: form.elements.available.checked,
        rating: existing.rating || 0,
        reviewCount: existing.reviewCount || 0,
      });
      showToast("Profile saved.", "success");
      window.location.hash = `#/provider/${user.uid}`;
    } catch (err) {
      console.error(err);
      showToast("Could not save your profile. Please try again.", "error");
      btn.disabled = false;
      btn.textContent = "Save profile";
    }
  });

  fadeIn(".ticket");
}
