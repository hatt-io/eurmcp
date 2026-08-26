import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export type Cache = {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
};

type CacheEntry<T> = { expiresAt: number; value: T };

export class NullCache implements Cache {
  async get<T>(_key: string): Promise<T | undefined> {
    return undefined;
  }

  async set<T>(_key: string, _value: T, _ttlSeconds: number): Promise<void> {}
}

export class FileCache implements Cache {
  readonly #directory: string;

  constructor(directory: string) {
    this.#directory = directory;
  }

  #path(key: string): string {
    return join(this.#directory, `${createHash('sha256').update(key).digest('hex')}.json`);
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const parsed = JSON.parse(await readFile(this.#path(key), 'utf8')) as CacheEntry<T>;
      if (parsed.expiresAt <= Date.now()) return undefined;
      return parsed.value;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT' || error instanceof SyntaxError)
        return undefined;
      throw error;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await mkdir(this.#directory, { recursive: true, mode: 0o700 });
    const destination = this.#path(key);
    const staging = `${destination}.${process.pid}.staging`;
    const entry: CacheEntry<T> = { expiresAt: Date.now() + ttlSeconds * 1000, value };
    await writeFile(staging, JSON.stringify(entry), { encoding: 'utf8', mode: 0o600 });
    await rename(staging, destination);
  }
}

export const cacheTtl = Object.freeze({
  search: 15 * 60,
  latestConsolidation: 6 * 60 * 60,
  mutableDocument: 24 * 60 * 60,
  historicalDocument: 30 * 24 * 60 * 60,
  immutableJudgment: 180 * 24 * 60 * 60,
  guidance: 24 * 60 * 60
});
