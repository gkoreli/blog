import { SITE_AUDIT_VERSION, type SiteAuditReport } from './contracts.js';
import { isTechnicalAssessment } from './product-validation.js';

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.length <= 32_768;
const optionalText = (value: unknown): value is string | null => value === null || text(value);
const count = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.length <= 1000 && value.every(text);
const oneOf = (value: unknown, options: readonly string[]): boolean => typeof value === 'string' && options.includes(value);
const array = (value: unknown, check: (item: unknown) => boolean, max = 1000): boolean => Array.isArray(value) && value.length <= max && value.every(check);

/** Boundary validation for the complete public JSON report, including nested evidence. */
export function isSiteAuditReport(value: unknown): value is SiteAuditReport {
  if (!record(value) || value['version'] !== SITE_AUDIT_VERSION || !text(value['checkedAt']) || !text(value['target'])
    || typeof value['complete'] !== 'boolean' || !strings(value['limits'])
    || (value['assessment'] !== undefined && !isTechnicalAssessment(value['assessment']))) return false;
  const resources = value['resources'];
  if (!array(resources, resource => record(resource)
    && oneOf(resource['kind'], ['page', 'robots', 'llms', 'sitemap', 'markdown', 'probe'])
    && (resource['headersOmitted'] === undefined || array(resource['headersOmitted'], field => oneOf(field, ['contentType', 'robots', 'link', 'contentLocation', 'vary']), 5))
    && text(resource['requestedUrl']) && text(resource['finalUrl'])
    && oneOf(resource['outcome'], ['received', 'blocked-target', 'dns-error', 'network-error', 'timeout', 'too-large', 'redirect-limit', 'budget-exhausted'])
    && (resource['status'] === null || count(resource['status'])) && optionalText(resource['contentType'])
    && count(resource['bytes']) && count(resource['elapsedMs']) && count(resource['redirects']) && optionalText(resource['probeAgent'])
    && record(resource['headers']) && optionalText(resource['headers']['robots']) && optionalText(resource['headers']['link'])
    && optionalText(resource['headers']['contentLocation']) && optionalText(resource['headers']['vary']), 100)) return false;
  const page = value['page'];
  if (!record(page) || !optionalText(page['title']) || !optionalText(page['description']) || !optionalText(page['canonical'])
    || !optionalText(page['language']) || !count(page['textCharacters']) || !count(page['headings']) || !count(page['links'])
    || !count(page['scriptElements']) || !strings(page['structuredDataTypes']) || !count(page['structuredDataBlocks'])
    || !count(page['invalidStructuredDataBlocks']) || !oneOf(page['parseState'], ['parsed', 'not-html', 'unavailable'])
    || !array(page['metaRobots'], item => record(item) && text(item['agent']) && text(item['value']))
    || !array(page['alternateLinks'], item => record(item) && text(item['type']) && text(item['href']))) return false;
  if (page['indexingAssessmentComplete'] !== undefined && typeof page['indexingAssessmentComplete'] !== 'boolean') return false;
  if (page['textPreview'] !== undefined && (typeof page['textPreview'] !== 'string' || page['textPreview'].length > 1200)) return false;
  if (page['headingOutline'] !== undefined && !array(page['headingOutline'], heading => record(heading) && typeof heading['level'] === 'number' && [1, 2, 3, 4, 5, 6].includes(heading['level']) && typeof heading['text'] === 'string' && heading['text'].length <= 160, 12)) return false;
  const robots = value['robots'];
  if (!record(robots) || !oneOf(robots['state'], ['parsed', 'missing', 'unreachable', 'unavailable'])
    || !count(robots['groups']) || !count(robots['rules']) || !strings(robots['sitemaps'])
    || !array(robots['bots'], bot => record(bot) && text(bot['token']) && text(bot['provider']) && text(bot['source'])
      && oneOf(bot['role'], ['training-control', 'search', 'assistant', 'other'])
      && oneOf(bot['decision'], ['allowed', 'disallowed', 'unknown']) && strings(bot['matchedGroups'])
      && optionalText(bot['matchedRule']) && text(bot['reason']), 100)) return false;
  const discovery = value['discovery'];
  if (!record(discovery) || !oneOf(discovery['llms'], ['present', 'missing', 'unavailable']) || !count(discovery['llmsLinks'])
    || !oneOf(discovery['sitemap'], ['xml-observed', 'missing', 'unavailable', 'unexpected-content'])
    || !oneOf(discovery['markdown'], ['negotiated', 'not-negotiated', 'unavailable'])) return false;
  return array(value['findings'], finding => record(finding) && text(finding['id'])
    && oneOf(finding['severity'], ['action', 'review', 'info']) && text(finding['title']) && text(finding['evidence']) && text(finding['recommendation']), 100);
}
