// ===========================================================
// anim.js — shared GSAP helpers (gsap is loaded globally via CDN
// script tag in each page's <head>, before this module runs).
// ===========================================================

export function fadeIn(target, opts = {}) {
  if (!window.gsap) return;
  gsap.from(target, { opacity: 0, y: 18, duration: .55, ease: "power2.out", ...opts });
}

export function revealCards(target, opts = {}) {
  if (!window.gsap) return;
  gsap.from(target, { opacity: 0, y: 22, duration: .55, ease: "power2.out", stagger: .07, ...opts });
}

export function shake(el) {
  if (!el) return;
  if (!window.gsap) { el.classList.add("animate-pulse"); setTimeout(() => el.classList.remove("animate-pulse"), 400); return; }
  gsap.fromTo(el, { x: -9 }, { x: 0, duration: .5, ease: "elastic.out(1, 0.4)", clearProps: "x" });
}

export function pulse(el, scale = 1.07) {
  if (!el || !window.gsap) return;
  gsap.fromTo(el, { scale: 1 }, { scale, duration: .16, yoyo: true, repeat: 1, ease: "power1.inOut" });
}

export function openModal(overlayEl, boxEl) {
  overlayEl.classList.remove("hidden");
  overlayEl.classList.add("flex");
  if (!window.gsap) return;
  gsap.fromTo(overlayEl, { opacity: 0 }, { opacity: 1, duration: .2 });
  gsap.fromTo(boxEl, { opacity: 0, scale: .93, y: 14 }, { opacity: 1, scale: 1, y: 0, duration: .38, ease: "back.out(1.6)" });
}

export function closeModal(overlayEl, boxEl, done) {
  if (!window.gsap) { overlayEl.classList.add("hidden"); overlayEl.classList.remove("flex"); done && done(); return; }
  gsap.to(boxEl, { opacity: 0, scale: .95, y: 10, duration: .2, ease: "power1.in" });
  gsap.to(overlayEl, {
    opacity: 0, duration: .22, delay: .05,
    onComplete: () => { overlayEl.classList.add("hidden"); overlayEl.classList.remove("flex"); done && done(); }
  });
}

export function countUp(el, target, opts = {}) {
  if (!window.gsap) { el.textContent = target; return; }
  const obj = { val: 0 };
  const decimals = opts.decimals || 0;
  const suffix = opts.suffix || "";
  gsap.to(obj, {
    val: target, duration: 1.3, ease: "power2.out",
    onUpdate: () => el.textContent = obj.val.toFixed(decimals) + suffix
  });
}

export function staggerIn(selector, opts = {}) {
  if (!window.gsap) return;
  const els = typeof selector === "string" ? document.querySelectorAll(selector) : selector;
  if (!els || !els.length) return;
  gsap.from(els, { opacity: 0, y: 20, duration: .5, ease: "power2.out", stagger: .06, ...opts });
}
