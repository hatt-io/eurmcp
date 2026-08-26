import { DOMParser } from 'linkedom';
import { sha256 } from '../../evidence/normalization.js';
import { EuLawError } from '../../errors/errors.js';
import { normalizeArticleNumber } from '../../legal/provisions.js';
import type {
  CaseParagraph,
  LegalParagraph,
  LegalPoint,
  ParsedArticle,
  ParsedRecital,
  SourceAnchor
} from '../../types.js';

export const CELLAR_XHTML_PARSER = Object.freeze({
  name: 'cellar-official-xhtml',
  version: '2.1.0'
});

export type ParserContext = {
  evidenceId: string;
  parserName?: string;
  parserVersion?: string;
};

export type ParsedLegislation = {
  title: string;
  text: string;
  articles: ParsedArticle[];
  recitals: ParsedRecital[];
  detectedLanguage?: string;
  anchors: { anchor: SourceAnchor; text: string }[];
};

export type ParsedCase = {
  title?: string;
  caseNumber?: string;
  ecli?: string;
  dateText?: string;
  paragraphs: CaseParagraph[];
  operativePart?: string;
  anchors: { anchor: SourceAnchor; text: string }[];
};

function attributeValue(element: Element, name: string): string | null {
  const direct = element.getAttribute(name);
  if (direct !== null) return direct;
  const matchingName = Array.from(element.attributes).find(
    (attribute) => attribute.name.toLowerCase() === name.toLowerCase()
  )?.name;
  return matchingName ? element.getAttribute(matchingName) : null;
}

function structuralPath(element: Element): string {
  const id = attributeValue(element, 'id');
  if (id) return `#${id}`;
  const parts: string[] = [];
  let current: Element | null = element;
  while (current && current.tagName.toLowerCase() !== 'html') {
    const tag = current.tagName.toLowerCase();
    const siblings = current.parentElement
      ? Array.from(current.parentElement.children).filter(
          (item) => item.tagName === current!.tagName
        )
      : [current];
    parts.unshift(`${tag}:nth-of-type(${siblings.indexOf(current) + 1})`);
    current = current.parentElement;
  }
  return parts.join(' > ');
}

function sourceAnchor(
  context: ParserContext | undefined,
  kind: string,
  location: string,
  element: Element,
  text: string
): SourceAnchor | undefined {
  if (!context) return undefined;
  const parserVersion = context.parserVersion ?? CELLAR_XHTML_PARSER.version;
  const sourceElementId = attributeValue(element, 'id') || undefined;
  return {
    anchor_id: sha256(`${context.evidenceId}\0${parserVersion}\0${location}`),
    kind,
    location,
    ...(sourceElementId ? { source_element_id: sourceElementId } : {}),
    structural_path: structuralPath(element),
    text_sha256: sha256(normalized(text))
  };
}

function collectPointAnchors(
  point: LegalPoint,
  result: { anchor: SourceAnchor; text: string }[]
): void {
  if (point.source_anchor) result.push({ anchor: point.source_anchor, text: point.text });
  for (const child of point.points ?? []) collectPointAnchors(child, result);
}

function collectArticleAnchors(
  article: ParsedArticle,
  result: { anchor: SourceAnchor; text: string }[]
): void {
  if (article.source_anchor) {
    result.push({
      anchor: article.source_anchor,
      text: [article.heading, ...article.paragraphs.map((paragraph) => paragraph.text)]
        .filter(Boolean)
        .join(' ')
    });
  }
  for (const paragraph of article.paragraphs) {
    if (paragraph.source_anchor)
      result.push({ anchor: paragraph.source_anchor, text: paragraph.text });
    for (const point of paragraph.points ?? []) collectPointAnchors(point, result);
  }
}

function parseDocument(source: string): Document {
  const document = new DOMParser().parseFromString(source, 'text/html');
  if (!document?.documentElement || /awswaf|challenge-container/i.test(source)) {
    throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'Authoritative XHTML structure is unavailable');
  }
  return document as unknown as Document;
}

function normalized(value: string): string {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\s*\n\s*/g, ' ')
    .trim();
}

function textWithoutNotes(root: Element, skipNestedTables = false): string {
  const pieces: string[] = [];
  const visit = (node: Node, isRoot: boolean): void => {
    if (node.nodeType === 3) {
      pieces.push(node.nodeValue ?? '');
      return;
    }
    if (node.nodeType !== 1) return;
    const element = node as Element;
    if (
      element.matches('.oj-note-tag, .coj-note-tag') ||
      element.getAttribute('id')?.startsWith('ntc') ||
      element.getAttribute('href')?.startsWith('#ntr')
    ) {
      return;
    }
    if (
      skipNestedTables &&
      !isRoot &&
      (element.tagName.toLowerCase() === 'table' || element.classList.contains('grid-list'))
    ) {
      return;
    }
    for (const child of Array.from(element.childNodes)) visit(child, false);
  };
  visit(root, true);
  return normalized(pieces.join(''));
}

function directChildren(element: Element, selector?: string): Element[] {
  return Array.from(element.children).filter((child) => !selector || child.matches(selector));
}

function nestedDirectTables(element: Element): Element[] {
  const result: Element[] = [];
  const visit = (current: Element): void => {
    for (const child of directChildren(current)) {
      if (child.tagName.toLowerCase() === 'table') result.push(child);
      else visit(child);
    }
  };
  visit(element);
  return result;
}

function parsePointTable(
  table: Element,
  context?: ParserContext,
  location = 'point'
): LegalPoint | undefined {
  const row = table.querySelector('tr');
  if (!row) return undefined;
  const cells = directChildren(row, 'td');
  const labelCell = cells[0];
  const contentCell = cells[1];
  if (!labelCell || !contentCell) return undefined;
  const label = textWithoutNotes(labelCell).replace(/^\(|\)$/g, '');
  const text = textWithoutNotes(contentCell, true);
  if (!label || !text) return undefined;
  const nested = nestedDirectTables(contentCell)
    .map((element, index) => parsePointTable(element, context, `${location}(${index + 1})`))
    .filter((point): point is LegalPoint => Boolean(point));
  const point: LegalPoint = { label, text };
  const anchor = sourceAnchor(context, 'article_point', `${location}(${label})`, table, text);
  if (anchor) point.source_anchor = anchor;
  if (nested.length) point.points = nested;
  return point;
}

function parseGridPoint(
  grid: Element,
  context?: ParserContext,
  location = 'point'
): LegalPoint | undefined {
  const columns = directChildren(grid);
  const labelColumn = columns.find((child) => child.classList.contains('grid-list-column-1'));
  const contentColumn = columns.find((child) => child.classList.contains('grid-list-column-2'));
  if (!labelColumn || !contentColumn) return undefined;
  const label = textWithoutNotes(labelColumn)
    .replace(/^\(|\)$/g, '')
    .replace(/\s+/g, '');
  const text = textWithoutNotes(contentColumn, true);
  if (!label || !text) return undefined;
  const nested = Array.from(contentColumn.querySelectorAll('.grid-container.grid-list'))
    .filter((candidate) => {
      let parent = candidate.parentElement;
      while (parent && parent !== contentColumn) {
        if (parent.classList.contains('grid-list')) return false;
        parent = parent.parentElement;
      }
      return true;
    })
    .map((element, index) => parseGridPoint(element, context, `${location}(${index + 1})`))
    .filter((point): point is LegalPoint => Boolean(point));
  const point: LegalPoint = { label, text };
  const anchor = sourceAnchor(context, 'article_point', `${location}(${label})`, grid, text);
  if (anchor) point.source_anchor = anchor;
  if (nested.length) point.points = nested;
  return point;
}

function parseArticleElement(
  root: Element,
  requested?: string,
  context?: ParserContext
): ParsedArticle {
  const id = root.getAttribute('id') ?? '';
  const article = normalizeArticleNumber(id.replace(/^art_/, ''));
  if (requested && article !== requested) {
    throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'Article ID did not match requested article', {
      requested_article: requested,
      source_article: article
    });
  }
  const headingElement = directChildren(root)
    .find((child) => child.classList.contains('eli-title'))
    ?.querySelector('.oj-sti-art, .stitle-article-norm');
  const paragraphs: LegalParagraph[] = [];
  for (const child of directChildren(root)) {
    const childId = child.getAttribute('id') ?? '';
    if (/^\d{3,}[A-Z]?\.\d{3,}$/i.test(childId)) {
      const numberFromId = String(Number.parseInt(childId.split('.')[1] ?? '', 10));
      const firstTextElement = directChildren(child).find((node) => node.matches('p, div'));
      const raw = firstTextElement
        ? textWithoutNotes(firstTextElement)
        : textWithoutNotes(child, true);
      const visibleNumber = /^(\d+[a-z]?)\.(?:\s|$)/i.exec(raw)?.[1];
      const number = visibleNumber ?? numberFromId;
      const text = raw.replace(/^\d+[a-z]?\.(?:\s|$)/i, '').trim();
      const points = directChildren(child, 'table')
        .map((element) => parsePointTable(element, context, `Article ${article}(${number})`))
        .filter((point): point is LegalPoint => Boolean(point));
      const paragraph: LegalParagraph = { number, text };
      const anchor = sourceAnchor(
        context,
        'article_paragraph',
        `Article ${article}(${number})`,
        child,
        text
      );
      if (anchor) paragraph.source_anchor = anchor;
      if (points.length) paragraph.points = points;
      paragraphs.push(paragraph);
    } else if (child.matches('div.norm') && !child.classList.contains('inline-element')) {
      const numberElement = directChildren(child).find((node) =>
        node.classList.contains('no-parag')
      );
      const content = directChildren(child).find(
        (node) => node.classList.contains('norm') && node.classList.contains('inline-element')
      );
      if (!numberElement || !content) continue;
      const number = textWithoutNotes(numberElement).replace(/\.$/, '').trim();
      if (!/^\d+[a-z]?$/i.test(number)) {
        throw new EuLawError(
          'UPSTREAM_FORMAT_CHANGED',
          'Consolidated paragraph number was malformed',
          {
            article,
            source_number: number
          }
        );
      }
      const points = Array.from(content.querySelectorAll('.grid-container.grid-list'))
        .filter((candidate) => {
          let parent = candidate.parentElement;
          while (parent && parent !== content) {
            if (parent.classList.contains('grid-list')) return false;
            parent = parent.parentElement;
          }
          return true;
        })
        .map((element) => parseGridPoint(element, context, `Article ${article}(${number})`))
        .filter((point): point is LegalPoint => Boolean(point));
      const paragraph: LegalParagraph = { number, text: textWithoutNotes(content, true) };
      const anchor = sourceAnchor(
        context,
        'article_paragraph',
        `Article ${article}(${number})`,
        child,
        paragraph.text
      );
      if (anchor) paragraph.source_anchor = anchor;
      if (points.length) paragraph.points = points;
      paragraphs.push(paragraph);
    } else if (child.matches('p.oj-normal, p.norm')) {
      const text = textWithoutNotes(child);
      if (text) {
        const paragraph: LegalParagraph = { text };
        const anchor = sourceAnchor(
          context,
          'article_paragraph',
          `Article ${article}[${paragraphs.length + 1}]`,
          child,
          text
        );
        if (anchor) paragraph.source_anchor = anchor;
        paragraphs.push(paragraph);
      }
    }
  }
  if (!paragraphs.length) {
    throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'Article contained no provision paragraphs', {
      article
    });
  }
  const result: ParsedArticle = { article, paragraphs };
  const heading = headingElement ? textWithoutNotes(headingElement) : '';
  if (heading) result.heading = heading;
  const articleText = [heading, ...paragraphs.map((paragraph) => paragraph.text)]
    .filter(Boolean)
    .join(' ');
  const anchor = sourceAnchor(context, 'article', `Article ${article}`, root, articleText);
  if (anchor) result.source_anchor = anchor;
  return result;
}

export function parseLegislationXhtml(source: string, context?: ParserContext): ParsedLegislation {
  const document = parseDocument(source);
  const titleRoot = document.querySelector('.eli-main-title');
  const articleRoots = Array.from(
    document.querySelectorAll('div.eli-subdivision[id^="art_"]')
  ).filter((element) =>
    /^art_[0-9]+[a-z]?(?:-[0-9]+[a-z]?)?$/i.test(element.getAttribute('id') ?? '')
  );
  const recitalRoots = Array.from(
    document.querySelectorAll('div.eli-subdivision[id^="rct_"]')
  ).filter((element) => /^rct_[0-9]+$/.test(element.getAttribute('id') ?? ''));
  if (!titleRoot || !articleRoots.length) {
    throw new EuLawError(
      'UPSTREAM_FORMAT_CHANGED',
      'Expected CELLAR legislation structure was not found',
      {
        expected: ['eli-main-title', 'eli-subdivision#art_N']
      }
    );
  }
  const articles = articleRoots.map((root) => parseArticleElement(root, undefined, context));
  const articleNumbers = new Set(articles.map((article) => article.article));
  if (articleNumbers.size !== articles.length) {
    throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'Duplicate article identifiers in source');
  }
  const recitals = recitalRoots.map((root) => {
    const number = Number.parseInt((root.getAttribute('id') ?? '').slice(4), 10);
    const cells = Array.from(root.querySelectorAll('td'));
    const textCell = cells.at(-1);
    if (!Number.isInteger(number) || !textCell) {
      throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'Malformed recital structure');
    }
    const text = textWithoutNotes(textCell);
    const recital: ParsedRecital = { number, text };
    const anchor = sourceAnchor(context, 'recital', `Recital ${number}`, root, text);
    if (anchor) recital.source_anchor = anchor;
    return recital;
  });
  const anchors: { anchor: SourceAnchor; text: string }[] = [];
  for (const article of articles) collectArticleAnchors(article, anchors);
  for (const recital of recitals) {
    if (recital.source_anchor) anchors.push({ anchor: recital.source_anchor, text: recital.text });
  }
  const result: ParsedLegislation = {
    title: textWithoutNotes(titleRoot),
    text: textWithoutNotes(document.body),
    articles,
    recitals,
    anchors
  };
  const detectedLanguages = [
    ...new Set(
      Array.from(document.querySelectorAll('.oj-hd-lg'))
        .map((element) => element.textContent?.trim().toLowerCase())
        .filter((value): value is string => Boolean(value))
    )
  ];
  if (detectedLanguages.length > 1) {
    throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'Mixed source-language markers detected', {
      detected_languages: detectedLanguages
    });
  }
  const detectedLanguage = detectedLanguages[0];
  if (detectedLanguage) result.detectedLanguage = detectedLanguage;
  return result;
}

export function extractArticle(
  source: string,
  articleInput: string,
  context?: ParserContext
): ParsedArticle {
  const article = normalizeArticleNumber(articleInput);
  const document = parseDocument(source);
  const root = document.getElementById(`art_${article}`);
  if (!root)
    throw new EuLawError('ARTICLE_NOT_FOUND', `Article ${article} was not found`, { article });
  return parseArticleElement(root, article, context);
}

export function extractRecitals(
  source: string,
  requested: readonly number[],
  context?: ParserContext
): ParsedRecital[] {
  const document = parseDocument(source);
  return requested.map((number) => {
    const root = document.getElementById(`rct_${number}`);
    if (!root)
      throw new EuLawError('RECITAL_NOT_FOUND', `Recital ${number} was not found`, {
        requested_recital: number
      });
    const textCell = Array.from(root.querySelectorAll('td')).at(-1);
    if (!textCell) {
      throw new EuLawError(
        'UPSTREAM_FORMAT_CHANGED',
        `Recital ${number} has malformed source structure`,
        {
          requested_recital: number
        }
      );
    }
    const text = textWithoutNotes(textCell);
    const recital: ParsedRecital = { number, text };
    const anchor = sourceAnchor(context, 'recital', `Recital ${number}`, root, text);
    if (anchor) recital.source_anchor = anchor;
    return recital;
  });
}

export function parseCaseXhtml(source: string, context?: ParserContext): ParsedCase {
  const document = parseDocument(source);
  const modernCountElements = Array.from(
    document.querySelectorAll('p.coj-count[id^="point"], p.count[id^="point"]')
  );
  const legacyParagraphs = Array.from(document.querySelectorAll('p[class]')).filter((element) =>
    /pointnumerote/i.test(attributeValue(element, 'class') ?? '')
  );
  if (!modernCountElements.length && !legacyParagraphs.length) {
    throw new EuLawError(
      'UPSTREAM_FORMAT_CHANGED',
      'Expected numbered judgment paragraphs were not found',
      {
        expected: [
          'p.coj-count[id^=point]',
          'p.count[id^=point]',
          'p.C01Pointnumerote* > a[name^=point]'
        ]
      }
    );
  }
  const seen = new Set<number>();
  const paragraphElements = modernCountElements.length ? modernCountElements : legacyParagraphs;
  const paragraphs = paragraphElements.map((element) => {
    const modern = modernCountElements.length > 0;
    const countElement = modern
      ? element
      : Array.from(element.querySelectorAll('a')).find((anchor) =>
          /^point\d+$/i.test(attributeValue(anchor, 'name') ?? '')
        );
    if (!countElement) {
      throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'Judgment paragraph marker is missing');
    }
    const marker = modern
      ? attributeValue(countElement, 'id')
      : attributeValue(countElement, 'name');
    const idNumber = Number.parseInt((marker ?? '').replace(/^point/i, ''), 10);
    const visibleNumber = Number.parseInt(textWithoutNotes(countElement), 10);
    if (!Number.isInteger(idNumber) || idNumber !== visibleNumber || seen.has(idNumber)) {
      throw new EuLawError(
        'UPSTREAM_FORMAT_CHANGED',
        'Judgment paragraph numbering is inconsistent',
        {
          paragraph_id: marker,
          visible_number: textWithoutNotes(countElement)
        }
      );
    }
    seen.add(idNumber);
    const numberCell = modern ? countElement.parentElement : undefined;
    const textCell = modern ? numberCell?.nextElementSibling : element;
    if (!textCell)
      throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'Judgment paragraph text cell is missing', {
        paragraph: idNumber
      });
    const rawText = textWithoutNotes(textCell);
    const text = modern ? rawText : rawText.replace(new RegExp(`^${idNumber}\\s*`), '').trim();
    if (!text) {
      throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'Judgment paragraph text is empty', {
        paragraph: idNumber
      });
    }
    const paragraph: CaseParagraph = { number: idNumber, text };
    const anchor = sourceAnchor(
      context,
      'case_paragraph',
      `Paragraph ${idNumber}`,
      modern ? countElement : element,
      text
    );
    if (anchor) paragraph.source_anchor = anchor;
    return paragraph;
  });
  const bodyText = textWithoutNotes(document.body);
  const caseNumberPattern = /\b([CTF])[-‑–— ](\d+)\/(\d{2,4})\b/;
  const caseMatch = caseNumberPattern.exec(source) ?? caseNumberPattern.exec(bodyText);
  const ecliMatch = /\bECLI:EU:[CTF]:\d{4}:\d+\b/.exec(bodyText);
  const title =
    document.querySelector('.coj-doc-ti, .coj-title')?.textContent ??
    Array.from(document.querySelectorAll('p'))
      .map((element) => element.textContent)
      .find((text) => /^\s*(?:judgment|order|opinion)\s+of\s+the\s+court/i.test(text ?? ''));
  const grounds = Array.from(document.querySelectorAll('p')).find((element) =>
    /^on those grounds$/i.test(normalized(element.textContent ?? ''))
  );
  const result: ParsedCase = {
    paragraphs,
    anchors: paragraphs.flatMap((paragraph) =>
      paragraph.source_anchor ? [{ anchor: paragraph.source_anchor, text: paragraph.text }] : []
    )
  };
  if (title) result.title = normalized(title);
  if (caseMatch?.[1] && caseMatch[2] && caseMatch[3]) {
    result.caseNumber = `${caseMatch[1]}-${Number.parseInt(caseMatch[2], 10)}/${caseMatch[3].slice(-2)}`;
  }
  if (ecliMatch?.[0]) result.ecli = ecliMatch[0];
  const dateMatch =
    /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/.exec(
      bodyText
    );
  if (dateMatch?.[0]) result.dateText = dateMatch[0];
  if (grounds) {
    const parent = grounds.parentElement ?? grounds;
    const operative = [
      textWithoutNotes(parent),
      ...Array.from(parent.parentElement?.children ?? [])
        .slice(Array.from(parent.parentElement?.children ?? []).indexOf(parent) + 1, -1)
        .map((element) => textWithoutNotes(element))
    ]
      .filter(Boolean)
      .join(' ');
    if (operative) result.operativePart = operative;
  }
  return result;
}

export function extractCaseParagraphs(
  source: string,
  requested: readonly number[],
  context?: ParserContext
): CaseParagraph[] {
  const parsed = parseCaseXhtml(source, context);
  const byNumber = new Map(parsed.paragraphs.map((paragraph) => [paragraph.number, paragraph]));
  const available = parsed.paragraphs.map((paragraph) => paragraph.number);
  return requested.map((number) => {
    const paragraph = byNumber.get(number);
    if (!paragraph) {
      throw new EuLawError('PARAGRAPH_NOT_FOUND', `Paragraph ${number} was not found`, {
        requested_paragraph: number,
        available_range: { from: Math.min(...available), to: Math.max(...available) }
      });
    }
    return paragraph;
  });
}
