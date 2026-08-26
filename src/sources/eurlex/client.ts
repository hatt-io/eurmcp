import { eurLexUrl } from './links.js';

/** EUR-Lex adapter is link-only; exact content comes from CELLAR machine-readable items. */
export class EurLexClient {
  documentUrl(celex: string, language = 'en'): string {
    return eurLexUrl(celex, language);
  }
}
