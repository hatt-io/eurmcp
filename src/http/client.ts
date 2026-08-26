import { isIP } from 'node:net';
import { EuLawError } from '../errors/errors.js';
import type { Cache } from '../cache/cache.js';

const AUTHORITATIVE_HOSTS = new Set([
  'publications.europa.eu',
  'eur-lex.europa.eu',
  'data.europa.eu',
  'curia.europa.eu',
  'infocuria.curia.europa.eu',
  'www.edpb.europa.eu',
  'edpb.europa.eu',
  'www.edps.europa.eu',
  'edps.europa.eu'
]);

type HttpClientOptions = {
  timeoutMs: number;
  cache: Cache;
  userAgent?: string;
  maxResponseBytes?: number;
  maxRedirects?: number;
  retries?: number;
};

type RequestOptions = {
  accept: readonly string[];
  cacheKey?: string;
  ttlSeconds?: number;
  method?: 'GET' | 'POST';
  body?: string;
  contentType?: string;
  maxResponseBytes?: number;
};

type CachedResponse = {
  url: string;
  contentType: string;
  bodyBase64: string;
};

export type HttpPayload = {
  url: string;
  contentType: string;
  bytes: Uint8Array;
  text(): string;
};

function assertAuthoritativeUrl(url: URL): void {
  if (url.protocol !== 'https:') {
    throw new EuLawError('INVALID_ARGUMENT', 'Only HTTPS upstream URLs are permitted', {
      source_url: url.toString()
    });
  }
  const hostname = url.hostname.toLowerCase();
  if (!AUTHORITATIVE_HOSTS.has(hostname) || hostname === 'localhost' || isIP(hostname) !== 0) {
    throw new EuLawError('INVALID_ARGUMENT', 'Upstream URL is not on the authoritative allowlist', {
      source_url: url.toString()
    });
  }
  if (url.username || url.password) {
    throw new EuLawError('INVALID_ARGUMENT', 'Credentials are prohibited in upstream URLs');
  }
}

function mediaType(value: string | null): string {
  return (value ?? '').split(';')[0]?.trim().toLowerCase() ?? '';
}

function isAccepted(actual: string, accepted: readonly string[]): boolean {
  return accepted.some((expected) => {
    if (expected.endsWith('/*')) return actual.startsWith(expected.slice(0, -1));
    return actual === expected || (expected === 'application/xml' && actual.endsWith('+xml'));
  });
}

export class HttpClient {
  readonly #options: Required<Omit<HttpClientOptions, 'cache'>> & { cache: Cache };

  constructor(options: HttpClientOptions) {
    this.#options = {
      timeoutMs: options.timeoutMs,
      cache: options.cache,
      userAgent: options.userAgent ?? 'eu-law-mcp/0.1 (+https://github.com/eu-law-mcp/eu-law-mcp)',
      maxResponseBytes: options.maxResponseBytes ?? 25 * 1024 * 1024,
      maxRedirects: options.maxRedirects ?? 5,
      retries: options.retries ?? 2
    };
  }

  async get(url: string | URL, options: RequestOptions): Promise<HttpPayload> {
    return this.request(url, { ...options, method: 'GET' });
  }

  async request(urlInput: string | URL, options: RequestOptions): Promise<HttpPayload> {
    const initialUrl = new URL(urlInput);
    assertAuthoritativeUrl(initialUrl);

    if (options.cacheKey) {
      const cached = await this.#options.cache.get<CachedResponse>(options.cacheKey);
      if (cached)
        return this.#payload(
          cached.url,
          cached.contentType,
          Buffer.from(cached.bodyBase64, 'base64')
        );
    }

    let lastError: unknown;
    for (let attempt = 0; attempt <= this.#options.retries; attempt += 1) {
      try {
        const response = await this.#fetchFollowingRedirects(initialUrl, options);
        const contentType = mediaType(response.headers.get('content-type'));
        if (!isAccepted(contentType, options.accept)) {
          throw new EuLawError(
            'UPSTREAM_FORMAT_CHANGED',
            `Unexpected upstream content type: ${contentType || 'missing'}`,
            {
              source_url: response.url,
              expected_content_types: options.accept,
              actual_content_type: contentType || null
            }
          );
        }
        const declaredLength = Number(response.headers.get('content-length') ?? '0');
        const maximum = options.maxResponseBytes ?? this.#options.maxResponseBytes;
        if (declaredLength > maximum) {
          throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'Upstream response exceeds size limit', {
            source_url: response.url,
            maximum_bytes: maximum,
            declared_bytes: declaredLength
          });
        }
        const bytes = await this.#readLimited(response, maximum);
        const payload = this.#payload(response.url, contentType, bytes);
        if (options.cacheKey && options.ttlSeconds) {
          await this.#options.cache.set<CachedResponse>(
            options.cacheKey,
            { url: payload.url, contentType, bodyBase64: Buffer.from(bytes).toString('base64') },
            options.ttlSeconds
          );
        }
        return payload;
      } catch (error) {
        lastError = error;
        if (
          error instanceof EuLawError &&
          !['UPSTREAM_TIMEOUT', 'UPSTREAM_UNAVAILABLE'].includes(error.code)
        ) {
          throw error;
        }
        if (attempt < this.#options.retries) {
          await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
        }
      }
    }
    if (lastError instanceof EuLawError) throw lastError;
    throw new EuLawError('UPSTREAM_UNAVAILABLE', 'Authoritative source unavailable', {}, lastError);
  }

  async #fetchFollowingRedirects(initialUrl: URL, options: RequestOptions): Promise<Response> {
    let url = initialUrl;
    for (let redirects = 0; redirects <= this.#options.maxRedirects; redirects += 1) {
      assertAuthoritativeUrl(url);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.#options.timeoutMs);
      let response: Response;
      try {
        response = await fetch(url, {
          method: options.method ?? 'GET',
          ...(options.body === undefined ? {} : { body: options.body }),
          redirect: 'manual',
          headers: {
            Accept: options.accept.join(', '),
            'User-Agent': this.#options.userAgent,
            ...(options.contentType ? { 'Content-Type': options.contentType } : {})
          },
          signal: controller.signal
        });
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new EuLawError('UPSTREAM_TIMEOUT', 'Authoritative source request timed out', {
            source_url: url.toString(),
            timeout_ms: this.#options.timeoutMs
          });
        }
        throw new EuLawError(
          'UPSTREAM_UNAVAILABLE',
          'Authoritative source request failed',
          {
            source_url: url.toString()
          },
          error
        );
      } finally {
        clearTimeout(timer);
      }
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location)
          throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'Redirect had no Location header');
        url = new URL(location, url);
        continue;
      }
      if (!response.ok) {
        const code = response.status === 404 ? 'DOCUMENT_NOT_FOUND' : 'UPSTREAM_UNAVAILABLE';
        throw new EuLawError(code, `Authoritative source returned HTTP ${response.status}`, {
          source_url: url.toString(),
          status: response.status
        });
      }
      return response;
    }
    throw new EuLawError('UPSTREAM_UNAVAILABLE', 'Too many authoritative-source redirects', {
      source_url: initialUrl.toString(),
      maximum_redirects: this.#options.maxRedirects
    });
  }

  #payload(url: string, contentType: string, bytes: Uint8Array): HttpPayload {
    return { url, contentType, bytes, text: () => new TextDecoder().decode(bytes) };
  }

  async #readLimited(response: Response, maximum: number): Promise<Uint8Array> {
    if (!response.body) return new Uint8Array();
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      received += next.value.byteLength;
      if (received > maximum) {
        await reader.cancel();
        throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'Upstream response exceeds size limit', {
          source_url: response.url,
          maximum_bytes: maximum,
          received_bytes: received
        });
      }
      chunks.push(next.value);
    }
    const result = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return result;
  }
}
