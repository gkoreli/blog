export interface RobotsRule { allow: boolean; path: string; line: number }
export interface RobotsGroup { agents: string[]; rules: RobotsRule[] }
export interface RobotsDocument { groups: RobotsGroup[]; sitemaps: string[]; complete: boolean }

/** RFC 9309 groups, including consecutive agent lines and duplicate groups. */
export function parseRobots(text: string): RobotsDocument {
  const groups: RobotsGroup[] = [];
  const sitemaps: string[] = [];
  let group: RobotsGroup | null = null;
  let inRules = false;
  let complete = true;
  let ruleCount = 0;
  for (const [index, raw] of text.replace(/^\uFEFF/, '').split(/\r\n|\n|\r/).entries()) {
    if (index >= 10_000 || ruleCount >= 5_000 || raw.length > 8192) { complete = false; break; }
    const line = raw.replace(/#.*/, '').trim();
    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (key === 'user-agent') {
      if (!value || !/^(?:\*|[a-z_-]+)$/i.test(value)) continue;
      if (group === null || inRules) { group = { agents: [], rules: [] }; groups.push(group); inRules = false; }
      group.agents.push(value);
    } else if (key === 'allow' || key === 'disallow') {
      if (group === null) continue;
      inRules = true;
      if (value && (value.startsWith('/') || value.startsWith('*'))) { group.rules.push({ allow: key === 'allow', path: value, line: index + 1 }); ruleCount++; }
    } else if (key === 'sitemap' && value && sitemaps.length < 30) {
      sitemaps.push(value.slice(0, 2048));
    }
  }
  return { groups, sitemaps, complete };
}

/** Decode percent-encoded unreserved ASCII; preserve reserved octets, normalize UTF-8. */
function normalizeOctets(value: string, rule = true): string {
  let normalized = '';
  for (let index = 0; index < value.length;) {
    const character = value[index] ?? '';
    const escape = value.slice(index, index + 3);
    if (/^%[a-f0-9]{2}$/i.test(escape)) {
      const code = parseInt(escape.slice(1), 16);
      const decoded = String.fromCharCode(code);
      normalized += /^[A-Za-z0-9._~-]$/.test(decoded) ? decoded : escape.toUpperCase();
      index += 3;
    } else {
      const code = value.codePointAt(index);
      if (code === undefined) break;
      const point = String.fromCodePoint(code);
      normalized += !rule && point === '*' ? '%2A' : !rule && point === '$' ? '%24' : code > 127 ? encodeURIComponent(point) : character;
      index += point.length;
    }
  }
  return normalized;
}

/** Greedy wildcard matching without constructing an executable regular
 * expression from remote input. Explicit work budget turns hostile complexity
 * into unknown, never a silently partial policy verdict. */
function ruleMatch(rule: string, target: string, budget: { steps: number }): boolean | null {
  const normalized = normalizeOctets(rule);
  const end = normalized.endsWith('$');
  const body = end ? normalized.slice(0, -1) : `${normalized}*`;
  let pattern = 0;
  let position = 0;
  let star = -1;
  let checkpoint = 0;
  while (position < target.length) {
    if (++budget.steps > 200_000) return null;
    if (body[pattern] === '*') { star = pattern++; checkpoint = position; }
    else if (pattern < body.length && body[pattern] === target[position]) { pattern++; position++; }
    else if (star !== -1) { pattern = star + 1; position = ++checkpoint; }
    else return false;
  }
  while (body[pattern] === '*') { if (++budget.steps > 200_000) return null; pattern++; }
  return pattern === body.length;
}
function specificity(rule: string): number {
  return normalizeOctets(rule).replace(/\*|\$$/g, '').replace(/%[A-F0-9]{2}/g, 'x').length;
}
export interface RobotsDecision { decision: 'allowed' | 'disallowed' | 'unknown'; matchedGroups: string[]; matchedRule: string | null; reason: string }
export function evaluateRobots(document: RobotsDocument, token: string, path: string): RobotsDecision {
  if (!document.complete) return { decision: 'unknown', matchedGroups: [], matchedRule: null, reason: 'Robots parsing exceeded the 10,000-line, 5,000-rule or 8,192-character line policy budget; no partial policy verdict is returned.' };
  if (path === '/robots.txt') return { decision: 'allowed', matchedGroups: [], matchedRule: null, reason: 'The /robots.txt URI is implicitly allowed under RFC 9309.' };
  const key = token.toLowerCase();
  const specific = document.groups.filter(group => group.agents.some(agent => agent !== '*' && key.includes(agent.toLowerCase())));
  // User-agent groups match the product token case-insensitively; longest token
  // chooses specificity where names overlap; all equally specific groups merge.
  const longest = Math.max(0, ...specific.flatMap(group => group.agents.filter(agent => key.includes(agent.toLowerCase())).map(agent => agent.length)));
  const groups = longest > 0 ? specific.filter(group => group.agents.some(agent => agent.length === longest && key.includes(agent.toLowerCase())))
    : document.groups.filter(group => group.agents.includes('*'));
  const target = normalizeOctets(path, false);
  const matches: RobotsRule[] = [];
  const budget = { steps: 0 };
  for (const rule of groups.flatMap(group => group.rules)) {
    const matched = ruleMatch(rule.path, target, budget);
    if (matched === null) return { decision: 'unknown', matchedGroups: groups.flatMap(group => group.agents), matchedRule: null, reason: 'Robots wildcard evaluation exceeded its comparison budget; no partial policy verdict is returned.' };
    if (matched) matches.push(rule);
  }
  matches.sort((left, right) => specificity(right.path) - specificity(left.path) || Number(right.allow) - Number(left.allow));
  const winner = matches[0];
  return { decision: winner?.allow === false ? 'disallowed' : 'allowed',
    matchedGroups: [...new Set(groups.flatMap(group => group.agents))],
    matchedRule: winner ? `${winner.allow ? 'Allow' : 'Disallow'}: ${winner.path}` : null,
    reason: winner ? `Longest matching path rule (line ${winner.line}); Allow wins an equal-length tie.` : groups.length ? 'No matching nonempty rule in the selected group.' : 'No matching group or wildcard group.' };
}
