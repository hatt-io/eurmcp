import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { LegalResearchService } from '../server/services.js';
import {
  dateSchema,
  failure,
  languageSchema,
  looseOutputSchema,
  readOnlyAnnotations,
  success
} from './shared.js';

const requiredVersion = z.union([
  z.literal('original'),
  z.literal('current_consolidated'),
  dateSchema
]);

export function registerCompareDocumentVersions(
  server: McpServer,
  service: LegalResearchService
): void {
  server.registerTool(
    'compare_document_versions',
    {
      title: 'Compare official EU document versions',
      description:
        'Return deterministic structural provision differences after whitespace/markup normalization; does not characterize legal effect.',
      inputSchema: z.object({
        document: z.string().min(1).max(500),
        version_a: requiredVersion,
        version_b: requiredVersion,
        language: languageSchema,
        article: z.string().max(40).optional()
      }),
      outputSchema: looseOutputSchema,
      annotations: readOnlyAnnotations
    },
    async (input) => {
      try {
        return success(await service.compareDocumentVersions(input));
      } catch (error) {
        return failure(error);
      }
    }
  );
}
