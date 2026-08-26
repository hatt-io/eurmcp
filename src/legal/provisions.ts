import { EuLawError } from '../errors/errors.js';

export function normalizeArticleNumber(input: string): string {
  const value = input
    .trim()
    .replace(/^article\s+/i, '')
    .replace(/\s+/g, '');
  if (!/^[0-9]+[a-z]?(?:-[0-9]+[a-z]?)?$/i.test(value)) {
    throw new EuLawError('INVALID_ARGUMENT', `Invalid article number: ${input}`, {
      argument: 'article'
    });
  }
  return value.toLowerCase();
}

export function expandNumberSelection(
  selection: readonly number[] | { from: number; to: number },
  maxCount = 100
): number[] {
  const isRange = 'from' in selection;
  const values = isRange
    ? Array.from(
        { length: selection.to - selection.from + 1 },
        (_, index) => selection.from + index
      )
    : [...selection];
  if (
    values.length === 0 ||
    values.length > maxCount ||
    values.some((value) => !Number.isInteger(value) || value < 1)
  ) {
    throw new EuLawError('INVALID_ARGUMENT', 'Invalid or excessive number selection', {
      selection,
      max_count: maxCount
    });
  }
  if (isRange && selection.to < selection.from) {
    throw new EuLawError('INVALID_ARGUMENT', 'Range end must not precede range start', {
      selection
    });
  }
  return [...new Set(values)];
}
