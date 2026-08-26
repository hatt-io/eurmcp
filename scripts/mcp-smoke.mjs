/* global console, process */
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

const client = new Client({ name: 'eu-law-mcp-smoke', version: '1.0.0' });
const transport = new StdioClientTransport({
  command: process.execPath,
  args: ['dist/index.js'],
  cwd: process.cwd(),
  stderr: 'pipe',
  maxBufferSize: 20 * 1024 * 1024
});

const stderr = [];
transport.stderr?.on('data', (chunk) => stderr.push(String(chunk)));

const calls = [
  ['search_eu_law', { query: 'artificial intelligence', language: 'en', limit: 5 }],
  ['get_eu_document', { identifier: 'GDPR', language: 'en', version: 'original' }],
  ['get_article', { document: '32016R0679', article: '22', language: 'sv' }],
  ['get_recitals', { document: 'GDPR', recitals: [71], language: 'en' }],
  [
    'compare_document_versions',
    {
      document: 'GDPR',
      version_a: 'original',
      version_b: 'current_consolidated',
      language: 'en',
      article: '22'
    }
  ],
  [
    'search_eu_cases',
    { provision: 'Article 82 Regulation (EU) 2016/679', language: 'en', limit: 5 }
  ],
  ['get_eu_case', { identifier: 'ECLI:EU:C:2023:370', language: 'en' }],
  ['get_case_paragraphs', { case: 'C-300/21', paragraphs: { from: 42, to: 44 }, language: 'sv' }],
  ['find_cases_citing', { case: '62021CJ0300', language: 'en', limit: 3 }],
  ['search_edpb_documents', { query: 'consent', status: 'all', limit: 5 }],
  [
    'get_edpb_document',
    {
      identifier_or_url:
        'https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en',
      language: 'en'
    }
  ],
  ['search_edps_documents', { query: 'artificial intelligence', limit: 5 }],
  ['list_document_versions', { document: 'GDPR', language: 'en' }],
  ['get_document_timeline', { document: 'GDPR', language: 'en' }],
  ['get_provision_at_date', { document: 'GDPR', article: '22', date: '2016-05-04', language: 'en' }]
];

try {
  await client.connect(transport);
  const listed = await client.listTools();
  const names = listed.tools.map((tool) => tool.name).sort();
  assert.equal(names.length, calls.length + 1);
  const results = new Map();
  for (const [name, argumentsValue] of calls) {
    const result = await client.callTool({ name, arguments: argumentsValue });
    assert.equal(
      result.isError,
      undefined,
      `${name} returned an error: ${JSON.stringify(result.content)}`
    );
    assert.notEqual(result.structuredContent, undefined, `${name} omitted structured output`);
    assert.equal(result.structuredContent.api_version, '1.0');
    results.set(name, result.structuredContent);
    console.log(`PASS ${name}`);
  }

  const article = results.get('get_article');
  const quoteAnchor = article.paragraphs[0].source_anchor;
  const quoteMismatch = await client.callTool({
    name: 'verify_legal_quote',
    arguments: {
      evidence_id: article.provenance.evidence_id,
      anchor_id: quoteAnchor.anchor_id,
      quote: `${article.paragraphs[0].text} changed`
    }
  });
  assert.equal(quoteMismatch.isError, undefined);
  assert.equal(quoteMismatch.structuredContent.result, 'no_match');
  console.log('PASS verify_legal_quote no_match');

  const missingEvidence = await client.callTool({
    name: 'verify_legal_quote',
    arguments: {
      evidence_id: `sha256:${'0'.repeat(64)}`,
      anchor_id: '0'.repeat(64),
      quote: 'text'
    }
  });
  assert.equal(missingEvidence.isError, true);
  assert.equal(missingEvidence.structuredContent.error, 'EVIDENCE_NOT_FOUND');
  console.log('PASS error EVIDENCE_NOT_FOUND');

  const missingAnchor = await client.callTool({
    name: 'verify_legal_quote',
    arguments: {
      evidence_id: article.provenance.evidence_id,
      anchor_id: '0'.repeat(64),
      quote: 'text'
    }
  });
  assert.equal(missingAnchor.isError, true);
  assert.equal(missingAnchor.structuredContent.error, 'SOURCE_ANCHOR_NOT_FOUND');
  console.log('PASS error SOURCE_ANCHOR_NOT_FOUND');

  const missingParagraph = await client.callTool({
    name: 'get_case_paragraphs',
    arguments: { case: 'C-300/21', paragraphs: [999], language: 'en' }
  });
  assert.equal(missingParagraph.isError, true);
  assert.equal(missingParagraph.structuredContent.error, 'PARAGRAPH_NOT_FOUND');
  console.log('PASS error PARAGRAPH_NOT_FOUND');

  const invalidIdentifier = await client.callTool({
    name: 'get_eu_document',
    arguments: { identifier: 'not a legal identifier', language: 'en' }
  });
  assert.equal(invalidIdentifier.isError, true);
  assert.equal(invalidIdentifier.structuredContent.error, 'INVALID_IDENTIFIER');
  console.log('PASS error INVALID_IDENTIFIER');

  assert.equal(
    stderr.join(''),
    '',
    `server wrote diagnostics during successful smoke run: ${stderr.join('')}`
  );
} finally {
  await client.close();
}
