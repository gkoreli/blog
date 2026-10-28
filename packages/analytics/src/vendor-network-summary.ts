import type { VendorNetworkSummary } from './contracts.js';

// Historical method profiles retain their original source scope. No current feed replay.
const ORIGINAL_SOURCES = ['ahrefs-crawlers','google-common','openai-ads','openai-gpt','openai-search','openai-user','perplexity-bot','perplexity-user'] as const;
const ADDED_SOURCES = ['duckduckbot','google-agent'] as const;
const list = (values: readonly string[]) => values.map(v => `'${v}'`).join(',');

/** Consistency of stored fields supporting public claims, not proof of the
 * original address comparison, authenticated declaration or current feed state.
 */
export function vendorNetworkStateSql(): string {
  const v = (key: string) => `json_extract(vendor_ip_evidence, '$.${key}')`;
  const t = (key: string) => `json_type(vendor_ip_evidence, '$.${key}')`;
  const integer = (key: string, max: number) => `${t(key)} = 'integer' AND ${v(key)} BETWEEN 0 AND ${max}`;
  const c = (key: string) => `json_extract(check_row.value, '$.${key}')`;
  const ct = (key: string) => `json_type(check_row.value, '$.${key}')`;
  const timestamp = (value: string) => `typeof(${value}) = 'text' AND strftime('%Y-%m-%dT%H:%M:%fZ', ${value}, '+0 days') = ${value}`;
  const outcomes = [['listed','listed'],['notListed','not-listed'],['unavailable','unavailable'],['notAssessed','not-assessed']] as const;
  const flags = outcomes.map(([key,outcome]) => `${t(`summary.${key}`)} IN ('true','false') AND ${v(`summary.${key}`)} = EXISTS (SELECT 1 FROM json_each(vendor_ip_evidence, '$.checks') AS flag_row WHERE CASE WHEN flag_row.type = 'object' THEN json_extract(flag_row.value, '$.outcome') = '${outcome}' ELSE 0 END)`).join(' AND ');
  const validCheck = `
    ${ct('source')} = 'text'
    AND (${c('source')} IN (${list(ORIGINAL_SOURCES)}) OR (${v('profile')} IN ('2026-10-28.1','2026-10-28.2') AND ${c('source')} IN (${list(ADDED_SOURCES)})))
    AND CASE
      WHEN ${v('address.state')} <> 'usable' THEN ${c('outcome')} = 'unavailable' AND ${c('reason')} = 'address-unavailable' AND ${ct('snapshot')} = 'null'
      WHEN check_row.key >= 4 THEN ${c('outcome')} = 'not-assessed' AND ${c('reason')} = 'request-budget' AND ${ct('snapshot')} = 'null'
      WHEN ${c('outcome')} IN ('listed','not-listed') THEN ${ct('reason')} = 'null' AND ${ct('snapshot')} = 'object'
        AND ${ct('snapshot.sha256')} = 'text' AND length(${c('snapshot.sha256')}) = 64 AND ${c('snapshot.sha256')} NOT GLOB '*[^0-9a-f]*'
        AND ${ct('snapshot.prefixCount')} = 'integer' AND ${c('snapshot.prefixCount')} BETWEEN 1 AND 4096
        AND ${timestamp(c('snapshot.fetchedAt'))} AND ${timestamp(c('snapshot.validatedAt'))} AND ${timestamp(c('snapshot.freshUntil'))}
        AND ${c('snapshot.fetchedAt')} <= ${c('snapshot.validatedAt')} AND ${c('snapshot.validatedAt')} <= ${v('checkedAt')}
        AND (${ct('snapshot.publisherVersion')} = 'null' OR (${ct('snapshot.publisherVersion')} = 'text' AND length(${c('snapshot.publisherVersion')}) <= 32))
      WHEN ${c('outcome')} = 'not-assessed' THEN ${c('reason')} = 'refresh-cooldown' AND ${ct('snapshot')} = 'null'
      WHEN ${c('outcome')} = 'unavailable' THEN (${c('reason')} IN ('fetch-failed','fetch-timeout','http-status','media-type','body-limit','invalid-feed') OR (${v('profile')} = '2026-10-28.2' AND ${c('reason')} = 'revalidation-mismatch')) AND ${ct('snapshot')} = 'null'
      ELSE 0 END`;
  return `CASE WHEN vendor_ip_evidence IS NULL THEN 'not-recorded'
    WHEN NOT COALESCE((
      json_type(vendor_ip_evidence) = 'object' AND ${v('source')} = 'local-vendor-ip' AND ${v('method')} = 'published-ip-feed'
      AND ${v('profile')} IN ('2026-10-27.1','2026-10-28.1','2026-10-28.2') AND ${timestamp(v('checkedAt'))}
      AND ${integer('declarationCount',9007199254740991)} AND ${integer('configuredDeclarationCount',11)} AND ${integer('unmappedDeclarationCount',9007199254740991)}
      AND ${v('configuredDeclarationCount')} + ${v('unmappedDeclarationCount')} = ${v('declarationCount')}
      AND ${t('address')} = 'object'
      AND ((${v('address.state')} = 'usable' AND ${v('address.header')} IN ('cf-connecting-ip','cf-connecting-ipv6') AND ${v('address.family')} IN ('ipv4','ipv6') AND (${v('address.header')} <> 'cf-connecting-ipv6' OR ${v('address.family')} = 'ipv6'))
        OR (${v('address.state')} IN ('missing','invalid','special-range','worker-subrequest','edge-context-unavailable') AND ${t('address.header')} = 'null' AND ${t('address.family')} = 'null'))
      AND ${t('checks')} = 'array' AND json_array_length(vendor_ip_evidence, '$.checks') <= 10
      AND json_array_length(vendor_ip_evidence, '$.checks') <= ${v('configuredDeclarationCount')}
      AND ${v('configuredDeclarationCount')} <= json_array_length(vendor_ip_evidence, '$.checks') + EXISTS (SELECT 1 FROM json_each(vendor_ip_evidence, '$.checks') AS ahrefs WHERE CASE WHEN ahrefs.type = 'object' THEN json_extract(ahrefs.value, '$.source') = 'ahrefs-crawlers' ELSE 0 END)
      AND NOT EXISTS (SELECT 1 FROM json_each(vendor_ip_evidence, '$.checks') AS check_row WHERE CASE WHEN check_row.type = 'object' THEN NOT COALESCE((${validCheck}),0) ELSE 1 END)
      AND NOT EXISTS (SELECT 1 FROM json_each(vendor_ip_evidence, '$.checks') AS duplicate_row WHERE duplicate_row.type = 'object' GROUP BY json_extract(duplicate_row.value, '$.source') HAVING COUNT(*) > 1)
      AND ${t('summary')} = 'object' AND ${flags}
    ),0) THEN 'unrecognized' ELSE 'recognized' END`;
}

/** Overlapping outcome families must not be added as an exclusive partition. */
export function consistentVendorNetworkSummary(v: VendorNetworkSummary, total: number): boolean {
  if (!Number.isSafeInteger(total) || total < 0 || Object.values(v).some(n => !Number.isSafeInteger(n) || n < 0 || n > total)) return false;
  return Number.isSafeInteger(v.recognizedViews) && Number.isSafeInteger(v.unrecognizedViews)
    && v.recordedViews + v.notRecordedViews === total
    && v.recognizedViews + v.unrecognizedViews === v.recordedViews
    && [v.configuredDeclarationViews,v.unmappedDeclarationViews,v.noDeclarationViews].every(n => n <= v.recognizedViews)
    && v.noDeclarationViews + Math.max(v.configuredDeclarationViews,v.unmappedDeclarationViews) <= v.recognizedViews
    && v.noDeclarationViews + v.configuredDeclarationViews + v.unmappedDeclarationViews >= v.recognizedViews
    && [v.listedViews,v.notListedViews,v.unavailableViews,v.notAssessedViews,v.addressUnavailableViews].every(n => n <= v.configuredDeclarationViews)
    && v.listedViews + v.notListedViews + v.unavailableViews + v.notAssessedViews >= v.configuredDeclarationViews
    && v.addressUnavailableViews <= v.unavailableViews;
}
