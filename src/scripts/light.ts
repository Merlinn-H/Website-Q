// Room light (see .room-light in global.css): the wall takes the colour of the work in view. Each
// work's colour is read once from the tiny copy made for its colour bleed (data-light on .bleed).
// In the gallery the light follows the work crossing the middle of the screen; on a page with a
// single work (a work's page, About) it sits behind that work; on pages without works it fades out.
// The work in view also sets the folio in the menu.

import { lightColour } from '../lib/light-colour';

const colours = new Map<string, Promise<string | null>>();

// The pixels of the tiny copy, read straight from the PNG file (8-bit RGB or RGBA, as Astro makes
// it). Unlike drawing it on a canvas, this never holds up the page: the browser inflates the data
// in the background, and there are only a few dozen pixels to unfilter.
async function pixelsOf(src: string) {
  const bytes = new Uint8Array(await (await fetch(src)).arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const parts: BlobPart[] = [];
  let width = 0;
  let height = 0;
  let channels = 0;
  for (let pos = 8; pos + 8 <= bytes.length; ) {
    const length = view.getUint32(pos);
    const type = String.fromCharCode(...bytes.subarray(pos + 4, pos + 8));
    const data = bytes.subarray(pos + 8, pos + 8 + length);
    if (type === 'IHDR') {
      width = view.getUint32(pos + 8);
      height = view.getUint32(pos + 12);
      const [depth, colourType, , , interlace] = data.subarray(8, 13);
      channels = depth === 8 && !interlace ? (colourType === 2 ? 3 : colourType === 6 ? 4 : 0) : 0;
      if (!channels) return null;
    } else if (type === 'IDAT') {
      parts.push(data);
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + length;
  }
  const stream = new Blob(parts).stream().pipeThrough(new DecompressionStream('deflate'));
  const raw = new Uint8Array(await new Response(stream).arrayBuffer());

  // Each row starts with its filter; undo it against the row's left and upper neighbours.
  const stride = width * channels;
  const pixels = new Uint8Array(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? pixels[y * stride + x - channels] : 0;
      const up = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const corner = x >= channels && y > 0 ? pixels[(y - 1) * stride + x - channels] : 0;
      const estimate = left + up - corner;
      const [dLeft, dUp, dCorner] = [Math.abs(estimate - left), Math.abs(estimate - up), Math.abs(estimate - corner)];
      const paeth = dLeft <= dUp && dLeft <= dCorner ? left : dUp <= dCorner ? up : corner;
      const predictor = [0, left, up, (left + up) >> 1, paeth][filter] ?? 0;
      pixels[y * stride + x] = (raw[y * (stride + 1) + 1 + x] + predictor) & 255;
    }
  }
  return { pixels, channels };
}

// The colour that gives the work its character (see src/lib/light-colour.ts).
function colourOf(src: string) {
  let colour = colours.get(src);
  if (!colour) {
    colour = pixelsOf(src)
      .then((image) => {
        const light = image && lightColour(image.pixels, image.channels);
        return light ? `hsl(${light[0]} ${light[1]}% ${light[2]}%)` : null;
      })
      .catch(() => null);
    colours.set(src, colour);
  }
  return colour;
}

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);
const layer = () => document.querySelector<HTMLElement>('.room-light');

let current: HTMLElement | undefined;

// Lights the room from a work: its colour, in a pool behind it and sized to it.
async function lightFrom(bleed: HTMLElement) {
  const plate = bleed.closest<HTMLElement>('.plate');
  const src = bleed.dataset.light;
  if (!plate || !src) return;
  const colour = await colourOf(src);
  const light = layer();
  if (!light || current !== bleed) return;
  const box = plate.getBoundingClientRect();
  light.style.setProperty('--light-x', `${clamp(((box.left + box.width / 2) / innerWidth) * 100, 10, 90)}%`);
  light.style.setProperty('--light-y', `${clamp(((box.top + box.height / 2) / innerHeight) * 100, 15, 85)}%`);
  light.style.setProperty('--light-w', `${clamp((box.width / innerWidth) * 110, 30, 95)}%`);
  light.style.setProperty('--light-h', `${clamp((box.height / innerHeight) * 110, 30, 95)}%`);
  if (colour) light.style.setProperty('--light', colour);
}

// The folio in the menu: "II / III" for the work in view in the gallery's sequence, hidden on the
// opening screen and on other pages.
function showFolio(bleed?: HTMLElement) {
  const folio = document.querySelector<HTMLElement>('[data-folio]');
  if (!folio) return;
  const numerals = document.querySelectorAll('.work-numeral');
  const numeral = bleed?.closest('.work')?.querySelector('.work-numeral')?.textContent?.trim();
  const total = numerals[numerals.length - 1]?.textContent?.trim();
  if (numeral && total) folio.textContent = `${numeral} / ${total}`;
  folio.classList.toggle('is-shown', !!(numeral && total));
}

let observer: IntersectionObserver | undefined;

function watch() {
  observer?.disconnect();
  current = undefined;
  showFolio();
  const bleeds = [...document.querySelectorAll<HTMLElement>('.bleed[data-light]')];

  // No works on this page: the light fades out.
  if (!bleeds.length) {
    layer()?.style.removeProperty('--light');
    return;
  }

  // A page with a single work (a work's page, About): the light comes from it straight away.
  if (bleeds.length === 1) {
    current = bleeds[0];
    lightFrom(current);
  }

  // As the page scrolls, the work crossing the middle of the screen lights the room, the light
  // settling behind it.
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const bleed = entry.isIntersecting && entry.target.querySelector<HTMLElement>(':scope > .bleed');
        if (bleed) {
          current = bleed;
          lightFrom(bleed);
          showFolio(bleed);
        }
      }
    },
    { rootMargin: '-45% 0px -45% 0px' },
  );
  for (const bleed of bleeds) {
    const plate = bleed.closest('.plate');
    if (plate) observer.observe(plate);
  }
}

watch();
document.addEventListener('astro:after-swap', watch);

let resizing = 0;
addEventListener('resize', () => {
  clearTimeout(resizing);
  resizing = window.setTimeout(() => current && lightFrom(current), 200);
});
