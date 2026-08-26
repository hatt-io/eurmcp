import { cacheTtl } from '../cache/cache.js';
import { EuLawError } from '../errors/errors.js';
import {
  caseNumberToCelex,
  celexToCaseNumber,
  parseIdentifier,
  type CaseIdentifier,
  type LegislationIdentifier
} from '../legal/identifiers.js';
import { normalizeDocumentType, resourceTypeName } from '../legal/documentTypes.js';
import { normalizeForDiff } from '../legal/citations.js';
import { normalizeLanguage } from '../legal/languages.js';
import { expandNumberSelection, normalizeArticleNumber } from '../legal/provisions.js';
import { normalizeVersion, type VersionInfo, type VersionRequest } from '../legal/versions.js';
import type { CellarClient } from '../sources/cellar/client.js';
import {
  extractArticle,
  extractCaseParagraphs,
  extractRecitals,
  parseCaseXhtml,
  parseLegislationXhtml
} from '../sources/cellar/parser.js';
import type { CellarWork } from '../sources/cellar/types.js';
import type { CuriaClient } from '../sources/curia/client.js';
import type { EdpbClient } from '../sources/edpb/client.js';
import type { EdpsClient } from '../sources/edps/client.js';
import type { EurLexClient } from '../sources/eurlex/client.js';
import { eurLexEcliUrl } from '../sources/eurlex/links.js';
import type { DocumentRelationship, ParsedArticle, Provenance } from '../types.js';

type ResolvedDocument = { work: CellarWork; celex: string };
type ResolvedVersion = ResolvedDocument & { version: VersionInfo };

function compact<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}

function cellarProvenance(work: CellarWork, sourceUrl: string, language?: string): Provenance {
  return compact({
    publisher: 'Publications Office of the European Union',
    source_system: 'CELLAR',
    source_url: sourceUrl,
    retrieved_at: new Date().toISOString(),
    identifier: work.celex ?? work.ecli,
    language,
    celex: work.celex,
    eli: work.eli,
    ecli: work.ecli,
    cellar_uri: work.cellarUri
  });
}

function caseDocumentType(celex: string): string {
  const code = celex.slice(6, 7);
  return code === 'J'
    ? 'judgment'
    : code === 'O'
      ? 'order'
      : code === 'C'
        ? 'opinion'
        : 'court document';
}

function courtFromCelex(celex: string): string {
  const code = celex.slice(5, 6);
  return code === 'C' ? 'Court of Justice' : code === 'T' ? 'General Court' : 'EU court';
}

function extractInstrumentFromProvision(provision: string): string | undefined {
  const match = /(?:Regulation|Directive|Decision)\s*(?:\(EU\))?\s*\d{4}\/\d+/i.exec(provision);
  if (!match) return undefined;
  try {
    const parsed = parseIdentifier(match[0]);
    return parsed.kind === 'legislation' ? parsed.celex : undefined;
  } catch {
    return undefined;
  }
}

export class LegalResearchService {
  readonly #cellar: CellarClient;
  readonly #eurlex: EurLexClient;
  readonly #curia: CuriaClient;
  readonly #edpb: EdpbClient;
  readonly #edps: EdpsClient;

  constructor(dependencies: {
    cellar: CellarClient;
    eurlex: EurLexClient;
    curia: CuriaClient;
    edpb: EdpbClient;
    edps: EdpsClient;
  }) {
    this.#cellar = dependencies.cellar;
    this.#eurlex = dependencies.eurlex;
    this.#curia = dependencies.curia;
    this.#edpb = dependencies.edpb;
    this.#edps = dependencies.edps;
  }

  async #resolveLegislation(identifier: string, language = 'en'): Promise<ResolvedDocument> {
    const parsed = parseIdentifier(identifier);
    if (parsed.kind !== 'legislation') {
      throw new EuLawError('INVALID_IDENTIFIER', 'Expected a legislation identifier', {
        identifier
      });
    }
    return this.#resolveLegislationIdentifier(parsed, language);
  }

  async #resolveLegislationIdentifier(
    parsed: LegislationIdentifier,
    language: string
  ): Promise<ResolvedDocument> {
    const lang = normalizeLanguage(language);
    let candidates: CellarWork[];
    if (parsed.celex) {
      const work = await this.#cellar.findWorkByCelex(parsed.celex, lang.cellar);
      candidates = work ? [work] : [];
    } else if (parsed.eli) {
      candidates = await this.#cellar.findWorkByEli(parsed.eli, lang.cellar);
    } else {
      candidates = [];
    }
    if (!candidates.length) {
      const exists = parsed.celex
        ? await this.#cellar.hasWorkByCelex(parsed.celex)
        : parsed.eli
          ? await this.#cellar.hasWorkByEli(parsed.eli)
          : false;
      if (exists) {
        throw new EuLawError(
          'LANGUAGE_NOT_AVAILABLE',
          'Official language expression was not found',
          {
            identifier: parsed.celex ?? parsed.eli,
            language: lang.iso2
          }
        );
      }
      throw new EuLawError('DOCUMENT_NOT_FOUND', 'EU legal document not found', {
        identifier: parsed.celex ?? parsed.eli,
        language: lang.iso2
      });
    }
    if (candidates.length > 1) {
      throw new EuLawError(
        'AMBIGUOUS_IDENTIFIER',
        'Identifier resolved to multiple official works',
        {
          identifier: parsed.celex ?? parsed.eli,
          candidates: candidates.map((work) =>
            compact({ celex: work.celex, eli: work.eli, cellar_uri: work.cellarUri })
          )
        }
      );
    }
    const work = candidates[0]!;
    if (!work.celex)
      throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'Resolved legislation lacks CELEX', {
        cellar_uri: work.cellarUri
      });
    return { work, celex: work.celex };
  }

  async #resolveVersion(
    document: string,
    language: string,
    request?: VersionRequest
  ): Promise<ResolvedVersion> {
    const resolved = await this.#resolveLegislation(document, language);
    const version = normalizeVersion(request);
    if (version === 'original') {
      if (resolved.celex.startsWith('0')) {
        const date = /-(\d{4})(\d{2})(\d{2})$/.exec(resolved.celex);
        if (!date?.[1] || !date[2] || !date[3])
          throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'Consolidated CELEX lacks date');
        const value = `${date[1]}-${date[2]}-${date[3]}`;
        return {
          ...resolved,
          version: { type: 'consolidated', date: value, consolidation_date: value }
        };
      }
      return { ...resolved, version: { type: 'original' } };
    }
    const consolidations = await this.#cellar.findConsolidations(resolved.celex);
    const selected =
      version === 'current_consolidated'
        ? consolidations[0]
        : consolidations.find((item) => item.date === version);
    if (!selected) {
      throw new EuLawError('VERSION_NOT_FOUND', 'Requested official consolidation was not found', {
        document: resolved.celex,
        requested_version: version,
        available_versions: consolidations.map((item) => item.date)
      });
    }
    const work = await this.#cellar.findWorkByCelex(
      selected.celex,
      normalizeLanguage(language).cellar
    );
    if (!work)
      throw new EuLawError(
        'VERSION_NOT_FOUND',
        'Consolidated work has no requested language expression',
        {
          document: resolved.celex,
          requested_version: selected.date,
          language
        }
      );
    return {
      work,
      celex: selected.celex,
      version: { type: 'consolidated', date: selected.date, consolidation_date: selected.date }
    };
  }

  async #loadLegislation(document: string, language: string, version?: VersionRequest) {
    const lang = normalizeLanguage(language);
    const resolved = await this.#resolveVersion(document, lang.iso2, version);
    const item = await this.#cellar.getXhtmlItem(resolved.work.cellarUri, lang.cellar);
    const downloaded = await this.#cellar.downloadXhtml(
      item,
      resolved.version.type === 'original' ? cacheTtl.historicalDocument : cacheTtl.mutableDocument
    );
    const parsed = parseLegislationXhtml(downloaded.text);
    if (
      parsed.detectedLanguage &&
      parsed.detectedLanguage !== lang.iso2.toUpperCase().toLowerCase()
    ) {
      const expectedHeader = lang.cellar === 'SWE' ? 'sv' : lang.iso2;
      if (parsed.detectedLanguage !== expectedHeader) {
        throw new EuLawError(
          'UPSTREAM_FORMAT_CHANGED',
          'CELLAR content language marker disagrees with requested expression',
          {
            requested_language: lang.iso2,
            detected_language: parsed.detectedLanguage,
            source_url: downloaded.url
          }
        );
      }
    }
    return { lang, resolved, downloaded, parsed };
  }

  async searchEuLaw(input: {
    query: string;
    language?: string;
    document_type?: string;
    date_from?: string;
    date_to?: string;
    in_force?: boolean;
    limit?: number;
  }) {
    const lang = normalizeLanguage(input.language);
    const documentType = input.document_type
      ? normalizeDocumentType(input.document_type)
      : undefined;
    const rows = await this.#cellar.searchLegislation({
      query: input.query,
      language: lang.cellar,
      ...(documentType ? { documentType } : {}),
      ...(input.date_from ? { dateFrom: input.date_from } : {}),
      ...(input.date_to ? { dateTo: input.date_to } : {}),
      ...(input.in_force === undefined ? {} : { inForce: input.in_force }),
      limit: input.limit ?? 10
    });
    return rows.map((work) =>
      compact({
        title: work.title ?? work.celex ?? work.cellarUri,
        celex: work.celex,
        eli: work.eli,
        document_type: resourceTypeName(work.resourceTypeUri),
        date_document: work.dateDocument,
        date_publication: work.datePublication,
        date_effect: work.dateEffect,
        date_end_validity: work.dateEndValidity,
        in_force: work.inForce,
        languages: [lang.iso2],
        eurlex_url: work.celex ? this.#eurlex.documentUrl(work.celex, lang.iso2) : undefined,
        cellar_uri: work.cellarUri,
        provenance: cellarProvenance(
          work,
          'https://publications.europa.eu/webapi/rdf/sparql',
          lang.iso2
        )
      })
    );
  }

  async getEuDocument(input: { identifier: string; language?: string; version?: VersionRequest }) {
    const loaded = await this.#loadLegislation(
      input.identifier,
      input.language ?? 'en',
      input.version
    );
    const relationships: DocumentRelationship[] = await this.#cellar.findRelationships(
      loaded.resolved.work.cellarUri
    );
    return {
      title: loaded.parsed.title,
      identifiers: compact({
        celex: loaded.resolved.celex,
        eli: loaded.resolved.work.eli,
        cellar_uri: loaded.resolved.work.cellarUri
      }),
      document_type: resourceTypeName(loaded.resolved.work.resourceTypeUri),
      language: loaded.lang.iso2,
      version: loaded.resolved.version,
      text: loaded.parsed.text,
      metadata: compact({
        date_document: loaded.resolved.work.dateDocument,
        date_publication: loaded.resolved.work.datePublication,
        date_effect: loaded.resolved.work.dateEffect,
        date_end_validity: loaded.resolved.work.dateEndValidity,
        in_force: loaded.resolved.work.inForce,
        relationships,
        eurlex_url: this.#eurlex.documentUrl(loaded.resolved.celex, loaded.lang.iso2)
      }),
      provenance: cellarProvenance(loaded.resolved.work, loaded.downloaded.url, loaded.lang.iso2)
    };
  }

  async getArticle(input: {
    document: string;
    article: string;
    language?: string;
    version?: VersionRequest;
  }) {
    const loaded = await this.#loadLegislation(
      input.document,
      input.language ?? 'en',
      input.version
    );
    const article = extractArticle(loaded.downloaded.text, normalizeArticleNumber(input.article));
    return compact({
      document: compact({
        title: loaded.parsed.title,
        celex: loaded.resolved.celex,
        eli: loaded.resolved.work.eli
      }),
      article: article.article,
      heading: article.heading,
      paragraphs: article.paragraphs,
      language: loaded.lang.iso2,
      version: loaded.resolved.version,
      provenance: cellarProvenance(loaded.resolved.work, loaded.downloaded.url, loaded.lang.iso2)
    });
  }

  async getRecitals(input: {
    document: string;
    recitals: readonly number[] | { from: number; to: number };
    language?: string;
    version?: VersionRequest;
  }) {
    const numbers = expandNumberSelection(input.recitals);
    const loaded = await this.#loadLegislation(
      input.document,
      input.language ?? 'en',
      input.version
    );
    return {
      document: compact({
        title: loaded.parsed.title,
        celex: loaded.resolved.celex,
        eli: loaded.resolved.work.eli
      }),
      recitals: extractRecitals(loaded.downloaded.text, numbers),
      language: loaded.lang.iso2,
      provenance: cellarProvenance(loaded.resolved.work, loaded.downloaded.url, loaded.lang.iso2)
    };
  }

  async compareDocumentVersions(input: {
    document: string;
    version_a: string;
    version_b: string;
    language?: string;
    article?: string;
  }) {
    const language = input.language ?? 'en';
    const [a, b] = await Promise.all([
      this.#loadLegislation(input.document, language, input.version_a),
      this.#loadLegislation(input.document, language, input.version_b)
    ]);
    const select = (articles: ParsedArticle[]): ParsedArticle[] =>
      input.article
        ? articles.filter((article) => article.article === normalizeArticleNumber(input.article!))
        : articles;
    const aArticles = select(a.parsed.articles);
    const bArticles = select(b.parsed.articles);
    if (input.article && !aArticles.length)
      throw new EuLawError('ARTICLE_NOT_FOUND', 'Article missing from version A', {
        article: input.article
      });
    if (input.article && !bArticles.length)
      throw new EuLawError('ARTICLE_NOT_FOUND', 'Article missing from version B', {
        article: input.article
      });
    const flatten = (articles: ParsedArticle[]): Map<string, string> => {
      const values = new Map<string, string>();
      for (const article of articles) {
        for (const paragraph of article.paragraphs) {
          const base = `Article ${article.article}${paragraph.number ? `(${paragraph.number})` : ''}`;
          values.set(base, paragraph.text);
          const addPoints = (
            points: NonNullable<typeof paragraph.points>,
            parent: string
          ): void => {
            for (const point of points) {
              const location = `${parent}(${point.label})`;
              values.set(location, point.text);
              if (point.points?.length) addPoints(point.points, location);
            }
          };
          addPoints(paragraph.points ?? [], base);
        }
      }
      return values;
    };
    const before = flatten(aArticles);
    const after = flatten(bArticles);
    const locations = [...new Set([...before.keys(), ...after.keys()])];
    const changes: {
      location: string;
      change_type: 'modified' | 'added' | 'removed';
      before?: string;
      after?: string;
    }[] = [];
    for (const location of locations) {
      const left = before.get(location);
      const right = after.get(location);
      if (left === undefined && right !== undefined) {
        changes.push({ location, change_type: 'added', after: right });
        continue;
      }
      if (right === undefined && left !== undefined) {
        changes.push({ location, change_type: 'removed', before: left });
        continue;
      }
      if (normalizeForDiff(left!) !== normalizeForDiff(right!)) {
        changes.push({ location, change_type: 'modified', before: left!, after: right! });
      }
    }
    return {
      document: compact({
        title: a.parsed.title,
        celex: a.resolved.work.celex,
        eli: a.resolved.work.eli
      }),
      version_a: a.resolved.version,
      version_b: b.resolved.version,
      changes,
      provenance_a: cellarProvenance(a.resolved.work, a.downloaded.url, a.lang.iso2),
      provenance_b: cellarProvenance(b.resolved.work, b.downloaded.url, b.lang.iso2)
    };
  }

  async #resolveCase(
    identifier: string,
    language = 'en',
    documentType = 'judgment'
  ): Promise<ResolvedDocument> {
    const parsed = parseIdentifier(identifier);
    if (parsed.kind !== 'case')
      throw new EuLawError('INVALID_IDENTIFIER', 'Expected a case identifier', { identifier });
    return this.#resolveCaseIdentifier(parsed, language, documentType);
  }

  async #resolveCaseIdentifier(
    parsed: CaseIdentifier,
    language: string,
    documentType: string
  ): Promise<ResolvedDocument> {
    const lang = normalizeLanguage(language);
    let candidates: CellarWork[] = [];
    if (parsed.ecli) candidates = await this.#cellar.findWorkByEcli(parsed.ecli, lang.cellar);
    else {
      const celex =
        parsed.celex ??
        (parsed.caseNumber ? caseNumberToCelex(parsed.caseNumber, documentType) : undefined);
      if (celex) {
        const work = await this.#cellar.findWorkByCelex(celex, lang.cellar);
        if (work) candidates = [work];
      }
    }
    if (!candidates.length) {
      const expectedCelex =
        parsed.celex ??
        (parsed.caseNumber ? caseNumberToCelex(parsed.caseNumber, documentType) : undefined);
      const exists = parsed.ecli
        ? await this.#cellar.hasWorkByEcli(parsed.ecli)
        : expectedCelex
          ? await this.#cellar.hasWorkByCelex(expectedCelex)
          : false;
      if (exists) {
        throw new EuLawError(
          'LANGUAGE_NOT_AVAILABLE',
          'Official case language expression was not found',
          {
            identifier: parsed.ecli ?? expectedCelex ?? parsed.caseNumber,
            language: lang.iso2
          }
        );
      }
      throw new EuLawError('CASE_NOT_FOUND', 'EU court document not found', {
        identifier: parsed.ecli ?? expectedCelex ?? parsed.caseNumber,
        language: lang.iso2
      });
    }
    if (candidates.length > 1)
      throw new EuLawError('AMBIGUOUS_IDENTIFIER', 'Case identifier matched multiple works', {
        candidates: candidates.map((work) =>
          compact({ celex: work.celex, ecli: work.ecli, cellar_uri: work.cellarUri })
        )
      });
    const work = candidates[0]!;
    if (!work.celex)
      throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'Resolved case lacks CELEX', {
        cellar_uri: work.cellarUri
      });
    return { work, celex: work.celex };
  }

  async #loadCase(identifier: string, language: string, documentType = 'judgment') {
    const lang = normalizeLanguage(language);
    const resolved = await this.#resolveCase(identifier, lang.iso2, documentType);
    const item = await this.#cellar.getXhtmlItem(resolved.work.cellarUri, lang.cellar);
    const downloaded = await this.#cellar.downloadXhtml(item, cacheTtl.immutableJudgment);
    const parsed = parseCaseXhtml(downloaded.text);
    const canonicalCase = celexToCaseNumber(resolved.celex);
    const discrepancies: { field: string; metadata: string; content: string }[] = [];
    if (canonicalCase && parsed.caseNumber && canonicalCase !== parsed.caseNumber)
      discrepancies.push({
        field: 'case_number',
        metadata: canonicalCase,
        content: parsed.caseNumber
      });
    if (resolved.work.ecli && parsed.ecli && resolved.work.ecli !== parsed.ecli)
      discrepancies.push({ field: 'ecli', metadata: resolved.work.ecli, content: parsed.ecli });
    return { lang, resolved, downloaded, parsed, canonicalCase, discrepancies };
  }

  async searchEuCases(input: {
    query?: string;
    case_number?: string;
    ecli?: string;
    celex?: string;
    provision?: string;
    date_from?: string;
    date_to?: string;
    court?: 'court_of_justice' | 'general_court';
    document_type?: 'judgment' | 'order' | 'opinion';
    language?: string;
    limit?: number;
  }) {
    const lang = normalizeLanguage(input.language);
    const celex =
      input.celex ??
      (input.case_number ? caseNumberToCelex(input.case_number, input.document_type) : undefined);
    const interpretedCelex = input.provision
      ? extractInstrumentFromProvision(input.provision)
      : undefined;
    const rows = await this.#cellar.searchCaseLaw({
      ...(input.query ? { query: input.query } : {}),
      language: lang.cellar,
      ...(celex ? { celex } : {}),
      ...(input.ecli ? { ecli: input.ecli.toUpperCase() } : {}),
      ...(interpretedCelex ? { interpretedCelex } : {}),
      ...(input.date_from ? { dateFrom: input.date_from } : {}),
      ...(input.date_to ? { dateTo: input.date_to } : {}),
      ...(input.court ? { court: input.court } : {}),
      ...(input.document_type ? { documentType: input.document_type } : {}),
      limit: input.limit ?? 10
    });
    return rows.map((work) => {
      const caseNumber = work.celex ? celexToCaseNumber(work.celex) : undefined;
      const evidence = [
        ...(input.query ? [{ field: 'expression_title', value: input.query }] : []),
        ...(input.provision && interpretedCelex
          ? [
              {
                field: 'case-law_interpretes_resource_legal',
                value: `Instrument ${interpretedCelex}; this metadata does not establish a specific-article interpretation.`
              }
            ]
          : [])
      ];
      return compact({
        case_number: caseNumber ?? work.celex ?? 'unknown',
        case_name: work.title,
        ecli: work.ecli,
        celex: work.celex,
        court: work.celex ? courtFromCelex(work.celex) : undefined,
        chamber: work.chamberUri?.split('/').pop(),
        document_type: work.celex ? caseDocumentType(work.celex) : undefined,
        date: work.dateDocument,
        eurlex_url: work.celex ? this.#eurlex.documentUrl(work.celex, lang.iso2) : undefined,
        curia_url: caseNumber ? this.#curia.caseUrl(caseNumber, lang.iso2) : undefined,
        match_evidence: evidence.length ? evidence : undefined,
        provenance: cellarProvenance(
          work,
          'https://publications.europa.eu/webapi/rdf/sparql',
          lang.iso2
        )
      });
    });
  }

  async getEuCase(input: {
    identifier: string;
    language?: string;
    document_type?: 'judgment' | 'order' | 'opinion';
  }) {
    const loaded = await this.#loadCase(
      input.identifier,
      input.language ?? 'en',
      input.document_type ?? 'judgment'
    );
    const caseNumber = loaded.canonicalCase ?? loaded.parsed.caseNumber;
    if (!caseNumber || !loaded.resolved.work.dateDocument) {
      throw new EuLawError(
        'UPSTREAM_FORMAT_CHANGED',
        'Case metadata omitted required case number or date',
        {
          celex: loaded.resolved.celex
        }
      );
    }
    return compact({
      case_number: caseNumber,
      case_name: loaded.parsed.title ?? loaded.resolved.work.title,
      identifiers: compact({
        ecli: loaded.resolved.work.ecli ?? loaded.parsed.ecli,
        celex: loaded.resolved.celex
      }),
      court: courtFromCelex(loaded.resolved.celex),
      chamber: loaded.resolved.work.chamberUri?.split('/').pop(),
      date: loaded.resolved.work.dateDocument,
      document_type: caseDocumentType(loaded.resolved.celex),
      language: loaded.lang.iso2,
      paragraphs: loaded.parsed.paragraphs,
      operative_part: loaded.parsed.operativePart,
      source_consistency: { discrepancies: loaded.discrepancies },
      eurlex_url: loaded.resolved.work.ecli
        ? eurLexEcliUrl(loaded.resolved.work.ecli, loaded.lang.iso2)
        : this.#eurlex.documentUrl(loaded.resolved.celex, loaded.lang.iso2),
      curia_url: this.#curia.caseUrl(caseNumber, loaded.lang.iso2),
      provenance: cellarProvenance(loaded.resolved.work, loaded.downloaded.url, loaded.lang.iso2)
    });
  }

  async getCaseParagraphs(input: {
    case: string;
    paragraphs: readonly number[] | { from: number; to: number };
    language?: string;
  }) {
    const numbers = expandNumberSelection(input.paragraphs);
    const loaded = await this.#loadCase(input.case, input.language ?? 'en');
    const caseNumber = loaded.canonicalCase ?? loaded.parsed.caseNumber;
    if (!caseNumber)
      throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'Case number missing from official sources');
    return {
      case_number: caseNumber,
      identifiers: compact({
        ecli: loaded.resolved.work.ecli ?? loaded.parsed.ecli,
        celex: loaded.resolved.celex
      }),
      language: loaded.lang.iso2,
      paragraphs: extractCaseParagraphs(loaded.downloaded.text, numbers),
      provenance: cellarProvenance(loaded.resolved.work, loaded.downloaded.url, loaded.lang.iso2)
    };
  }

  async findCasesCiting(input: {
    case: string;
    court?: 'court_of_justice' | 'general_court';
    date_from?: string;
    date_to?: string;
    language?: string;
    limit?: number;
  }) {
    const lang = normalizeLanguage(input.language);
    const target = await this.#resolveCase(input.case, lang.iso2);
    const targetNumber = celexToCaseNumber(target.celex);
    if (!targetNumber)
      throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'Target CELEX is not a recognized judgment');
    const rows = (
      await this.#cellar.findCitations(
        target.work.cellarUri,
        Math.min((input.limit ?? 10) * 4, 200)
      )
    )
      .filter((work) => !input.date_from || (work.dateDocument ?? '') >= input.date_from)
      .filter((work) => !input.date_to || (work.dateDocument ?? '9999') <= input.date_to)
      .filter(
        (work) =>
          !input.court ||
          (input.court === 'court_of_justice'
            ? work.celex?.slice(5, 6) === 'C'
            : work.celex?.slice(5, 6) === 'T')
      )
      .slice(0, input.limit ?? 10);
    return {
      cited_case: compact({
        case_number: targetNumber,
        ecli: target.work.ecli,
        celex: target.celex
      }),
      citing_cases: rows.map((work) =>
        compact({
          case_number: work.celex ? celexToCaseNumber(work.celex) : undefined,
          ecli: work.ecli,
          celex: work.celex,
          date: work.dateDocument,
          provenance: {
            ...cellarProvenance(
              work,
              'https://publications.europa.eu/webapi/rdf/sparql',
              lang.iso2
            ),
            methodology:
              'Authoritative CELLAR cdm:work_cites_work relationship; not keyword co-occurrence.'
          }
        })
      )
    };
  }

  searchEdpbDocuments(input: Parameters<EdpbClient['search']>[0]) {
    return this.#edpb.search(input);
  }

  async getEdpbDocument(input: { identifier_or_url: string; language?: string }) {
    const language = normalizeLanguage(input.language).iso2;
    const result = await this.#edpb.get(input.identifier_or_url, language);
    return compact({
      title: result.page.title,
      document_number: result.page.documentNumber,
      document_type: result.page.documentType,
      adoption_date: result.page.adoptionDate,
      version: result.page.version,
      status: result.page.status,
      language: result.language,
      text: result.text,
      sections: result.sections,
      provenance: result.provenance
    });
  }

  searchEdpsDocuments(input: Parameters<EdpsClient['search']>[0]) {
    return this.#edps.search(input);
  }
}
