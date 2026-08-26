import { documentTypeUris } from '../../legal/documentTypes.js';
import { dateFilter, fullTextExpression, prefixes, sparqlIri, sparqlString } from './sparql.js';

const WORK_FIELDS = `
  OPTIONAL { ?work cdm:resource_legal_id_celex ?celex }
  OPTIONAL { ?work cdm:resource_legal_eli ?eli }
  OPTIONAL { ?work cdm:case-law_ecli ?ecli }
  OPTIONAL { ?work cdm:work_date_document ?dateDocument }
  OPTIONAL { ?work cdm:date_creation_legacy ?datePublication }
  OPTIONAL { ?work cdm:resource_legal_date_entry-into-force ?dateEffect }
  OPTIONAL { ?work cdm:resource_legal_date_end-of-validity ?dateEndValidity }
  OPTIONAL { ?work cdm:resource_legal_in-force ?inForce }
  OPTIONAL { ?work cdm:work_has_resource-type ?resourceType }
  OPTIONAL { ?work cdm:case-law_delivered_by_court-formation ?chamber }
`;

function identifierQuery(predicate: string, value: string, language?: string): string {
  return `${prefixes}
SELECT DISTINCT ?work ?celex ?eli ?ecli ?title ?dateDocument ?datePublication ?dateEffect
  ?dateEndValidity ?inForce ?resourceType ?chamber ?languages
WHERE {
  ?work ${predicate} ?identifierValue .
  FILTER(STR(?identifierValue) = ${sparqlString(value)})
  ${WORK_FIELDS}
  ${
    language
      ? `?expression cdm:expression_belongs_to_work ?work ;
    cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/${language}> .
  OPTIONAL { ?expression cdm:expression_title ?title }
  BIND(${sparqlString(language)} AS ?languages)`
      : ''
  }
}
LIMIT 20`;
}

export function findWorkByCelex(celex: string, language = 'ENG'): string {
  return identifierQuery('cdm:resource_legal_id_celex', celex, language);
}

export function findWorkByCelexAnyLanguage(celex: string): string {
  return identifierQuery('cdm:resource_legal_id_celex', celex);
}

export function findWorkByEli(eli: string, language = 'ENG'): string {
  return identifierQuery('cdm:resource_legal_eli', eli, language);
}

export function findWorkByEliAnyLanguage(eli: string): string {
  return identifierQuery('cdm:resource_legal_eli', eli);
}

export function findWorkByEcli(ecli: string, language = 'ENG'): string {
  return identifierQuery('cdm:case-law_ecli', ecli, language);
}

export function findWorkByEcliAnyLanguage(ecli: string): string {
  return identifierQuery('cdm:case-law_ecli', ecli);
}

export function findExpressions(workUri: string, language?: string): string {
  return `${prefixes}
SELECT DISTINCT ?work ?expression ?langCode (STR(?formatValue) AS ?format) ?item WHERE {
  VALUES ?work { ${sparqlIri(workUri)} }
  ?expression cdm:expression_belongs_to_work ?work ; cdm:expression_uses_language ?lang .
  ?lang dc:identifier ?langCode .
  ${language ? `FILTER(STR(?langCode) = ${sparqlString(language)})` : ''}
  ?manifestation cdm:manifestation_manifests_expression ?expression ;
    cdm:manifestation_type ?formatValue .
  ?item cdm:item_belongs_to_manifestation ?manifestation .
}
ORDER BY ?langCode ?format ?item
LIMIT 500`;
}

export const findManifestations = findExpressions;

export type LegislationSearchQuery = {
  query: string;
  language: string;
  documentType?: string;
  dateFrom?: string;
  dateTo?: string;
  inForce?: boolean;
  limit: number;
};

export function searchLegislation(input: LegislationSearchQuery): string {
  const typeCodes = input.documentType ? documentTypeUris[input.documentType] : undefined;
  const typeFilter = typeCodes
    ? `VALUES ?resourceType { ${typeCodes
        .map((code) =>
          sparqlIri(`http://publications.europa.eu/resource/authority/resource-type/${code}`)
        )
        .join(' ')} }`
    : '';
  return `${prefixes}
SELECT DISTINCT ?work ?celex ?eli ?title ?dateDocument ?datePublication ?dateEffect
  ?dateEndValidity ?inForce ?resourceType ?rank
WHERE {
  ?work rdf:type cdm:resource_legal ; cdm:resource_legal_id_celex ?celex .
  FILTER(STRSTARTS(STR(?celex), "3"))
  ?expression cdm:expression_belongs_to_work ?work ;
    cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/${input.language}> ;
    cdm:expression_title ?title .
  ?title bif:contains ${fullTextExpression(input.query)} OPTION (score ?rank) .
  ${WORK_FIELDS}
  ${typeFilter}
  ${dateFilter('?dateDocument', input.dateFrom, input.dateTo)}
  ${input.inForce === undefined ? '' : `FILTER(?inForce = ${input.inForce ? 'true' : 'false'})`}
}
ORDER BY DESC(?rank) DESC(?dateDocument) ?celex
LIMIT ${input.limit}`;
}

export type CaseSearchQuery = {
  query?: string;
  language: string;
  celex?: string;
  ecli?: string;
  interpretedCelex?: string;
  dateFrom?: string;
  dateTo?: string;
  court?: 'court_of_justice' | 'general_court';
  documentType?: 'judgment' | 'order' | 'opinion';
  limit: number;
};

export function searchCaseLaw(input: CaseSearchQuery): string {
  const exact = input.celex
    ? `?work cdm:resource_legal_id_celex ?exactCelex . FILTER(STR(?exactCelex) = ${sparqlString(input.celex)})`
    : input.ecli
      ? `?work cdm:case-law_ecli ?exactEcli . FILTER(STR(?exactEcli) = ${sparqlString(input.ecli)})`
      : '?work cdm:resource_legal_id_celex ?requiredCelex . FILTER(STRSTARTS(STR(?requiredCelex), "6"))';
  const courtCode =
    input.court === 'general_court' ? 'T' : input.court === 'court_of_justice' ? 'C' : undefined;
  const typeCode =
    input.documentType === 'judgment'
      ? 'J'
      : input.documentType === 'order'
        ? 'O'
        : input.documentType === 'opinion'
          ? 'C'
          : undefined;
  return `${prefixes}
SELECT DISTINCT ?work ?celex ?ecli ?title ?dateDocument ?resourceType ?chamber
WHERE {
  ${exact}
  ?work cdm:resource_legal_id_celex ?celex .
  ?expression cdm:expression_belongs_to_work ?work ;
    cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/${input.language}> ;
    cdm:expression_title ?title .
  ${input.query ? `?title bif:contains ${fullTextExpression(input.query)} .` : ''}
  ${input.interpretedCelex ? `?interpreted cdm:resource_legal_id_celex ?interpretedCelex . FILTER(STR(?interpretedCelex) = ${sparqlString(input.interpretedCelex)}) ?work cdm:case-law_interpretes_resource_legal ?interpreted .` : ''}
  ${WORK_FIELDS}
  ${dateFilter('?dateDocument', input.dateFrom, input.dateTo)}
  ${courtCode ? `FILTER(SUBSTR(STR(?celex), 6, 1) = ${sparqlString(courtCode)})` : ''}
  ${typeCode ? `FILTER(SUBSTR(STR(?celex), 7, 1) = ${sparqlString(typeCode)})` : ''}
}
ORDER BY DESC(?dateDocument) ?celex
LIMIT ${input.limit}`;
}

export function findConsolidations(originalCelex: string): string {
  const consolidationPrefix = `0${originalCelex.slice(1)}-`;
  return `${prefixes}
SELECT DISTINCT ?consolidation ?celex ?date WHERE {
  ?original cdm:resource_legal_id_celex ?originalCelex .
  FILTER(STR(?originalCelex) = ${sparqlString(originalCelex)})
  ?consolidation cdm:act_consolidated_consolidates_resource_legal ?original ;
    cdm:resource_legal_id_celex ?celex ; cdm:work_date_document ?date .
  FILTER(STRSTARTS(STR(?celex), ${sparqlString(consolidationPrefix)}))
}
ORDER BY DESC(?date) ?celex`;
}

export function findAmendingActs(workUri: string): string {
  return `${prefixes}
SELECT DISTINCT ?related ?relationship ?celex WHERE {
  VALUES ?work { ${sparqlIri(workUri)} }
  {
    ?work ?predicate ?related .
    VALUES (?predicate ?relationship) {
      (cdm:resource_legal_amends_resource_legal "amends")
      (cdm:resource_legal_repeals_resource_legal "repeals")
      (cdm:resource_legal_corrects_resource_legal "corrects")
      (cdm:resource_legal_implements_resource_legal "implements")
    }
  } UNION {
    ?related ?predicate ?work .
    VALUES (?predicate ?relationship) {
      (cdm:resource_legal_amends_resource_legal "amended_by")
      (cdm:resource_legal_repeals_resource_legal "repealed_by")
      (cdm:resource_legal_corrects_resource_legal "corrected_by")
      (cdm:resource_legal_implements_resource_legal "implemented_by")
      (cdm:act_consolidated_consolidates_resource_legal "consolidates")
      (cdm:case-law_interpretes_resource_legal "related_case")
    }
  }
  OPTIONAL { ?related cdm:resource_legal_id_celex ?celex }
}
ORDER BY ?relationship ?celex`;
}

export function findCitations(targetWorkUri: string, limit: number): string {
  return `${prefixes}
SELECT DISTINCT ?work ?celex ?ecli ?dateDocument WHERE {
  VALUES ?target { ${sparqlIri(targetWorkUri)} }
  ?work cdm:work_cites_work ?target ; cdm:resource_legal_id_celex ?celex .
  FILTER(STRSTARTS(STR(?celex), "6"))
  OPTIONAL { ?work cdm:case-law_ecli ?ecli }
  OPTIONAL { ?work cdm:work_date_document ?dateDocument }
}
ORDER BY DESC(?dateDocument) ?celex
LIMIT ${limit}`;
}

export function searchEdpsPublications(input: {
  query: string;
  dateFrom?: string;
  dateTo?: string;
  limit: number;
}): string {
  return `${prefixes}
SELECT DISTINCT ?work ?title ?dateDocument ?resourceType ?celex WHERE {
  ?expression cdm:expression_belongs_to_work ?work ;
    cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/ENG> ;
    cdm:expression_title ?title .
  ?title bif:contains ${fullTextExpression(input.query)} .
  FILTER(CONTAINS(LCASE(STR(?title)), "edps") || CONTAINS(LCASE(STR(?title)), "european data protection supervisor"))
  OPTIONAL { ?work cdm:work_date_document ?dateDocument }
  OPTIONAL { ?work cdm:work_has_resource-type ?resourceType }
  OPTIONAL { ?work cdm:resource_legal_id_celex ?celex }
  ${dateFilter('?dateDocument', input.dateFrom, input.dateTo)}
}
ORDER BY DESC(?dateDocument) ?title
LIMIT ${input.limit}`;
}
