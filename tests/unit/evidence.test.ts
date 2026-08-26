import { mkdir, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  FileEvidenceStore,
  type EvidenceStore,
  verifyStoredQuote
} from '../../src/evidence/store.js';
import { normalizeLegalText, sha256 } from '../../src/evidence/normalization.js';
import { parseLegislationXhtml } from '../../src/sources/cellar/parser.js';
import { officialEuLanguageCodes } from '../../src/legal/languages.js';

const testRoot = join(process.cwd(), 'codex-tmp-evidence-tests');

afterEach(async () => {
  await rm(testRoot, { recursive: true, force: true });
});

describe('durable evidence', () => {
  it('normalizes legal text without changing case, punctuation, or diacritics', () => {
    expect(normalizeLegalText('  Ångström\r\nArticle\u00a022.  ')).toBe('Ångström Article 22.');
    expect(normalizeLegalText('Case A')).not.toBe(normalizeLegalText('case A'));
  });

  it('stores content-addressed source bytes and anchor metadata with private permissions', async () => {
    await mkdir(testRoot, { recursive: true });
    const store = new FileEvidenceStore(testRoot);
    const bytes = new TextEncoder().encode('<html>official</html>');
    const hash = sha256(bytes);
    const anchor = {
      anchor_id: sha256(`sha256:${hash}\0parser-1\0Article 1`),
      kind: 'article',
      location: 'Article 1',
      source_element_id: 'art_1',
      structural_path: '#art_1',
      text_sha256: sha256('Official text'),
      text: 'Official text'
    };
    const evidenceId = await store.put(bytes, {
      media_type: 'application/xhtml+xml',
      source_url: 'https://publications.europa.eu/resource/cellar/example',
      retrieved_at: '2026-08-26T00:00:00.000Z',
      parser_name: 'fixture',
      parser_version: '1',
      normalized_text_sha256: sha256('Official text'),
      anchors: [anchor]
    });
    expect(evidenceId).toBe(`sha256:${hash}`);
    expect((await store.get(evidenceId)).anchors).toEqual([anchor]);
    const mode = (await stat(join(testRoot, 'evidence', 'v1', `${hash}.source`))).mode & 0o777;
    expect(mode).toBe(0o600);
    await expect(
      verifyStoredQuote(store, {
        evidence_id: evidenceId,
        anchor_id: anchor.anchor_id,
        quote: 'Official text'
      })
    ).resolves.toMatchObject({ result: 'exact_match' });
    await expect(
      verifyStoredQuote(store, {
        evidence_id: evidenceId,
        anchor_id: anchor.anchor_id,
        quote: '  Official\u00a0text '
      })
    ).resolves.toMatchObject({ result: 'normalized_match' });
    await expect(
      verifyStoredQuote(store, {
        evidence_id: evidenceId,
        anchor_id: anchor.anchor_id,
        quote: 'Changed text'
      })
    ).resolves.toMatchObject({ result: 'no_match' });
    await expect(
      verifyStoredQuote(store, {
        evidence_id: evidenceId,
        anchor_id: '0'.repeat(64),
        quote: 'Official text'
      })
    ).rejects.toMatchObject({ code: 'SOURCE_ANCHOR_NOT_FOUND' });
    const duplicateStore: EvidenceStore = {
      enabled: true,
      put: store.put.bind(store),
      async get() {
        const record = await store.get(evidenceId);
        return { ...record, anchors: [record.anchors[0]!, record.anchors[0]!] };
      }
    };
    await expect(
      verifyStoredQuote(duplicateStore, {
        evidence_id: evidenceId,
        anchor_id: anchor.anchor_id,
        quote: 'Official text'
      })
    ).rejects.toMatchObject({ code: 'UPSTREAM_FORMAT_CHANGED' });
  });

  it('generates stable unique anchors from official XHTML identifiers', () => {
    const source = `<!doctype html><html><body>
      <div class="eli-main-title">Act</div><div class="oj-hd-lg">EN</div>
      <div class="eli-subdivision" id="rct_1"><table><tr><td>(1)</td><td>Reason.</td></tr></table></div>
      <div class="eli-subdivision" id="art_1"><p class="oj-normal">Rule.</p></div>
    </body></html>`;
    const evidenceId = `sha256:${sha256(source)}`;
    const first = parseLegislationXhtml(source, { evidenceId });
    const second = parseLegislationXhtml(source, { evidenceId });
    expect(first.anchors).toEqual(second.anchors);
    expect(new Set(first.anchors.map((item) => item.anchor.anchor_id)).size).toBe(
      first.anchors.length
    );
    expect(first.articles[0]?.source_anchor?.source_element_id).toBe('art_1');
    expect(first.recitals[0]?.source_anchor?.source_element_id).toBe('rct_1');
  });

  it('keeps provision boundaries across all 24 official language markers', () => {
    expect(officialEuLanguageCodes).toHaveLength(24);
    for (const language of officialEuLanguageCodes) {
      const source = `<html><body><div class="eli-main-title">Act</div>
        <div class="oj-hd-lg">${language.toUpperCase()}</div>
        <div class="eli-subdivision" id="rct_71"><table><tr><td>(71)</td><td>Text.</td></tr></table></div>
        <div class="eli-subdivision" id="art_22"><p class="oj-normal">Rule.</p></div>
      </body></html>`;
      const parsed = parseLegislationXhtml(source);
      expect(parsed.detectedLanguage).toBe(language);
      expect(parsed.articles.map((article) => article.article)).toEqual(['22']);
      expect(parsed.recitals.map((recital) => recital.number)).toEqual([71]);
    }
  });
});
