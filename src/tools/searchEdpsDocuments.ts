import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { LegalResearchService } from '../server/services.js';
import {
  dateSchema,
  failure,
  limitSchema,
  looseOutputSchema,
  readOnlyAnnotations,
  success
} from './shared.js';

export function registerSearchEdpsDocuments(
  server: McpServer,
  service: LegalResearchService
): void {
  server.registerTool(
    'search_edps_documents',
    {
      title: 'Search EDPS documents',
      description:
        'Search official Publications Office CELLAR metadata for EDPS publications. Coverage is limited to EDPS material deposited in CELLAR.',
      inputSchema: z.object({
        query: z.string().min(2).max(500),
        document_type: z.string().max(100).optional(),
        date_from: dateSchema.optional(),
        date_to: dateSchema.optional(),
        limit: limitSchema
      }),
      outputSchema: looseOutputSchema,
      annotations: readOnlyAnnotations
    },
    async (input) => {
      try {
        return success({
          results: await service.searchEdpsDocuments({
            query: input.query,
            ...(input.document_type ? { documentType: input.document_type } : {}),
            ...(input.date_from ? { dateFrom: input.date_from } : {}),
            ...(input.date_to ? { dateTo: input.date_to } : {}),
            limit: input.limit ?? 10
          })
        });
      } catch (error) {
        return failure(error);
      }
    }
  );
}
