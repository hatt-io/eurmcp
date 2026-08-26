import { EuLawError } from '../errors/errors.js';
import type { CaseParagraph } from '../types.js';
import { instrumentAliases, normalizeCelex, parseIdentifier } from './identifiers.js';
import { normalizeArticleNumber } from './provisions.js';

const ARTICLE_WORDS = [
  'article',
  'artikel',
  'artículo',
  'articolo',
  'artigo',
  'articolul?',
  'artykuł',
  'článek',
  'článok',
  'člen',
  'članak',
  'artikla',
  'artikolu',
  'artikkel',
  'airteagal',
  'cikk',
  'pants',
  'straipsnis',
  'άρθρο',
  'член'
] as const;

const ARTICLE_REFERENCE = new RegExp(
  `(?:^|[^\\p{L}])(?:${ARTICLE_WORDS.join('|')})\\s+([0-9]+[a-z]?(?:-[0-9]+[a-z]?)?)`,
  'iu'
);

export type CaseProvisionReference = {
  article: string;
  interpretedCelex: string;
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function provisionArgumentError(provision: string): EuLawError {
  return new EuLawError(
    'INVALID_ARGUMENT',
    'Provision must identify one article and one instrument, for example "Article 82 GDPR" or "Article 82 of Regulation (EU) 2016/679"',
    { argument: 'provision', value: provision }
  );
}

function legislationCelex(input: string): string | undefined {
  try {
    const parsed = parseIdentifier(input);
    return parsed.kind === 'legislation' ? parsed.celex : undefined;
  } catch {
    return undefined;
  }
}

export function parseCaseProvisionReference(provision: string): CaseProvisionReference {
  const normalized = provision.normalize('NFKC');
  const articleMatch = ARTICLE_REFERENCE.exec(normalized);
  const articleInput = articleMatch?.[1];
  if (!articleMatch || !articleInput) throw provisionArgumentError(provision);
  const article = normalizeArticleNumber(articleInput);

  const remainder = normalized
    .replace(articleMatch[0], ' ')
    .replace(/^\s*(?:of|of\s+the|in|under|pursuant\s+to)\s+/i, '')
    .trim();
  const directCelex = remainder ? legislationCelex(remainder) : undefined;
  if (directCelex) return { article, interpretedCelex: directCelex };

  const upper = normalized.toUpperCase();
  const alias = Object.keys(instrumentAliases)
    .sort((left, right) => right.length - left.length)
    .find((candidate) => {
      const escaped = escapeRegex(candidate);
      return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}(?:$|[^\\p{L}\\p{N}])`, 'u').test(upper);
    });
  const aliasCelex = alias ? legislationCelex(alias) : undefined;
  if (aliasCelex) return { article, interpretedCelex: aliasCelex };

  const formal = /(?:Regulation|Directive|Decision)\s*(?:\(EU\))?\s*\d{4}\/\d+/i.exec(normalized);
  const formalCelex = formal?.[0] ? legislationCelex(formal[0]) : undefined;
  if (formalCelex) return { article, interpretedCelex: formalCelex };

  throw provisionArgumentError(provision);
}

export function normalizeCaseCelex(celex: string): string {
  const normalized = normalizeCelex(celex);
  if (parseIdentifier(normalized).kind !== 'case') {
    throw new EuLawError(
      'INVALID_ARGUMENT',
      'celex must be a case-law CELEX identifier; use interpreted_celex for legislation',
      { argument: 'celex', value: celex, expected: 'case-law CELEX beginning with 6' }
    );
  }
  return normalized;
}

export function normalizeInterpretedCelex(celex: string): string {
  const normalized = normalizeCelex(celex);
  if (parseIdentifier(normalized).kind !== 'legislation') {
    throw new EuLawError('INVALID_ARGUMENT', 'interpreted_celex must identify legislation', {
      argument: 'interpreted_celex',
      value: celex,
      expected: 'legislation CELEX'
    });
  }
  return normalized;
}

function instrumentMentionPattern(celex: string): RegExp {
  const alternatives = [
    celex,
    ...Object.keys(instrumentAliases).filter((key) => {
      const value = instrumentAliases[key];
      return typeof value === 'string' && value === celex;
    })
  ].map(escapeRegex);
  const formal = /^3(\d{4})[A-Z]{1,3}(\d{3,4})$/.exec(celex);
  if (formal?.[1] && formal[2]) {
    alternatives.push(`${formal[1]}\\s*\\/\\s*0*${Number.parseInt(formal[2], 10)}`);
  }
  return new RegExp(
    `(?:^|[^\\p{L}\\p{N}])(?:${alternatives.join('|')})(?:$|[^\\p{L}\\p{N}])`,
    'giu'
  );
}

function articleMentions(text: string): Array<{ article: string; end: number }> {
  const pattern = new RegExp(
    `(?:^|[^\\p{L}])(?:${ARTICLE_WORDS.join('|')})s?\\s+([0-9]+[a-z]?(?:-[0-9]+[a-z]?)?)`,
    'giu'
  );
  return Array.from(text.matchAll(pattern), (match) => ({
    article: normalizeArticleNumber(match[1]!),
    end: (match.index ?? 0) + match[0].length
  }));
}

function hasLinkedProvisionMention(text: string, reference: CaseProvisionReference): boolean {
  const articles = articleMentions(text);
  if (!articles.length) return false;
  for (const instrument of text.matchAll(instrumentMentionPattern(reference.interpretedCelex))) {
    const instrumentStart = instrument.index ?? 0;
    const preceding = articles.filter((article) => article.end <= instrumentStart).at(-1);
    if (!preceding) continue;
    const gap = text.slice(preceding.end, instrumentStart);
    if (gap.length > 120 || /[.!?;]/u.test(gap)) continue;
    const listedArticles = Array.from(
      gap.matchAll(/(?:,|\b(?:and|or)\b|&)\s*([0-9]+[a-z]?(?:-[0-9]+[a-z]?)?)/giu),
      (match) => normalizeArticleNumber(match[1]!)
    );
    if ([preceding.article, ...listedArticles].includes(reference.article)) return true;
  }
  return false;
}

export function findCaseProvisionMentions(
  paragraphs: readonly CaseParagraph[],
  reference: CaseProvisionReference
): CaseParagraph[] {
  return paragraphs.filter((paragraph) => hasLinkedProvisionMention(paragraph.text, reference));
}
