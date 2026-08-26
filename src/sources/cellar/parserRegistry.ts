import { DOMParser } from 'linkedom';
import { sha256 } from '../../evidence/normalization.js';
import { EuLawError } from '../../errors/errors.js';
import { normalizeArticleNumber } from '../../legal/provisions.js';
import type { LegalParagraph, ParsedArticle, ParsedRecital, SourceAnchor } from '../../types.js';
import {
  CELLAR_XHTML_PARSER,
  parseLegislationXhtml,
  type ParsedLegislation,
  type ParserContext
} from './parser.js';

export const FORMEX4_PARSER = Object.freeze({ name: 'cellar-formex4-xml', version: '1.0.0' });

function value(element: Element | null): string {
  return (element?.textContent ?? '')
    .normalize('NFC')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstByTag(root: Element | Document, tag: string): Element | null {
  return (root.getElementsByTagName(tag)[0] as unknown as Element | undefined) ?? null;
}

function anchor(
  context: ParserContext | undefined,
  kind: string,
  location: string,
  element: Element,
  text: string
): SourceAnchor | undefined {
  if (!context) return undefined;
  const sourceElementId = element.getAttribute('ID') ?? element.getAttribute('id') ?? undefined;
  return {
    anchor_id: sha256(`${context.evidenceId}\0${FORMEX4_PARSER.version}\0${location}`),
    kind,
    location,
    ...(sourceElementId ? { source_element_id: sourceElementId } : {}),
    structural_path: sourceElementId ? `#${sourceElementId}` : location.replaceAll(' ', '/'),
    text_sha256: sha256(value(element) || text)
  };
}

export function parseLegislationFormex4(
  source: string,
  context?: ParserContext
): ParsedLegislation {
  const document = new DOMParser().parseFromString(source, 'text/xml');
  if (
    !document?.documentElement ||
    !/^(?:LEXP|FORMEX|ACT|CONSLEG)$/i.test(document.documentElement.tagName)
  ) {
    throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'Expected Formex4 root was not found');
  }
  const articleRoots = Array.from(document.querySelectorAll('ARTICLE')) as unknown as Element[];
  if (!articleRoots.length) {
    throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'Formex4 document contained no ARTICLE nodes');
  }
  const anchors: ParsedLegislation['anchors'] = [];
  const articles: ParsedArticle[] = articleRoots.map((root) => {
    const numberText = value(firstByTag(root, 'NO.ART')) || root.getAttribute('ID') || '';
    const numberMatch = /(?:Article\s+)?([0-9]+[a-z]?(?:-[0-9]+[a-z]?)?)/i.exec(numberText);
    if (!numberMatch?.[1]) {
      throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'Formex4 article number was missing');
    }
    const article = normalizeArticleNumber(numberMatch[1]);
    const paragraphRoots = Array.from(
      root.querySelectorAll(':scope > PARAG, :scope > ALINEA')
    ) as unknown as Element[];
    const paragraphs: LegalParagraph[] = paragraphRoots.map((paragraphRoot, index) => {
      const number = value(firstByTag(paragraphRoot, 'NO.PARAG')) || undefined;
      const text = value(paragraphRoot.querySelector('TXT')) || value(paragraphRoot);
      if (!text) {
        throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'Formex4 paragraph text was empty', {
          article
        });
      }
      const location = number
        ? `Article ${article}(${number})`
        : `Article ${article}[${index + 1}]`;
      const result: LegalParagraph = { ...(number ? { number } : {}), text };
      const sourceAnchor = anchor(context, 'article_paragraph', location, paragraphRoot, text);
      if (sourceAnchor) {
        result.source_anchor = sourceAnchor;
        anchors.push({ anchor: sourceAnchor, text });
      }
      return result;
    });
    if (!paragraphs.length) {
      const text = value(root.querySelector('TXT'));
      if (text) paragraphs.push({ text });
    }
    if (!paragraphs.length) {
      throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'Formex4 article had no paragraphs', {
        article
      });
    }
    const heading = value(firstByTag(root, 'TI.ART')) || undefined;
    const result: ParsedArticle = { article, ...(heading ? { heading } : {}), paragraphs };
    const sourceAnchor = anchor(
      context,
      'article',
      `Article ${article}`,
      root,
      [heading, ...paragraphs.map((paragraph) => paragraph.text)].filter(Boolean).join(' ')
    );
    if (sourceAnchor) {
      result.source_anchor = sourceAnchor;
      anchors.push({ anchor: sourceAnchor, text: value(root) });
    }
    return result;
  });
  const recitalRoots = Array.from(document.querySelectorAll('CONSIDERANT')) as unknown as Element[];
  const recitals: ParsedRecital[] = recitalRoots.map((root, index) => {
    const rawNumber = value(firstByTag(root, 'NO.CONS')) || String(index + 1);
    const number = Number.parseInt(rawNumber.replace(/\D/g, ''), 10);
    const text = value(root.querySelector('TXT')) || value(root);
    if (!Number.isInteger(number) || !text) {
      throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'Malformed Formex4 recital');
    }
    const result: ParsedRecital = { number, text };
    const sourceAnchor = anchor(context, 'recital', `Recital ${number}`, root, text);
    if (sourceAnchor) {
      result.source_anchor = sourceAnchor;
      anchors.push({ anchor: sourceAnchor, text });
    }
    return result;
  });
  const title =
    value(firstByTag(document as unknown as Document, 'TI')) ||
    value(firstByTag(document as unknown as Document, 'TITLE')) ||
    value(firstByTag(document as unknown as Document, 'DOC.TI'));
  if (!title) throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'Formex4 title was missing');
  return {
    title,
    text: value(document.documentElement as unknown as Element),
    articles,
    recitals,
    anchors
  };
}

export const parserRegistry = Object.freeze({
  'application/xhtml+xml': CELLAR_XHTML_PARSER,
  'text/html': CELLAR_XHTML_PARSER,
  'application/xml': FORMEX4_PARSER,
  'application/formex4+xml': FORMEX4_PARSER
});

export function parseOfficialLegislation(
  source: string,
  mediaType: keyof typeof parserRegistry,
  context?: ParserContext
): ParsedLegislation {
  if (mediaType === 'application/xhtml+xml' || mediaType === 'text/html') {
    return parseLegislationXhtml(source, context);
  }
  if (mediaType === 'application/xml' || mediaType === 'application/formex4+xml') {
    if (/<html[\s>]/i.test(source)) return parseLegislationXhtml(source, context);
    return parseLegislationFormex4(source, context);
  }
  throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'No parser is registered for source media type', {
    media_type: mediaType
  });
}
