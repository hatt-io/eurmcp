export type SparqlValue = {
  type: 'uri' | 'literal' | 'bnode';
  value: string;
  datatype?: string;
  'xml:lang'?: string;
};

export type SparqlBinding = Record<string, SparqlValue | undefined>;

export type SparqlResults = {
  head: { vars: string[] };
  results: { bindings: SparqlBinding[] };
};

export type CellarWork = {
  cellarUri: string;
  celex?: string;
  eli?: string;
  ecli?: string;
  title?: string;
  dateDocument?: string;
  datePublication?: string;
  dateEffect?: string;
  dateEndValidity?: string;
  inForce?: boolean;
  resourceTypeUri?: string;
  languages: string[];
  chamberUri?: string;
};

export type CellarExpressionItem = {
  workUri: string;
  expressionUri: string;
  language: string;
  format: string;
  itemUri: string;
};

export type CellarConsolidation = {
  cellarUri: string;
  celex: string;
  date: string;
};
