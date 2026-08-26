import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { EuLawError } from '../src/errors/errors.js';
import {
  extractArticle,
  extractCaseParagraphs,
  extractRecitals,
  parseCaseXhtml,
  parseLegislationXhtml
} from '../src/sources/cellar/parser.js';
import { parseEdpbDocumentPage, parseEdpbSearchPage } from '../src/sources/edpb/parser.js';

const fixture = (name: string) => readFile(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

describe('authoritative response fixtures', () => {
  it('preserves legislation hierarchy and exact source numbering', async () => {
    const source = await fixture('gdpr-en.xhtml');
    const parsed = parseLegislationXhtml(source);
    expect(parsed.detectedLanguage).toBe('en');
    expect(parsed.articles.map((article) => article.article)).toEqual(['22']);
    const article = extractArticle(source, '22');
    expect(article.heading).toContain('Automated individual');
    expect(article.paragraphs.map((paragraph) => paragraph.number)).toEqual(['1', '2']);
    expect(article.paragraphs[1]?.points?.map((point) => point.label)).toEqual(['a', 'b', 'c']);
    expect(article.paragraphs[1]?.points?.[2]?.points?.[0]?.label).toBe('i');
    expect(extractRecitals(source, [71])).toEqual([
      expect.objectContaining({ number: 71, text: expect.stringContaining('automated processing') })
    ]);
    expect(() => extractArticle(source, '999')).toThrowError(EuLawError);
  });

  it('parses the official consolidated XHTML structure separately', async () => {
    const article = extractArticle(await fixture('gdpr-consolidated-en.xhtml'), '22');
    expect(article.heading).toContain('Automated individual');
    expect(article.paragraphs.map((paragraph) => paragraph.number)).toEqual(['1', '2']);
    expect(article.paragraphs[1]?.points?.map((point) => point.label)).toEqual(['a', 'b']);
  });

  it('never renumbers, merges, or treats footnotes as judgment paragraphs', async () => {
    const source = await fixture('c-300-21-en.xhtml');
    const parsed = parseCaseXhtml(source);
    expect(parsed.caseNumber).toBe('C-300/21');
    expect(parsed.ecli).toBe('ECLI:EU:C:2023:370');
    expect(parsed.dateText).toBe('4 May 2023');
    expect(parsed.paragraphs.map((paragraph) => paragraph.number)).toEqual([42, 43, 50]);
    expect(parsed.paragraphs[1]?.text).not.toContain('Footnote text');
    expect(parsed.operativePart).toContain('The Court hereby rules');
    expect(extractCaseParagraphs(source, [50])[0]?.text).toContain('mere infringement');
    expect(() => extractCaseParagraphs(source, [49])).toThrowError(EuLawError);
  });

  it('fails when source numbering conflicts with source IDs', async () => {
    const source = (await fixture('c-300-21-en.xhtml')).replace(
      'id="point42">42',
      'id="point41">42'
    );
    expect(() => parseCaseXhtml(source)).toThrowError(EuLawError);
  });

  it('parses isolated official EDPB HTML and detects missing language', async () => {
    const search = parseEdpbSearchPage(
      await fixture('edpb-search.html'),
      'https://www.edpb.europa.eu/documents_en'
    );
    expect(search[0]).toMatchObject({ documentNumber: '05/2020', status: 'adopted' });
    const page = parseEdpbDocumentPage(
      await fixture('edpb-document.html'),
      'https://www.edpb.europa.eu/example_en',
      'sv'
    );
    expect(page.documentUrl).toContain('_sv.pdf');
    expect(() =>
      parseEdpbDocumentPage(
        '<html><body>AwsWafIntegration challenge-container</body></html>',
        'https://www.edpb.europa.eu/',
        'en'
      )
    ).toThrowError(EuLawError);
  });
});
