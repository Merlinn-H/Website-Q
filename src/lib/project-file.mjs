// Build-time helper for src/lib/social-card.ts. Plain JavaScript on purpose: it uses Node's own
// modules, whose type definitions the project does not install.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * The full path of a file of the project, or undefined if it is missing.
 * @param {string} path relative to the project folder
 * @returns {string | undefined}
 */
export function projectFile(path) {
  const full = resolve(path);
  return existsSync(full) ? full : undefined;
}
