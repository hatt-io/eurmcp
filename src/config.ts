import { resolve } from 'node:path';
import { EuLawError } from './errors/errors.js';

export type Config = {
  cacheDir: string;
  cacheEnabled: boolean;
  evidenceEnabled: boolean;
  httpTimeoutMs: number;
  logLevel: 'silent' | 'error' | 'warn' | 'info' | 'debug';
};

function booleanEnv(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  if (['1', 'true', 'yes', 'on'].includes(value.toLowerCase())) return true;
  if (['0', 'false', 'no', 'off'].includes(value.toLowerCase())) return false;
  throw new EuLawError('INVALID_ARGUMENT', `${name} must be a boolean`, {
    environment_variable: name
  });
}

function numberEnv(name: string, defaultValue: number, minimum: number, maximum: number): number {
  const raw = process.env[name];
  if (raw === undefined) return defaultValue;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new EuLawError('INVALID_ARGUMENT', `${name} is outside the allowed range`, {
      environment_variable: name,
      minimum,
      maximum
    });
  }
  return value;
}

export function loadConfig(): Config {
  const logLevel = process.env.EU_LAW_LOG_LEVEL ?? 'warn';
  if (!['silent', 'error', 'warn', 'info', 'debug'].includes(logLevel)) {
    throw new EuLawError('INVALID_ARGUMENT', 'Invalid EU_LAW_LOG_LEVEL', { value: logLevel });
  }
  return {
    cacheDir: resolve(process.env.EU_LAW_CACHE_DIR ?? '.eu-law-cache'),
    cacheEnabled: booleanEnv('EU_LAW_CACHE_ENABLED', true),
    evidenceEnabled: booleanEnv('EU_LAW_EVIDENCE_ENABLED', true),
    httpTimeoutMs: numberEnv('EU_LAW_HTTP_TIMEOUT_MS', 30_000, 1_000, 120_000),
    logLevel: logLevel as Config['logLevel']
  };
}
