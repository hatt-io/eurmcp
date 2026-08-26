import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { LegalResearchService } from '../server/services.js';
import { getProvisionAtDateOutputSchema } from './outputSchemas.js';
import { dateSchema, failure, languageSchema, readOnlyAnnotations, success } from './shared.js';

export function registerGetProvisionAtDate(server: McpServer, service: LegalResearchService): void {
  server.registerTool(
    'get_provision_at_date',
    {
      title: 'Get an article at a date',
      description:
        'Return an exact article from the latest safe official snapshot on or before a date; legal effect is not inferred.',
      inputSchema: z.strictObject({
        document: z.string().min(1).max(500),
        article: z.string().min(1).max(40),
        date: dateSchema,
        language: languageSchema
      }),
      outputSchema: getProvisionAtDateOutputSchema,
      annotations: readOnlyAnnotations
    },
    async (input) => {
      try {
        return success(await service.getProvisionAtDate(input));
      } catch (error) {
        return failure(error);
      }
    }
  );
}
