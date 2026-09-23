import Lenis from 'lenis';
import Snap from 'lenis/snap';

// Smooth scrolling (Lenis), for a mouse or trackpad and only for visitors who have not asked for
// reduced motion; it switches off or on again if either changes while the page is open. Touch
// screens keep their own scrolling.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(pointer: fine)');
let lenis: Lenis | null = null;
let snap: Snap | null = null;

// Works settle gently into place (elements marked data-snap, see global.css): where wheel or
// trackpad scrolling stops near one, the page glides until it sits in the middle of the screen
// below the menu. A pull, never a lock: stop further away and the page stays where it is.
let snapPoints: (() => void)[] = [];

const pageTop = (el: HTMLElement) => {
  let top = 0;
  for (let node: HTMLElement | null = el; node; node = node.offsetParent as HTMLElement | null) {
    top += node.offsetTop;
  }
  return top;
};

function placeSnaps() {
  for (const remove of snapPoints) remove();
  snapPoints = [];
  if (!snap) return;
  const menu = document.querySelector<HTMLElement>('.site-header')?.offsetHeight ?? 0;
  for (const el of document.querySelectorAll<HTMLElement>('[data-snap]')) {
    const top = pageTop(el);
    const value = el.dataset.snap === 'center' ? top + (el.offsetHeight - innerHeight - menu) / 2 : top - menu;
    snapPoints.push(snap.add(Math.max(0, Math.round(value))));
  }
  // The foot of the page (the footer) is a resting place too, so the pull towards the last work
  // never keeps the visitor from reaching it.
  if (snapPoints.length) {
    snapPoints.push(snap.add(Math.max(0, document.documentElement.scrollHeight - innerHeight)));
  }
}

function applyMotionPreference() {
  if (reducedMotion.matches || !finePointer.matches) {
    snap?.destroy();
    lenis?.destroy();
    snap = lenis = null;
  } else if (!lenis) {
    lenis = new Lenis({ autoRaf: true });
    snap = new Snap(lenis, { type: 'proximity', distanceThreshold: '30%', debounce: 220 });
    placeSnaps();
  }
}

applyMotionPreference();
reducedMotion.addEventListener('change', applyMotionPreference);
finePointer.addEventListener('change', applyMotionPreference);
// The full-screen viewer is marked data-lenis-prevent, and the page cannot scroll behind it (see
// global.css), so Lenis needs no pausing.

// Snap points follow the layout: new page, fonts arriving, window resized.
let placing = 0;
const placeSnapsSoon = () => {
  clearTimeout(placing);
  placing = window.setTimeout(placeSnaps, 150);
};
const layout = new ResizeObserver(placeSnapsSoon);
layout.observe(document.body);
addEventListener('resize', placeSnapsSoon);

// A touch on a screen that also has a trackpad keeps its own scrolling, without the pull.
let changingPage = false;
addEventListener('touchstart', () => snap?.stop(), { passive: true });
addEventListener(
  'wheel',
  () => {
    if (!changingPage) snap?.start();
  },
  { passive: true },
);

// Pages change without reloading (see transitions.ts). Smooth scrolling stops gliding as soon as
// a link is followed and the pull pauses; both take up the new page once it is in place
// (stopping and starting again also puts back Lenis's classes on the page root, which the new
// page replaces).
let resume = 0;
const settle = () => {
  lenis?.stop();
  lenis?.start();
};

document.addEventListener('astro:before-preparation', () => {
  settle();
  clearTimeout(resume);
  changingPage = true;
  snap?.stop();
});

document.addEventListener('astro:after-swap', () => {
  settle();
  lenis?.resize();
  layout.disconnect();
  layout.observe(document.body);
  placeSnaps();
  resume = window.setTimeout(() => {
    changingPage = false;
    snap?.start();
  }, 400);
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
