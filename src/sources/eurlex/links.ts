export function eurLexUrl(
  identifier: string,
  language = 'en',
  view: 'TXT' | 'ALL' | 'CASE' = 'TXT'
): string {
  return `https://eur-lex.europa.eu/legal-content/${language.toUpperCase()}/${view}/?uri=CELEX:${encodeURIComponent(identifier)}`;
}

export function eurLexEcliUrl(ecli: string, language = 'en'): string {
  return `https://eur-lex.europa.eu/legal-content/${language.toUpperCase()}/TXT/?uri=ecli:${encodeURIComponent(ecli)}`;
}
