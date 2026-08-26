export type Provenance = {
  publisher: string;
  source_system: string;
  source_url: string;
  retrieved_at: string;
  identifier?: string;
  source_identifier?: string;
  language?: string;
  celex?: string;
  eli?: string;
  ecli?: string;
  cellar_uri?: string;
  methodology?: string;
  evidence_id?: string;
  snapshot_available?: boolean;
  media_type?: string;
  response_sha256?: string;
  normalized_text_sha256?: string;
  parser_name?: string;
  parser_version?: string;
  normalization?: string;
  http_status?: number;
  byte_count?: number;
  etag?: string;
  last_modified?: string;
  cache_status?: 'hit' | 'miss';
  cellar_work_uri?: string;
  cellar_expression_uri?: string;
  cellar_manifestation_uri?: string;
  cellar_item_uri?: string;
};

export type SourceAnchor = {
  anchor_id: string;
  kind: string;
  location: string;
  source_element_id?: string;
  structural_path: string;
  text_sha256: string;
};

export type LegalPoint = {
  label: string;
  text: string;
  points?: LegalPoint[];
  source_anchor?: SourceAnchor;
};

export type LegalParagraph = {
  number?: string;
  text: string;
  points?: LegalPoint[];
  source_anchor?: SourceAnchor;
};

export type ParsedArticle = {
  article: string;
  heading?: string;
  paragraphs: LegalParagraph[];
  source_anchor?: SourceAnchor;
};

export type ParsedRecital = { number: number; text: string; source_anchor?: SourceAnchor };
export type CaseParagraph = { number: number; text: string; source_anchor?: SourceAnchor };

export type DocumentRelationship = {
  type:
    | 'amends'
    | 'amended_by'
    | 'corrects'
    | 'corrected_by'
    | 'implements'
    | 'implemented_by'
    | 'repeals'
    | 'repealed_by'
    | 'consolidates'
    | 'related_case';
  celex?: string;
  cellar_uri: string;
  date?: string;
  source_predicate?: string;
};
