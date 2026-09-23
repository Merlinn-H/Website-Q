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

// Scroll reveals, for browsers without scroll-linked CSS animation (the others animate
// data-reveal elements in pure CSS). The hidden state only exists in CSS under
// html.reveal-ready, so without this script everything stays visible.
const items = document.querySelectorAll<HTMLElement>('[data-reveal]');

if (items.length && 'IntersectionObserver' in window && !CSS.supports('animation-timeline: view()')) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  );

  for (const item of items) {
    // Anything already on screen is shown at once, so nothing flickers on load.
    const { top, bottom } = item.getBoundingClientRect();
    if (top < innerHeight && bottom > 0) item.classList.add('is-visible');
    else observer.observe(item);
  }

  document.documentElement.classList.add('reveal-ready');
}

// Page transitions: the artwork that was clicked grows into its own page. Only that image gets
// the shared name "artwork" (work pages give it to their main image in CSS), so the name stays
// unique. The way back is handled by a small script in the page head (BaseLayout.astro),
// because it has to run before the page first appears. Browsers without cross-page view
// transitions simply change page.
let clicked: HTMLElement | undefined;

addEventListener(
  'click',
  (event) => {
    clicked = (event.target as Element | null)?.closest<HTMLElement>('a[data-artwork-link]') ?? undefined;
  },
  { capture: true },
);

addEventListener('pageswap', (event) => {
  const { viewTransition } = event as Event & { viewTransition?: object | null };
  if (viewTransition && clicked) clicked.style.viewTransitionName = 'artwork';
});
