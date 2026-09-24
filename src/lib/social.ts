import type { Work } from './works';

/** The link preview of a work: the work on the dark wall, in the site's look (made at build time
 * by src/pages/social/[slug].jpg.ts, see src/lib/social-card.ts). */
export const socialImageFor = (work: Work) => ({
  src: `/social/${work.id}.jpg`,
  width: 1200,
  height: 630,
  alt: work.data.title,
});
