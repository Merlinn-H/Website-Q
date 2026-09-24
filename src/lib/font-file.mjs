// Build-time helper for the link previews (src/lib/social-card.ts). Plain JavaScript on purpose:
// it uses Node's own modules, whose type definitions the project does not install.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { inflateSync } from 'node:zlib';

/**
 * A plain copy of a WOFF font file of the project (a format the @fontsource packages ship), for
 * setting text with sharp. sharp cannot read their WOFF2 files and silently falls back to another
 * font (Times New Roman on Windows, a sans on Vercel's Linux); a plain font file is read
 * everywhere. The copy is written once to the system's temporary folder, named after the font's
 * contents (never rewritten: another process may have it open).
 * @param {string} path relative to the project folder
 * @returns {string | undefined} the copy's full path, or undefined if the file is missing or not WOFF
 */
export function plainFont(path) {
  const file = resolve(path);
  if (!existsSync(file)) return undefined;
  const woff = readFileSync(file);
  if (woff.toString('latin1', 0, 4) !== 'wOFF') return undefined;
  const hash = createHash('sha256').update(woff).digest('hex').slice(0, 12);
  const copy = join(tmpdir(), `${basename(file, '.woff')}-${hash}.ttf`);
  if (existsSync(copy)) return copy;

  // The WOFF table directory, after its 44-byte header: tag, offset, compressed length, length and
  // checksum of each table. A table is compressed only when that made it smaller.
  const count = woff.readUInt16BE(12);
  const tables = [];
  for (let i = 0; i < count; i++) {
    const at = 44 + i * 20;
    const offset = woff.readUInt32BE(at + 4);
    const compressed = woff.readUInt32BE(at + 8);
    const data = woff.subarray(offset, offset + compressed);
    tables.push({
      tag: woff.subarray(at, at + 4),
      checksum: woff.readUInt32BE(at + 16),
      data: compressed < woff.readUInt32BE(at + 12) ? inflateSync(data) : data,
    });
  }

  // The plain font: a 12-byte header, a 16-byte record per table, then the tables, each padded to
  // a multiple of four bytes.
  const power = 2 ** Math.floor(Math.log2(count));
  const header = Buffer.alloc(12 + 16 * count);
  header.writeUInt32BE(woff.readUInt32BE(4), 0);
  header.writeUInt16BE(count, 4);
  header.writeUInt16BE(power * 16, 6);
  header.writeUInt16BE(Math.log2(power), 8);
  header.writeUInt16BE((count - power) * 16, 10);
  const parts = [header];
  let offset = header.length;
  tables.forEach(({ tag, checksum, data }, i) => {
    const at = 12 + i * 16;
    tag.copy(header, at);
    header.writeUInt32BE(checksum, at + 4);
    header.writeUInt32BE(offset, at + 8);
    header.writeUInt32BE(data.length, at + 12);
    const padded = Buffer.alloc(Math.ceil(data.length / 4) * 4);
    data.copy(padded);
    parts.push(padded);
    offset += padded.length;
  });

  writeFileSync(copy, Buffer.concat(parts));
  return copy;
}
