export type Provenance = {
  publisher: string;
  source_system: string;
  source_url: string;
  retrieved_at: string;
  identifier?: string;
  language?: string;
  celex?: string;
  eli?: string;
  ecli?: string;
  cellar_uri?: string;
  methodology?: string;
};

export type LegalPoint = {
  label: string;
  text: string;
  points?: LegalPoint[];
};

export type LegalParagraph = {
  number?: string;
  text: string;
  points?: LegalPoint[];
};

export type ParsedArticle = {
  article: string;
  heading?: string;
  paragraphs: LegalParagraph[];
};

export type ParsedRecital = { number: number; text: string };
export type CaseParagraph = { number: number; text: string };

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
};
