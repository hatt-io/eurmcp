import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { LegalResearchService } from '../server/services.js';
import { verifyLegalQuoteOutputSchema } from './outputSchemas.js';
import { failure, readOnlyAnnotations, success } from './shared.js';

export function registerVerifyLegalQuote(server: McpServer, service: LegalResearchService): void {
  server.registerTool(
    'verify_legal_quote',
    {
      title: 'Verify a legal quote',
      description:
        'Compare a quote only with one stored evidence anchor. Returns exact_match, normalized_match, or no_match.',
      inputSchema: z.strictObject({
        evidence_id: z.string().regex(/^sha256:[a-f0-9]{64}$/),
        anchor_id: z.string().regex(/^[a-f0-9]{64}$/),
        quote: z.string().max(200_000)
      }),
      outputSchema: verifyLegalQuoteOutputSchema,
      annotations: readOnlyAnnotations
    },
    async (input) => {
      try {
        return success(await service.verifyLegalQuote(input));
      } catch (error) {
        return failure(error);
      }
    }
  );
}
