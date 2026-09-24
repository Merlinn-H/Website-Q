// A work's image fades in once it has arrived (see .plate img in global.css), over the blurred
// colours of its bleed, instead of popping in. Only images still loading are hidden, never one that
// is already there, and not an image that stands in for a travelling work (transitions.ts). Without
// JavaScript the images simply appear.
function watchArrivals() {
  for (const img of document.querySelectorAll<HTMLImageElement>('.plate img')) {
    if (img.complete || img.style.background) continue;
    img.classList.add('is-arriving');
    const arrived = () => img.classList.remove('is-arriving');
    img.addEventListener('load', arrived, { once: true });
    img.addEventListener('error', arrived, { once: true });
  }
}

watchArrivals();
document.addEventListener('astro:after-swap', watchArrivals);
