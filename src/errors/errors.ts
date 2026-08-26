export const errorCodes = [
  'DOCUMENT_NOT_FOUND',
  'ARTICLE_NOT_FOUND',
  'RECITAL_NOT_FOUND',
  'CASE_NOT_FOUND',
  'PARAGRAPH_NOT_FOUND',
  'LANGUAGE_NOT_AVAILABLE',
  'AMBIGUOUS_IDENTIFIER',
  'VERSION_NOT_FOUND',
  'UPSTREAM_UNAVAILABLE',
  'UPSTREAM_TIMEOUT',
  'UPSTREAM_FORMAT_CHANGED',
  'INVALID_IDENTIFIER',
  'INVALID_ARGUMENT',
  'EVIDENCE_NOT_FOUND',
  'SOURCE_ANCHOR_NOT_FOUND'
] as const;

export type ErrorCode = (typeof errorCodes)[number];
export type ErrorContext = Record<string, unknown>;

export class EuLawError extends Error {
  readonly code: ErrorCode;
  readonly context: ErrorContext;

  constructor(code: ErrorCode, message: string, context: ErrorContext = {}, cause?: unknown) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = 'EuLawError';
    this.code = code;
    this.context = context;
  }

  toJSON(): { error: ErrorCode; message: string } & ErrorContext {
    return { error: this.code, message: this.message, ...this.context };
  }
}

export function asEuLawError(error: unknown): EuLawError {
  if (error instanceof EuLawError) return error;
  return new EuLawError(
    'UPSTREAM_UNAVAILABLE',
    error instanceof Error ? error.message : 'Unknown upstream failure',
    {},
    error
  );
}
