/** Cloudflare legacy category vocabulary, reviewed 2026-10-27.
 * https://developers.cloudflare.com/bots/concepts/bot/verified-bots/#legacy-categories
 * A provider category is not a local signature verdict or a verified human trigger.
 */
export const NATIVE_BOT_CATEGORIES = [
  'Academic Research', 'Accessibility', 'Advertising & Marketing', 'Aggregator',
  'AI Assistant', 'AI Crawler', 'AI Search', 'Archiver', 'Feed Fetcher',
  'Monitoring & Analytics', 'Page Preview', 'Search Engine Crawler',
  'Search Engine Optimization', 'Security', 'Social Media Marketing', 'Webhooks', 'Other',
] as const;
export type NativeBotCategory = typeof NATIVE_BOT_CATEGORIES[number];
export type NativeCategoryBasis = NativeBotCategory | 'empty' | 'unavailable' | 'unrecognized' | 'not-recorded';
export interface NativeCategoryEvidence {
  version: '2026-10-27.1';
  status: 'known' | 'empty' | 'unavailable' | 'unrecognized';
  value: NativeBotCategory | null;
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function isNativeBotCategory(value: unknown): value is NativeBotCategory {
  return typeof value === 'string' && NATIVE_BOT_CATEGORIES.some(category => category === value);
}
export function isNativeCategoryBasis(value: unknown): value is NativeCategoryBasis {
  return isNativeBotCategory(value) || value === 'empty' || value === 'unavailable' || value === 'unrecognized' || value === 'not-recorded';
}
export function nativeCategoryEvidence(cf: unknown): NativeCategoryEvidence {
  const value = record(cf) ? cf.verifiedBotCategory : undefined;
  return { version: '2026-10-27.1',
    status: isNativeBotCategory(value) ? 'known' : value === '' ? 'empty' : value === undefined || value === null ? 'unavailable' : 'unrecognized',
    value: isNativeBotCategory(value) ? value : null,
  };
}
/** Fixed field, closed output; never group/display an arbitrary stored string. */
export function nativeCategoryBasisSql(): string {
  return `CASE
    WHEN json_type(signature_evidence, '$.native.category') IS NULL THEN 'not-recorded'
    WHEN json_extract(signature_evidence, '$.version') IS NOT '2026-10-27.4'
      OR COALESCE(json_extract(signature_evidence, '$.source'), '') NOT IN ('local-webbotauth','test-injected')
      OR json_extract(signature_evidence, '$.native.category.version') IS NOT '2026-10-27.1' THEN 'unrecognized'
    WHEN json_extract(signature_evidence, '$.native.category.status') = 'known'
      AND json_extract(signature_evidence, '$.native.category.value') IN (${NATIVE_BOT_CATEGORIES.map(value => "'" + value + "'").join(',')})
      THEN json_extract(signature_evidence, '$.native.category.value')
    WHEN json_extract(signature_evidence, '$.native.category.status') IN ('empty','unavailable','unrecognized')
      AND json_type(signature_evidence, '$.native.category.value') = 'null'
      THEN json_extract(signature_evidence, '$.native.category.status')
    ELSE 'unrecognized' END`;
}
const UNKNOWN_LABELS = {
  empty: 'Empty provider category — no purpose established', unavailable: 'Provider category unavailable',
  unrecognized: 'Unrecognized provider category record', 'not-recorded': 'Category not recorded — earlier or unreported',
} as const;
export function nativeCategoryLabel(basis: NativeCategoryBasis): string {
  return isNativeBotCategory(basis) ? basis : UNKNOWN_LABELS[basis];
}
