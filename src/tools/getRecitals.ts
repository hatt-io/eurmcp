import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { LegalResearchService } from '../server/services.js';
import {
  failure,
  languageSchema,
  numberSelectionSchema,
  readOnlyAnnotations,
  success,
  versionSchema
} from './shared.js';
import { getRecitalsOutputSchema } from './outputSchemas.js';

export function registerGetRecitals(server: McpServer, service: LegalResearchService): void {
  server.registerTool(
    'get_recitals',
    {
      title: 'Get exact EU-law recitals',
      description: 'Retrieve selected, source-numbered recitals from an official EU legal text.',
      inputSchema: z.object({
        document: z.string().min(1).max(500),
        recitals: numberSelectionSchema,
        language: languageSchema,
        version: versionSchema
      }),
      outputSchema: getRecitalsOutputSchema,
      annotations: readOnlyAnnotations
    },
    async (input) => {
      try {
        return success(await service.getRecitals(input));
      } catch (error) {
        return failure(error);
      }
    }
  );
}
