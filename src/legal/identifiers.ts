import { EuLawError } from '../errors/errors.js';

export type LegislationIdentifier = {
  kind: 'legislation';
  celex?: string;
  eli?: string;
  source: 'celex' | 'eli' | 'formal_citation' | 'alias';
};

export type CaseIdentifier = {
  kind: 'case';
  caseNumber?: string;
  celex?: string;
  ecli?: string;
  source: 'case_number' | 'celex' | 'ecli';
};

export type LegalIdentifier = LegislationIdentifier | CaseIdentifier;

export const instrumentAliases: Readonly<Record<string, string | readonly string[]>> =
  Object.freeze({
    GDPR: '32016R0679',
    'GENERAL DATA PROTECTION REGULATION': '32016R0679',
    'AI ACT': '32024R1689',
    'DIGITAL SERVICES ACT': '32022R2065',
    DSA: '32022R2065',
    'DIGITAL MARKETS ACT': '32022R1925',
    DMA: '32022R1925'
  });

const CELEX_RE = /^[0-9][0-9]{4}[A-Z]{1,3}[0-9]{3,4}(?:\([0-9]+\))?(?:-[0-9]{8})?$/;
const CASE_CELEX_RE = /^6([0-9]{4})(CJ|CO|CC|TJ|TO|TC|FJ|FO|FC)([0-9]{4})$/;
const ECLI_RE = /^ECLI:EU:(C|T|F):([0-9]{4}):([0-9]+)$/;
const CASE_NUMBER_RE = /^([CTF])\s*[-‑–—]?\s*([0-9]+)\s*\/\s*([0-9]{2,4})$/;
const FORMAL_ACT_RE =
  /^(REGULATION|DIRECTIVE|DECISION|RECOMMENDATION|OPINION)\s*(?:\((?:EU|EC|EEC|EURATOM)\))?\s*(?:NO\s*)?([0-9]{4})\s*\/\s*([0-9]+)$/i;

const FORMAL_TO_CELEX: Record<string, string> = {
  REGULATION: 'R',
  DIRECTIVE: 'L',
  DECISION: 'D',
  RECOMMENDATION: 'H',
  OPINION: 'A'
};

export function normalizeCelex(input: string): string {
  const value = input
    .trim()
    .toUpperCase()
    .replace(/^CELEX\s*:\s*/, '')
    .replace(/\s+/g, '');
  if (!CELEX_RE.test(value)) {
    throw new EuLawError('INVALID_IDENTIFIER', `Invalid CELEX identifier: ${input}`, {
      identifier: input,
      expected: 'CELEX'
    });
  }
  return value;
}

export function normalizeEcli(input: string): string {
  const value = input.trim().toUpperCase().replace(/\s+/g, '');
  if (!ECLI_RE.test(value)) {
    throw new EuLawError('INVALID_IDENTIFIER', `Invalid ECLI identifier: ${input}`, {
      identifier: input,
      expected: 'ECLI'
    });
  }
  return value;
}

export function normalizeEli(input: string): string {
  let value: URL;
  try {
    value = new URL(input.trim());
  } catch (error) {
    throw new EuLawError(
      'INVALID_IDENTIFIER',
      `Invalid ELI URI: ${input}`,
      { identifier: input },
      error
    );
  }
  if (!['data.europa.eu', 'eur-lex.europa.eu'].includes(value.hostname.toLowerCase())) {
    throw new EuLawError('INVALID_IDENTIFIER', `Unsupported ELI host: ${value.hostname}`, {
      identifier: input
    });
  }
  const marker = value.pathname.indexOf('/eli/');
  if (marker < 0) {
    throw new EuLawError('INVALID_IDENTIFIER', `Invalid ELI path: ${input}`, { identifier: input });
  }
  const path = value.pathname.slice(marker).replace(/\/$/, '');
  return `http://data.europa.eu${path}`;
}

export function normalizeCaseNumber(input: string): string {
  const match = CASE_NUMBER_RE.exec(input.trim().toUpperCase());
  if (!match?.[1] || !match[2] || !match[3]) {
    throw new EuLawError('INVALID_IDENTIFIER', `Invalid EU case number: ${input}`, {
      identifier: input,
      expected: 'C-300/21'
    });
  }
  const year = match[3].length === 2 ? match[3] : match[3].slice(-2);
  return `${match[1]}-${Number.parseInt(match[2], 10)}/${year}`;
}

export function caseNumberToCelex(caseNumber: string, documentType = 'judgment'): string {
  const normalized = normalizeCaseNumber(caseNumber);
  const match = /^([CTF])-([0-9]+)\/([0-9]{2})$/.exec(normalized);
  if (!match?.[1] || !match[2] || !match[3])
    throw new EuLawError('INVALID_IDENTIFIER', 'Invalid case');
  const century = Number(match[3]) <= 49 ? '20' : '19';
  const codeByCourt: Record<string, Record<string, string>> = {
    C: { judgment: 'CJ', order: 'CO', opinion: 'CC' },
    T: { judgment: 'TJ', order: 'TO', opinion: 'TC' },
    F: { judgment: 'FJ', order: 'FO', opinion: 'FC' }
  };
  const type = codeByCourt[match[1]]?.[documentType] ?? `${match[1]}J`;
  return `6${century}${match[3]}${type}${match[2].padStart(4, '0')}`;
}

export function celexToCaseNumber(celex: string): string | undefined {
  const match = CASE_CELEX_RE.exec(celex);
  if (!match?.[1] || !match[2] || !match[3]) return undefined;
  const court = match[2][0];
  return `${court}-${Number.parseInt(match[3], 10)}/${match[1].slice(-2)}`;
}

export function parseIdentifierWithAliases(
  input: string,
  aliases: Readonly<Record<string, string | readonly string[]>>
): LegalIdentifier {
  const value = input.trim();
  if (!value) throw new EuLawError('INVALID_IDENTIFIER', 'Identifier cannot be empty');

  const alias = aliases[value.toUpperCase()];
  if (Array.isArray(alias)) {
    throw new EuLawError('AMBIGUOUS_IDENTIFIER', `Ambiguous maintained alias: ${value}`, {
      identifier: value,
      candidates: alias
    });
  }
  if (typeof alias === 'string') {
    return { kind: 'legislation', celex: alias, source: 'alias' };
  }

  if (/^https?:\/\/(?:data\.europa\.eu|eur-lex\.europa\.eu)\/.*\/eli\//i.test(value)) {
    return { kind: 'legislation', eli: normalizeEli(value), source: 'eli' };
  }
  if (ECLI_RE.test(value.toUpperCase().replace(/\s+/g, ''))) {
    return { kind: 'case', ecli: normalizeEcli(value), source: 'ecli' };
  }
  if (CASE_NUMBER_RE.test(value.toUpperCase())) {
    return { kind: 'case', caseNumber: normalizeCaseNumber(value), source: 'case_number' };
  }

  const upper = value
    .toUpperCase()
    .replace(/^CELEX\s*:\s*/, '')
    .replace(/\s+/g, '');
  if (CELEX_RE.test(upper)) {
    const celex = normalizeCelex(upper);
    if (CASE_CELEX_RE.test(celex)) {
      const caseNumber = celexToCaseNumber(celex);
      return { kind: 'case', celex, ...(caseNumber ? { caseNumber } : {}), source: 'celex' };
    }
    return { kind: 'legislation', celex, source: 'celex' };
  }

  const formal = FORMAL_ACT_RE.exec(value);
  if (formal?.[1] && formal[2] && formal[3]) {
    const code = FORMAL_TO_CELEX[formal[1].toUpperCase()];
    if (code) {
      return {
        kind: 'legislation',
        celex: normalizeCelex(`3${formal[2]}${code}${formal[3].padStart(4, '0')}`),
        source: 'formal_citation'
      };
    }
  }

  throw new EuLawError('INVALID_IDENTIFIER', `Unrecognized EU legal identifier: ${input}`, {
    identifier: input
  });
}

export function parseIdentifier(input: string): LegalIdentifier {
  return parseIdentifierWithAliases(input, instrumentAliases);
}
