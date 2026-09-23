import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// A web address (https://...) or a value still written as [PLACEHOLDER: ...].
const link = z.union([
  z.httpUrl({ error: 'must be a full web address starting with https://' }),
  z.string().regex(/^\[PLACEHOLDER:.*\]$/),
]);

// One folder per work: src/content/works/<folder>/index.md plus exactly one image file.
// The folder name becomes the page address: /works/<folder>/
const works = defineCollection({
  loader: glob({ pattern: '*/index.md', base: './src/content/works' }),
  schema: z.object({
    title: z.string().min(1),
    year: z.union([z.number().int(), z.string().min(1)]),
    medium: z.string().min(1),
    dimensions: z.string().min(1).optional(),
    featured: z.boolean().default(false),
    order: z.number(),
    status: z.enum(['available', 'sold', 'not-for-sale']),
    etsyUrl: link.optional(),
    printsUrl: link.optional(),
  }),
});

// The About page statement, with an optional portrait image in the same folder.
const about = defineCollection({
  loader: glob({ pattern: 'index.md', base: './src/content/about' }),
  schema: z.object({
    portraitAlt: z.string().min(1).optional(),
  }),
});

export const collections = { works, about };
