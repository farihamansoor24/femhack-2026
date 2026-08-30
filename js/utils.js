// ---------- Booking ID ----------
// Human-readable, sortable-ish, unique enough for an MVP:
// GW-<base36 timestamp>-<4 random base36 chars>
export function generateBookingId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GW-${ts}-${rand}`;
}

// ---------- Toast ----------
let toastTimer = null;
export function showToast(message, tone = "info") {
  const el = document.getElementById("toast");
  const body = document.getElementById("toast-body");
  if (!el || !body) return;
  body.textContent = message;
  body.style.borderColor =
    tone === "error" ? "#B14A2E" : tone === "success" ? "#2F6F4E" : "rgba(192,138,40,0.4)";
  el.classList.remove("hidden");
  if (window.gsap) {
    gsap.fromTo(el, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" });
  }
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    if (window.gsap) {
      gsap.to(el, { y: 20, opacity: 0, duration: 0.3, ease: "power2.in", onComplete: () => el.classList.add("hidden") });
    } else {
      el.classList.add("hidden");
    }
  }, 3200);
}

// ---------- Stars ----------
// rating: number 0-5 (can be fractional for display), interactive: whether to render as buttons
export function renderStars(rating, { size = "text-base" } = {}) {
  const full = Math.round(rating);
  let html = `<span class="star-row ${size}">`;
  for (let i = 1; i <= 5; i++) {
    html += `<span class="${i <= full ? "" : "star-off"}">★</span>`;
  }
  html += `</span>`;
  return html;
}

// ---------- Dates ----------
export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// ---------- Validation ----------
export function validateRequired(form, fieldNames) {
  const errors = [];
  const values = {};
  for (const name of fieldNames) {
    const field = form.elements[name];
    const value = field ? field.value.trim() : "";
    values[name] = value;
    if (!value) errors.push(name);
  }
  return { valid: errors.length === 0, errors, values };
}

export function markFieldError(form, name, hasError) {
  const field = form.elements[name];
  if (!field) return;
  field.classList.toggle("border-rust", hasError);
  field.classList.toggle("ring-1", hasError);
  field.classList.toggle("ring-rust", hasError);
}

// ---------- Status labels ----------
export const STATUS_META = {
  pending: { label: "Pending", stampClass: "stamp-pending" },
  accepted: { label: "Accepted", stampClass: "stamp-accepted" },
  in_progress: { label: "In progress", stampClass: "stamp-inprogress" },
  completed: { label: "Completed", stampClass: "stamp-completed" },
  rejected: { label: "Rejected", stampClass: "stamp-rejected" },
};

export function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
