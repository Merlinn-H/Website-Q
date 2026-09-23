import { getImage } from 'astro:assets';
import type { Work } from './works';

/** A JPEG copy of the artwork (longest side 1200px, never cropped) for link previews. */
export async function socialImageFor(work: Work) {
  const { width, height } = work.image;
  const scale = Math.min(1, 1200 / Math.max(width, height));
  const image = await getImage({
    src: work.image,
    width: Math.round(width * scale),
    format: 'jpg',
    fit: 'contain',
  });

  return {
    src: image.src,
    width: Number(image.attributes.width),
    height: Number(image.attributes.height),
    alt: work.data.title,
  };
}
