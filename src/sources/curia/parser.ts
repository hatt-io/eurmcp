import { EuLawError } from '../../errors/errors.js';

export function requireCuriaCaseResult(html: string): void {
  if (!/Case number|Numéro de l'affaire|Målnummer/i.test(html)) {
    throw new EuLawError('UPSTREAM_FORMAT_CHANGED', 'InfoCuria case-result structure changed');
  }
}
