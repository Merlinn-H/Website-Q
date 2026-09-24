import { getCollection, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';

// Every image sitting next to an index.md in src/content/works/<folder>/.
const images = import.meta.glob<{ default: ImageMetadata }>(
  '/src/content/works/*/*.{jpg,jpeg,png,webp,avif,tif,tiff,JPG,JPEG,PNG,WEBP,AVIF,TIF,TIFF}',
  { eager: true },
);

export type Work = CollectionEntry<'works'> & {
  image: ImageMetadata;
  /** The image file, from the project folder (/src/content/works/<folder>/<file>). */
  imagePath: string;
  /** Width divided by height of the artwork image. */
  ratio: number;
  /** Wide works get the full width; upright and square ones hang beside their label. */
  shape: 'wide' | 'upright';
  /** Position in the sequence as a Roman numeral (I, II, III...). */
  numeral: string;
};

const folderOf = (path: string) => path.slice(0, path.lastIndexOf('/') + 1);

const toRoman = (value: number) => {
  const numerals: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let rest = value;
  let result = '';
  for (const [amount, symbol] of numerals) {
    while (rest >= amount) {
      result += symbol;
      rest -= amount;
    }
  }
  return result;
};

/** All works, sorted by `order`, each with its image. */
export async function getWorks(): Promise<Work[]> {
  const entries = await getCollection('works');

  return entries
    .map((entry) => {
      const folder = folderOf(`/${entry.filePath ?? `src/content/works/${entry.id}/index.md`}`);
      const found = Object.keys(images).filter((path) => folderOf(path) === folder);
      if (found.length !== 1) {
        throw new Error(
          `${folder} must contain exactly one image file (JPG, PNG, WebP, AVIF or TIFF) next to index.md. Found ${found.length}.`,
        );
      }
      const image = images[found[0]].default;
      return { ...entry, image, imagePath: found[0], ratio: image.width / image.height };
    })
    .sort((a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id))
    .map((work, index) => ({
      ...work,
      shape: work.ratio > 1.15 ? ('wide' as const) : ('upright' as const),
      numeral: toRoman(index + 1),
    }));
}

/** The work shown full screen at the top of the gallery: the first featured one, else the first. */
export const getFeatured = (works: Work[]) => works.find((work) => work.data.featured) ?? works[0];

export const workPath = (work: Work) => `/works/${work.id}/`;

const statusLabel: Record<string, string> = {
  available: 'Available',
  sold: 'Sold',
  'not-for-sale': 'Not for sale',
};

/** What the work page shows for `status`; a placeholder is shown as written. */
export const availability = (status: string) => statusLabel[status] ?? status;
