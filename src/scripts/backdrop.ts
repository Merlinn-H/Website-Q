import { navigate } from 'astro:transitions/client';

// Work pages: a click on the empty background, or Escape, returns to the gallery. Coming straight
// from the gallery, this simply goes back, so the gallery reopens where it was and the work glides
// back into its place; otherwise the gallery opens at this work. Without JavaScript, the Gallery
// link in the header does the same job. Loaded on every page, as pages change without reloading.

// The page seen just before this one. The browser's referrer only tells where the visit started.
let previous = (() => {
  try {
    const from = new URL(document.referrer);
    return from.origin === location.origin ? from.pathname : undefined;
  } catch {
    return undefined;
  }
})();
let current = location.pathname;

const workPage = () => document.querySelector<HTMLElement>('[data-back]');

const somethingOpen = () => {
  try {
    return !!document.querySelector('dialog[open], :popover-open');
  } catch {
    return !!document.querySelector('dialog[open]');
  }
};

function backToGallery(page: HTMLElement) {
  if (previous === '/' && history.length > 1) history.back();
  else if (page.dataset.back) navigate(page.dataset.back);
}

const markBackdrop = () => workPage()?.classList.add('has-backdrop');

markBackdrop();
document.addEventListener('astro:after-swap', () => {
  previous = current;
  current = location.pathname;
  markBackdrop();
});

document.addEventListener('click', (event) => {
  const target = event.target as Element;
  const page = target.closest?.<HTMLElement>('[data-back]');
  // Links, buttons, the full-screen view, the label and the pager keep their own behaviour.
  if (!page || target.closest('a, button, dialog, .details, .pager')) return;
  if (getSelection()?.toString()) return;
  backToGallery(page);
});

addEventListener('keydown', (event) => {
  const page = workPage();
  if (!page || event.key !== 'Escape' || event.defaultPrevented || somethingOpen()) return;
  backToGallery(page);
});
