export function curiaCaseUrl(caseNumber: string, language = 'en'): string {
  return `https://infocuria.curia.europa.eu/tabs/redirect/juris/liste.jsf?jur=C,T,F&language=${encodeURIComponent(language)}&num=${encodeURIComponent(caseNumber)}`;
}
