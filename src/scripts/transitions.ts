// Moving between pages. Astro's client router (see BaseLayout.astro) swaps the next page in
// without reloading, while the old page cross-fades into it. On top of that:
// - pages are fetched shortly before they are needed (a link on screen for a moment, pointed at,
//   focused or touched) and kept for the visit, so a change of page starts at once;
// - the work that was clicked grows into its own page, its colour bleed travelling with it, and
//   glides back into place on the way back, while the rest of the page dims like house lights.
//   Only that work and its bleed carry the shared names "artwork" and "artwork-bleed" (a work page
//   gives them to its own in CSS), and only when both pages show the work, so each name is used
//   once;
// - the next page's main image is loaded before the change where possible, so it is there from
//   the start. When the same work is already on screen, its image stands in meanwhile.

const GALLERY_LINK = 'a[data-artwork-link]';
const STAGE = '.stage-work';
// Longest wait for the next page's main image before changing page anyway, in milliseconds.
const IMAGE_WAIT = 400;

// Pages fetched ahead ------------------------------------------------------------------------

const pages = new Map<string, Promise<string | undefined>>();

// A page of the site, fetched once per visit. Anything unusual (an error, a redirect, not a
// page) is left to the router's own loading.
function fetchPage(href: string) {
  const url = href.split('#')[0];
  let page = pages.get(url);
  if (!page) {
    page = fetch(url)
      .then((response) =>
        response.ok && !response.redirected && response.headers.get('content-type')?.startsWith('text/html')
          ? response.text()
          : undefined,
      )
      .catch(() => undefined);
    pages.set(url, page);
  }
  return page;
}

const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html');

const isPageLink = (link: HTMLAnchorElement) =>
  link.origin === location.origin &&
  link.pathname !== location.pathname &&
  !link.target &&
  !link.hasAttribute('download') &&
  !link.hasAttribute('data-astro-reload');

// Links on screen for a moment, except when the visitor saves data or the connection is slow.
const slowConnection = () => {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection;
  return !!connection && (!!connection.saveData || /2g/.test(connection.effectiveType ?? ''));
};

const timers = new WeakMap<Element, number>();
const onScreenLinks = new IntersectionObserver((entries) => {
  for (const { target, isIntersecting } of entries) {
    clearTimeout(timers.get(target));
    if (!isIntersecting) continue;
    const timer = window.setTimeout(() => {
      onScreenLinks.unobserve(target);
      fetchPage((target as HTMLAnchorElement).href);
    }, 300);
    timers.set(target, timer);
  }
});

function watchLinks() {
  onScreenLinks.disconnect();
  if (slowConnection()) return;
  for (const link of document.querySelectorAll<HTMLAnchorElement>('a[href]')) {
    if (isPageLink(link)) onScreenLinks.observe(link);
  }
}

watchLinks();
document.addEventListener('astro:after-swap', watchLinks);

// Pointing at, focusing or touching a link fetches its page; for Previous and Next, the work's
// image as well.
const warmed = new Set<string>();

function warmImage(href: string) {
  if (warmed.has(href)) return;
  warmed.add(href);
  fetchPage(href).then((html) => {
    const img = html && parse(html).querySelector<HTMLImageElement>(`${STAGE} img`);
    if (img) preload(img);
  });
}

for (const type of ['pointerover', 'focusin', 'touchstart']) {
  document.addEventListener(
    type,
    (event) => {
      const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href]');
      if (!link || !isPageLink(link)) return;
      fetchPage(link.href);
      if (link.matches('.pager-link')) warmImage(link.href);
    },
    { passive: true },
  );
}

// Shared names ---------------------------------------------------------------------------------

const bleedOf = (el: Element) => el.closest('.plate')?.querySelector<HTMLElement>('.bleed') ?? undefined;

const onScreen = (el: Element) => {
  const { top, bottom } = el.getBoundingClientRect();
  return bottom > 0 && top < innerHeight;
};

// The full-screen view (or any popover) covers the page: nothing under it should fly over it.
const covered = () => {
  try {
    return !!document.querySelector('dialog[open], :popover-open');
  } catch {
    return !!document.querySelector('dialog[open]');
  }
};

// The gallery link to a page that is on screen, preferring the one that was clicked.
const galleryLinkTo = (path: string, clicked?: Element | null) => {
  const links = [...document.querySelectorAll<HTMLAnchorElement>(GALLERY_LINK)].filter(
    (link) => link.pathname === path && onScreen(link),
  );
  return links.find((link) => link === clicked) ?? links[0];
};

// Names given for one change of page, removed once its transition is over.
let generation = 0;
const named = new Map<HTMLElement, number>();

function setName(el: HTMLElement | undefined, value: string) {
  if (!el) return;
  el.style.viewTransitionName = value;
  named.set(el, generation);
}

// Gives a work and its bleed their shared names, or keeps them out of the transition.
function nameWork(work: HTMLElement | undefined, on = true) {
  setName(work, on ? 'artwork' : 'none');
  setName(work && bleedOf(work), on ? 'artwork-bleed' : 'none');
}

function clearNames(only?: number) {
  for (const [el, given] of named) {
    if (only !== undefined && given !== only) continue;
    el.style.removeProperty('view-transition-name');
    named.delete(el);
  }
}

// Images -------------------------------------------------------------------------------------

// Images loaded ahead, kept until the next page is in place.
let loading: HTMLImageElement[] = [];

// Loads an image of another page the way the browser will show it on this screen (same file,
// size and format), resolving once it has arrived or failed.
function preload(img: HTMLImageElement): Promise<void> {
  const original = img.parentElement?.localName === 'picture' ? img.parentElement : img;
  const copy = document.importNode(original, true);
  const image = copy instanceof HTMLImageElement ? copy : copy.querySelector('img');
  if (!image) return Promise.resolve();
  loading.push(image);
  return new Promise((resolve) => {
    image.addEventListener('load', () => resolve(), { once: true });
    image.addEventListener('error', () => resolve(), { once: true });
  });
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Until a work's own file has loaded, the copy that was on screen stands in, stretched to fit.
function standIn(img: HTMLImageElement | null, src: string | undefined) {
  if (!img || !src || (img.complete && img.naturalWidth > 0)) return;
  img.style.background = `url("${src}") center / 100% 100% no-repeat`;
  const done = () => img.style.removeProperty('background');
  img.addEventListener('load', done, { once: true });
  img.addEventListener('error', done, { once: true });
}

// Changing page ----------------------------------------------------------------------------------

let fromPath = '';
let leaving: HTMLElement | undefined; // the work on screen that continues into the next page
let continuing = false; // whether the next page shows that same work
let placeholder: string | undefined; // its image file, to stand in on the next page
let viewTransition: ViewTransition | undefined;

document.addEventListener('astro:before-preparation', (event) => {
  generation += 1;
  clearNames();
  fromPath = event.from.pathname;
  leaving = placeholder = undefined;
  continuing = false;

  const load = event.loader;
  event.loader = async () => {
    const html = await fetchPage(event.to.href);
    const fetched = html ? parse(html) : undefined;
    // A stylesheet file not on this page yet (in development, say) is left to the router's own
    // loading, which waits for it.
    const newStyles = [...(fetched?.querySelectorAll('head link[rel=stylesheet]') ?? [])].some(
      (link) => !document.querySelector(`link[rel=stylesheet][href="${link.getAttribute('href')}"]`),
    );
    if (fetched && !newStyles) {
      event.newDocument = fetched;
      // As the router's own loading does.
      for (const el of fetched.querySelectorAll('noscript')) el.remove();
    } else {
      await load();
    }
    if (event.defaultPrevented || event.signal.aborted) return;
    const next = event.newDocument;
    const stage = document.querySelector<HTMLElement>(STAGE);
    const nextStage = next.querySelector(STAGE);

    // The work that goes on: on a work page, its work, if the next page is another work page or
    // shows this same work; elsewhere, the work leading to the next page.
    if (!covered()) {
      const shownNext = next.querySelector(`${STAGE}, ${GALLERY_LINK}[href="${fromPath}"]`);
      if (stage) leaving = shownNext ? stage : undefined;
      else if (nextStage) leaving = galleryLinkTo(event.to.pathname, event.sourceElement?.closest(GALLERY_LINK));
    }
    if (leaving && !stage) nameWork(leaving);
    if (stage && !leaving) nameWork(stage, false);
    continuing = !!leaving && (!stage || !nextStage || event.to.pathname === fromPath);
    placeholder = leaving?.querySelector('img')?.currentSrc || undefined;

    // Load the next page's main images now, and wait for them a moment unless the same work goes
    // on (its image on screen stands in until the new file arrives).
    const images = [...next.querySelectorAll<HTMLImageElement>('main img[fetchpriority="high"]')].map(preload);
    if (!continuing && images.length) await Promise.race([Promise.all(images), delay(IMAGE_WAIT)]);
  };
});

document.addEventListener('astro:before-swap', (event) => {
  viewTransition = event.viewTransition;
});

document.addEventListener('astro:after-swap', () => {
  const current = generation;
  const stage = document.querySelector<HTMLElement>(STAGE);
  let arriving: HTMLElement | undefined;

  if (stage) {
    if (leaving) arriving = stage;
    else nameWork(stage, false);
  } else if (leaving) {
    arriving = galleryLinkTo(fromPath);
    nameWork(arriving);
  }

  if (arriving) {
    if (continuing) standIn(arriving.querySelector('img'), placeholder);
    // While a work travels, the rest of the page dims like house lights (see global.css).
    viewTransition?.types?.add('artwork');
  }

  loading = [];
  viewTransition?.finished.finally(() => clearNames(current));
  viewTransition = undefined;
});
