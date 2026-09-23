// @ts-check
import { defineConfig, fontProviders, sharpImageService } from 'astro/config';

// The site's public address, used for canonical links, social previews and the sitemap.
// On Vercel, VERCEL_PROJECT_PRODUCTION_URL holds it automatically: your custom domain once one is
// attached (the shortest one), otherwise the free *.vercel.app address. To force a specific
// address (for example the www version), set a SITE_URL environment variable in Vercel.
// Local builds fall back to the local preview address.
const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const siteUrl =
  process.env.SITE_URL || (productionHost ? `https://${productionHost}` : 'http://localhost:4321');

// Latin character range, as published by Fontsource for these fonts.
/** @type {[string, ...string[]]} */
const latin = [
  'U+0000-00FF', 'U+0131', 'U+0152-0153', 'U+02BB-02BC', 'U+02C6', 'U+02DA', 'U+02DC', 'U+0304',
  'U+0308', 'U+0329', 'U+2000-206F', 'U+20AC', 'U+2122', 'U+2191', 'U+2193', 'U+2212', 'U+2215',
  'U+FEFF', 'U+FFFD',
];

export default defineConfig({
  site: siteUrl,
  build: {
    // All CSS is small, so it is inlined into each page: no render-blocking stylesheet request.
    inlineStylesheets: 'always',
  },
  // Pages change without reloading, and are fetched ahead of time by src/scripts/transitions.ts
  // (which keeps them for the visit), so Astro's own prefetching is off.
  prefetch: false,
  image: {
    // Encoder quality for the resized artwork files (0 to 100). Kept high enough to hold
    // painted texture; lower numbers give smaller files.
    service: sharpImageService({
      avif: { quality: 64 },
      webp: { quality: 82 },
      jpeg: { quality: 84, mozjpeg: true },
    }),
  },
  // Fonts are self-hosted: Astro copies these files from the installed @fontsource packages into
  // the build and generates size-matched fallback fonts to avoid layout shift while they load.
  // To change a font, see "Changing colours and fonts" in README.md.
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Cormorant Garamond', // serif for the name, titles and statement
      cssVariable: '--font-display-face',
      fallbacks: ['serif'],
      options: {
        variants: [
          {
            src: ['@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-normal.woff2'],
            weight: 400,
            style: 'normal',
            unicodeRange: latin,
          },
          {
            src: ['@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-italic.woff2'],
            weight: 400,
            style: 'italic',
            unicodeRange: latin,
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Instrument Sans', // sans for navigation, labels and body text
      cssVariable: '--font-ui-face',
      fallbacks: ['sans-serif'],
      options: {
        variants: [
          {
            src: ['@fontsource/instrument-sans/files/instrument-sans-latin-400-normal.woff2'],
            weight: 400,
            style: 'normal',
            unicodeRange: latin,
          },
          {
            src: ['@fontsource/instrument-sans/files/instrument-sans-latin-500-normal.woff2'],
            weight: 500,
            style: 'normal',
            unicodeRange: latin,
          },
        ],
      },
    },
  ],
});
