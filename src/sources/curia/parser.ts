import { EuLawError } from '../../errors/errors.js';

export function requireCuriaCaseResult(html: string): void {
  if (!/Case number|Numéro de l'affaire|Målnummer/i.test(html)) {
    throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'InfoCuria case-result structure changed');
  }
}

export type CuriaCaseMetadata = {
  caseNumber?: string;
  celex?: string;
  ecli?: string;
  date?: string;
  court?: string;
  documentType?: string;
  language?: string;
};

export function parseCuriaCaseMetadata(html: string): CuriaCaseMetadata {
  requireCuriaCaseResult(html);
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const caseMatch = /\b([CTF])-\s*(\d+)\/(\d{2,4})\b/i.exec(text);
  const result: CuriaCaseMetadata = {};
  if (caseMatch?.[1] && caseMatch[2] && caseMatch[3]) {
    result.caseNumber = `${caseMatch[1].toUpperCase()}-${Number.parseInt(caseMatch[2], 10)}/${caseMatch[3].slice(-2)}`;
  }
  result.celex = /\b6\d{4}[CFT][JOC]\d{4}\b/i.exec(text)?.[0]?.toUpperCase();
  result.ecli = /\bECLI:EU:[CTF]:\d{4}:\d+\b/i.exec(text)?.[0]?.toUpperCase();
  result.date = /\b\d{4}-\d{2}-\d{2}\b/.exec(text)?.[0];
  if (/Court of Justice/i.test(text)) result.court = 'Court of Justice';
  else if (/General Court/i.test(text)) result.court = 'General Court';
  if (/\bJudgment\b/i.test(text)) result.documentType = 'judgment';
  else if (/\bOrder\b/i.test(text)) result.documentType = 'order';
  else if (/\bOpinion\b/i.test(text)) result.documentType = 'opinion';
  result.language = /<html[^>]+lang=["']([^"']+)/i.exec(html)?.[1]?.slice(0, 2).toLowerCase();
  return result;
}
