// Room light (see .room-light in global.css): the wall takes the colour of the work in view. Each
// work's colour is read once from the tiny copy made for its colour bleed (data-light on .bleed).
// In the gallery the light follows the work crossing the middle of the screen; on a work's page it
// sits behind the work; on pages without works it fades out.

const colours = new Map<string, Promise<string | null>>();

// Hue and saturation of an RGB colour, brought to a middle lightness so that every work lights the
// room about as much. A work with hardly any colour gives a neutral, warm light.
function toLight(r: number, g: number, b: number) {
  const [red, green, blue] = [r / 255, g / 255, b / 255];
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const spread = max - min;
  if (spread < 0.02) return 'hsl(40 25% 60%)';
  const saturation = spread / (1 - Math.abs(max + min - 1));
  const sector =
    max === red ? ((green - blue) / spread + 6) % 6 : max === green ? (blue - red) / spread + 2 : (red - green) / spread + 4;
  const hue = Math.round(sector * 60);
  return `hsl(${hue} ${Math.round(Math.min(Math.max(saturation, 0.35), 0.85) * 100)}% 55%)`;
}

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

// The colour that gives the work its character: an average weighted towards the most colourful
// parts (a plain average tends to grey).
function colourOf(src: string) {
  let colour = colours.get(src);
  if (!colour) {
    colour = pixelsOf(src)
      .then((image) => {
        if (!image) return null;
        const { pixels, channels } = image;
        let r = 0;
        let g = 0;
        let b = 0;
        let total = 0;
        for (let i = 0; i < pixels.length; i += channels) {
          const chroma = (Math.max(pixels[i], pixels[i + 1], pixels[i + 2]) - Math.min(pixels[i], pixels[i + 1], pixels[i + 2])) / 255;
          const weight = 0.05 + chroma * chroma;
          r += pixels[i] * weight;
          g += pixels[i + 1] * weight;
          b += pixels[i + 2] * weight;
          total += weight;
        }
        return total ? toLight(r / total, g / total, b / total) : null;
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

let observer: IntersectionObserver | undefined;

function watch() {
  observer?.disconnect();
  current = undefined;
  const bleeds = [...document.querySelectorAll<HTMLElement>('.bleed[data-light]')];

  // No works on this page: the light fades out.
  if (!bleeds.length) {
    layer()?.style.removeProperty('--light');
    return;
  }

  // A work's page: the light sits behind the work.
  if (bleeds.length === 1) {
    current = bleeds[0];
    lightFrom(current);
    return;
  }

  // The gallery: the work crossing the middle of the screen lights the room.
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const bleed = entry.isIntersecting && entry.target.querySelector<HTMLElement>(':scope > .bleed');
        if (bleed && bleed !== current) {
          current = bleed;
          lightFrom(bleed);
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
