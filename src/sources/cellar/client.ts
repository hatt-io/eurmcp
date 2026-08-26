import { cacheTtl, type Cache } from '../../cache/cache.js';
import { EuLawError } from '../../errors/errors.js';
import type { HttpClient } from '../../http/client.js';
import type { DocumentRelationship } from '../../types.js';
import {
  findAmendingActs,
  findCitations,
  findConsolidations,
  findExpressions,
  findWorkByCelex,
  findWorkByCelexAnyLanguage,
  findWorkByEcli,
  findWorkByEcliAnyLanguage,
  findWorkByEli,
  findWorkByEliAnyLanguage,
  searchCaseLaw,
  searchLegislation,
  type CaseSearchQuery,
  type LegislationSearchQuery
} from './queries.js';
import type {
  CellarConsolidation,
  CellarExpressionItem,
  CellarWork,
  SparqlBinding,
  SparqlResults
} from './types.js';

const ENDPOINT = 'https://publications.europa.eu/webapi/rdf/sparql';

function optional(binding: SparqlBinding, name: string): string | undefined {
  return binding[name]?.value || undefined;
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  if (value === '1' || value === 'true') return true;
  if (value === '0' || value === 'false') return false;
  return undefined;
}

function workFromBinding(binding: SparqlBinding): CellarWork {
  const cellarUri = optional(binding, 'work');
  if (!cellarUri) throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'CELLAR result omitted work URI');
  const work: CellarWork = {
    cellarUri,
    languages: (optional(binding, 'languages') ?? '').split(',').filter(Boolean)
  };
  const fields = {
    celex: optional(binding, 'celex'),
    eli: optional(binding, 'eli'),
    ecli: optional(binding, 'ecli'),
    title: optional(binding, 'title'),
    dateDocument: optional(binding, 'dateDocument'),
    datePublication: optional(binding, 'datePublication'),
    dateEffect: optional(binding, 'dateEffect'),
    dateEndValidity: optional(binding, 'dateEndValidity'),
    resourceTypeUri: optional(binding, 'resourceType'),
    chamberUri: optional(binding, 'chamber')
  };
  for (const [key, value] of Object.entries(fields))
    if (value !== undefined) Object.assign(work, { [key]: value });
  const inForce = parseBoolean(optional(binding, 'inForce'));
  if (inForce !== undefined) work.inForce = inForce;
  return work;
}

export class CellarClient {
  readonly #http: HttpClient;
  readonly #cache: Cache;

  constructor(http: HttpClient, cache: Cache) {
    this.#http = http;
    this.#cache = cache;
  }

  async sparql(query: string, ttlSeconds = cacheTtl.search): Promise<SparqlBinding[]> {
    const key = `cellar:sparql:${query}`;
    const cached = await this.#cache.get<SparqlBinding[]>(key);
    if (cached) return cached;
    const payload = await this.#http.request(ENDPOINT, {
      method: 'POST',
      body: new URLSearchParams({ query }).toString(),
      contentType: 'application/x-www-form-urlencoded;charset=UTF-8',
      accept: ['application/sparql-results+json', 'application/json'],
      maxResponseBytes: 5 * 1024 * 1024
    });
    let decoded: SparqlResults;
    try {
      decoded = JSON.parse(payload.text()) as SparqlResults;
    } catch (error) {
      throw new EuLawError(
        'UPSTREAM_FORMAT_CHANGED',
        'CELLAR returned invalid SPARQL JSON',
        {
          source_url: payload.url
        },
        error
      );
    }
    if (!Array.isArray(decoded.results?.bindings)) {
      throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'CELLAR SPARQL JSON omitted bindings', {
        source_url: payload.url
      });
    }
    await this.#cache.set(key, decoded.results.bindings, ttlSeconds);
    return decoded.results.bindings;
  }

  async findWorkByCelex(celex: string, language = 'ENG'): Promise<CellarWork | undefined> {
    const first = (
      await this.sparql(findWorkByCelex(celex, language), cacheTtl.historicalDocument)
    )[0];
    return first ? workFromBinding(first) : undefined;
  }

  async hasWorkByCelex(celex: string): Promise<boolean> {
    return Boolean(
      (await this.sparql(findWorkByCelexAnyLanguage(celex), cacheTtl.historicalDocument))[0]
    );
  }

  async findWorkByEli(eli: string, language = 'ENG'): Promise<CellarWork[]> {
    return (await this.sparql(findWorkByEli(eli, language), cacheTtl.historicalDocument)).map(
      workFromBinding
    );
  }

  async hasWorkByEli(eli: string): Promise<boolean> {
    return Boolean(
      (await this.sparql(findWorkByEliAnyLanguage(eli), cacheTtl.historicalDocument))[0]
    );
  }

  async findWorkByEcli(ecli: string, language = 'ENG'): Promise<CellarWork[]> {
    return (await this.sparql(findWorkByEcli(ecli, language), cacheTtl.immutableJudgment)).map(
      workFromBinding
    );
  }

  async hasWorkByEcli(ecli: string): Promise<boolean> {
    return Boolean(
      (await this.sparql(findWorkByEcliAnyLanguage(ecli), cacheTtl.immutableJudgment))[0]
    );
  }

  async findExpressions(workUri: string, language?: string): Promise<CellarExpressionItem[]> {
    const rows = await this.sparql(findExpressions(workUri, language), cacheTtl.historicalDocument);
    return rows.map((row) => {
      const work = optional(row, 'work');
      const expression = optional(row, 'expression');
      const lang = optional(row, 'langCode');
      const format = optional(row, 'format');
      const item = optional(row, 'item');
      if (!work || !expression || !lang || !format || !item) {
        throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'CELLAR manifestation row was incomplete');
      }
      return { workUri: work, expressionUri: expression, language: lang, format, itemUri: item };
    });
  }

  async getXhtmlItem(workUri: string, language: string): Promise<CellarExpressionItem> {
    const items = await this.findExpressions(workUri, language);
    const xhtml = items.find((item) => item.format.toLowerCase() === 'xhtml');
    if (!xhtml) {
      if (items.length === 0) {
        throw new EuLawError(
          'LANGUAGE_NOT_AVAILABLE',
          `Official language expression not found: ${language}`,
          {
            cellar_uri: workUri,
            language
          }
        );
      }
      throw new EuLawError(
        'UPSTREAM_FORMAT_CHANGED',
        'CELLAR expression has no XHTML manifestation',
        {
          cellar_uri: workUri,
          language,
          available_formats: [...new Set(items.map((item) => item.format))]
        }
      );
    }
    return xhtml;
  }

  async downloadXhtml(
    item: CellarExpressionItem,
    ttlSeconds: number
  ): Promise<{ text: string; url: string }> {
    const url = item.itemUri.replace(/^http:/, 'https:');
    const payload = await this.#http.get(url, {
      accept: ['application/xhtml+xml', 'text/html', 'application/xml'],
      cacheKey: `cellar:item:${item.itemUri}`,
      ttlSeconds
    });
    const text = payload.text();
    if (!text.includes('<html') || !text.includes('</html>')) {
      throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'CELLAR XHTML item lacks an HTML root', {
        source_url: payload.url
      });
    }
    return { text, url: payload.url };
  }

  async searchLegislation(input: LegislationSearchQuery): Promise<CellarWork[]> {
    return (await this.sparql(searchLegislation(input), cacheTtl.search)).map(workFromBinding);
  }

  async searchCaseLaw(input: CaseSearchQuery): Promise<CellarWork[]> {
    return (await this.sparql(searchCaseLaw(input), cacheTtl.search)).map(workFromBinding);
  }

  async findConsolidations(celex: string): Promise<CellarConsolidation[]> {
    const rows = await this.sparql(findConsolidations(celex), cacheTtl.latestConsolidation);
    return rows.map((row) => {
      const cellarUri = optional(row, 'consolidation');
      const resultCelex = optional(row, 'celex');
      const date = optional(row, 'date');
      if (!cellarUri || !resultCelex || !date) {
        throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'CELLAR consolidation row was incomplete');
      }
      return { cellarUri, celex: resultCelex, date };
    });
  }

  async findRelationships(workUri: string): Promise<DocumentRelationship[]> {
    const rows = await this.sparql(findAmendingActs(workUri), cacheTtl.mutableDocument);
    return rows.flatMap((row) => {
      const related = optional(row, 'related');
      const relationship = optional(row, 'relationship') as
        DocumentRelationship['type'] | undefined;
      if (!related || !relationship) return [];
      const value: DocumentRelationship = { type: relationship, cellar_uri: related };
      const celex = optional(row, 'celex');
      if (celex) value.celex = celex;
      return [value];
    });
  }

  async findCitations(workUri: string, limit: number): Promise<CellarWork[]> {
    return (await this.sparql(findCitations(workUri, limit), cacheTtl.search)).map(workFromBinding);
  }
}
