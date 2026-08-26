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
  sourceReceipt?: {
    sourceUrl: string;
    retrievedAt: string;
    mediaType: string;
    responseSha256: string;
    httpStatus: number;
    byteCount: number;
    etag?: string;
    lastModified?: string;
    cacheStatus: 'hit' | 'miss';
  };
};

export type CellarExpressionItem = {
  workUri: string;
  expressionUri: string;
  language: string;
  format: string;
  itemUri: string;
  manifestationUri: string;
};

export type CellarConsolidation = {
  cellarUri: string;
  celex: string;
  date: string;
};
