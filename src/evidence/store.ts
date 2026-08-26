import { randomUUID } from 'node:crypto';
import { chmod, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { EuLawError } from '../errors/errors.js';
import type { SourceAnchor } from '../types.js';
import { LEGAL_TEXT_NORMALIZATION, normalizeLegalText, sha256 } from './normalization.js';

const EVIDENCE_ID = /^sha256:([a-f0-9]{64})$/;
const ANCHOR_ID = /^[a-f0-9]{64}$/;

export type StoredAnchor = SourceAnchor & { text: string };

export type EvidenceRecord = {
  evidence_id: string;
  response_sha256: string;
  media_type: string;
  source_url: string;
  retrieved_at: string;
  parser_name: string;
  parser_version: string;
  normalized_text_sha256?: string;
  anchors: StoredAnchor[];
};

export type EvidenceStore = {
  readonly enabled: boolean;
  put(
    bytes: Uint8Array,
    record: Omit<EvidenceRecord, 'evidence_id' | 'response_sha256'>
  ): Promise<string>;
  get(evidenceId: string): Promise<EvidenceRecord>;
};

function hashFromEvidenceId(evidenceId: string): string {
  const match = EVIDENCE_ID.exec(evidenceId);
  if (!match?.[1]) {
    throw new EuLawError('EVIDENCE_NOT_FOUND', 'Evidence identifier was not found', {
      evidence_id: evidenceId
    });
  }
  return match[1];
}

export class FileEvidenceStore implements EvidenceStore {
  readonly enabled = true;
  readonly #directory: string;

  constructor(cacheDirectory: string) {
    this.#directory = join(cacheDirectory, 'evidence', 'v1');
  }

  async put(
    bytes: Uint8Array,
    record: Omit<EvidenceRecord, 'evidence_id' | 'response_sha256'>
  ): Promise<string> {
    const hash = sha256(bytes);
    const evidenceId = `sha256:${hash}`;
    await mkdir(this.#directory, { recursive: true, mode: 0o700 });
    const sourcePath = join(this.#directory, `${hash}.source`);
    const recordPath = join(this.#directory, `${hash}.json`);
    await this.#writeOnce(sourcePath, bytes);
    const complete: EvidenceRecord = {
      ...record,
      evidence_id: evidenceId,
      response_sha256: hash,
      anchors: record.anchors.map((anchor) => ({
        ...anchor,
        text: normalizeLegalText(anchor.text)
      }))
    };
    const staging = `${recordPath}.${process.pid}.${randomUUID()}.staging`;
    await writeFile(staging, JSON.stringify(complete), { encoding: 'utf8', mode: 0o600 });
    await rename(staging, recordPath);
    await chmod(recordPath, 0o600);
    return evidenceId;
  }

  async get(evidenceId: string): Promise<EvidenceRecord> {
    const hash = hashFromEvidenceId(evidenceId);
    try {
      const parsed = JSON.parse(
        await readFile(join(this.#directory, `${hash}.json`), 'utf8')
      ) as EvidenceRecord;
      if (parsed.evidence_id !== evidenceId || parsed.response_sha256 !== hash) {
        throw new EuLawError(
          'UPSTREAM_FORMAT_CHANGED',
          'Stored evidence metadata is inconsistent',
          {
            evidence_id: evidenceId
          }
        );
      }
      return parsed;
    } catch (error) {
      if (error instanceof EuLawError) throw error;
      if ((error as NodeJS.ErrnoException).code === 'ENOENT' || error instanceof SyntaxError) {
        throw new EuLawError('EVIDENCE_NOT_FOUND', 'Evidence identifier was not found', {
          evidence_id: evidenceId
        });
      }
      throw error;
    }
  }

  async #writeOnce(path: string, bytes: Uint8Array): Promise<void> {
    try {
      await readFile(path);
      return;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    const staging = `${path}.${process.pid}.${randomUUID()}.staging`;
    await writeFile(staging, bytes, { mode: 0o600 });
    try {
      await rename(staging, path);
      await chmod(path, 0o600);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    }
  }
}

export class NullEvidenceStore implements EvidenceStore {
  readonly enabled = false;

  async put(
    bytes: Uint8Array,
    _record: Omit<EvidenceRecord, 'evidence_id' | 'response_sha256'>
  ): Promise<string> {
    return `sha256:${sha256(bytes)}`;
  }

  async get(evidenceId: string): Promise<EvidenceRecord> {
    hashFromEvidenceId(evidenceId);
    throw new EuLawError('EVIDENCE_NOT_FOUND', 'Evidence snapshots are disabled', {
      evidence_id: evidenceId
    });
  }
}

export function assertAnchorId(anchorId: string): void {
  if (!ANCHOR_ID.test(anchorId)) {
    throw new EuLawError('SOURCE_ANCHOR_NOT_FOUND', 'Source anchor was not found', {
      anchor_id: anchorId
    });
  }
}

export async function verifyStoredQuote(
  store: EvidenceStore,
  input: { evidence_id: string; anchor_id: string; quote: string }
) {
  assertAnchorId(input.anchor_id);
  const evidence = await store.get(input.evidence_id);
  const anchors = evidence.anchors.filter((item) => item.anchor_id === input.anchor_id);
  if (anchors.length === 0) {
    throw new EuLawError('SOURCE_ANCHOR_NOT_FOUND', 'Source anchor was not found', {
      evidence_id: input.evidence_id,
      anchor_id: input.anchor_id
    });
  }
  if (anchors.length > 1) {
    throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'Source anchor resolved more than once', {
      evidence_id: input.evidence_id,
      anchor_id: input.anchor_id
    });
  }
  const source = anchors[0]!;
  const result =
    input.quote === source.text
      ? 'exact_match'
      : normalizeLegalText(input.quote) === normalizeLegalText(source.text)
        ? 'normalized_match'
        : 'no_match';
  return {
    evidence_id: input.evidence_id,
    anchor_id: input.anchor_id,
    result,
    normalization: LEGAL_TEXT_NORMALIZATION,
    source_anchor: {
      anchor_id: source.anchor_id,
      kind: source.kind,
      location: source.location,
      ...(source.source_element_id ? { source_element_id: source.source_element_id } : {}),
      structural_path: source.structural_path,
      text_sha256: source.text_sha256
    }
  };
}
