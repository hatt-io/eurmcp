import { EuLawError } from '../../errors/errors.js';

export function rejectEurLexChallenge(html: string): void {
  if (/AwsWafIntegration|challenge-container|verify that you're not a robot/i.test(html)) {
    throw new EuLawError('UPSTREAM_UNAVAILABLE', 'EUR-Lex returned an anti-automation challenge');
  }
}
