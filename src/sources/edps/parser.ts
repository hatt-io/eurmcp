import { DOMParser } from 'linkedom';
import { EuLawError } from '../../errors/errors.js';

export function parseEdpsSearchPage(
  html: string,
  sourceUrl: string
): { title: string; pageUrl: string; date?: string }[] {
  if (/AwsWafIntegration|challenge-container|403 Forbidden/i.test(html)) {
    throw new EuLawError('UPSTREAM_UNAVAILABLE', 'EDPS website blocked non-browser retrieval', {
      source_url: sourceUrl
    });
  }
  const document = new DOMParser().parseFromString(html, 'text/html');
  const links = Array.from(
    document?.querySelectorAll('h3 a[href*="/publications/"]') ?? []
  ) as unknown as Element[];
  if (!links.length) {
    throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'EDPS search-result structure changed', {
      source_url: sourceUrl
    });
  }
  return links.flatMap((link) => {
    const title = link.textContent?.replace(/\s+/g, ' ').trim();
    const href = link.getAttribute('href');
    if (!title || !href) return [];
    return [{ title, pageUrl: new URL(href, sourceUrl).toString() }];
  });
}
