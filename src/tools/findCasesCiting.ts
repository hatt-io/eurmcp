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

export function registerFindCasesCiting(server: McpServer, service: LegalResearchService): void {
  server.registerTool(
    'find_cases_citing',
    {
      title: 'Find cases citing a judgment',
      description:
        'Find citing judgments through authoritative CELLAR work_cites_work relationships, never keyword co-occurrence.',
      inputSchema: z.object({
        case: z.string().min(1).max(200),
        court: z.enum(['court_of_justice', 'general_court']).optional(),
        date_from: dateSchema.optional(),
        date_to: dateSchema.optional(),
        language: languageSchema,
        limit: limitSchema
      }),
      outputSchema: looseOutputSchema,
      annotations: readOnlyAnnotations
    },
    async (input) => {
      try {
        return success(await service.findCasesCiting(input));
      } catch (error) {
        return failure(error);
      }
    }
  );
}
