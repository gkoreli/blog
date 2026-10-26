/** Public display approvals only; this catalogue grants no verification trust. */
export const PUBLIC_SIGNERS = [
  { origin: 'https://crawler.exa.ai', name: 'Exa', source: 'https://crawler.exa.ai/' },
  { origin: 'https://ahrefs.com', name: 'Ahrefs', source: 'https://ahrefs.com/robot' },
  { origin: 'https://assistbot.duckduckgo.com', name: 'DuckDuckGo', source: 'https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot' },
] as const;

export type PublicSignerName = typeof PUBLIC_SIGNERS[number]['name'] | 'Other';

export function isPublicSignerName(value: unknown): value is PublicSignerName {
  return value === 'Other' || PUBLIC_SIGNERS.some(signer => signer.name === value);
}
