import sharp from 'sharp';
import { site } from '../site.config';
import { lightColour } from './light-colour';
import { plainFont } from './font-file.mjs';
import type { Work } from './works';

// Link previews in the site's look (1200 x 630 JPEG, made once at build time): the work, whole,
// on the dark wall, with the faint light from above, the shadow towards the edges, the room lit by
// the work's colour and its edges running onto the wall; the name in the bottom right corner, as
// on the gallery's opening screen. The values follow tokens.css, as on a 1200 x 630 screen.

const WIDTH = 1200;
const HEIGHT = 630;
const WALL = '#0f0d0b'; // --colour-bg
const TEXT = '#ebe5d9'; // --colour-text
// The most room the work may take, keeping space around it for its colours.
const BOX_W = 1000;
const BOX_H = 470;
const REACH_X = 84; // --bleed-size
const REACH_Y = 57; // --bleed-size-vertical
const BLUR = 17; // --bleed-blur
const BLEED_OPACITY = 0.8; // --bleed-opacity
const ROOM_LIGHT = 0.24; // --room-light
const WALL_LIGHT = 0.05; // --wall-light
const VIGNETTE = 0.6; // --vignette
const NAME_SIZE = 80;
const NAME_FONT = 'node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff';

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);

function hslToRgb(h: number, s: number, l: number) {
  const [sat, light] = [s / 100, l / 100];
  const a = sat * Math.min(light, 1 - light);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round((light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255);
  };
  return `rgb(${channel(0)}, ${channel(8)}, ${channel(4)})`;
}

// How much of the bleed shows at a distance from its outer edge, as in global.css (--fade-x,
// --fade-y): nothing at the edge, fully in once the reach is covered.
function fade(distance: number, reach: number) {
  const t = distance / reach;
  if (t >= 1) return 1;
  if (t < 0.3) return (Math.max(t, 0) / 0.3) * 0.08;
  if (t < 0.65) return 0.08 + ((t - 0.3) / 0.35) * 0.32;
  return 0.4 + ((t - 0.65) / 0.35) * 0.6;
}

// The wall: its light from above and deeper shadow at the edges (body::before in global.css),
// and the pool of the work's colour behind it (.room-light).
function wall(colour: string | undefined, workW: number, workH: number) {
  const lightW = (clamp((workW / WIDTH) * 110, 30, 95) / 100) * WIDTH;
  const lightH = (clamp((workH / HEIGHT) * 110, 30, 95) / 100) * HEIGHT;
  const [cx, cy] = [WIDTH / 2, HEIGHT / 2];
  const room = colour
    ? `<radialGradient id="room" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${lightW}"
        gradientTransform="translate(${cx} ${cy}) scale(1 ${lightH / lightW}) translate(${-cx} ${-cy})">
        <stop offset="0" stop-color="${colour}" stop-opacity="${ROOM_LIGHT}" />
        <stop offset="0.4" stop-color="${colour}" stop-opacity="${ROOM_LIGHT * 0.75}" />
        <stop offset="0.7" stop-color="${colour}" stop-opacity="${ROOM_LIGHT * 0.3}" />
        <stop offset="1" stop-color="${colour}" stop-opacity="0" />
      </radialGradient>`
    : '';
  return new TextEncoder().encode(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
    <defs>
      <radialGradient id="top" gradientUnits="userSpaceOnUse" cx="${cx}" cy="0" r="${1.2 * WIDTH}"
        gradientTransform="scale(1 ${(0.7 * HEIGHT) / (1.2 * WIDTH)})">
        <stop offset="0" stop-color="rgb(235, 229, 217)" stop-opacity="${WALL_LIGHT}" />
        <stop offset="0.62" stop-color="rgb(235, 229, 217)" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="edges" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${0.4 * HEIGHT}" r="${1.5 * WIDTH}"
        gradientTransform="translate(${cx} ${0.4 * HEIGHT}) scale(1 ${(1.1 * HEIGHT) / (1.5 * WIDTH)}) translate(${-cx} ${-0.4 * HEIGHT})">
        <stop offset="0.45" stop-color="#000" stop-opacity="0" />
        <stop offset="1" stop-color="#000" stop-opacity="${VIGNETTE}" />
      </radialGradient>
      ${room}
    </defs>
    <rect width="100%" height="100%" fill="${WALL}" />
    <rect width="100%" height="100%" fill="url(#top)" />
    <rect width="100%" height="100%" fill="url(#edges)" />
    ${colour ? '<rect width="100%" height="100%" fill="url(#room)" />' : ''}
  </svg>`);
}

// The bleed (see Bleed.astro and .bleed in global.css): a tiny copy of the work stretched over it,
// its outermost pixels carried out over the reach on every side, blurred, faded towards its edges.
async function bleed(tiny: { data: Uint8Array; width: number; height: number }, workW: number, workH: number) {
  const width = workW + 2 * REACH_X;
  const height = workH + 2 * REACH_Y;
  const stretched = await sharp(tiny.data, { raw: { width: tiny.width, height: tiny.height, channels: 3 } })
    .resize(workW, workH, { fit: 'fill', kernel: 'linear' })
    .extend({ top: REACH_Y, bottom: REACH_Y, left: REACH_X, right: REACH_X, extendWith: 'copy' })
    .raw()
    .toBuffer();
  const soft = await sharp(stretched, { raw: { width, height, channels: 3 } })
    .blur(BLUR)
    .modulate({ saturation: 1.15, brightness: 0.9 })
    .raw()
    .toBuffer();
  const alpha = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    const fy = fade(Math.min(y, height - 1 - y), REACH_Y);
    for (let x = 0; x < width; x++) {
      alpha[y * width + x] = Math.round(fade(Math.min(x, width - 1 - x), REACH_X) * fy * BLEED_OPACITY * 255);
    }
  }
  return sharp(soft, { raw: { width, height, channels: 3 } })
    .joinChannel(alpha, { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer();
}

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;').replace(/"/g, '&quot;');

// The name in the site's italic, in the bottom right corner (clear of the work and its colours).
// Left out if the font cannot be used.
async function name() {
  const fontfile = plainFont(NAME_FONT);
  if (!fontfile) return undefined;
  try {
    const { data, info } = await sharp({
      text: {
        text: `<span foreground="${TEXT}">${escape(site.name)}</span>`,
        font: `Instrument Serif Italic ${NAME_SIZE}`,
        fontfile,
        rgba: true,
        dpi: 72,
      },
    })
      .png()
      .toBuffer({ resolveWithObject: true });
    const left = WIDTH - 48 - info.width;
    const top = HEIGHT - 26 - info.height;
    return left < 0 || top < 0 ? undefined : { input: data, left, top };
  } catch {
    return undefined;
  }
}

export async function socialCard(work: Work) {
  const source = `.${work.imagePath}`;
  const signature = await name();

  // The work, centred, as large as the room allows; smaller if it would reach the name's corner.
  let workW = Math.min(BOX_W, BOX_H * work.ratio);
  if (signature && WIDTH / 2 + workW / 2 > signature.left - 32 && HEIGHT / 2 + workW / work.ratio / 2 > signature.top - 32) {
    const byWidth = 2 * (signature.left - 32 - WIDTH / 2);
    const byHeight = 2 * (signature.top - 32 - HEIGHT / 2) * work.ratio;
    workW = Math.max(byWidth, byHeight);
  }
  workW = Math.round(workW);
  const workH = Math.round(workW / work.ratio);
  const left = Math.round((WIDTH - workW) / 2);
  const top = Math.round((HEIGHT - workH) / 2);

  const image = await sharp(source)
    .rotate()
    .resize(workW, workH, { fit: 'fill' })
    .flatten({ background: WALL })
    .png()
    .toBuffer();
  const tiny = await sharp(source)
    .rotate()
    .resize({ width: 8 })
    .flatten({ background: WALL })
    .toColourspace('srgb')
    .raw({ depth: 'uchar' })
    .toBuffer({ resolveWithObject: true });
  const light = lightColour(tiny.data, tiny.info.channels);
  const colour = light && hslToRgb(...light);
  const glow = await bleed({ data: tiny.data, width: tiny.info.width, height: tiny.info.height }, workW, workH);

  return sharp(wall(colour, workW, workH))
    .composite([
      { input: glow, left: left - REACH_X, top: top - REACH_Y },
      { input: image, left, top },
      ...(signature ? [signature] : []),
    ])
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();
}
