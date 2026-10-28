/** Public display approvals only; this catalogue grants no verification trust. */
export const SIGNER_DISPLAY_PROFILE = '2026-10-28.1';
export type SignerDisplayProfile = '2026-10-27.1' | typeof SIGNER_DISPLAY_PROFILE;
export const PUBLIC_SIGNERS = [
  { origin: 'https://crawler.exa.ai', name: 'Exa', displayProfile: '2026-10-27.1', source: 'https://crawler.exa.ai/' },
  { origin: 'https://ahrefs.com', name: 'Ahrefs', displayProfile: '2026-10-27.1', source: 'https://ahrefs.com/robot' },
  { origin: 'https://assistbot.duckduckgo.com', name: 'DuckDuckGo', displayProfile: '2026-10-27.1', source: 'https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot' },
  { origin: 'https://agent.bot.goog', name: 'Google', displayProfile: '2026-10-28.1', source: 'https://developers.google.com/crawling/docs/crawlers-fetchers/web-bot-auth' },
] as const;

export type PublicSignerName = typeof PUBLIC_SIGNERS[number]['name'] | 'Other';

/** A receipt's recorded catalogue is independent of today's report display. */
export function publicSignerName(origin: string | null, profile: SignerDisplayProfile = SIGNER_DISPLAY_PROFILE): PublicSignerName {
  return PUBLIC_SIGNERS.find(signer => signer.origin === origin
    && (signer.displayProfile === '2026-10-27.1' || profile === SIGNER_DISPLAY_PROFILE))?.name ?? 'Other';
}

export function isPublicSignerName(value: unknown): value is PublicSignerName {
  return value === 'Other' || PUBLIC_SIGNERS.some(signer => signer.name === value);
}
