import { userAgentClaimText } from './user-agent-products.js';

export type OsFamily = 'windows-nt' | 'android' | 'ios' | 'macos' | 'chromeos' | 'linux' | 'unknown';
type NamedOs = Exclude<OsFamily, 'unknown'>;
export interface PlatformClaim {
  family: OsFamily;
  major: number | null;
  minor: number | null;
  state: 'reported' | 'version-unresolved' | 'conflicting' | 'unrecognized';
  declaredFamilies: NamedOs[];
}

const RULES = [
  ['ios', /\b(?:CPU (?:iPhone )?OS|iPhone OS) ([^ \t;),]+)/gi],
  ['android', /\bAndroid[ /]([^ \t;),]+)/gi],
  ['windows-nt', /\bWindows NT ([^ \t;),]+)/gi],
  ['macos', /\bMac OS X ([^ \t;),]+)/gi],
] as const;

/** Read every supported OS-version claim, not the first favorable regex match.
 * Android/Linux and ChromeOS/Linux are compatible generic/specific markers.
 * These reported tokens may be frozen, overridden or copied; they do not
 * identify the actual operating system or physical device. */
export function platformClaim(userAgent: string): PlatformClaim {
  const text = userAgentClaimText(userAgent);
  const families = new Map<NamedOs, Map<string, { major: number | null; minor: number | null }>>();
  for (const [family, pattern] of RULES) {
    const versions = new Map<string, { major: number | null; minor: number | null }>();
    for (const match of text.matchAll(pattern)) {
      const raw = match[1] ?? '';
      const suppliedParts = raw.split(/[_.]/);
      const parts = suppliedParts.map(Number);
      while (parts.length < 3) parts.push(0);
      const valid = /^\d{1,5}(?:[_.]\d{1,5}){0,2}$/.test(raw) && parts.every(value => Number.isSafeInteger(value) && value >= 0 && value <= 65535);
      const key = valid ? parts.join('.') : 'invalid';
      const prior = versions.get(key);
      versions.set(key, { major: valid ? parts[0] ?? null : null,
        minor: valid ? prior?.minor ?? (suppliedParts.length > 1 ? parts[1] ?? null : null) : null });
    }
    if (versions.size > 0) families.set(family, versions);
  }
  if (/\bCrOS\b/i.test(text)) families.set('chromeos', new Map([['unspecified', { major: null, minor: null }]]));
  if (/\bLinux\b/i.test(text) && !families.has('android') && !families.has('chromeos')) families.set('linux', new Map([['unspecified', { major: null, minor: null }]]));
  const declaredFamilies = [...families.keys()].sort();
  const only = families.size === 1 ? families.entries().next().value : undefined;
  if (families.size > 1 || only !== undefined && only[1].size > 1) {
    return { family: 'unknown', major: null, minor: null, state: 'conflicting', declaredFamilies };
  }
  if (only === undefined) return { family: 'unknown', major: null, minor: null, state: 'unrecognized', declaredFamilies };
  const [family, versions] = only;
  const version = versions.values().next().value;
  return { family, major: version?.major ?? null, minor: version?.minor ?? null,
    state: version?.major === null ? 'version-unresolved' : 'reported', declaredFamilies };
}
