import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { EuLawError } from '../errors/errors.js';
import type { LegalResearchService } from '../server/services.js';
import {
  dateSchema,
  failure,
  languageSchema,
  limitSchema,
  readOnlyAnnotations,
  success
} from './shared.js';
import { searchEuCasesOutputSchema } from './outputSchemas.js';

export function registerSearchEuCases(server: McpServer, service: LegalResearchService): void {
  server.registerTool(
    'search_eu_cases',
    {
      title: 'Search EU case law',
      description:
        'Search authoritative CELLAR case-law metadata. query is an AND-of-tokens match over official case titles. provision and interpreted_celex use instrument-level CELLAR classification; they do not establish article-level relevance.',
      inputSchema: z.object({
        query: z
          .string()
          .max(500)
          .describe('AND-of-tokens full-text match over the official case title only')
          .optional(),
        case_number: z.string().max(80).optional(),
        ecli: z.string().max(100).optional(),
        celex: z
          .string()
          .max(50)
          .describe('Exact case-law CELEX identifier beginning with 6')
          .optional(),
        interpreted_celex: z
          .string()
          .max(50)
          .describe(
            'Legislation CELEX interpreted by returned cases; instrument-level metadata only'
          )
          .optional(),
        provision: z
          .string()
          .max(300)
          .describe(
            'Provision text containing a recognized instrument, such as "Article 82 GDPR"; filters at instrument level only'
          )
          .optional(),
        date_from: dateSchema.optional(),
        date_to: dateSchema.optional(),
        court: z.enum(['court_of_justice', 'general_court']).optional(),
        document_type: z.enum(['judgment', 'order', 'opinion']).optional(),
        language: languageSchema,
        limit: limitSchema
      }),
      outputSchema: searchEuCasesOutputSchema,
      annotations: readOnlyAnnotations
    },
    async (input) => {
      try {
        if (
          !input.query &&
          !input.case_number &&
          !input.ecli &&
          !input.celex &&
          !input.interpreted_celex &&
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
