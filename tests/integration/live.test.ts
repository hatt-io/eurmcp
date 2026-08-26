import { describe, expect, it } from 'vitest';
import { FileCache } from '../../src/cache/cache.js';
import { EuLawError } from '../../src/errors/errors.js';
import { createService } from '../../src/server/createServer.js';

const live = process.env.EU_LAW_LIVE_TESTS === '1' ? describe : describe.skip;
const service = createService({ cache: new FileCache('.eu-law-cache/live-tests') });

live.sequential('live authoritative EU services', () => {
  it('runs configured rotating official-language canaries', async () => {
    const languages = (process.env.EU_LAW_CANARY_LANGUAGES ?? '')
      .split(',')
      .map((language) => language.trim())
      .filter(Boolean);
    for (const language of languages) {
      const article = await service.getArticle({
        document: 'GDPR',
        article: '22',
        language,
        version: 'original'
      });
      const recital = await service.getRecitals({
        document: 'GDPR',
        recitals: [71],
        language,
        version: 'original'
      });
      expect(article.language).toBe(language);
      expect(article.paragraphs.length).toBeGreaterThan(0);
      expect(recital.recitals[0]?.number).toBe(71);
    }
  });
  it('retrieves mandatory GDPR articles and recital in official languages', async () => {
    for (const article of ['5', '6', '22', '25', '82']) {
      const result = await service.getArticle({
        document: '32016R0679',
        article,
        language: 'en',
        version: 'original'
      });
      expect(result.article).toBe(article);
      expect(result.language).toBe('en');
      expect(result.paragraphs.length).toBeGreaterThan(0);
      expect(result.provenance.celex).toBe('32016R0679');
    }
    for (const article of ['22', '82']) {
      const result = await service.getArticle({
        document: 'Regulation (EU) 2016/679',
        article,
        language: 'sv'
      });
      expect(result.article).toBe(article);
      expect(result.language).toBe('sv');
      expect(result.provenance.language).toBe('sv');
    }
    const recital = await service.getRecitals({ document: 'GDPR', recitals: [71], language: 'en' });
    expect(recital.recitals[0]?.number).toBe(71);
    expect(recital.recitals[0]?.text.length).toBeGreaterThan(100);
  });

  it('distinguishes original and current official consolidated GDPR versions', async () => {
    const original = await service.getEuDocument({
      identifier: 'GDPR',
      language: 'en',
      version: 'original'
    });
    const consolidated = await service.getEuDocument({
      identifier: '32016R0679',
      language: 'en',
      version: 'current_consolidated'
    });
    expect(original.version.type).toBe('original');
    expect(consolidated.version.type).toBe('consolidated');
    expect(consolidated.version.consolidation_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const comparison = await service.compareDocumentVersions({
      document: 'GDPR',
      version_a: 'original',
      version_b: 'current_consolidated',
      language: 'en',
      article: '22'
    });
    expect(Array.isArray(comparison.changes)).toBe(true);
  });

  it('lists the GDPR timeline and performs safe point-in-time retrieval', async () => {
    const versions = await service.listDocumentVersions({ document: 'GDPR', language: 'en' });
    expect(versions.versions[0]).toMatchObject({
      type: 'original',
      celex: '32016R0679',
      language_available: true
    });
    expect(versions.versions.some((version) => version.type === 'consolidated')).toBe(true);
    const timeline = await service.getDocumentTimeline({ document: 'GDPR', language: 'en' });
    expect(timeline.events.some((event) => event.event_type === 'original')).toBe(true);
    expect(timeline.events.some((event) => event.event_type === 'consolidation')).toBe(true);
    const article = await service.getProvisionAtDate({
      document: 'GDPR',
      article: '22',
      date: '2016-05-04',
      language: 'en'
    });
    expect(article).toMatchObject({
      article: '22',
      snapshot_date: '2016-05-04',
      legal_effect_not_inferred: true
    });
  });

  it('verifies anchored legal quotes in English and Swedish without repair', async () => {
    for (const language of ['en', 'sv']) {
      const article = await service.getArticle({
        document: 'GDPR',
        article: '22',
        language,
        version: 'original'
      });
      const paragraph = article.paragraphs[0]!;
      expect(article.provenance.snapshot_available).toBe(true);
      expect(paragraph.source_anchor).toBeDefined();
      await expect(
        service.verifyLegalQuote({
          evidence_id: article.provenance.evidence_id!,
          anchor_id: paragraph.source_anchor!.anchor_id,
          quote: paragraph.text
        })
      ).resolves.toMatchObject({ result: 'exact_match' });
      await expect(
        service.verifyLegalQuote({
          evidence_id: article.provenance.evidence_id!,
          anchor_id: paragraph.source_anchor!.anchor_id,
          quote: `${paragraph.text} changed`
        })
      ).resolves.toMatchObject({ result: 'no_match' });
      const recitals = await service.getRecitals({
        document: 'GDPR',
        recitals: [71],
        language,
        version: 'original'
      });
      await expect(
        service.verifyLegalQuote({
          evidence_id: recitals.provenance.evidence_id!,
          anchor_id: recitals.recitals[0]!.source_anchor!.anchor_id,
          quote: recitals.recitals[0]!.text
        })
      ).resolves.toMatchObject({ result: 'exact_match' });
    }
  });

  it('cross-resolves C-300/21 identifiers and retrieves exact numbered paragraphs', async () => {
    const identifiers = ['C-300/21', '62021CJ0300', 'ECLI:EU:C:2023:370'];
    const documents = [];
    for (const identifier of identifiers) {
      documents.push(await service.getEuCase({ identifier, language: 'en' }));
    }
    expect(new Set(documents.map((document) => document.case_number))).toEqual(
      new Set(['C-300/21'])
    );
    expect(new Set(documents.map((document) => document.identifiers.celex))).toEqual(
      new Set(['62021CJ0300'])
    );
    expect(new Set(documents.map((document) => document.identifiers.ecli))).toEqual(
      new Set(['ECLI:EU:C:2023:370'])
    );
    expect(documents[0]?.source_consistency.discrepancies).toEqual([]);

    const exact = await service.getCaseParagraphs({
      case: 'C-300/21',
      paragraphs: [42, 43, 50],
      language: 'en'
    });
    expect(exact.paragraphs.map((paragraph) => paragraph.number)).toEqual([42, 43, 50]);
    const range = await service.getCaseParagraphs({
      case: '62021CJ0300',
      paragraphs: { from: 42, to: 50 },
      language: 'sv'
    });
    expect(range.paragraphs.map((paragraph) => paragraph.number)).toEqual([
      42, 43, 44, 45, 46, 47, 48, 49, 50
    ]);
    expect(range.language).toBe('sv');

    const paragraph50 = await service.getCaseParagraphs({
      case: 'C-300/21',
      paragraphs: [50],
      language: 'en'
    });
    await expect(
      service.verifyLegalQuote({
        evidence_id: paragraph50.provenance.evidence_id!,
        anchor_id: paragraph50.paragraphs[0]!.source_anchor!.anchor_id,
        quote: paragraph50.paragraphs[0]!.text
      })
    ).resolves.toMatchObject({ result: 'exact_match' });
    const paragraph50Sv = await service.getCaseParagraphs({
      case: 'C-300/21',
      paragraphs: [50],
      language: 'sv'
    });
    await expect(
      service.verifyLegalQuote({
        evidence_id: paragraph50Sv.provenance.evidence_id!,
        anchor_id: paragraph50Sv.paragraphs[0]!.source_anchor!.anchor_id,
        quote: paragraph50Sv.paragraphs[0]!.text
      })
    ).resolves.toMatchObject({ result: 'exact_match' });

    try {
      await service.getCaseParagraphs({ case: 'C-300/21', paragraphs: [999], language: 'en' });
      throw new Error('expected missing paragraph');
    } catch (error) {
      expect(error).toBeInstanceOf(EuLawError);
      expect((error as EuLawError).code).toBe('PARAGRAPH_NOT_FOUND');
      expect((error as EuLawError).context.requested_paragraph).toBe(999);
    }
  });

  it('searches official metadata and preserves limited evidence claims', async () => {
    const privacy = await service.searchEuLaw({
      query: 'data protection',
      language: 'en',
      limit: 50
    });
    expect(privacy.some((result) => result.celex === '32016R0679')).toBe(true);
    const ai = await service.searchEuLaw({
      query: 'artificial intelligence',
      language: 'en',
      limit: 20
    });
    expect(ai.some((result) => result.celex === '32024R1689')).toBe(true);
    const cases = await service.searchEuCases({
      provision: 'Article 82 Regulation (EU) 2016/679',
      language: 'en',
      limit: 50
    });
    expect(cases.some((result) => result.celex === '62021CJ0300')).toBe(true);
    expect(
      cases.every((result) =>
        result.match_evidence?.some(
          (evidence) =>
            evidence.field === 'case_paragraph' &&
            evidence.paragraph &&
            evidence.source_anchor?.kind === 'case_paragraph'
        )
      )
    ).toBe(true);
  });

  it('uses authoritative citation relationships and official regulator sources', async () => {
    const citations = await service.findCasesCiting({ case: 'C-300/21', language: 'en', limit: 5 });
    expect(citations.cited_case.celex).toBe('62021CJ0300');
    expect(citations.citing_cases.length).toBeGreaterThan(0);
    expect(citations.citing_cases[0]?.provenance.methodology).toContain('work_cites_work');

    const edpb = await service.searchEdpbDocuments({ query: 'consent', status: 'all', limit: 10 });
    expect(edpb.some((result) => result.document_number === '05/2020')).toBe(true);
    const edpbDocument = await service.getEdpbDocument({
      identifier_or_url:
        'https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en',
      language: 'en'
    });
    expect(edpbDocument.text.length).toBeGreaterThan(1000);
    expect(edpbDocument.provenance.publisher).toBe('European Data Protection Board');

    const edps = await service.searchEdpsDocuments({ query: 'artificial intelligence', limit: 10 });
    expect(edps.length).toBeGreaterThan(0);
    expect(edps[0]?.provenance.source_system).toContain('CELLAR');
  });
});
