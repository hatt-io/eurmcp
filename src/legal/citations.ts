export function normalizeCitationText(value: string): string {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeForDiff(value: string): string {
  return normalizeCitationText(value)
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/\s+([,.;:!?])/g, '$1');
}
