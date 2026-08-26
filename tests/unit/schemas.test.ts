import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import * as z from 'zod/v4';
import { toolOutputSchemas } from '../../src/tools/outputSchemas.js';

describe('versioned output contracts', () => {
  const contractHashes: Record<string, string> = {
    search_eu_law: 'd95ddbf572e6eac86cae86dfaed8e69d3d785e0e3cb0d44a15620c46a9914a54',
    get_eu_document: 'ef91ded4257944af596d49ba7fec89e626e0d65a99453a4b78e67174cd99f3f1',
    get_article: '68c01ce320d5295dd2b29bdd0b7bb3e68072735c863136aeab39cad30921c092',
    get_recitals: '193a56f39611278196e0428ad032bb6e9d1202655ea0771b412a72f483b54881',
    compare_document_versions: 'c89fea288d9b95b24a5d7b034e427b45045330bed70be7b3e5c5088eaccbb300',
    search_eu_cases: 'e4193a267f653914a73eccb9be20882aa8651cd34649f50b123f4e51987641bb',
    get_eu_case: 'a495d9b863d87e320c368631cb9a7ace6671b186a025303bc991ab47e613bc38',
    get_case_paragraphs: '44bc090ca77913528c61067b241f8ae110c7f90dbe47bc8c0ed2e5650489dbcd',
    find_cases_citing: '5b9ce325467a5a222bc23902079cbab882a32c8a587415dda901b8706e47ebc5',
    search_edpb_documents: 'e7a7c53fd3eb50d5e009edae83091fb90e7439d53da585aacf43366067cb2060',
    get_edpb_document: '57c15ca642c059fd1a57f91d96a9a9f10da1865b0e7532384f1d7959e6bb5012',
    search_edps_documents: 'e7a7c53fd3eb50d5e009edae83091fb90e7439d53da585aacf43366067cb2060',
    list_document_versions: '269142a1b5581116b146773eaeb2b2fdd87b18dd0e1b15fea84064cb9de8e3d7',
    get_document_timeline: '054e3c74021962a2dcaf370196d46891fa96498581b573500449bbccb1835d35',
    get_provision_at_date: '68c01ce320d5295dd2b29bdd0b7bb3e68072735c863136aeab39cad30921c092',
    verify_legal_quote: '5e98cf4f5275d3cbe87007d267ef7f2cf3ef9418b46cd87235b14e0263223e99'
  };

  it('publishes one strict versioned schema for every tool', () => {
    expect(Object.keys(toolOutputSchemas)).toHaveLength(16);
    for (const [name, schema] of Object.entries(toolOutputSchemas)) {
      const json = z.toJSONSchema(schema) as Record<string, unknown>;
      expect(json.type, name).toBe('object');
      expect(json.additionalProperties, name).toBe(false);
      expect(json.properties, name).toMatchObject({
        api_version: { const: '1.0', type: 'string' }
      });
    }
  });

  it('matches the generated JSON Schema contract snapshot', () => {
    const actual = Object.fromEntries(
      Object.entries(toolOutputSchemas).map(([name, schema]) => [
        name,
        createHash('sha256')
          .update(JSON.stringify(z.toJSONSchema(schema)))
          .digest('hex')
      ])
    );
    expect(actual).toEqual(contractHashes);
  });

  it('rejects extra and mistyped legal identity fields', () => {
    const base = {
      api_version: '1.0',
      document: { title: 'Act', celex: '32016R0679', invented_identity: 'bad' },
      article: '22',
      paragraphs: [],
      language: 'en',
      version: { type: 'original' },
      provenance: {
        publisher: 'Publications Office of the European Union',
        source_system: 'CELLAR',
        source_url: 'https://publications.europa.eu/example',
        retrieved_at: '2026-08-26T00:00:00.000Z'
      }
    };
    expect(toolOutputSchemas.get_article.safeParse(base).success).toBe(false);
    expect(
      toolOutputSchemas.get_article.safeParse({
        ...base,
        document: { title: 'Act', celex: 32016 }
      }).success
    ).toBe(false);
  });
});
