import { describe, expect, it } from 'vitest';
import { NullCache } from '../../src/cache/cache.js';
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
});
