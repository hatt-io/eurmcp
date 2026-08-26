import { curiaCaseUrl } from './links.js';
import { cacheTtl } from '../../cache/cache.js';
import type { HttpClient } from '../../http/client.js';
import { parseCuriaCaseMetadata, type CuriaCaseMetadata } from './parser.js';

/** CURIA adapter supplies authoritative case-file links; exact judgment XHTML comes from CELLAR. */
export class CuriaClient {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  caseUrl(caseNumber: string, language = 'en'): string {
    return curiaCaseUrl(caseNumber, language);
  }

  async getCaseMetadata(caseNumber: string, language = 'en'): Promise<CuriaCaseMetadata> {
    const url = this.caseUrl(caseNumber, language);
    const payload = await this.#http.get(url, {
      accept: ['text/html', 'application/xhtml+xml'],
      cacheKey: `curia:v2:case:${url}`,
      ttlSeconds: cacheTtl.immutableJudgment,
      maxResponseBytes: 5 * 1024 * 1024
    });
    return parseCuriaCaseMetadata(payload.text());
  }
}
