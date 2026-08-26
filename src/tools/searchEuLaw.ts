import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { LegalResearchService } from '../server/services.js';
import {
  dateSchema,
  failure,
  languageSchema,
  limitSchema,
  looseOutputSchema,
  readOnlyAnnotations,
  success
} from './shared.js';

export function registerSearchEuLaw(server: McpServer, service: LegalResearchService): void {
  server.registerTool(
    'search_eu_law',
    {
      title: 'Search EU law',
      description:
        'Search authoritative CELLAR metadata for EU legislation and legal acts. Returns metadata and provenance, not legal conclusions.',
      inputSchema: z.object({
        query: z.string().min(2).max(500),
        language: languageSchema,
        document_type: z.string().max(80).optional(),
        date_from: dateSchema.optional(),
        date_to: dateSchema.optional(),
        in_force: z.boolean().optional(),
        limit: limitSchema
      }),
      outputSchema: looseOutputSchema,
      annotations: readOnlyAnnotations
    },
    async (input) => {
      try {
        return success({ results: await service.searchEuLaw(input) });
      } catch (error) {
        return failure(error);
      }
    }
  );
}
