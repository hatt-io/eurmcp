import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { LegalResearchService } from '../server/services.js';
import { failure, languageSchema, readOnlyAnnotations, success, versionSchema } from './shared.js';
import { getArticleOutputSchema } from './outputSchemas.js';

export function registerGetArticle(server: McpServer, service: LegalResearchService): void {
  server.registerTool(
    'get_article',
    {
      title: 'Get exact EU-law article',
      description:
        'Retrieve one structurally exact article, including numbered paragraphs and points, from official CELLAR XHTML.',
      inputSchema: z.object({
        document: z.string().min(1).max(500),
        article: z.string().min(1).max(40),
        language: languageSchema,
        version: versionSchema
      }),
      outputSchema: getArticleOutputSchema,
      annotations: readOnlyAnnotations
    },
    async (input) => {
      try {
        return success(await service.getArticle(input));
      } catch (error) {
        return failure(error);
      }
    }
  );
}
