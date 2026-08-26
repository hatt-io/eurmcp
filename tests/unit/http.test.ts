import { afterEach, describe, expect, it, vi } from 'vitest';
import { NullCache, type Cache } from '../../src/cache/cache.js';
import { EuLawError } from '../../src/errors/errors.js';
import { HttpClient } from '../../src/http/client.js';

describe('HTTP security boundary', () => {
  const http = new HttpClient({ timeoutMs: 1000, cache: new NullCache() });

  it('rejects arbitrary, local, credentialed, and non-HTTPS URLs before fetch', async () => {
    for (const url of [
      'http://publications.europa.eu/',
      'https://example.com/',
      'https://localhost/',
      'https://127.0.0.1/',
      'https://user:pass@publications.europa.eu/'
    ]) {
      await expect(http.get(url, { accept: ['text/html'] })).rejects.toBeInstanceOf(EuLawError);
    }
  });

  it('hashes actual bytes and preserves the original receipt on cache hits', async () => {
    const values = new Map<string, unknown>();
    const cache: Cache = {
      async get<T>(key: string) {
        return values.get(key) as T | undefined;
      },
      async set<T>(key: string, value: T) {
        values.set(key, value);
      }
    };
    const response = new Response('official', {
      status: 200,
      headers: {
        'content-type': 'text/html',
        etag: '"fixture"',
        'last-modified': 'Wed, 26 Aug 2026 12:00:00 GMT'
      }
    });
    Object.defineProperty(response, 'url', {
      value: 'https://publications.europa.eu/example'
    });
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal('fetch', fetchMock);
    const client = new HttpClient({ timeoutMs: 1000, cache, retries: 0 });
    const first = await client.get('https://publications.europa.eu/example', {
      accept: ['text/html'],
      cacheKey: 'fixture',
      ttlSeconds: 60
    });
    const second = await client.get('https://publications.europa.eu/example', {
      accept: ['text/html'],
      cacheKey: 'fixture',
      ttlSeconds: 60
    });
    expect(first.byteCount).toBe(8);
    expect(first.rawSha256).toBe(second.rawSha256);
    expect(second.retrievedAt).toBe(first.retrievedAt);
    expect(second.cacheStatus).toBe('hit');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

afterEach(() => vi.unstubAllGlobals());
