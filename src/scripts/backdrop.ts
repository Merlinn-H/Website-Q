// Work pages: a click on the empty background, or Escape, returns to the gallery. Coming from the
// gallery, this simply goes back, so the gallery reopens where it was and the work glides back
// into its place; otherwise the gallery opens at this work. Without JavaScript, the Gallery link
// in the header does the same job.
const page = document.querySelector<HTMLElement>('[data-back]');

const somethingOpen = () => {
  try {
    return !!document.querySelector('dialog[open], :popover-open');
  } catch {
    return !!document.querySelector('dialog[open]');
  }
};

if (page?.dataset.back) {
  const target = page.dataset.back;
  const cameFromGallery = () => {
    if (history.length < 2 || !document.referrer) return false;
    const from = new URL(document.referrer);
    return from.origin === location.origin && from.pathname === '/';
  };
  const backToGallery = () => (cameFromGallery() ? history.back() : location.assign(target));

  page.classList.add('has-backdrop');

  page.addEventListener('click', (event) => {
    // Links, buttons, the full-screen view, the label and the pager keep their own behaviour.
    if ((event.target as Element).closest('a, button, dialog, .details, .pager')) return;
    if (getSelection()?.toString()) return;
    backToGallery();
  });

  addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || event.defaultPrevented || somethingOpen()) return;
    backToGallery();
  });
}
