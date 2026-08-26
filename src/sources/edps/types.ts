import type { Provenance } from '../../types.js';

export type EdpsSearchResult = {
  title: string;
  document_type?: string;
  date?: string;
  celex?: string;
  page_url: string;
  document_url?: string;
  provenance: Provenance;
};
