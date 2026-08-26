import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { LegalResearchService } from '../server/services.js';
import {
  failure,
  languageSchema,
  looseOutputSchema,
  readOnlyAnnotations,
  success
} from './shared.js';

export function registerGetEuCase(server: McpServer, service: LegalResearchService): void {
  server.registerTool(
    'get_eu_case',
    {
      title: 'Get EU court document',
      description:
        'Retrieve an exact official EU court document with source paragraph numbering preserved.',
      inputSchema: z.object({
        identifier: z.string().min(1).max(200),
        language: languageSchema,
        document_type: z.enum(['judgment', 'order', 'opinion']).optional()
      }),
      outputSchema: looseOutputSchema,
      annotations: readOnlyAnnotations
    },
    async (input) => {
      try {
        return success(await service.getEuCase(input));
      } catch (error) {
        return failure(error);
      }
    }
  );
}
