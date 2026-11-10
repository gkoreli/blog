import { hasConflictingBrowserClaims, userAgentEngineVersion, type UserAgentProduct } from './user-agent-products.js';

export type BrowserFamily = 'chromium' | 'edge' | 'opera' | 'firefox' | 'safari' | 'unknown';
export interface BrowserClaim {
  family: BrowserFamily;
  major: number | null;
  state: 'recognized' | 'version-unresolved' | 'conflicting' | 'unrecognized';
  /** Compatibility products are included; these are not installed browsers. */
  declaredFamilies: Exclude<BrowserFamily, 'unknown'>[];
}

const GROUPS = [
  ['edge', ['edg', 'edga', 'edgios']],
  ['opera', ['opr']],
  ['firefox', ['firefox', 'fxios']],
  ['chromium', ['chrome', 'chromium', 'crios']],
  ['safari', ['safari']],
] as const;

/** Select a reported browser under explicit compatibility rules, never an
 * authenticated executable. Chrome+Safari and Chrome+Edge/Opera are normal;
 * Edge+Opera cannot choose a single vendor by array/regex priority. */
export function browserClaim(products: readonly UserAgentProduct[]): BrowserClaim {
  const declaredFamilies = GROUPS.flatMap(([family, names]) => products.some(product => names.some(name => name === product.name)) ? [family] : []);
  if (hasConflictingBrowserClaims(products) || declaredFamilies.includes('edge') && declaredFamilies.includes('opera')) {
    return { family: 'unknown', major: null, state: 'conflicting', declaredFamilies };
  }
  for (const [family, names] of GROUPS) {
    if (!declaredFamilies.includes(family)) continue;
    if (family === 'safari' && !products.some(product => product.name === 'version')) continue;
    const version = userAgentEngineVersion(products, family === 'safari' ? ['version'] : names);
    return { family, major: version?.major ?? null, state: version === null ? 'version-unresolved' : 'recognized', declaredFamilies };
  }
  return { family: 'unknown', major: null, state: 'unrecognized', declaredFamilies };
}
