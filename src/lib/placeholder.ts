/** True for values still written as [PLACEHOLDER: ...]. They are shown as text, never as links. */
export const isPlaceholder = (value: unknown): value is string =>
  typeof value === 'string' && value.trimStart().startsWith('[PLACEHOLDER');
