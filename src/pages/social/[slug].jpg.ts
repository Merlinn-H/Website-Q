import type { APIRoute, GetStaticPaths } from 'astro';
import { getWorks, type Work } from '../../lib/works';
import { socialCard } from '../../lib/social-card';

// One link preview per work, at /social/<folder name>.jpg (see src/lib/social-card.ts).
export const getStaticPaths = (async () => {
  const works = await getWorks();
  return works.map((work) => ({ params: { slug: work.id }, props: { work } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ work: Work }> = async ({ props }) =>
  new Response(new Uint8Array(await socialCard(props.work)), {
    headers: { 'Content-Type': 'image/jpeg' },
  });
