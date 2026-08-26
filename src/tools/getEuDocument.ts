import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { LegalResearchService } from '../server/services.js';
import { failure, languageSchema, readOnlyAnnotations, success, versionSchema } from './shared.js';
import { getEuDocumentOutputSchema } from './outputSchemas.js';

export function registerGetEuDocument(server: McpServer, service: LegalResearchService): void {
  server.registerTool(
    'get_eu_document',
    {
      title: 'Get EU legal document',
      description:
        'Retrieve an exact official language/version of an EU legal act by deterministic identifier.',
      inputSchema: z.object({
        identifier: z.string().min(1).max(500),
        language: languageSchema,
        version: versionSchema
      }),
      outputSchema: getEuDocumentOutputSchema,
      annotations: readOnlyAnnotations
    },
    async (input) => {
      try {
        return success(await service.getEuDocument(input));
      } catch (error) {
        return failure(error);
      }
    }
  );
}
