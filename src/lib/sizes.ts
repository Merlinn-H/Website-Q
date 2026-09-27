// The width at which a work is shown, written for the `sizes` attribute of its image, so that the
// browser downloads a file only just large enough for the screen. Each formula repeats the CSS
// that sizes the work (same design tokens, same arithmetic): keep them in step with tokens.css,
// index.astro, about.astro and works/[slug].astro. A small drift only changes which file is picked,
// never the layout.
// Heights use vh: phones then count the screen without their address bar, a little larger.

// Design tokens (tokens.css).
const gutter = 'clamp(1rem, 4vw, 3.5rem)';
const frameGap = 'clamp(0.75rem, 2vw, 1.75rem)';
const header = 'clamp(2.75rem, 2rem + 4vmin, 4.5rem)';
const pageTop = `(${header} + clamp(0.5rem, 2vh, 1.5rem))`;
const bleedVertical = 'clamp(3rem, 9vh, 8rem)';

// The width between the page's gutters.
const content = `(100vw - 2 * ${gutter})`;

const r = (ratio: number) => ratio.toFixed(4);

/**
 * The opening work of the gallery (index.astro, .hero): as wide as the space allows, and short
 * enough to leave room for the name (`lines` of it, its longest word `letters` long) above and/or
 * below; an upright work on a wide screen takes the full height, the name beside it.
 */
export function heroSizes(ratio: number, letters: number, lines: number, upright: boolean) {
  const padBottom = 'clamp(1rem, 4vh, 2.5rem)';
  const gap = 'clamp(0.75rem, 2vh, 1.5rem)';
  const wordEm = Number(Math.max(letters * 0.46, 0.95).toFixed(3));
  const wordSize = lines === 1 ? `min(14vh, 14rem, ${content} / ${wordEm})` : `min(9vh, 11rem, ${content} / ${wordEm})`;
  const stage = `(100vh - ${pageTop} - ${padBottom})`;
  const stack = `min(${content} - 2 * ${frameGap}, (${stage} - ${lines} * (1.3 * ${wordSize} + ${gap}) - 2 * ${frameGap}) * ${r(ratio)})`;
  if (!upright) return stack;
  const sides = `min(${content} - 2 * ${frameGap}, (${stage} - 2 * ${frameGap}) * ${r(ratio)})`;
  return `(min-width: 64em) and (min-aspect-ratio: 3/2) ${sides}, ${stack}`;
}

/**
 * A work in the gallery's sequence (index.astro, .work-plate): it fits below the menu with its
 * label; from 64em an upright work hangs in 7 of 12 columns, its label beside it.
 */
export function sequenceSizes(ratio: number, upright: boolean) {
  const title = 'clamp(1.875rem, 1.3rem + 2.4vw, 3.5rem)';
  const room = (label: string) => `max(55vh, 100vh - ${header} - 2 * ${frameGap} - ${label} - 2rem)`;
  const below = `min(${content} - 2 * ${frameGap}, ${room(`(5.5rem + 1.05 * ${title})`)} * ${r(ratio)})`;
  if (!upright) return below;
  const columns = `(7 * ${content} - 5 * ${gutter}) / 12`;
  const beside = `min(${columns} - 2 * ${frameGap}, ${room('0rem')} * ${r(ratio)})`;
  return `(min-width: 64em) ${beside}, ${below}`;
}

/**
 * The work beside the statement on About (about.astro, .about-work): one column on phones; from
 * 56em the second column (5 of 6 + 5 parts, after the column gap).
 */
export function aboutSizes(ratio: number) {
  const width = `(min(100vw, 96rem) - 2 * ${gutter})`;
  const narrow = `min(${width} - 2 * ${frameGap}, max(14rem, 100vh - ${pageTop} - 2 * ${bleedVertical} - 6rem) * ${r(ratio)})`;
  const column = `(${width} - clamp(3rem, 7vw, 8rem)) * 5 / 11`;
  const wide = `min(${column} - 2 * ${frameGap}, max(16rem, 100vh - ${pageTop} - 2 * ${bleedVertical} - 5rem) * ${r(ratio)})`;
  return `(min-width: 56em) ${wide}, ${narrow}`;
}

/**
 * The work on its own page (works/[slug].astro, .stage-plate). Beside its label (wide screens,
 * phones held sideways) it has the full height of the page, less the room kept for its glow.
 * Under its label, the label's height depends on its text: it is estimated generously, so the
 * file picked is never too small.
 */
export function workSizes(ratio: number) {
  const footerSlim = 'clamp(2.25rem, 1.5rem + 2vh, 2.75rem)';
  const endPad = 'clamp(0.25rem, 1vh, 0.75rem)';
  const glowRoom = `max(0rem, ${bleedVertical} - ${footerSlim} - ${endPad})`;
  const height = `(100vh - ${footerSlim} - ${pageTop} - ${endPad} - ${glowRoom})`;
  const beside = `min(${content} - clamp(2rem, 5vw, 5rem) - 24rem, ${height} * ${r(ratio)})`;
  const under = `min(${content}, max(6rem, 100vh - 24rem) * ${r(ratio)})`;
  return `(min-width: 48em) and (min-aspect-ratio: 1/1) ${beside}, (min-width: 36em) and (min-aspect-ratio: 3/2) ${beside}, ${under}`;
}
