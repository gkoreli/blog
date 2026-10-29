import { createHash } from 'node:crypto';

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const SOURCES = { 'agent-operated-browser': 'cua-controller', 'automated-web-tool': 'tool-call-receipt', 'vendor-assistant': 'assistant-ui-receipt' };
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function check(condition, message) { if (!condition) throw Error(message); }
function clock(value) {
  check(typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|\+00:00)$/.test(value), 'Explicit UTC execution time required');
  const time = Date.parse(value);
  check(Number.isFinite(time) && new Date(time).toISOString().slice(0, 19) === value.slice(0, 19), 'Invalid execution time'); return time;
}
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (record(value)) return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  return value;
}
const digest = value => createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');

/** Private association result contains matched raw events. Never publish it.
 * Labels come from independently accepted execution receipts, never the UA.
 * Zero returned events is missing measurement, not a no-request verdict.
 */
export function reconcileFetcherTrials(plan, executions, events) {
  check(record(plan) && UUID.test(plan.workerVersion) && Array.isArray(plan.trials) && plan.trials.length > 0 && plan.trials.length <= 32, 'Invalid plan');
  check(Array.isArray(executions) && Array.isArray(events) && events.length <= 4096, 'Invalid input scope');
  const plannedAt = clock(plan.frozenAt);
  const plans = new Map(), executed = new Map();
  for (const trial of plan.trials) {
    check(record(trial) && /^[a-z0-9-]{1,40}$/.test(trial.id) && !plans.has(trial.id), 'Invalid or duplicate trial');
    check(Object.hasOwn(SOURCES, trial.operator) && trial.labelSource === SOURCES[trial.operator], 'Invalid planned label provenance');
    const url = new URL(trial.url);
    check(url.origin === 'https://gkoreli.com' && url.pathname === '/owner' && url.username === '' && url.password === '' && url.hash === '', 'Control must use excluded owner page');
    check([...url.searchParams.keys()].join(',') === 'trial' && /^gk-fetch\d+-[a-z0-9-]{12,96}$/.test(url.searchParams.get('trial') ?? ''), 'Invalid trial URL marker');
    check(![...plans.values()].some(previous => previous.url === trial.url), 'Duplicate planned URL');
    plans.set(trial.id, trial);
  }
  for (const execution of executions) {
    const trial = plans.get(execution.id);
    check(trial && !executed.has(execution.id), 'Unknown or duplicate execution');
    check(execution.operator === trial.operator && execution.labelSource === trial.labelSource, 'Execution label provenance mismatch');
    const start = clock(execution.startedAt), end = clock(execution.endedAt);
    check(start >= plannedAt && end >= start && end - start <= 120000, 'Invalid execution window');
    executed.set(execution.id, { ...execution, start, end });
  }
  const measurements = [];
  for (const [id, trial] of plans) {
    const execution = executed.get(id);
    if (!execution) { measurements.push({ id, status: 'not-executed', events: [], duplicateCopies: 0 }); continue; }
    const candidates = events.filter(event => event?.event?.request?.url === trial.url);
    if (!candidates.length) { measurements.push({ id, status: 'capture-unavailable', events: [], duplicateCopies: 0 }); continue; }
    const accepted = new Map(); let invalid = false, conflict = false, duplicateCopies = 0;
    for (const event of candidates) {
      const request = event.event.request;
      const entries = record(request.headers) ? Object.entries(request.headers) : [];
      const headers = Object.fromEntries(entries.map(([key, value]) => [key.toLowerCase(), value]));
      const ray = headers['cf-ray'];
      if (event.scriptName !== 'gkoreli-com' || event.scriptVersion?.id !== plan.workerVersion || event.outcome !== 'ok'
        || event.truncated !== false || !Array.isArray(event.exceptions) || event.exceptions.length !== 0
        || !Array.isArray(event.logs)
        || request.method !== 'GET' || event.event.response?.status !== 200 || !Number.isSafeInteger(event.eventTimestamp)
        || event.eventTimestamp < execution.start || event.eventTimestamp > execution.end || typeof ray !== 'string' || !/^[a-f0-9]{16}(?:-[A-Z]{3})?$/.test(ray)
        || Object.keys(headers).length !== entries.length || !entries.every(([, value]) => typeof value === 'string')) { invalid = true; continue; }
      const key = `${event.scriptVersion.id}:${ray.slice(0, 16)}:${event.eventTimestamp}`;
      const previous = accepted.get(key);
      if (previous) { if (digest(previous) === digest(event)) duplicateCopies++; else conflict = true; }
      else accepted.set(key, event);
    }
    measurements.push({ id, status: conflict ? 'capture-conflict' : invalid ? 'capture-invalid' : 'matched', events: conflict || invalid ? [] : [...accepted.values()], duplicateCopies });
  }
  return { planned: plans.size, executed: executed.size, measurements };
}
