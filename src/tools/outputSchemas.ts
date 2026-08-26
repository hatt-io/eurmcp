import * as z from 'zod/v4';

const api = { api_version: z.literal('1.0') };
const optionalString = z.string().optional();

export const sourceAnchorSchema = z.strictObject({
  anchor_id: z.string().regex(/^[a-f0-9]{64}$/),
  kind: z.string(),
  location: z.string(),
  source_element_id: optionalString,
  structural_path: z.string(),
  text_sha256: z.string().regex(/^[a-f0-9]{64}$/)
});

export const provenanceSchema = z.strictObject({
  publisher: z.string(),
  source_system: z.string(),
  source_url: z.string().url(),
  retrieved_at: z.string(),
  identifier: optionalString,
  source_identifier: optionalString,
  language: optionalString,
  celex: optionalString,
  eli: optionalString,
  ecli: optionalString,
  cellar_uri: optionalString,
  methodology: optionalString,
  evidence_id: optionalString,
  snapshot_available: z.boolean().optional(),
  media_type: optionalString,
  response_sha256: optionalString,
  normalized_text_sha256: optionalString,
  parser_name: optionalString,
  parser_version: optionalString,
  normalization: optionalString,
  http_status: z.number().int().optional(),
  byte_count: z.number().int().nonnegative().optional(),
  etag: optionalString,
  last_modified: optionalString,
  cache_status: z.enum(['hit', 'miss']).optional(),
  cellar_work_uri: optionalString,
  cellar_expression_uri: optionalString,
  cellar_manifestation_uri: optionalString,
  cellar_item_uri: optionalString
});

const identifiersSchema = z.strictObject({
  celex: optionalString,
  eli: optionalString,
  ecli: optionalString,
  cellar_uri: optionalString
});

const versionSchema = z.strictObject({
  type: z.enum(['original', 'consolidated']),
  date: optionalString,
  consolidation_date: optionalString
});

const legalPointSchema: z.ZodType = z.lazy(() =>
  z.strictObject({
    label: z.string(),
    text: z.string(),
    points: z.array(legalPointSchema).optional(),
    source_anchor: sourceAnchorSchema.optional()
  })
);

const legalParagraphSchema = z.strictObject({
  number: optionalString,
  text: z.string(),
  points: z.array(legalPointSchema).optional(),
  source_anchor: sourceAnchorSchema.optional()
});

const documentIdentitySchema = z.strictObject({
  title: optionalString,
  celex: optionalString,
  eli: optionalString
});

const relationshipSchema = z.strictObject({
  type: z.enum([
    'amends',
    'amended_by',
    'corrects',
    'corrected_by',
    'implements',
    'implemented_by',
    'repeals',
    'repealed_by',
    'consolidates',
    'related_case'
  ]),
  celex: optionalString,
  cellar_uri: z.string(),
  date: optionalString,
  source_predicate: optionalString
});

export const searchEuLawOutputSchema = z.strictObject({
  ...api,
  results: z.array(
    z.strictObject({
      title: z.string(),
      celex: optionalString,
      eli: optionalString,
      document_type: optionalString,
      date_document: optionalString,
      date_publication: optionalString,
      date_effect: optionalString,
      date_end_validity: optionalString,
      in_force: z.boolean().optional(),
      languages: z.array(z.string()),
      eurlex_url: optionalString,
      cellar_uri: z.string(),
      provenance: provenanceSchema
    })
  )
});

export const getEuDocumentOutputSchema = z.strictObject({
  ...api,
  title: z.string(),
  identifiers: identifiersSchema,
  document_type: optionalString,
  language: z.string(),
  version: versionSchema,
  text: z.string(),
  metadata: z.strictObject({
    date_document: optionalString,
    date_publication: optionalString,
    date_effect: optionalString,
    date_end_validity: optionalString,
    in_force: z.boolean().optional(),
    relationships: z.array(relationshipSchema),
    eurlex_url: z.string()
  }),
  provenance: provenanceSchema
});

export const getArticleOutputSchema = z.strictObject({
  ...api,
  document: documentIdentitySchema,
  article: z.string(),
  heading: optionalString,
  paragraphs: z.array(legalParagraphSchema),
  language: z.string(),
  version: versionSchema,
  source_anchor: sourceAnchorSchema.optional(),
  provenance: provenanceSchema,
  requested_date: optionalString,
  snapshot_date: optionalString,
  legal_effect_not_inferred: z.boolean().optional()
});

export const getRecitalsOutputSchema = z.strictObject({
  ...api,
  document: documentIdentitySchema,
  recitals: z.array(
    z.strictObject({
      number: z.number().int().positive(),
      text: z.string(),
      source_anchor: sourceAnchorSchema.optional()
    })
  ),
  language: z.string(),
  provenance: provenanceSchema
});

export const compareDocumentVersionsOutputSchema = z.strictObject({
  ...api,
  document: documentIdentitySchema,
  version_a: versionSchema,
  version_b: versionSchema,
  changes: z.array(
    z.strictObject({
      location: z.string(),
      change_type: z.enum(['modified', 'added', 'removed']),
      before: optionalString,
      after: optionalString
    })
  ),
  provenance_a: provenanceSchema,
  provenance_b: provenanceSchema
});

const evidenceSemanticsSchema = z.strictObject({
  field: z.string(),
  value: z.string(),
  evidence_type: z.enum([
    'textual_mention',
    'metadata_relation',
    'formal_citation',
    'operative_reference',
    'authoritative_classification'
  ]),
  scope: z.string(),
  direction: z.string(),
  source_predicate: optionalString,
  methodology: z.string()
});

const caseSummarySchema = z.strictObject({
  case_number: z.string(),
  case_name: optionalString,
  ecli: optionalString,
  celex: optionalString,
  court: optionalString,
  chamber: optionalString,
  document_type: optionalString,
  date: optionalString,
  eurlex_url: optionalString,
  curia_url: optionalString,
  match_evidence: z.array(evidenceSemanticsSchema).optional(),
  provenance: provenanceSchema
});

export const searchEuCasesOutputSchema = z.strictObject({
  ...api,
  results: z.array(caseSummarySchema)
});

const fieldCheckSchema = z.strictObject({
  field: z.string(),
  status: z.enum(['match', 'conflict', 'primary_only', 'secondary_only']),
  primary_value: optionalString,
  secondary_value: optionalString
});
const discrepancySchema = z.strictObject({
  field: z.string(),
  primary_value: optionalString,
  secondary_value: optionalString,
  metadata: optionalString,
  content: optionalString
});
const sourceConsistencySchema = z.strictObject({
  status: z.enum(['verified_cross_system', 'verified_same_system', 'primary_only', 'conflict']),
  checks: z.array(fieldCheckSchema),
  discrepancies: z.array(discrepancySchema)
});

const caseParagraphSchema = z.strictObject({
  number: z.number().int().positive(),
  text: z.string(),
  source_anchor: sourceAnchorSchema.optional()
});

export const getEuCaseOutputSchema = z.strictObject({
  ...api,
  case_number: z.string(),
  case_name: optionalString,
  identifiers: identifiersSchema,
  court: z.string(),
  chamber: optionalString,
  date: z.string(),
  document_type: z.string(),
  language: z.string(),
  paragraphs: z.array(caseParagraphSchema),
  operative_part: optionalString,
  source_consistency: sourceConsistencySchema,
  eurlex_url: z.string(),
  curia_url: z.string(),
  provenance: provenanceSchema
});

export const getCaseParagraphsOutputSchema = z.strictObject({
  ...api,
  case_number: z.string(),
  identifiers: identifiersSchema,
  language: z.string(),
  paragraphs: z.array(caseParagraphSchema),
  provenance: provenanceSchema
});

export const findCasesCitingOutputSchema = z.strictObject({
  ...api,
  cited_case: z.strictObject({ case_number: z.string(), ecli: optionalString, celex: z.string() }),
  citing_cases: z.array(
    z.strictObject({
      case_number: optionalString,
      ecli: optionalString,
      celex: optionalString,
      date: optionalString,
      match_evidence: z.array(evidenceSemanticsSchema).optional(),
      provenance: provenanceSchema
    })
  )
});

const regulatorSearchSchema = z.strictObject({
  title: z.string(),
  document_number: optionalString,
  document_type: optionalString,
  adoption_date: optionalString,
  date: optionalString,
  version: optionalString,
  status: optionalString,
  topics: z.array(z.string()).optional(),
  page_url: z.string(),
  document_url: optionalString,
  celex: optionalString,
  provenance: provenanceSchema
});

export const searchEdpbDocumentsOutputSchema = z.strictObject({
  ...api,
  results: z.array(regulatorSearchSchema)
});
export const searchEdpsDocumentsOutputSchema = z.strictObject({
  ...api,
  results: z.array(regulatorSearchSchema)
});

export const getEdpbDocumentOutputSchema = z.strictObject({
  ...api,
  title: z.string(),
  document_number: optionalString,
  document_type: optionalString,
  adoption_date: optionalString,
  version: optionalString,
  status: optionalString,
  language: z.string(),
  text: z.string(),
  sections: z.array(
    z.strictObject({
      heading: optionalString,
      paragraphs: z.array(
        z.strictObject({
          number: optionalString,
          text: z.string(),
          source_anchor: sourceAnchorSchema.optional()
        })
      )
    })
  ),
  provenance: provenanceSchema
});

export const listDocumentVersionsOutputSchema = z.strictObject({
  ...api,
  document: z.string(),
  versions: z.array(
    z.strictObject({
      type: z.enum(['original', 'consolidated']),
      celex: z.string(),
      cellar_uri: z.string(),
      snapshot_date: optionalString,
      publication_date: optionalString,
      consolidation_date: optionalString,
      languages: z.array(z.string()),
      requested_language: z.string(),
      language_available: z.boolean(),
      provenance: provenanceSchema
    })
  )
});

export const getDocumentTimelineOutputSchema = z.strictObject({
  ...api,
  document: z.string(),
  events: z.array(
    z.strictObject({
      event_type: z.enum(['original', 'corrigendum', 'amending_act', 'consolidation']),
      date: optionalString,
      event_date_field: z.string(),
      celex: optionalString,
      cellar_uri: z.string(),
      authoritative_predicate: z.string(),
      provenance: provenanceSchema
    })
  )
});

export const getProvisionAtDateOutputSchema = getArticleOutputSchema;

export const verifyLegalQuoteOutputSchema = z.strictObject({
  ...api,
  evidence_id: z.string(),
  anchor_id: z.string(),
  result: z.enum(['exact_match', 'normalized_match', 'no_match']),
  normalization: z.literal('legal-text-nfc-whitespace-v1'),
  source_anchor: sourceAnchorSchema
});

export const toolOutputSchemas = Object.freeze({
  search_eu_law: searchEuLawOutputSchema,
  get_eu_document: getEuDocumentOutputSchema,
  get_article: getArticleOutputSchema,
  get_recitals: getRecitalsOutputSchema,
  compare_document_versions: compareDocumentVersionsOutputSchema,
  search_eu_cases: searchEuCasesOutputSchema,
  get_eu_case: getEuCaseOutputSchema,
  get_case_paragraphs: getCaseParagraphsOutputSchema,
  find_cases_citing: findCasesCitingOutputSchema,
  search_edpb_documents: searchEdpbDocumentsOutputSchema,
  get_edpb_document: getEdpbDocumentOutputSchema,
  search_edps_documents: searchEdpsDocumentsOutputSchema,
  list_document_versions: listDocumentVersionsOutputSchema,
  get_document_timeline: getDocumentTimelineOutputSchema,
  get_provision_at_date: getProvisionAtDateOutputSchema,
  verify_legal_quote: verifyLegalQuoteOutputSchema
});
