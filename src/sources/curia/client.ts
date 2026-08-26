import { curiaCaseUrl } from './links.js';

/** CURIA adapter supplies authoritative case-file links; exact judgment XHTML comes from CELLAR. */
export class CuriaClient {
  caseUrl(caseNumber: string, language = 'en'): string {
    return curiaCaseUrl(caseNumber, language);
  }
}
