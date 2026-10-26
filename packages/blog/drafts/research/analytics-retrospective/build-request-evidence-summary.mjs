import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function date(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Use UTC dates in YYYY-MM-DD form');
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new Error('Invalid UTC date');
  return parsed;
}

/** Generates aggregate-only private-review SQL; never connects to production. */
export function buildEvidenceSummary(start, end, now = new Date()) {
  const first = date(start); const last = date(end);
  if (last <= first || last - first > 60 * 86400000) throw new Error('Choose a positive window no longer than sixty days');
  const cutoff = now.toISOString().replace('T', ' ').slice(0, 19);
  const selected = `WITH selected AS MATERIALIZED (
    SELECT p.request_evidence facts, p.collection_version collectionVersion, p.reader_kind readerKind,
      d.payload diagnostic FROM page_observations p
      LEFT JOIN page_observation_diagnostics d ON d.observation_id=p.id AND d.expires_at>'${cutoff}'
    WHERE p.observed_at>='${start} 00:00:00' AND p.observed_at<'${end} 00:00:00'
  )`;
  const sections = [
    ['coverage-total', "SELECT 'coverage' section,'stored-observations' key1,NULL key2,COUNT(*) views FROM selected"],
    ['coverage-structured', "SELECT 'coverage' section,'structured-captures' key1,NULL key2,COALESCE(SUM(facts IS NOT NULL),0) views FROM selected"],
    ['coverage-private', "SELECT 'coverage' section,'available-unexpired-diagnostics' key1,NULL key2,COALESCE(SUM(diagnostic IS NOT NULL),0) views FROM selected"],
  ];
  for (const [section, key, detail] of [
    ['browser', "COALESCE(json_extract(facts,'$.browserFamily'),'not-captured')", "CAST(json_extract(facts,'$.browserMajor') AS TEXT)"],
    ['os', "COALESCE(json_extract(facts,'$.osFamily'),'not-captured')", "CAST(json_extract(facts,'$.osMajor') AS TEXT)"],
    ['client-form', "COALESCE(json_extract(facts,'$.declaredClientForm'),'not-captured')", 'NULL'],
    ['language', "CASE WHEN facts IS NULL THEN 'not-captured' ELSE COALESCE(json_extract(facts,'$.primaryLanguage'),'unknown') END", 'NULL'],
    ['http', "CASE WHEN diagnostic IS NULL THEN 'not-available' ELSE COALESCE(json_extract(diagnostic,'$.transport.httpProtocol'),'unknown') END", 'NULL'],
    ['signature', "CASE WHEN diagnostic IS NULL THEN 'not-available' ELSE json_extract(diagnostic,'$.signatureOutcome') END", "json_extract(diagnostic,'$.signatureReason')"],
    ['collection-version', "COALESCE(collectionVersion,'historical-unknown')", 'readerKind'],
  ]) sections.push([section, `SELECT '${section}' section,${key} key1,${detail} key2,COUNT(*) views FROM selected GROUP BY ${key},${detail}`]);
  const cases = sections.map(([name, query]) => `WHEN '${name}' THEN (
    SELECT COALESCE(json_group_array(json_object('section',section,'key1',key1,'key2',key2,'views',views)),json('[]')) FROM (${query})
  )`).join('\n');
  // D1 has a stricter compound-SELECT limit than ordinary Node SQLite.
  return `${selected}, sections(name) AS (VALUES ${sections.map(([name]) => `('${name}')`).join(',')})
    SELECT name,CASE name ${cases} END payload FROM sections ORDER BY name;\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.stdout.write(buildEvidenceSummary(process.argv[2] ?? '', process.argv[3] ?? ''));
}
