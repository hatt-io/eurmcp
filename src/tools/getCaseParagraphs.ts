import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { LegalResearchService } from '../server/services.js';
import {
  failure,
  languageSchema,
  looseOutputSchema,
  numberSelectionSchema,
  readOnlyAnnotations,
  success
} from './shared.js';

export function registerGetCaseParagraphs(server: McpServer, service: LegalResearchService): void {
  server.registerTool(
    'get_case_paragraphs',
    {
      title: 'Get exact judgment paragraphs',
      description:
        'Retrieve only requested, source-numbered paragraphs. Missing numbers return PARAGRAPH_NOT_FOUND.',
      inputSchema: z.object({
        case: z.string().min(1).max(200),
        paragraphs: numberSelectionSchema,
        language: languageSchema
      }),
      outputSchema: looseOutputSchema,
      annotations: readOnlyAnnotations
    },
    async (input) => {
      try {
        return success(await service.getCaseParagraphs(input));
      } catch (error) {
        return failure(error);
      }
    }
  );
}
