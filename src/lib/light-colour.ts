/**
 * The colour a work lights the room with, from the pixels of a tiny copy of it (8-bit, 3 or 4
 * channels): an average weighted towards the most colourful parts (a plain average tends to grey),
 * brought to a middle lightness so that every work lights the room about as much. A work with
 * hardly any colour gives a neutral, warm light. Returns hue (degrees), saturation and lightness
 * (percent). Used by the room light (src/scripts/light.ts) and the link previews
 * (src/lib/social-card.ts).
 */
export function lightColour(pixels: ArrayLike<number>, channels: number): [number, number, number] | undefined {
  let r = 0;
  let g = 0;
  let b = 0;
  let total = 0;
  for (let i = 0; i + 2 < pixels.length; i += channels) {
    const chroma = (Math.max(pixels[i], pixels[i + 1], pixels[i + 2]) - Math.min(pixels[i], pixels[i + 1], pixels[i + 2])) / 255;
    const weight = 0.05 + chroma * chroma;
    r += pixels[i] * weight;
    g += pixels[i + 1] * weight;
    b += pixels[i + 2] * weight;
    total += weight;
  }
  if (!total) return undefined;

  const [red, green, blue] = [r / total / 255, g / total / 255, b / total / 255];
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const spread = max - min;
  if (spread < 0.02) return [40, 25, 60];
  const saturation = spread / (1 - Math.abs(max + min - 1));
  const sector =
    max === red ? ((green - blue) / spread + 6) % 6 : max === green ? (blue - red) / spread + 2 : (red - green) / spread + 4;
  return [Math.round(sector * 60), Math.round(Math.min(Math.max(saturation, 0.35), 0.85) * 100), 55];
}
