import { cacheTtl } from '../../cache/cache.js';
import type { CellarClient } from '../cellar/client.js';
import { searchEdpsPublications } from '../cellar/queries.js';
import type { EdpsSearchResult } from './types.js';

export class EdpsClient {
  readonly #cellar: CellarClient;

  constructor(cellar: CellarClient) {
    this.#cellar = cellar;
  }

  async search(input: {
    query: string;
    documentType?: string;
    dateFrom?: string;
    dateTo?: string;
    limit: number;
  }): Promise<EdpsSearchResult[]> {
    const rows = await this.#cellar.sparql(
      searchEdpsPublications({
        query: input.query,
        ...(input.dateFrom ? { dateFrom: input.dateFrom } : {}),
        ...(input.dateTo ? { dateTo: input.dateTo } : {}),
        limit: Math.min(input.limit * 3, 100)
      }),
      cacheTtl.search
    );
    return rows
      .flatMap((row) => {
        const title = row.title?.value;
        const cellarUri = row.work?.value;
        if (!title || !cellarUri) return [];
        const type = row.resourceType?.value.split('/').pop()?.toLowerCase().replaceAll('_', ' ');
        if (
          input.documentType &&
          !`${type ?? ''} ${title}`.toLowerCase().includes(input.documentType.toLowerCase())
        )
          return [];
        const celex = row.celex?.value;
        const date = row.dateDocument?.value;
        const result: EdpsSearchResult = {
          title,
          page_url: cellarUri.replace(/^http:/, 'https:'),
          provenance: {
            publisher:
              'European Data Protection Supervisor / Publications Office of the European Union',
            source_system: 'CELLAR knowledge graph (EDPS publication metadata)',
            source_url: 'https://publications.europa.eu/webapi/rdf/sparql',
            retrieved_at: new Date().toISOString(),
            cellar_uri: cellarUri,
            ...(celex ? { celex } : {}),
            methodology:
              'Official CELLAR title metadata restricted to records identifying EDPS as publisher/source.'
          }
        };
        if (type) result.document_type = type;
        if (date) result.date = date;
        if (celex) result.celex = celex;
        return [result];
      })
      .slice(0, input.limit);
  }
}
