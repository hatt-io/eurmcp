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

export function registerSearchEdpbDocuments(
  server: McpServer,
  service: LegalResearchService
): void {
  server.registerTool(
    'search_edpb_documents',
    {
      title: 'Search EDPB documents',
      description: 'Search the official EDPB document catalogue through its public website.',
      inputSchema: z.object({
        query: z.string().min(2).max(500),
        document_type: z
          .enum(['guideline', 'recommendation', 'opinion', 'statement', 'decision', 'other'])
          .optional(),
        status: z.enum(['adopted', 'consultation', 'all']).optional(),
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
          results: await service.searchEdpbDocuments({
            query: input.query,
            ...(input.document_type ? { documentType: input.document_type } : {}),
            ...(input.status ? { status: input.status } : {}),
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
