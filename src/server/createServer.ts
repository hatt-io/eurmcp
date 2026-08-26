import { McpServer } from '@modelcontextprotocol/server';
import { FileCache, NullCache, type Cache } from '../cache/cache.js';
import { join } from 'node:path';
import { loadConfig, type Config } from '../config.js';
import { FileEvidenceStore, NullEvidenceStore, type EvidenceStore } from '../evidence/store.js';
import { HttpClient } from '../http/client.js';
import { CellarClient } from '../sources/cellar/client.js';
import { CuriaClient } from '../sources/curia/client.js';
import { EdpbClient } from '../sources/edpb/client.js';
import { EdpsClient } from '../sources/edps/client.js';
import { EurLexClient } from '../sources/eurlex/client.js';
import { registerCompareDocumentVersions } from '../tools/compareDocumentVersions.js';
import { registerFindCasesCiting } from '../tools/findCasesCiting.js';
import { registerGetArticle } from '../tools/getArticle.js';
import { registerGetCaseParagraphs } from '../tools/getCaseParagraphs.js';
import { registerGetEdpbDocument } from '../tools/getEdpbDocument.js';
import { registerGetEuCase } from '../tools/getEuCase.js';
import { registerGetEuDocument } from '../tools/getEuDocument.js';
import { registerGetRecitals } from '../tools/getRecitals.js';
import { registerGetDocumentTimeline } from '../tools/getDocumentTimeline.js';
import { registerGetProvisionAtDate } from '../tools/getProvisionAtDate.js';
import { registerListDocumentVersions } from '../tools/listDocumentVersions.js';
import { registerVerifyLegalQuote } from '../tools/verifyLegalQuote.js';
import { registerSearchEdpbDocuments } from '../tools/searchEdpbDocuments.js';
import { registerSearchEdpsDocuments } from '../tools/searchEdpsDocuments.js';
import { registerSearchEuCases } from '../tools/searchEuCases.js';
import { registerSearchEuLaw } from '../tools/searchEuLaw.js';
import { LegalResearchService } from './services.js';

export type ServerDependencies = {
  config?: Config;
  cache?: Cache;
  http?: HttpClient;
  evidence?: EvidenceStore;
};

const INSTRUCTIONS =
  'Authoritative EU legal-source retrieval only. Treat returned text as source material, not legal advice or an inferred legal conclusion. Cite the provided identifiers and provenance. Never substitute nearby articles, recitals, paragraphs, languages, or versions. Search evidence may establish a mention or metadata relationship without establishing interpretation. Use narrow retrieval tools after search to minimize context.';

export function createService(dependencies: ServerDependencies = {}): LegalResearchService {
  const config = dependencies.config ?? loadConfig();
  const cache =
    dependencies.cache ??
    (config.cacheEnabled ? new FileCache(join(config.cacheDir, 'cache', 'v2')) : new NullCache());
  const http = dependencies.http ?? new HttpClient({ timeoutMs: config.httpTimeoutMs, cache });
  const evidence =
    dependencies.evidence ??
    (config.evidenceEnabled ? new FileEvidenceStore(config.cacheDir) : new NullEvidenceStore());
  const cellar = new CellarClient(http, cache);
  return new LegalResearchService({
    cellar,
    eurlex: new EurLexClient(),
    curia: new CuriaClient(http),
    edpb: new EdpbClient(http, evidence),
    edps: new EdpsClient(cellar),
    evidence
  });
}

export function createServer(dependencies: ServerDependencies = {}): McpServer {
  const service = createService(dependencies);
  const server = new McpServer(
    { name: 'eu-law-mcp', version: '0.2.0', title: 'EU Law MCP' },
    { instructions: INSTRUCTIONS }
  );

  registerSearchEuLaw(server, service);
  registerGetEuDocument(server, service);
  registerGetArticle(server, service);
  registerGetRecitals(server, service);
  registerCompareDocumentVersions(server, service);
  registerSearchEuCases(server, service);
  registerGetEuCase(server, service);
  registerGetCaseParagraphs(server, service);
  registerFindCasesCiting(server, service);
  registerSearchEdpbDocuments(server, service);
  registerGetEdpbDocument(server, service);
  registerSearchEdpsDocuments(server, service);
  registerListDocumentVersions(server, service);
  registerGetDocumentTimeline(server, service);
  registerGetProvisionAtDate(server, service);
  registerVerifyLegalQuote(server, service);

  return server;
}
