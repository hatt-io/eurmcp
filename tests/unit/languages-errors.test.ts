import { describe, expect, it } from 'vitest';
import { EuLawError } from '../../src/errors/errors.js';
import { normalizeLanguage } from '../../src/legal/languages.js';
import { expandNumberSelection, normalizeArticleNumber } from '../../src/legal/provisions.js';

describe('language and selection validation', () => {
  it('normalizes English and Swedish without translation', () => {
    expect(normalizeLanguage('en')).toMatchObject({ iso2: 'en', cellar: 'ENG' });
    expect(normalizeLanguage('sv-SE')).toMatchObject({ iso2: 'sv', cellar: 'SWE' });
  });

  it('rejects unsupported language and malformed selections', () => {
    expect(() => normalizeLanguage('xx')).toThrowError(EuLawError);
    expect(() => normalizeArticleNumber('about twenty-two')).toThrowError(EuLawError);
    expect(() => expandNumberSelection({ from: 5, to: 2 })).toThrowError(EuLawError);
    expect(expandNumberSelection({ from: 42, to: 44 })).toEqual([42, 43, 44]);
  });
});
