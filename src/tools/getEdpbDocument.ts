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

export function registerGetEdpbDocument(server: McpServer, service: LegalResearchService): void {
  server.registerTool(
    'get_edpb_document',
    {
      title: 'Get EDPB document',
      description:
        'Retrieve text from an official EDPB PDF and preserve visible numbered paragraphs where extractable.',
      inputSchema: z.object({
        identifier_or_url: z.string().min(1).max(1000),
        language: languageSchema
      }),
      outputSchema: looseOutputSchema,
      annotations: readOnlyAnnotations
    },
    async (input) => {
      try {
        return success(await service.getEdpbDocument(input));
      } catch (error) {
        return failure(error);
      }
    }
  );
}
