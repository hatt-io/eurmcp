import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { EuLawError } from '../errors/errors.js';
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

export function registerSearchEuCases(server: McpServer, service: LegalResearchService): void {
  server.registerTool(
    'search_eu_cases',
    {
      title: 'Search EU case law',
      description:
        'Search authoritative CELLAR case-law metadata. Match evidence distinguishes metadata links from article-level mentions.',
      inputSchema: z.object({
        query: z.string().max(500).optional(),
        case_number: z.string().max(80).optional(),
        ecli: z.string().max(100).optional(),
        celex: z.string().max(50).optional(),
        provision: z.string().max(300).optional(),
        date_from: dateSchema.optional(),
        date_to: dateSchema.optional(),
        court: z.enum(['court_of_justice', 'general_court']).optional(),
        document_type: z.enum(['judgment', 'order', 'opinion']).optional(),
        language: languageSchema,
        limit: limitSchema
      }),
      outputSchema: looseOutputSchema,
      annotations: readOnlyAnnotations
    },
    async (input) => {
      try {
        if (
          !input.query &&
          !input.case_number &&
          !input.ecli &&
          !input.celex &&
          !input.provision &&
          !input.date_from &&
          !input.date_to
        ) {
          throw new EuLawError('INVALID_ARGUMENT', 'At least one search criterion is required', {
            argument: 'search criteria'
          });
        }
        return success({ results: await service.searchEuCases(input) });
      } catch (error) {
        return failure(error);
      }
    }
  );
}
