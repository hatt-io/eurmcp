import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { LegalResearchService } from '../server/services.js';
import { listDocumentVersionsOutputSchema } from './outputSchemas.js';
import { failure, languageSchema, readOnlyAnnotations, success } from './shared.js';

export function registerListDocumentVersions(
  server: McpServer,
  service: LegalResearchService
): void {
  server.registerTool(
    'list_document_versions',
    {
      title: 'List official document versions',
      description:
        'List the original act and every official consolidation, with requested-language availability reported without substitution.',
      inputSchema: z.strictObject({
        document: z.string().min(1).max(500),
        language: languageSchema
      }),
      outputSchema: listDocumentVersionsOutputSchema,
      annotations: readOnlyAnnotations
    },
    async (input) => {
      try {
        return success(await service.listDocumentVersions(input));
      } catch (error) {
        return failure(error);
      }
    }
  );
}
