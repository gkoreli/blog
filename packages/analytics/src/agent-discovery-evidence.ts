/** Offline observations of agent-operated search and reviewed external references.
 * No inference of people, answer citations, traffic or population growth. */
export const AGENT_DISCOVERY_VERSION = 'agent-discovery-v1';
export const AGENT_DISCOVERY_MAX_BYTES = 8 * 1024 * 1024;
interface Question { id: string; query: string }
interface Source { id: string; label: string; urls: string[] }
interface Method { service: string; mode: string; model: string | null; context: string; responseSetting: string }
interface ReturnedSource { title: string; url: string }
type Observation = {
  questionId: string; capturedAt: string; rawSha256: string;
} & ({ status: 'captured'; returnedSources: ReturnedSource[] } | { status: 'failed'; reason: string });
interface Run { id: string; method: Method; observations: Observation[] }
interface Reference {
  sourceUrl: string; targetId: string; relation: 'link' | 'evidence-reuse';
  capturedAt: string; rawSha256: string; review: string;
}
type Presence = 'found' | 'not-returned' | 'failed' | 'missing';
export interface AgentDiscoveryReport {
  version: typeof AGENT_DISCOVERY_VERSION;
  provenance: 'saved-observations' | 'synthetic';
  sourceAuthenticity: 'not-established-by-parser';
  questionSet: string; questions: Question[]; sources: Source[];
  runs: Array<Run & {
    completed: number; failed: number; missing: number;
    matches: Array<{ sourceId: string; found: number; completed: number; byQuestion: Array<{ questionId: string; presence: Presence }> }>;
  }>;
  comparisons: Array<{
    baseline: string; candidate: string; sameDeclaredMethod: boolean; status: 'paired' | 'new-baseline-required';
    sources: Array<{ sourceId: string; pairedCompleted: number; retained: string[]; appeared: string[]; disappeared: string[]; absentBoth: string[]; unavailable: string[] }>;
  }>;
  references: Array<{ sourceUrl: string; targetId: string; relation: Reference['relation']; observations: Reference[] }>;
  referenceTotals: { distinctSourceUrls: number; distinctSourceTargetPairs: number; evidenceReusePairs: number; reviewedObservations: number };
  limits: string[];
}
function fail(code: string): never { throw new Error(`Agent discovery evidence rejected: ${code}`); }
function object(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function fields(value: Record<string, unknown>, keys: string[]): boolean { return Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key)); }
function text(value: unknown, maximum = 2048): value is string { return typeof value === 'string' && value.length > 0 && value.length <= maximum && value.trim().length > 0; }
function id(value: unknown): value is string { return typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/.test(value); }
function instant(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().replace('.000Z', 'Z') === value.replace('.000Z', 'Z');
}
function hash(value: unknown): value is string { return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value); }
function url(value: unknown): value is string {
  if (!text(value, 4096)) return false;
  try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password && u.href === value; } catch { return false; }
}
function array(value: unknown, maximum: number): unknown[] { return Array.isArray(value) && value.length <= maximum ? value : fail('array-budget'); }
function unique(values: string[], code: string): void { if (new Set(values).size !== values.length) fail(code); }
function method(value: unknown): Method {
  if (!object(value) || !fields(value, ['service', 'mode', 'model', 'context', 'responseSetting'])
    || !text(value.service, 240) || !text(value.mode, 240) || value.model !== null && !text(value.model, 240)
    || !text(value.context, 1024) || !text(value.responseSetting, 240)) return fail('method');
  return { service: value.service, mode: value.mode, model: value.model, context: value.context, responseSetting: value.responseSetting };
}
const LIMITS = [
  'Returned search pools measure observed agent discovery, not an AI answer citation rate, complete ranking, unique people or origin visits.',
  'Exact registered URLs match; redirects and unregistered URL variants are not silently joined. Duplicate URLs within a pool count once for presence.',
  'Failed and missing observations are unavailable, not zero visibility. Completed empty pools are observed non-returns.',
  'Different declared methods withhold transitions and require a new baseline. Same declared method does not establish the same underlying index, model, context, page version or causal attribution. Repeated trials are not distinct audience members.',
  'External references and evidence reuse are supplied reviewer assessments with capture hashes; this parser does not fetch sources, authenticate captures or independently judge truth.',
  'References group source URLs without fragments and retain query strings and review history. Distinct retrieval URLs are not necessarily distinct pages or publishers, independent experiments, analytics installations or proof of human identity. No human label is required for observed agent discovery or external reuse.',
];

export function analyzeAgentDiscovery(input: unknown): AgentDiscoveryReport {
  let serialized: string | undefined;
  try { serialized = JSON.stringify(input); } catch { return fail('json'); }
  if (!serialized || new TextEncoder().encode(serialized).length > AGENT_DISCOVERY_MAX_BYTES) return fail('input-budget');
  if (!object(input) || !fields(input, ['version', 'provenance', 'questionSet', 'questions', 'sources', 'runs', 'references'])
    || input.version !== AGENT_DISCOVERY_VERSION || input.provenance !== 'saved-observations' && input.provenance !== 'synthetic'
    || !text(input.questionSet, 240)) return fail('envelope');
  const questions: Question[] = array(input.questions, 100).map(q => {
    if (!object(q) || !fields(q, ['id', 'query']) || !id(q.id) || !text(q.query, 4096)) return fail('question');
    return { id: q.id, query: q.query };
  });
  if (!questions.length) fail('empty-questions'); unique(questions.map(q => q.id), 'duplicate-question');
  unique(questions.map(q => q.query), 'duplicate-query');
  const sources: Source[] = array(input.sources, 100).map(s => {
    if (!object(s) || !fields(s, ['id', 'label', 'urls']) || !id(s.id) || !text(s.label, 240)) return fail('source');
    const urls = array(s.urls, 20).map(u => url(u) ? u : fail('source-url'));
    if (!urls.length) fail('empty-source-urls'); return { id: s.id, label: s.label, urls };
  });
  if (!sources.length) fail('empty-sources'); unique(sources.map(s => s.id), 'duplicate-source');
  unique(sources.flatMap(s => s.urls), 'ambiguous-source-url');
  const questionIds = new Set(questions.map(q => q.id)), sourceIds = new Set(sources.map(s => s.id));
  const rawRuns: Run[] = array(input.runs, 20).map(r => {
    if (!object(r) || !fields(r, ['id', 'method', 'observations']) || !id(r.id)) return fail('run');
    const observations: Observation[] = array(r.observations, questions.length).map(o => {
      if (!object(o) || !id(o.questionId) || !questionIds.has(o.questionId) || !instant(o.capturedAt) || !hash(o.rawSha256)) return fail('observation');
      const base = { questionId: o.questionId, capturedAt: o.capturedAt, rawSha256: o.rawSha256 };
      if (o.status === 'failed' && fields(o, ['questionId', 'capturedAt', 'rawSha256', 'status', 'reason']) && text(o.reason, 240)) return { ...base, status: 'failed', reason: o.reason };
      if (o.status !== 'captured' || !fields(o, ['questionId', 'capturedAt', 'rawSha256', 'status', 'returnedSources'])) return fail('observation-status');
      const returnedSources = array(o.returnedSources, 1000).map(s => {
        if (!object(s) || !fields(s, ['title', 'url']) || !text(s.title, 1024) || !url(s.url)) return fail('returned-source');
        return { title: s.title, url: s.url };
      });
      return { ...base, status: 'captured', returnedSources };
    });
    unique(observations.map(o => o.questionId), 'duplicate-observation');
    return { id: r.id, method: method(r.method), observations };
  });
  if (!rawRuns.length) fail('empty-runs'); unique(rawRuns.map(r => r.id), 'duplicate-run');
  const runs = rawRuns.map(r => {
    const completed = r.observations.filter(o => o.status === 'captured').length;
    return { ...r, completed, failed: r.observations.length - completed, missing: questions.length - r.observations.length,
      matches: sources.map(s => {
        const byQuestion = questions.map(q => {
          const o = r.observations.find(o => o.questionId === q.id);
          const presence: Presence = !o ? 'missing' : o.status === 'failed' ? 'failed'
            : o.returnedSources.some(row => s.urls.includes(row.url)) ? 'found' : 'not-returned';
          return { questionId: q.id, presence };
        });
        return { sourceId: s.id, found: byQuestion.filter(q => q.presence === 'found').length, completed, byQuestion };
      }) };
  });
  const baseline = runs[0];
  const comparisons: AgentDiscoveryReport['comparisons'] = runs.slice(1).map(candidate => {
    const sameDeclaredMethod = JSON.stringify(baseline.method) === JSON.stringify(candidate.method);
    return { baseline: baseline.id, candidate: candidate.id, sameDeclaredMethod,
    status: sameDeclaredMethod ? 'paired' : 'new-baseline-required',
    sources: !sameDeclaredMethod ? [] : sources.map(s => {
      const a = baseline.matches.find(m => m.sourceId === s.id), b = candidate.matches.find(m => m.sourceId === s.id);
      if (!a || !b) return fail('internal-source');
      const retained: string[] = [], appeared: string[] = [], disappeared: string[] = [], absentBoth: string[] = [], unavailable: string[] = [];
      for (let i = 0; i < questions.length; i++) {
        const before = a.byQuestion[i].presence, after = b.byQuestion[i].presence, q = questions[i].id;
        if (before === 'failed' || before === 'missing' || after === 'failed' || after === 'missing') unavailable.push(q);
        else if (before === 'found' && after === 'found') retained.push(q);
        else if (before === 'found') disappeared.push(q);
        else if (after === 'found') appeared.push(q);
        else absentBoth.push(q);
      }
      return { sourceId: s.id, pairedCompleted: questions.length - unavailable.length, retained, appeared, disappeared, absentBoth, unavailable };
    }),
  }; });
  const referenceMap = new Map<string, AgentDiscoveryReport['references'][number]>();
  for (const r of array(input.references, 1000)) {
    if (!object(r) || !fields(r, ['sourceUrl', 'targetId', 'relation', 'capturedAt', 'rawSha256', 'review'])
      || !url(r.sourceUrl) || !id(r.targetId) || !sourceIds.has(r.targetId)
      || r.relation !== 'link' && r.relation !== 'evidence-reuse'
      || !instant(r.capturedAt) || !hash(r.rawSha256) || !text(r.review, 4096)) return fail('reference');
    const target = sources.find(s => s.id === r.targetId), referenceUrl = r.sourceUrl;
    if (!target || target.urls.some(u => new URL(u).origin === new URL(referenceUrl).origin)) return fail('reference-not-external');
    const observation: Reference = { sourceUrl: r.sourceUrl, targetId: r.targetId, relation: r.relation, capturedAt: r.capturedAt, rawSha256: r.rawSha256, review: r.review };
    // Fragments name a location within a retrieved representation, not a new
    // HTTP resource. Keep queries: their page equivalence is not established.
    const retrieval = new URL(referenceUrl); retrieval.hash = '';
    const sourceUrl = retrieval.href;
    const key = JSON.stringify([sourceUrl, r.targetId]), existing = referenceMap.get(key);
    if (existing) { existing.observations.push(observation); if (r.relation === 'evidence-reuse') existing.relation = 'evidence-reuse'; }
    else referenceMap.set(key, { sourceUrl, targetId: r.targetId, relation: r.relation, observations: [observation] });
  }
  const references = [...referenceMap.values()];
  return { version: AGENT_DISCOVERY_VERSION, provenance: input.provenance, sourceAuthenticity: 'not-established-by-parser',
    questionSet: input.questionSet, questions, sources, runs, comparisons, references,
    referenceTotals: { distinctSourceUrls: new Set(references.map(r => r.sourceUrl)).size, distinctSourceTargetPairs: references.length,
      evidenceReusePairs: references.filter(r => r.relation === 'evidence-reuse').length, reviewedObservations: references.reduce((n, r) => n + r.observations.length, 0) }, limits: [...LIMITS] };
}
function escape(value: string): string { return value.replace(/[&<>|`*_[\]\\]/g, c => `&#${c.charCodeAt(0)};`).replace(/[\r\n]/g, ' '); }
export function renderAgentDiscovery(report: AgentDiscoveryReport): string {
  const lines = ['# Agent discovery decision brief', '', `Provenance: ${report.provenance}. Question set: ${escape(report.questionSet)}.`, '',
    'Each result is agent-operated search discovery. Reviewed external references and evidence reuse are additional supported outcomes. Human identification is not a condition for counting them.', '',
    '| Run | Completed questions | Failed | Missing | Tracked source | Found / completed |', '| --- | --- | --- | --- | --- | --- |'];
  for (const run of report.runs) for (const match of run.matches) lines.push(`| ${escape(run.id)} | ${run.completed}/${report.questions.length} | ${run.failed} | ${run.missing} | ${escape(match.sourceId)} | ${match.found}/${match.completed} |`);
  for (const run of report.runs) {
    lines.push('', `## ${escape(run.id)}`, '', `Method: ${escape(JSON.stringify(run.method))}`, '', '| Question | Exact query | Source presence |', '| --- | --- | --- |');
    report.questions.forEach((q, i) => lines.push(`| ${escape(q.id)} | ${escape(q.query)} | ${run.matches.map(m => `${escape(m.sourceId)}: ${m.byQuestion[i].presence}`).join('; ')} |`));
  }
  for (const pair of report.comparisons) {
    lines.push('', `## ${escape(pair.baseline)} → ${escape(pair.candidate)}`, '', `Same declared method: ${pair.sameDeclaredMethod}. ${pair.status === 'new-baseline-required' ? 'New baseline required; transitions withheld. Inspect each run separately.' : 'Descriptive matched-question comparison; no causal or growth-rate claim.'}`);
    for (const s of pair.sources) lines.push('', `${escape(s.sourceId)}: ${s.pairedCompleted} paired completed; retained ${s.retained.length}, appeared ${s.appeared.length}, disappeared ${s.disappeared.length}, absent both ${s.absentBoth.length}, unavailable ${s.unavailable.length}.`);
  }
  lines.push('', '## Reviewed external references', '', `Distinct source URLs (fragments omitted): ${report.referenceTotals.distinctSourceUrls}; source/target pairs: ${report.referenceTotals.distinctSourceTargetPairs}; evidence-reuse pairs: ${report.referenceTotals.evidenceReusePairs}; saved review observations: ${report.referenceTotals.reviewedObservations}.`);
  for (const r of report.references) lines.push('', `${escape(r.sourceUrl)} → ${escape(r.targetId)}: ${r.relation}.`, ...r.observations.map(o => `- ${escape(o.capturedAt)}: ${escape(o.review)} (capture SHA-256 ${o.rawSha256}).`));
  lines.push('', '## Boundaries', '', ...report.limits.map(l => `- ${l}`), ''); return lines.join('\n');
}
