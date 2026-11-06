/** Lexical request claims only: products are not authenticated software or devices.
 * Keep these boundaries identical for named declarations and browser support.
 * Comment-compatible separators preserve documented crawler product claims;
 * Recognized URI spans, embedded names and malformed slash versions are not
 * products. The URI exclusion below is bounded lexical policy, not full grammar.
 */
export interface UserAgentProduct {
  readonly name: string;
  readonly version: string | null;
}

const asciiLetter = (code: number) => code >= 65 && code <= 90 || code >= 97 && code <= 122;
const schemeCharacter = (code: number) => asciiLetter(code) || code >= 48 && code <= 57 || code === 43 || code === 45 || code === 46;

/** Mask absolute-URI claims beginning with an ASCII scheme, without validating
 * URLs, making network requests or inferring a role from a hostname. Semicolons,
 * userinfo, query and fragment content stay within a contiguous URI span.
 * Whitespace or an unmatched ')' ends the span; balanced URI parentheses and
 * backslash-escaped non-whitespace characters stay inside it. Ambiguous ';Bot'
 * immediately after a URI is URI data until a real separator, not a declaration.
 * Schemeless references and complete UA/comment grammar remain unsupported.
 * Colons preserve length and cannot create a product boundary when masking
 * starts inside another invalid token. Scan scheme runs once, including when
 * no colon follows, so long scheme-like input does not cause repeated rescans.
 */
export function userAgentClaimText(userAgent: string): string {
  const parts: string[] = [];
  let cursor = 0, copiedUntil = 0;
  while (cursor < userAgent.length) {
    if (!asciiLetter(userAgent.charCodeAt(cursor))) { cursor++; continue; }
    const start = cursor;
    do { cursor++; } while (cursor < userAgent.length && schemeCharacter(userAgent.charCodeAt(cursor)));
    if (userAgent[cursor] !== ':') continue;
    cursor++;
    let parentheses = 0;
    while (cursor < userAgent.length) {
      const code = userAgent.charCodeAt(cursor);
      if (code <= 32) break;
      if (userAgent[cursor] === ')') {
        if (parentheses === 0) break;
        parentheses--;
      } else if (userAgent[cursor] === '(') parentheses++;
      else if (userAgent[cursor] === '\\' && cursor + 1 < userAgent.length && userAgent.charCodeAt(cursor + 1) > 32) cursor++;
      cursor++;
    }
    parts.push(userAgent.slice(copiedUntil, start), ':'.repeat(cursor - start));
    copiedUntil = cursor;
  }
  return parts.length === 0 ? userAgent : parts.join('') + userAgent.slice(copiedUntil);
}

export function userAgentProducts(userAgent: string): UserAgentProduct[] {
  const pattern = /(?:^|[ \t;(])([!#$%&'*+.^_`|~0-9A-Za-z-]+)(?:\/([!#$%&'*+.^_`|~0-9A-Za-z-]+))?(?=$|[ \t;)])/g;
  return [...userAgentClaimText(userAgent).matchAll(pattern)].flatMap(match => match[1] === undefined ? []
    : [{ name: match[1].toLowerCase(), version: match[2] ?? null }]);
}

/** Firefox/its iOS shell cannot select one browser claim alongside a Chromium,
 * Edge or modern Opera declaration. This is a lexical conflict, not a finding
 * about actual engines or operators. Chrome+Safari and Chrome+Edge/Opera are
 * normal compatibility combinations; Edge+Opera and iOS+desktop spellings are
 * not independently rejected here without this explicit family conflict.
 */
export function hasConflictingBrowserClaims(products: readonly UserAgentProduct[]): boolean {
  let firefox = false, chromium = false;
  for (const product of products) {
    if (product.name === 'firefox' || product.name === 'fxios') firefox = true;
    if (['chrome', 'chromium', 'crios', 'edg', 'edga', 'edgios', 'opr'].includes(product.name)) chromium = true;
    if (firefox && chromium) return true;
  }
  return false;
}

const GENERIC_AUTOMATION_PRODUCTS: ReadonlySet<string> = new Set([
  'bot', 'spider', 'crawler', 'crawl', 'slurp', 'scrapy', 'headless',
  'phantomjs', 'selenium', 'wget', 'python-requests',
  'go-http-client', 'uptimerobot', 'lighthouse', 'chrome-lighthouse',
]);

/** Preserve bare bot/spider/crawler product conventions without scanning URLs
 * or arbitrary embedded substrings. CUBOT is also a real phone brand: its bare
 * model token is insufficient, while an explicit CUBOT/version product remains
 * a generic lexical claim. This exception never hides another product.
 * Phantom wallet uses Phantom/ios/...; only the explicit PhantomJS tool matches.
 * Reviewed browser counterexamples: isbot 3f9c982acd95b1be033fa3c14b2a7ece565ba10a,
 * fixtures/browsers.yml CUBOT (149–153) and Phantom (484–485).
 */
export function hasGenericAutomationProduct(products: readonly UserAgentProduct[]): boolean {
  return products.some(product => GENERIC_AUTOMATION_PRODUCTS.has(product.name)
    || product.version !== null && (product.name === 'curl' || product.name === 'libcurl')
    || (!/^cubot(?:$|[-_])/.test(product.name) || product.version !== null)
      && /(?:bot(?:$|-)|(?:spider|crawler)(?:$|[-_]))/.test(product.name));
}

export interface UserAgentVersion { major: number; minor: number; }
function numericVersion(value: string | null): UserAgentVersion | null {
  if (value === null || !/^\d{1,5}(?:\.\d{1,5})*$/.test(value)) return null;
  const [major, minor = 0] = value.split('.').map(Number);
  return major === undefined || major > 65535 || minor > 65535 ? null : { major, minor };
}

/** Conflicting versions of one claimed engine cannot select a favorable value.
 * No product, malformed version and conflicting version remain unsupported
 * for this claim check; none establishes that a human/browser was absent.
 */
export function userAgentEngineVersion(products: readonly UserAgentProduct[], names: readonly string[]): UserAgentVersion | null {
  const matches = products.filter(product => names.includes(product.name));
  if (matches.length === 0) return null;
  const versions = matches.map(product => numericVersion(product.version));
  const first = versions[0];
  return first === null || first === undefined || versions.some(version => version === null
    || version.major !== first.major || version.minor !== first.minor) ? null : first;
}

/** Capability claim under supporting transport/context, never emission proof.
 * iOS engine capability follows the declared OS, including CriOS/FxiOS shells;
 * desktop Chromium/Firefox follow their engine product and Safari its Version.
 */
export function claimsFetchMetadataFromProducts(userAgent: string, products: readonly UserAgentProduct[]): boolean {
  if (hasConflictingBrowserClaims(products)) return false;
  const names = new Set(products.map(product => product.name));
  const iosClaims = [...userAgentClaimText(userAgent).matchAll(/\b(?:CPU(?: iPhone)? OS|iPhone OS) (\d{1,5})_(\d{1,5})(?:_\d{1,5})?\b/gi)];
  const ios = iosClaims[0];
  if (ios !== undefined && names.has('applewebkit')) {
    const major = Number(ios[1]), minor = Number(ios[2]);
    return iosClaims.every(claim => Number(claim[1]) === major && Number(claim[2]) === minor)
      && major <= 65535 && minor <= 65535 && (major > 16 || major === 16 && minor >= 4);
  }
  // These iOS-specific shell tokens cannot borrow a desktop version threshold
  // when their required engine/OS context is missing.
  if (names.has('crios') || names.has('fxios')) return false;
  if (names.has('chrome') || names.has('chromium')) {
    const version = userAgentEngineVersion(products, ['chrome', 'chromium']);
    return version !== null && version.major >= 76;
  }
  if (names.has('firefox')) {
    const version = userAgentEngineVersion(products, ['firefox']);
    return version !== null && version.major >= 90;
  }
  if (names.has('safari') && names.has('applewebkit')) {
    const version = userAgentEngineVersion(products, ['version']);
    return version !== null && (version.major > 16 || version.major === 16 && version.minor >= 4);
  }
  return false;
}
