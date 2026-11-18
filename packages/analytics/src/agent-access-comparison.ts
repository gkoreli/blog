import { addCalendarDays } from '@gkoreli/time';
import type { AgentAccessMetrics, AgentAccessReport, selectAgentAccess } from './agent-access-contract.js';

const LEADING_CHANGES = 3;

interface WeeklyCounts {
  previous: number;
  latest: number;
}

interface WeeklyChange extends WeeklyCounts {
  change: number;
}

type ChangeRow<Key> = WeeklyChange & (
  { kind: 'entry'; key: Key } |
  { kind: 'other'; direction: 'increase' | 'decrease'; count: number }
);

function lastTwoWeeks(metrics: AgentAccessMetrics): WeeklyCounts {
  const [, , previous, latest] = metrics.weeks;
  return { previous, latest };
}

function rankChanges<Key>(rows: Iterable<{ key: Key; metrics: AgentAccessMetrics }>): ChangeRow<Key>[] {
  type Entry = ChangeRow<Key> & { kind: 'entry' };
  const increases: Entry[] = [];
  const decreases: Entry[] = [];
  for (const { key, metrics } of rows) {
    const counts = lastTwoWeeks(metrics);
    const change = counts.latest - counts.previous;
    if (change > 0) increases.push({ kind: 'entry', key, ...counts, change });
    if (change < 0) decreases.push({ kind: 'entry', key, ...counts, change });
  }

  function summarize(changes: Entry[], direction: 'increase' | 'decrease'): ChangeRow<Key>[] {
    changes.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    const leading = changes.slice(0, LEADING_CHANGES);
    const rest = changes.slice(LEADING_CHANGES);
    const other = rest.reduce((sum, row) => ({
      count: sum.count + 1, previous: sum.previous + row.previous,
      latest: sum.latest + row.latest, change: sum.change + row.change,
    }), { count: 0, previous: 0, latest: 0, change: 0 });
    return other.count === 0 ? leading : [...leading, { kind: 'other', direction, ...other }];
  }

  return [...summarize(increases, 'increase'), ...summarize(decreases, 'decrease')];
}

type SelectedAccess = ReturnType<typeof selectAgentAccess>;
type MeasurementProfile = Pick<SelectedAccess['history'][number], 'collection' | 'classifier' | 'source'> & WeeklyCounts;

function compareProfiles(history: SelectedAccess['history'], totals: WeeklyCounts) {
  const groups = new Map<string, MeasurementProfile>();
  for (const { collection, classifier, source, metrics } of history) {
    const { previous, latest } = lastTwoWeeks(metrics);
    if (previous === 0 && latest === 0) continue;
    const key = JSON.stringify([collection, classifier, source]);
    const row = groups.get(key) ?? { collection, classifier, source, previous: 0, latest: 0 };
    row.previous += previous;
    row.latest += latest;
    groups.set(key, row);
  }
  const profiles = [...groups.values()].sort((a, b) => (b.previous + b.latest) - (a.previous + a.latest));
  if (totals.previous === 0 || totals.latest === 0) return { status: 'empty-week', profiles } as const;
  if (profiles.some(row => row.collection === null || row.classifier === null || row.source === 'not-recorded' || row.source === 'unrecognized')) {
    return { status: 'incomplete', profiles } as const;
  }
  return { status: profiles.length === 1 ? 'one-profile' : 'multiple-profiles', profiles } as const;
}

/** Compare the last two completed seven-day periods in this selection.
 * Each breakdown partitions the change independently, including unknown
 * declarations and unregistered resources. Equal stamps describe the
 * recorded profile only. They cannot establish stable collection coverage.
 */
export function compareAgentAccessWeeks(scope: AgentAccessReport['scope'], selected: SelectedAccess) {
  const totals = lastTwoWeeks(selected.total);
  const latestStart = addCalendarDays(scope.endExclusive, -7);
  return {
    previous: { start: addCalendarDays(latestStart, -7), endExclusive: latestStart, views: totals.previous },
    latest: { start: latestStart, endExclusive: scope.endExclusive, views: totals.latest },
    change: totals.latest - totals.previous,
    clients: rankChanges(selected.byClient.map(({ client, metrics }) => ({ key: client, metrics }))),
    resources: rankChanges([
      ...selected.byResource.map(({ resource, metrics }) => ({ key: resource, metrics })),
      { key: null, metrics: selected.unregistered },
    ]),
    measurement: compareProfiles(selected.history, totals),
  };
}
