import { DOMParser } from 'linkedom';
import { EuLawError } from '../../errors/errors.js';
import { normalizeArticleNumber } from '../../legal/provisions.js';
import type {
  CaseParagraph,
  LegalParagraph,
  LegalPoint,
  ParsedArticle,
  ParsedRecital
} from '../../types.js';

type ParsedLegislation = {
  title: string;
  text: string;
  articles: ParsedArticle[];
  recitals: ParsedRecital[];
  detectedLanguage?: string;
};

type ParsedCase = {
  title?: string;
  caseNumber?: string;
  ecli?: string;
  dateText?: string;
  paragraphs: CaseParagraph[];
  operativePart?: string;
};

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

function parsePointTable(table: Element): LegalPoint | undefined {
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
    .map(parsePointTable)
    .filter((point): point is LegalPoint => Boolean(point));
  const point: LegalPoint = { label, text };
  if (nested.length) point.points = nested;
  return point;
}

function parseGridPoint(grid: Element): LegalPoint | undefined {
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
    .map(parseGridPoint)
    .filter((point): point is LegalPoint => Boolean(point));
  const point: LegalPoint = { label, text };
  if (nested.length) point.points = nested;
  return point;
}

function parseArticleElement(root: Element, requested?: string): ParsedArticle {
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
        .map(parsePointTable)
        .filter((point): point is LegalPoint => Boolean(point));
      const paragraph: LegalParagraph = { number, text };
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
        .map(parseGridPoint)
        .filter((point): point is LegalPoint => Boolean(point));
      const paragraph: LegalParagraph = { number, text: textWithoutNotes(content, true) };
      if (points.length) paragraph.points = points;
      paragraphs.push(paragraph);
    } else if (child.matches('p.oj-normal, p.norm')) {
      const text = textWithoutNotes(child);
      if (text) paragraphs.push({ text });
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
  return result;
}

export function parseLegislationXhtml(source: string): ParsedLegislation {
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
  const articles = articleRoots.map((root) => parseArticleElement(root));
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
    return { number, text: textWithoutNotes(textCell) };
  });
  const result: ParsedLegislation = {
    title: textWithoutNotes(titleRoot),
    text: textWithoutNotes(document.body),
    articles,
    recitals
  };
  const detectedLanguage = document.querySelector('.oj-hd-lg')?.textContent?.trim().toLowerCase();
  if (detectedLanguage) result.detectedLanguage = detectedLanguage;
  return result;
}

export function extractArticle(source: string, articleInput: string): ParsedArticle {
  const article = normalizeArticleNumber(articleInput);
  const document = parseDocument(source);
  const root = document.getElementById(`art_${article}`);
  if (!root)
    throw new EuLawError('ARTICLE_NOT_FOUND', `Article ${article} was not found`, { article });
  return parseArticleElement(root, article);
}

export function extractRecitals(source: string, requested: readonly number[]): ParsedRecital[] {
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
    return { number, text: textWithoutNotes(textCell) };
  });
}

export function parseCaseXhtml(source: string): ParsedCase {
  const document = parseDocument(source);
  const countElements = Array.from(document.querySelectorAll('p.coj-count[id^="point"]'));
  if (!countElements.length) {
    throw new EuLawError(
      'UPSTREAM_FORMAT_CHANGED',
      'Expected numbered judgment paragraphs were not found',
      {
        expected: 'p.coj-count[id^=point]'
      }
    );
  }
  const seen = new Set<number>();
  const paragraphs = countElements.map((countElement) => {
    const idNumber = Number.parseInt(
      (countElement.getAttribute('id') ?? '').replace(/^point/, ''),
      10
    );
    const visibleNumber = Number.parseInt(textWithoutNotes(countElement), 10);
    if (!Number.isInteger(idNumber) || idNumber !== visibleNumber || seen.has(idNumber)) {
      throw new EuLawError(
        'UPSTREAM_FORMAT_CHANGED',
        'Judgment paragraph numbering is inconsistent',
        {
          paragraph_id: countElement.getAttribute('id'),
          visible_number: textWithoutNotes(countElement)
        }
      );
    }
    seen.add(idNumber);
    const numberCell = countElement.parentElement;
    const textCell = numberCell?.nextElementSibling;
    if (!textCell) {
      throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'Judgment paragraph text cell is missing', {
        paragraph: idNumber
      });
    }
    const text = textWithoutNotes(textCell);
    if (!text) {
      throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'Judgment paragraph text is empty', {
        paragraph: idNumber
      });
    }
    return { number: idNumber, text };
  });
  const bodyText = textWithoutNotes(document.body);
  const caseMatch = /\b([CTF])[-‑–— ](\d+)\/(\d{2,4})\b/.exec(bodyText);
  const ecliMatch = /\bECLI:EU:[CTF]:\d{4}:\d+\b/.exec(bodyText);
  const title = document.querySelector('.coj-doc-ti, .coj-title')?.textContent;
  const grounds = Array.from(document.querySelectorAll('p')).find((element) =>
    /^on those grounds$/i.test(normalized(element.textContent ?? ''))
  );
  const result: ParsedCase = { paragraphs };
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
  requested: readonly number[]
): CaseParagraph[] {
  const parsed = parseCaseXhtml(source);
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
