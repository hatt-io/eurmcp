import { readFile } from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';
import { NullEvidenceStore } from '../../src/evidence/store.js';
import { sha256 } from '../../src/evidence/normalization.js';
import { EuLawError } from '../../src/errors/errors.js';
import {
  findCaseProvisionMentions,
  parseCaseProvisionReference
} from '../../src/legal/caseSearch.js';
import { LegalResearchService } from '../../src/server/services.js';
import { parseCaseXhtml } from '../../src/sources/cellar/parser.js';
import { searchCaseLaw } from '../../src/sources/cellar/queries.js';
import type { CellarWork } from '../../src/sources/cellar/types.js';

function createCaseSearchService(options: { rows?: CellarWork[]; xhtml?: string } = {}) {
  const searchCaseLawMock = vi.fn().mockResolvedValue(options.rows ?? []);
  const item = {
    workUri: 'https://publications.europa.eu/resource/cellar/case-work',
    expressionUri: 'https://publications.europa.eu/resource/cellar/case-expression',
    language: 'ENG',
    format: 'xhtml',
    itemUri: 'https://publications.europa.eu/resource/cellar/case-item',
    manifestationUri: 'https://publications.europa.eu/resource/cellar/case-manifestation'
  };
  const bytes = new TextEncoder().encode(options.xhtml ?? '');
  const service = new LegalResearchService({
    cellar: {
      searchCaseLaw: searchCaseLawMock,
      getXhtmlItem: vi.fn().mockResolvedValue(item),
      downloadXhtml: vi.fn().mockResolvedValue({
        ...item,
        item,
        url: item.itemUri,
        contentType: 'application/xhtml+xml',
        bytes,
        retrievedAt: '2026-08-26T00:00:00.000Z',
        headers: {},
        status: 200,
        byteCount: bytes.byteLength,
        rawSha256: sha256(bytes),
        cacheStatus: 'miss',
        text: () => options.xhtml ?? ''
      })
    } as never,
    eurlex: { documentUrl: () => 'https://eur-lex.europa.eu/' } as never,
    curia: { caseUrl: () => 'https://curia.europa.eu/' } as never,
    edpb: {} as never,
    edps: {} as never,
    evidence: new NullEvidenceStore()
  });
  return { service, searchCaseLawMock };
}

describe('case search filters', () => {
  it('rejects a provision whose instrument cannot be resolved', async () => {
    const { service, searchCaseLawMock } = createCaseSearchService();

    await expect(
      service.searchEuCases({ provision: 'Article 82', language: 'en' })
    ).rejects.toMatchObject<Partial<EuLawError>>({ code: 'INVALID_ARGUMENT' });
    expect(searchCaseLawMock).not.toHaveBeenCalled();
  });

  it('reports malformed formal instruments as invalid provision arguments', async () => {
    const { service, searchCaseLawMock } = createCaseSearchService();

    await expect(
      service.searchEuCases({
        provision: 'Article 82 of Regulation (EU) 2016/99999',
        language: 'en'
      })
    ).rejects.toMatchObject<Partial<EuLawError>>({
      code: 'INVALID_ARGUMENT',
      context: { argument: 'provision' }
    });
    expect(searchCaseLawMock).not.toHaveBeenCalled();
  });

  it('resolves maintained aliases in provision filters', async () => {
    const { service, searchCaseLawMock } = createCaseSearchService();

    await service.searchEuCases({ provision: 'Article 82 GDPR', language: 'en' });

    expect(searchCaseLawMock).toHaveBeenCalledWith(
      expect.objectContaining({
        interpretedCelex: '32016R0679',
        requiresHtml: true,
        limit: 100
      })
    );
  });

  it('requires an article rather than treating an instrument as a provision', async () => {
    const { service, searchCaseLawMock } = createCaseSearchService();

    await expect(
      service.searchEuCases({ provision: 'GDPR', language: 'en' })
    ).rejects.toMatchObject<Partial<EuLawError>>({ code: 'INVALID_ARGUMENT' });
    expect(searchCaseLawMock).not.toHaveBeenCalled();
  });

  it('returns only cases with paragraph-level article evidence', async () => {
    const xhtml = await readFile(new URL('../fixtures/c-300-21-en.xhtml', import.meta.url), 'utf8');
    const work: CellarWork = {
      cellarUri: 'https://publications.europa.eu/resource/cellar/case-work',
      celex: '62021CJ0300',
      ecli: 'ECLI:EU:C:2023:370',
      title: 'UI v Österreichische Post AG',
      dateDocument: '2023-05-04',
      languages: ['ENG']
    };
    const { service } = createCaseSearchService({ rows: [work], xhtml });

    const article82 = await service.searchEuCases({
      provision: 'Article 82 GDPR',
      language: 'en'
    });
    expect(article82).toHaveLength(1);
    expect(article82[0]?.match_evidence?.[0]).toMatchObject({
      field: 'case_paragraph',
      scope: 'paragraph:50',
      paragraph: 50,
      source_anchor: { kind: 'case_paragraph', location: 'Paragraph 50' }
    });
    expect(article82[0]?.provenance).toMatchObject({
      source_url: 'https://publications.europa.eu/resource/cellar/case-item',
      parser_name: 'cellar-official-xhtml',
      snapshot_available: false
    });

    const article22 = await service.searchEuCases({
      provision: 'Article 22 GDPR',
      language: 'en'
    });
    expect(article22).toEqual([]);
  });

  it('requires the article and instrument to occur in the same numbered paragraph', () => {
    const parsed = parseCaseXhtml(
      '<html><body><table><tr><td><p class="coj-count" id="point1">1</p></td><td>Article 82 TFEU applies.</td></tr></table><table><tr><td><p class="coj-count" id="point2">2</p></td><td>The GDPR is also relevant.</td></tr></table></body></html>',
      { evidenceId: `sha256:${'a'.repeat(64)}` }
    );
    const reference = parseCaseProvisionReference('Article 82 GDPR');

    expect(findCaseProvisionMentions(parsed.paragraphs, reference)).toEqual([]);
  });

  it('rejects a different article linked to the instrument in the same paragraph', () => {
    const reference = parseCaseProvisionReference('Article 22 GDPR');
    const paragraphs = [
      {
        number: 1,
        text: 'Article 22 of the Constitution applies, read with Article 23 of the GDPR.'
      },
      {
        number: 2,
        text: 'Article 15 of the GDPR refers elsewhere in its text to Article 22(1).'
      }
    ];

    expect(findCaseProvisionMentions(paragraphs, reference)).toEqual([]);
  });

  it('accepts the requested article when it is linked directly to the instrument', () => {
    const reference = parseCaseProvisionReference('Article 22 GDPR');
    const paragraph = {
      number: 1,
      text: 'This request concerns Article 15(1)(h) and Article 22 of Regulation (EU) 2016/679.'
    };

    expect(findCaseProvisionMentions([paragraph], reference)).toEqual([paragraph]);
  });

  it('accepts the requested article in a plural article list', () => {
    const reference = parseCaseProvisionReference('Article 22 GDPR');
    const paragraph = {
      number: 1,
      text: 'The request concerns Articles 15, 21 and 22 of the GDPR.'
    };

    expect(findCaseProvisionMentions([paragraph], reference)).toEqual([paragraph]);
  });

  it('rejects an article that appears only as the end of a range', () => {
    const reference = parseCaseProvisionReference('Article 22 GDPR');
    const paragraph = {
      number: 1,
      text: 'The rights in Articles 12 to 22 of the GDPR must be respected.'
    };

    expect(findCaseProvisionMentions([paragraph], reference)).toEqual([]);
  });

  it('parses official legacy CELLAR case HTML', () => {
    const parsed = parseCaseXhtml(
      '<HTML><BODY><P class="C19Centre">JUDGMENT OF THE COURT</P><P>Case C‑300/21</P><P class="C01PointnumeroteAltN"><A NAME="point50">50</A>&nbsp; Article 82(1) of the GDPR must be interpreted.</P></BODY></HTML>',
      { evidenceId: `sha256:${'b'.repeat(64)}` }
    );

    expect(parsed).toMatchObject({
      title: 'JUDGMENT OF THE COURT',
      caseNumber: 'C-300/21',
      paragraphs: [
        {
          number: 50,
          text: 'Article 82(1) of the GDPR must be interpreted.',
          source_anchor: { kind: 'case_paragraph', location: 'Paragraph 50' }
        }
      ]
    });
  });

  it('parses older official XHTML converter paragraphs', () => {
    const parsed = parseCaseXhtml(
      '<html><body><p class="sum-title-1"><a id="judgment"/>JUDGMENT OF THE COURT</p><p class="normal">In Case C‑673/17,</p><table><tr><td><p class="count" id="point1">1</p></td><td><p class="normal">Article 22 of the GDPR applies.</p></td></tr></table></body></html>'
    );

    expect(parsed).toMatchObject({
      caseNumber: 'C-673/17',
      paragraphs: [{ number: 1, text: 'Article 22 of the GDPR applies.' }]
    });
  });

  it('accepts an explicit legislation CELEX as an instrument filter', async () => {
    const { service, searchCaseLawMock } = createCaseSearchService();

    await service.searchEuCases({ interpreted_celex: '32016r0679', language: 'en' });

    expect(searchCaseLawMock).toHaveBeenCalledWith(
      expect.objectContaining({ interpretedCelex: '32016R0679' })
    );
  });

  it('rejects legislation passed as an exact case CELEX', async () => {
    const { service, searchCaseLawMock } = createCaseSearchService();

    await expect(
      service.searchEuCases({ celex: '32016R0679', language: 'en' })
    ).rejects.toMatchObject<Partial<EuLawError>>({ code: 'INVALID_ARGUMENT' });
    expect(searchCaseLawMock).not.toHaveBeenCalled();
  });

  it('rejects silently competing filters', async () => {
    const { service, searchCaseLawMock } = createCaseSearchService();

    await expect(
      service.searchEuCases({
        case_number: 'C-300/21',
        ecli: 'ECLI:EU:C:2023:370',
        language: 'en'
      })
    ).rejects.toMatchObject<Partial<EuLawError>>({ code: 'INVALID_ARGUMENT' });
    await expect(
      service.searchEuCases({
        provision: 'Article 82 GDPR',
        interpreted_celex: '32016R0679',
        language: 'en'
      })
    ).rejects.toMatchObject<Partial<EuLawError>>({ code: 'INVALID_ARGUMENT' });
    expect(searchCaseLawMock).not.toHaveBeenCalled();
  });

  it('guards every query branch as case law and ranks title matches', () => {
    const query = searchCaseLaw({
      query: 'data protection',
      language: 'ENG',
      ecli: 'ECLI:EU:C:2023:370',
      limit: 10
    });

    expect(query).toContain('FILTER(STRSTARTS(STR(?celex), "6"))');
    expect(query).toContain("'data' AND 'protection'");
    expect(query).toContain('OPTION (score ?rank)');
    expect(query).toContain('ORDER BY DESC(?rank) DESC(?dateDocument) ?celex');
  });

  it('can require a downloadable official HTML case expression', () => {
    const query = searchCaseLaw({ language: 'ENG', requiresHtml: true, limit: 10 });

    expect(query).toContain('cdm:manifestation_manifests_expression ?expression');
    expect(query).toContain('FILTER(LCASE(STR(?format)) IN ("html", "xhtml"))');
  });
});
