// ===========================================================
// ui.js — toast notifications (Tailwind classes + GSAP motion)
// ===========================================================

export function toast(message, type = "success") {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "fixed bottom-6 right-6 z-[300] max-w-xs px-4 py-3 rounded-xl shadow-lg font-mono text-sm text-white";
    document.body.appendChild(el);
  }
  el.textContent = message;
  // Fixed dark surfaces, independent of the page's theme tokens —
  // a toast should always read clearly regardless of light/dark mode.
  el.className = "fixed bottom-6 right-6 z-[300] max-w-xs px-4 py-3 rounded-xl shadow-lg border font-mono text-sm text-white " +
    (type === "error" ? "bg-[#A8451F] border-[#C1502A]" : "bg-neutral-900 border-neutral-700");

  if (window.gsap) {
    gsap.killTweensOf(el);
    gsap.fromTo(el, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .35, ease: "power2.out" });
    clearTimeout(el._t);
    el._t = setTimeout(() => {
      gsap.to(el, { opacity: 0, y: 16, duration: .3, ease: "power1.in" });
    }, 3000);
  } else {
    el.style.opacity = 1;
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.opacity = 0; }, 3000);
  }
}
