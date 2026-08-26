import { describe, expect, it, vi } from 'vitest';
import { EuLawError } from '../../src/errors/errors.js';
import { LegalResearchService } from '../../src/server/services.js';
import { searchCaseLaw } from '../../src/sources/cellar/queries.js';

function createCaseSearchService() {
  const searchCaseLawMock = vi.fn().mockResolvedValue([]);
  const service = new LegalResearchService({
    cellar: { searchCaseLaw: searchCaseLawMock } as never,
    eurlex: {} as never,
    curia: {} as never,
    edpb: {} as never,
    edps: {} as never,
    evidence: {} as never
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

  it('resolves maintained aliases in provision filters', async () => {
    const { service, searchCaseLawMock } = createCaseSearchService();

    await service.searchEuCases({ provision: 'Article 82 GDPR', language: 'en' });

    expect(searchCaseLawMock).toHaveBeenCalledWith(
      expect.objectContaining({ interpretedCelex: '32016R0679' })
    );
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
});
