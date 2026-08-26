import { EuLawError } from '../errors/errors.js';

export type EuLanguage = {
  iso2: string;
  cellar: string;
  eli: string;
};

const LANGUAGES: Record<string, EuLanguage> = {
  bg: { iso2: 'bg', cellar: 'BUL', eli: 'bul' },
  es: { iso2: 'es', cellar: 'SPA', eli: 'spa' },
  cs: { iso2: 'cs', cellar: 'CES', eli: 'ces' },
  da: { iso2: 'da', cellar: 'DAN', eli: 'dan' },
  de: { iso2: 'de', cellar: 'DEU', eli: 'deu' },
  et: { iso2: 'et', cellar: 'EST', eli: 'est' },
  el: { iso2: 'el', cellar: 'ELL', eli: 'ell' },
  en: { iso2: 'en', cellar: 'ENG', eli: 'eng' },
  fr: { iso2: 'fr', cellar: 'FRA', eli: 'fra' },
  ga: { iso2: 'ga', cellar: 'GLE', eli: 'gle' },
  hr: { iso2: 'hr', cellar: 'HRV', eli: 'hrv' },
  it: { iso2: 'it', cellar: 'ITA', eli: 'ita' },
  lv: { iso2: 'lv', cellar: 'LAV', eli: 'lav' },
  lt: { iso2: 'lt', cellar: 'LIT', eli: 'lit' },
  hu: { iso2: 'hu', cellar: 'HUN', eli: 'hun' },
  mt: { iso2: 'mt', cellar: 'MLT', eli: 'mlt' },
  nl: { iso2: 'nl', cellar: 'NLD', eli: 'nld' },
  pl: { iso2: 'pl', cellar: 'POL', eli: 'pol' },
  pt: { iso2: 'pt', cellar: 'POR', eli: 'por' },
  ro: { iso2: 'ro', cellar: 'RON', eli: 'ron' },
  sk: { iso2: 'sk', cellar: 'SLK', eli: 'slk' },
  sl: { iso2: 'sl', cellar: 'SLV', eli: 'slv' },
  fi: { iso2: 'fi', cellar: 'FIN', eli: 'fin' },
  sv: { iso2: 'sv', cellar: 'SWE', eli: 'swe' }
};

const ALIASES: Record<string, string> = {
  eng: 'en',
  english: 'en',
  swe: 'sv',
  swedish: 'sv',
  svenska: 'sv',
  gre: 'el',
  ell: 'el'
};

export function normalizeLanguage(input = 'en'): EuLanguage {
  const key = input.trim().toLowerCase().replace('_', '-').split('-')[0] ?? '';
  const normalized = ALIASES[key] ?? key;
  const language = LANGUAGES[normalized];
  if (!language) {
    throw new EuLawError('INVALID_ARGUMENT', `Unsupported EU language: ${input}`, {
      argument: 'language',
      value: input
    });
  }
  return language;
}

export const officialEuLanguageCodes = Object.freeze(Object.keys(LANGUAGES));
