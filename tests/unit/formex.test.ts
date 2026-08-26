import { describe, expect, it } from 'vitest';
import { sha256 } from '../../src/evidence/normalization.js';
import {
  parseLegislationFormex4,
  parseOfficialLegislation
} from '../../src/sources/cellar/parserRegistry.js';

describe('official parser registry', () => {
  const formex = `<ACT><TITLE>Example act</TITLE>
    <CONSIDERANT ID="rct_1"><NO.CONS>(1)</NO.CONS><TXT>Reason.</TXT></CONSIDERANT>
    <ARTICLE ID="art_1"><NO.ART>Article 1</NO.ART><TI.ART>Scope</TI.ART>
      <PARAG ID="art_1_par_1"><NO.PARAG>1</NO.PARAG><TXT>This applies.</TXT></PARAG>
    </ARTICLE></ACT>`;

  it('parses registered Formex4 structure with stable anchors', () => {
    const parsed = parseLegislationFormex4(formex, {
      evidenceId: `sha256:${sha256(formex)}`
    });
    expect(parsed.title).toBe('Example act');
    expect(parsed.articles[0]).toMatchObject({ article: '1', heading: 'Scope' });
    expect(parsed.articles[0]?.paragraphs[0]).toMatchObject({ number: '1', text: 'This applies.' });
    expect(parsed.recitals[0]).toMatchObject({ number: 1, text: 'Reason.' });
    expect(parsed.articles[0]?.source_anchor?.source_element_id).toBe('art_1');
  });

  it('preserves provision identity across Formex4 and XHTML', () => {
    const xhtml = `<html><body><div class="eli-main-title">Example act</div>
      <div class="eli-subdivision" id="art_1"><div class="eli-title"><span class="oj-sti-art">Scope</span></div>
      <div id="001.001"><p>1. This applies.</p></div></div></body></html>`;
    const left = parseOfficialLegislation(formex, 'application/xml');
    const right = parseOfficialLegislation(xhtml, 'application/xhtml+xml');
    expect(left.articles[0]?.article).toBe(right.articles[0]?.article);
    expect(left.articles[0]?.paragraphs[0]).toMatchObject(right.articles[0]?.paragraphs[0] ?? {});
  });

  it('fails closed for an unregistered media type', () => {
    expect(() =>
      parseOfficialLegislation(formex, 'application/json' as 'application/xml')
    ).toThrow();
  });
});
