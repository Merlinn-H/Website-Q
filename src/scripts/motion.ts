import Lenis from 'lenis';

// Smooth scrolling (Lenis) runs only for visitors who have not asked for reduced motion, and
// switches off or on again if that preference changes while the page is open.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let lenis: Lenis | null = null;

function applyMotionPreference() {
  if (reducedMotion.matches) {
    lenis?.destroy();
    lenis = null;
  } else if (!lenis) {
    lenis = new Lenis({ autoRaf: true });
  }
}

applyMotionPreference();
reducedMotion.addEventListener('change', applyMotionPreference);
// The full-screen viewer and the mobile menu are marked data-lenis-prevent or take no wheel
// input, and the page cannot scroll behind them (see global.css), so Lenis needs no pausing.

// Pages change without reloading (see transitions.ts). Smooth scrolling stops gliding as soon as
// a link is followed, then takes up the new page's position and length once it is in place
// (stopping and starting again also puts back its classes on the page root, which the new page
// replaces).
const settle = () => {
  lenis?.stop();
  lenis?.start();
};

document.addEventListener('astro:before-preparation', settle);
document.addEventListener('astro:after-swap', () => {
  settle();
  lenis?.resize();
});

// Scroll reveals, for browsers without scroll-linked CSS animation (the others animate
// data-reveal elements in pure CSS). The hidden state only exists in CSS under
// html.reveal-ready, so without this script everything stays visible. Set up again for each
// new page.
let observer: IntersectionObserver | undefined;

function revealOnScroll() {
  observer?.disconnect();
  const items = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (!items.length || !('IntersectionObserver' in window) || CSS.supports('animation-timeline: view()')) return;

  const watcher = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          watcher.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  );
  observer = watcher;

  for (const item of items) {
    // Anything already on screen is shown at once, so nothing flickers on load.
    const { top, bottom } = item.getBoundingClientRect();
    if (top < innerHeight && bottom > 0) item.classList.add('is-visible');
    else watcher.observe(item);
  }

  document.documentElement.classList.add('reveal-ready');
}

revealOnScroll();
document.addEventListener('astro:after-swap', revealOnScroll);
