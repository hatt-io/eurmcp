import { extractText, getDocumentProxy } from 'unpdf';
import { cacheTtl } from '../../cache/cache.js';
import { EuLawError } from '../../errors/errors.js';
import type { HttpClient } from '../../http/client.js';
import type { Provenance } from '../../types.js';
import { parseEdpbDocumentPage, parseEdpbSearchPage, sectionsFromPdfText } from './parser.js';
import type { EdpbPage, EdpbSearchResult } from './types.js';

function provenance(sourceUrl: string, language?: string): Provenance {
  const value: Provenance = {
    publisher: 'European Data Protection Board',
    source_system: 'EDPB official website',
    source_url: sourceUrl,
    retrieved_at: new Date().toISOString()
  };
  if (language) value.language = language;
  return value;
}

export class EdpbClient {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  async search(input: {
    query: string;
    documentType?: string;
    status?: 'adopted' | 'consultation' | 'all';
    dateFrom?: string;
    dateTo?: string;
    limit: number;
  }): Promise<EdpbSearchResult[]> {
    const url = new URL('https://www.edpb.europa.eu/documents_en');
    url.searchParams.set('keys', input.query);
    const payload = await this.#http.get(url, {
      accept: ['text/html'],
      cacheKey: `edpb:search:${url.toString()}`,
      ttlSeconds: cacheTtl.search,
      maxResponseBytes: 5 * 1024 * 1024
    });
    return parseEdpbSearchPage(payload.text(), payload.url)
      .filter(
        (result) =>
          !input.documentType || result.documentType?.toLowerCase().includes(input.documentType)
      )
      .filter((result) => !input.status || input.status === 'all' || result.status === input.status)
      .filter((result) => !input.dateFrom || (result.adoptionDate ?? '') >= input.dateFrom)
      .filter((result) => !input.dateTo || (result.adoptionDate ?? '9999') <= input.dateTo)
      .slice(0, input.limit)
      .map((result) => ({
        title: result.title,
        ...(result.documentNumber ? { document_number: result.documentNumber } : {}),
        ...(result.documentType ? { document_type: result.documentType } : {}),
        ...(result.adoptionDate ? { adoption_date: result.adoptionDate } : {}),
        ...(result.version ? { version: result.version } : {}),
        ...(result.status ? { status: result.status } : {}),
        ...(result.topics.length ? { topics: result.topics } : {}),
        page_url: result.pageUrl,
        provenance: provenance(payload.url)
      }));
  }

  async get(
    identifierOrUrl: string,
    language: string
  ): Promise<{
    page: EdpbPage;
    language: string;
    text: string;
    sections: ReturnType<typeof sectionsFromPdfText>;
    provenance: Provenance;
  }> {
    let pageUrl: string;
    if (/^https:\/\//i.test(identifierOrUrl)) {
      const candidate = new URL(identifierOrUrl);
      if (!['www.edpb.europa.eu', 'edpb.europa.eu'].includes(candidate.hostname)) {
        throw new EuLawError('INVALID_ARGUMENT', 'Only official EDPB URLs are accepted', {
          identifier_or_url: identifierOrUrl
        });
      }
      pageUrl = candidate.toString();
    } else {
      const results = await this.search({ query: identifierOrUrl, limit: 20 });
      const exact = results.filter(
        (result) =>
          result.document_number?.toLowerCase() === identifierOrUrl.toLowerCase() ||
          result.title.toLowerCase() === identifierOrUrl.toLowerCase()
      );
      if (exact.length > 1) {
        throw new EuLawError('AMBIGUOUS_IDENTIFIER', 'Multiple EDPB documents match', {
          identifier: identifierOrUrl,
          candidates: exact.map((result) => ({ title: result.title, page_url: result.page_url }))
        });
      }
      pageUrl = exact[0]?.page_url ?? '';
      if (!pageUrl && results.length) {
        throw new EuLawError('AMBIGUOUS_IDENTIFIER', 'EDPB identifier did not resolve exactly', {
          identifier: identifierOrUrl,
          candidates: results.map((result) => ({
            title: result.title,
            document_number: result.document_number,
            page_url: result.page_url
          }))
        });
      }
      if (!pageUrl)
        throw new EuLawError('DOCUMENT_NOT_FOUND', 'EDPB document not found', {
          identifier: identifierOrUrl
        });
    }
    const pagePayload = await this.#http.get(pageUrl, {
      accept: ['text/html'],
      cacheKey: `edpb:page:${pageUrl}`,
      ttlSeconds: cacheTtl.guidance,
      maxResponseBytes: 5 * 1024 * 1024
    });
    const page = parseEdpbDocumentPage(pagePayload.text(), pagePayload.url, language);
    const pdf = await this.#http.get(page.documentUrl, {
      accept: ['application/pdf'],
      cacheKey: `edpb:pdf:${page.documentUrl}`,
      ttlSeconds: cacheTtl.historicalDocument,
      maxResponseBytes: 30 * 1024 * 1024
    });
    const proxy = await getDocumentProxy(new Uint8Array(pdf.bytes), { verbosity: 0 });
    const extracted = await extractText(proxy, { mergePages: true });
    if (!extracted.text.trim()) {
      throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'EDPB PDF has no extractable official text', {
        source_url: pdf.url
      });
    }
    return {
      page,
      language,
      text: extracted.text,
      sections: sectionsFromPdfText(extracted.text),
      provenance: provenance(pdf.url, language)
    };
  }
}
