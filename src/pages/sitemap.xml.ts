import type { APIRoute } from 'astro';
import { getWorks, workPath } from '../lib/works';

// Every public page, for search engines. The 404 page is left out on purpose.
export const GET: APIRoute = async ({ site }) => {
  const works = await getWorks();
  const paths = [
    '/',
    ...works.map(workPath),
    '/about/',
    '/contact/',
    '/privacy/',
    '/cookies/',
    '/legal/',
  ];
  const urls = paths.map((path) => `  <url><loc>${new URL(path, site).href}</loc></url>`).join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
