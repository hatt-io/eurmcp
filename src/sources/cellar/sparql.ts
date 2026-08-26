import { EuLawError } from '../../errors/errors.js';

export const prefixes = `
PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
PREFIX dc: <http://purl.org/dc/elements/1.1/>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
`;

export function sparqlString(value: string): string {
  return `"${value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')}"`;
}

export function sparqlIri(value: string): string {
  if (!/^https?:\/\/[^<>"{}|\\^`\s]+$/.test(value)) {
    throw new EuLawError('INVALID_ARGUMENT', 'Unsafe internal IRI', { iri: value });
  }
  return `<${value}>`;
}

export function fullTextExpression(query: string): string {
  const tokens = query
    .normalize('NFKC')
    .match(/[\p{L}\p{N}]{2,}/gu)
    ?.slice(0, 12);
  if (!tokens?.length) {
    throw new EuLawError('INVALID_ARGUMENT', 'Search query must contain a searchable word', {
      argument: 'query'
    });
  }
  return sparqlString(tokens.map((token) => `'${token.replace(/'/g, "''")}'`).join(' AND '));
}

export function dateFilter(variable: string, from?: string, to?: string): string {
  const filters: string[] = [];
  if (from) filters.push(`${variable} >= ${sparqlString(from)}^^xsd:date`);
  if (to) filters.push(`${variable} <= ${sparqlString(to)}^^xsd:date`);
  return filters.length ? `FILTER(${filters.join(' && ')})` : '';
}
