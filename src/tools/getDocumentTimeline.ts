import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { LegalResearchService } from '../server/services.js';
import { getDocumentTimelineOutputSchema } from './outputSchemas.js';
import { failure, languageSchema, readOnlyAnnotations, success } from './shared.js';

export function registerGetDocumentTimeline(
  server: McpServer,
  service: LegalResearchService
): void {
  server.registerTool(
    'get_document_timeline',
    {
      title: 'Get official document timeline',
      description:
        'Return original, corrigendum, amending-act, and consolidation events as distinct official resources.',
      inputSchema: z.strictObject({
        document: z.string().min(1).max(500),
        language: languageSchema
      }),
      outputSchema: getDocumentTimelineOutputSchema,
      annotations: readOnlyAnnotations
    },
    async (input) => {
      try {
        return success(await service.getDocumentTimeline(input));
      } catch (error) {
        return failure(error);
      }
    }
  );
}
