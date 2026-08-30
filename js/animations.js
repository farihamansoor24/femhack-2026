// Small, deliberate motion vocabulary — reused everywhere so the
// app feels choreographed rather than sprinkled with random effects.

export function animatePageIn(root) {
  if (!window.gsap) return;
  gsap.fromTo(
    root,
    { opacity: 0, y: 14 },
    { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }
  );
}

export function staggerCards(selector = ".stagger-card") {
  if (!window.gsap) return;
  const cards = gsap.utils.toArray(selector);
  if (!cards.length) return;
  gsap.fromTo(
    cards,
    { opacity: 0, y: 22, rotate: -1 },
    {
      opacity: 1,
      y: 0,
      rotate: 0,
      duration: 0.55,
      ease: "power3.out",
      stagger: 0.08,
    }
  );
}

export function heroIntro() {
  if (!window.gsap) return;
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.fromTo(".hero-eyebrow", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 })
    .fromTo(".hero-title", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6 }, "-=0.2")
    .fromTo(".hero-sub", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5 }, "-=0.35")
    .fromTo(".hero-search", { opacity: 0, y: 16, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.5 }, "-=0.3")
    .fromTo(".hero-stamp", { opacity: 0, scale: 0.6, rotate: 12 }, { opacity: 1, scale: 1, rotate: -6, duration: 0.5, ease: "back.out(2.2)" }, "-=0.35");
}

// A rubber-stamp "thud" — used whenever a booking's status changes.
export function stampBounce(el) {
  if (!window.gsap || !el) return;
  gsap.fromTo(
    el,
    { scale: 1.6, opacity: 0, rotate: 10 },
    { scale: 1, opacity: 1, rotate: -3, duration: 0.45, ease: "back.out(3)" }
  );
}

export function fadeIn(selector, opts = {}) {
  if (!window.gsap) return;
  gsap.fromTo(selector, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", ...opts });
}
