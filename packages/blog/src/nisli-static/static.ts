/**
 * static.ts — Static HTML renderer for nisli/core-style templates
 *
 * Prototype of `@nisli/core/server` — a build-time `renderToString()` for
 * nisli/core templates. Same `html` tagged template syntax as the browser
 * version, but resolves to plain HTML strings instead of DOM bindings.
 *
 * Design goal: components shouldn't know if they're rendering to DOM or
 * string. The entry point decides — `mount()` for browser, `renderToString()`
 * for Node. Same pattern as Lit SSR and React's renderToString.
 *
 * Current limitation: this is a standalone `html` function, not yet wired
 * into nisli/core's component system. Full SSR would require resolving
 * component trees, signals, when(), each() — all without a DOM.
 *
 * Future: move into @nisli/core as `@nisli/core/server` export.
 */

// ── Types ───────────────────────────────────────────────────────────

export interface StaticResult {
  toString(): string;
  __staticResult: true;
}

// ── Escaping ────────────────────────────────────────────────────────

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, ch => ESCAPE_MAP[ch] ?? ch);
}

// ── html tagged template (static) ──────────────────────────────────

/**
 * Static version of nisli/core's `html` tagged template.
 *
 * ```ts
 * const page = html`<h1>${title}</h1><p>${description}</p>`;
 * const output = page.toString(); // complete HTML string
 * ```
 *
 * Values are auto-escaped unless they are StaticResult (nested templates)
 * or RawHtml (pre-escaped content like markdown output).
 */
export function html(strings: TemplateStringsArray, ...values: unknown[]): StaticResult {
  const result: string[] = [];

  for (let i = 0; i < strings.length; i++) {
    result.push(strings[i] ?? '');

    if (i < values.length) {
      const value = values[i];
      result.push(resolveValue(value));
    }
  }

  const output = result.join('');

  return {
    __staticResult: true as const,
    toString: () => output,
  };
}

// ── Raw HTML (opt out of escaping) ──────────────────────────────────

interface RawHtml {
  __raw: true;
  value: string;
}

/**
 * Mark a string as raw HTML — bypasses escaping.
 * Use for pre-rendered content (markdown output, syntax-highlighted code).
 *
 * ```ts
 * const content = raw(markdownToHtml(post.content));
 * html`<div class="post">${content}</div>`;
 * ```
 */
export function raw(value: string): RawHtml {
  return { __raw: true as const, value };
}

// ── Value resolution ────────────────────────────────────────────────

function resolveValue(value: unknown): string {
  if (value == null || value === false) return '';
  if (value === true) return '';

  // Nested static template
  if (typeof value === 'object' && '__staticResult' in value) {
    return (value as StaticResult).toString();
  }

  // Raw HTML (pre-escaped)
  if (typeof value === 'object' && '__raw' in value) {
    return (value as RawHtml).value;
  }

  // Array of values
  if (Array.isArray(value)) {
    return value.map(resolveValue).join('');
  }

  // Everything else: escape and stringify
  return escapeHtml(String(value));
}
