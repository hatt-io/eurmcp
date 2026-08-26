import { describe, expect, it } from 'vitest';
import { EuLawError } from '../../src/errors/errors.js';
import {
  caseNumberToCelex,
  celexToCaseNumber,
  normalizeCaseNumber,
  normalizeCelex,
  normalizeEcli,
  normalizeEli,
  parseIdentifier,
  parseIdentifierWithAliases
} from '../../src/legal/identifiers.js';

describe('deterministic identifiers', () => {
  it('normalizes CELEX and formal citations', () => {
    expect(normalizeCelex(' celex: 32016r0679 ')).toBe('32016R0679');
    expect(parseIdentifier('Regulation (EU) 2016/679')).toMatchObject({
      celex: '32016R0679',
      source: 'formal_citation'
    });
  });

  it('normalizes ELI, ECLI, case number, and cross-resolves case CELEX', () => {
    expect(normalizeEli('https://eur-lex.europa.eu/eli/reg/2016/679/oj/')).toBe(
      'http://data.europa.eu/eli/reg/2016/679/oj'
    );
    expect(normalizeEcli(' ecli:eu:c:2023:370 ')).toBe('ECLI:EU:C:2023:370');
    expect(normalizeCaseNumber('C – 0300 / 2021')).toBe('C-300/21');
    expect(caseNumberToCelex('C-300/21')).toBe('62021CJ0300');
    expect(celexToCaseNumber('62021CJ0300')).toBe('C-300/21');
  });

  it('uses only explicit aliases', () => {
    expect(parseIdentifier('GDPR')).toMatchObject({ celex: '32016R0679', source: 'alias' });
    expect(parseIdentifier('AI Act')).toMatchObject({ celex: '32024R1689', source: 'alias' });
    expect(() => parseIdentifier('probably the privacy regulation')).toThrow(EuLawError);
  });

  it('returns explicit ambiguity instead of choosing', () => {
    try {
      parseIdentifierWithAliases('shared name', { 'SHARED NAME': ['32016R0679', '32024R1689'] });
      throw new Error('expected ambiguity');
    } catch (error) {
      expect(error).toBeInstanceOf(EuLawError);
      expect((error as EuLawError).code).toBe('AMBIGUOUS_IDENTIFIER');
      expect((error as EuLawError).context.candidates).toEqual(['32016R0679', '32024R1689']);
    }
  });
});
