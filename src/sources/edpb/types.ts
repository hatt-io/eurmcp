import type { Provenance } from '../../types.js';

export type EdpbSearchResult = {
  title: string;
  document_number?: string;
  document_type?: string;
  adoption_date?: string;
  version?: string;
  status?: string;
  topics?: string[];
  page_url: string;
  document_url?: string;
  provenance: Provenance;
};

export type EdpbPage = {
  title: string;
  documentNumber?: string;
  documentType?: string;
  adoptionDate?: string;
  version?: string;
  status?: string;
  topics: string[];
  pageUrl: string;
  documentUrl: string;
};
