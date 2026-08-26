import { DOMParser } from 'linkedom';
import { EuLawError } from '../../errors/errors.js';
import type { EdpbPage } from './types.js';

function text(element: Element | null): string | undefined {
  const value = element?.textContent?.replace(/\s+/g, ' ').trim();
  return value || undefined;
}

function documentNumber(title: string): string | undefined {
  return /\b(?:Guidelines?|Recommendations?|Opinion|Statement|Decision)\s+([0-9]+\/[0-9]{4})\b/i.exec(
    title
  )?.[1];
}

export function parseEdpbSearchPage(
  html: string,
  pageUrl: string
): Omit<EdpbPage, 'documentUrl'>[] {
  const document = new DOMParser().parseFromString(html, 'text/html');
  if (!document || /AwsWafIntegration|challenge-container/i.test(html)) {
    throw new EuLawError('UPSTREAM_UNAVAILABLE', 'EDPB returned an anti-automation challenge', {
      source_url: pageUrl
    });
  }
  const cards = Array.from(
    document.querySelectorAll('.view-documents-overview-documents__row .document-card')
  ) as unknown as Element[];
  if (!cards.length && !/0 items|No results/i.test(html)) {
    throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'EDPB search-result structure changed', {
      source_url: pageUrl,
      expected: '.document-card'
    });
  }
  return cards.flatMap((card) => {
    const title = text(card.querySelector('h3.document-card__title'));
    const link = card.querySelector('a.document-card__link')?.getAttribute('href');
    if (!title || !link) return [];
    const type = text(card.querySelector('.document-card__document-type'));
    const date = card.querySelector('time')?.getAttribute('datetime')?.slice(0, 10);
    const topics = (
      Array.from(card.querySelectorAll('.document-card__topics span')) as unknown as Element[]
    )
      .map((topic) => text(topic)?.replace(/^#/, ''))
      .filter((topic): topic is string => Boolean(topic));
    const result: Omit<EdpbPage, 'documentUrl'> = {
      title,
      topics,
      pageUrl: new URL(link, pageUrl).toString()
    };
    const number = documentNumber(title);
    if (number) result.documentNumber = number;
    if (type) result.documentType = type;
    if (date) result.adoptionDate = date;
    result.status = /consultation|draft/i.test(title) ? 'consultation' : 'adopted';
    return [result];
  });
}

export function parseEdpbDocumentPage(html: string, pageUrl: string, language: string): EdpbPage {
  const document = new DOMParser().parseFromString(html, 'text/html');
  if (!document || /AwsWafIntegration|challenge-container/i.test(html)) {
    throw new EuLawError('UPSTREAM_UNAVAILABLE', 'EDPB returned an anti-automation challenge', {
      source_url: pageUrl
    });
  }
  const root = document.querySelector('.document-full');
  const title = text(root?.querySelector('h1.document-full__title') ?? null);
  if (!root || !title) {
    throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'EDPB document-page structure changed', {
      source_url: pageUrl,
      expected: '.document-full h1.document-full__title'
    });
  }
  const firstFile = root.querySelector('.document-full__files-item');
  const languageOption = firstFile?.querySelector(
    `option[value="${language}"], option[lang="${language}"]`
  );
  const defaultLink = firstFile?.querySelector('a[type="application/pdf"]')?.getAttribute('href');
  const selectedLink =
    languageOption?.getAttribute('data-url') ?? (language === 'en' ? defaultLink : undefined);
  if (!selectedLink) {
    throw new EuLawError(
      'LANGUAGE_NOT_AVAILABLE',
      `EDPB has no official ${language} file for this document`,
      {
        source_url: pageUrl,
        language
      }
    );
  }
  const documentType = text(root.querySelector('.document-full__document-type'));
  const adoptionDate = root.querySelector('time')?.getAttribute('datetime')?.slice(0, 10);
  const topics = (
    Array.from(
      root.querySelectorAll('.document-full__relevant-topics-list-item-link')
    ) as unknown as Element[]
  )
    .map((topic) => text(topic)?.replace(/^#/, ''))
    .filter((topic): topic is string => Boolean(topic));
  const result: EdpbPage = {
    title,
    topics,
    pageUrl,
    documentUrl: new URL(selectedLink, pageUrl).toString(),
    status: /consultation|draft/i.test(title) ? 'consultation' : 'adopted'
  };
  const number = documentNumber(title);
  if (number) result.documentNumber = number;
  if (documentType) result.documentType = documentType;
  if (adoptionDate) result.adoptionDate = adoptionDate;
  return result;
}

export function sectionsFromPdfText(
  textValue: string
): { heading?: string; paragraphs: { number?: string; text: string }[] }[] {
  const lines = textValue
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const sections: { heading?: string; paragraphs: { number?: string; text: string }[] }[] = [];
  let current: { heading?: string; paragraphs: { number?: string; text: string }[] } = {
    paragraphs: []
  };
  for (const line of lines) {
    if (/^(?:\d+\.?\s+)?[A-Z][A-Z\s,–—-]{5,}$/.test(line) && line.length < 160) {
      if (current.paragraphs.length || current.heading) sections.push(current);
      current = { heading: line, paragraphs: [] };
      continue;
    }
    const numbered = /^(\d{1,4})\.\s+(.+)$/.exec(line);
    if (numbered?.[1] && numbered[2])
      current.paragraphs.push({ number: numbered[1], text: numbered[2] });
    else current.paragraphs.push({ text: line });
  }
  if (current.paragraphs.length || current.heading) sections.push(current);
  return sections;
}
