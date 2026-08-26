import { EuLawError } from '../errors/errors.js';

export type VersionRequest = 'original' | 'current_consolidated' | string;
export type VersionInfo =
  { type: 'original' } | { type: 'consolidated'; date: string; consolidation_date: string };

export function normalizeVersion(input: VersionRequest | undefined): VersionRequest {
  if (input === undefined || input === 'original' || input === 'current_consolidated') {
    return input ?? 'original';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    throw new EuLawError('INVALID_ARGUMENT', `Invalid version: ${input}`, {
      argument: 'version',
      expected: 'original, current_consolidated, or YYYY-MM-DD'
    });
  }
  return input;
}
