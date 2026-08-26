import { EuLawError } from '../errors/errors.js';

export const documentTypeUris: Readonly<Record<string, readonly string[]>> = Object.freeze({
  regulation: ['REG'],
  directive: ['DIR'],
  decision: ['DEC'],
  recommendation: ['RECO'],
  opinion: ['OPIN'],
  'delegated regulation': ['REG_DEL'],
  'implementing regulation': ['REG_IMPL'],
  treaty: ['TREATY']
});

export function normalizeDocumentType(input: string): string {
  const value = input.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  if (!documentTypeUris[value]) {
    throw new EuLawError('INVALID_ARGUMENT', `Unsupported document type: ${input}`, {
      argument: 'document_type',
      supported: Object.keys(documentTypeUris)
    });
  }
  return value;
}

export function resourceTypeName(uri: string | undefined): string | undefined {
  if (!uri) return undefined;
  const code = uri.split('/').pop();
  for (const [name, codes] of Object.entries(documentTypeUris)) {
    if (code && codes.includes(code)) return name;
  }
  return code?.toLowerCase().replaceAll('_', ' ');
}
