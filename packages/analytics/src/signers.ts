/** Public display approvals only; this catalogue grants no verification trust. */
export const SIGNER_DISPLAY_PROFILES = ['2026-10-27.1', '2026-10-28.1', '2026-11-05.1'] as const;
export const SIGNER_DISPLAY_PROFILE = '2026-11-05.1';
/** Last catalogue emitted before its profile was retained in stored evidence. */
export const LEGACY_SIGNER_DISPLAY_PROFILE = '2026-10-28.1';
export type SignerDisplayProfile = typeof SIGNER_DISPLAY_PROFILES[number];
export const PUBLIC_SIGNERS = [
  { origin: 'https://crawler.exa.ai', name: 'Exa', displayProfile: '2026-10-27.1', source: 'https://crawler.exa.ai/' },
  { origin: 'https://ahrefs.com', name: 'Ahrefs', displayProfile: '2026-10-27.1', source: 'https://ahrefs.com/robot' },
  { origin: 'https://assistbot.duckduckgo.com', name: 'DuckDuckGo', displayProfile: '2026-10-27.1', source: 'https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot' },
  { origin: 'https://agent.bot.goog', name: 'Google', displayProfile: '2026-10-28.1', source: 'https://developers.google.com/crawling/docs/crawlers-fetchers/web-bot-auth' },
  { origin: 'https://exauser.crawler.exa.ai', name: 'Exa', displayProfile: '2026-11-05.1', source: 'https://exauser.crawler.exa.ai/' },
  { origin: 'https://chatgpt.com', name: 'ChatGPT', displayProfile: '2026-11-05.1', source: 'https://chatgpt.com/.well-known/http-message-signatures-directory' },
] as const;

export type PublicSignerName = typeof PUBLIC_SIGNERS[number]['name'] | 'Other';

/** A receipt's recorded catalogue is independent of today's report display. */
export function publicSignerName(origin: string | null, profile: SignerDisplayProfile = SIGNER_DISPLAY_PROFILE): PublicSignerName {
  return PUBLIC_SIGNERS.find(signer => signer.origin === origin
    && SIGNER_DISPLAY_PROFILES.indexOf(signer.displayProfile) <= SIGNER_DISPLAY_PROFILES.indexOf(profile))?.name ?? 'Other';
}

export function isSignerDisplayProfile(value: unknown): value is SignerDisplayProfile {
  return SIGNER_DISPLAY_PROFILES.some(profile => profile === value);
}

export function isPublicSignerName(value: unknown): value is PublicSignerName {
  return value === 'Other' || PUBLIC_SIGNERS.some(signer => signer.name === value);
}
