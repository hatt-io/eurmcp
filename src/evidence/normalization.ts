import { createHash } from 'node:crypto';

export const LEGAL_TEXT_NORMALIZATION = 'legal-text-nfc-whitespace-v1' as const;

export function normalizeLegalText(value: string): string {
  return value
    .normalize('NFC')
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/\s+/gu, ' ')
    .trim();
}

export function sha256(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex');
}
