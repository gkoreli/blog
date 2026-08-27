import { staticHtml as html } from '@nisli/core/static';
import type { PostMeta } from '../src/lib/frontmatter.js';
import {
  BunFusionHero,
  Callout,
  CompareTable,
  FlowDiagram,
  Prognosis,
  PullQuote,
  SectionBreak,
  Sources,
  StatRow,
} from '../src/templates/components.js';

export const meta: PostMeta = {
  title: 'Bun 1.4 Made the Runtime the Dependency',
  seoTitle: 'Bun 1.4 Review: The Runtime Is the Dependency',
  alternativeHeadline: 'Bun 1.4 moves fifteen package jobs into one Rust-based binary',
  date: '2026-08-26',
  description: 'Bun 1.4 moves fifteen package jobs into one Rust-based binary. The package graph shrinks, but compatibility and maintenance move into the runtime.',
  section: 'oss-radar',
  tags: ['oss-radar', 'bun', 'javascript', 'rust', 'runtime'],
  layout: 'immersive',
  featured: false,
  images: [],
  slug: 'oss-radar-05-bun-1-4',
};

export function preamble() {
  return BunFusionHero({
    issueNum: 'Issue #05',
    date: 'August 2026',
    tags: 'open-source · javascript · runtimes · rust',
    title: html`<h1>Bun 1.4 Made the Runtime the <em>Dependency</em></h1>`,
    subtitle: 'The package graph shrank. The responsibility did not.',
    author: 'Goga Koreli',
    readTime: '9 min read',
  });
}

export function article() {
  return html`
<article class="post-content">
  <p class="post-lede">
    <a href="https://github.com/oven-sh/bun/releases/tag/bun-v1.4.0" target="_blank" rel="noopener">Bun 1.4.0</a>
    shipped on August 20 with its runtime source cut over from Zig to Rust. The release also presents fifteen
    package-shaped jobs as built-ins: image transforms, browser control, Markdown, PTYs, cron, archives, terminal
    text, and more. Those changes belong together. Bun is taking responsibility for more application behavior while
    using Rust, upstream compatibility tests, and production canaries to make that larger boundary safer. Try 1.4 as
    a pinned, measured migration. Do not swap it blindly for Node.
  </p>

  <p>
    This is not a story about dependencies disappearing. A line can leave <code>package.json</code> while its
    implementation, upgrade cadence, platform matrix, and security boundary move into the runtime. Bun 1.4 makes
    that transfer unusually visible. The release compresses a JavaScript toolchain into one executable, then shows
    the engineering bill for owning the result.
  </p>

  ${StatRow({
    items: [
      { value: '15 → 1', label: html`Package jobs presented as Bun built-ins` },
      { value: '+1,517', label: html`Node.js test-suite cases added since 1.3` },
      { value: '1st', label: html`Stable release with Bun's runtime in Rust` },
    ],
  })}

  <h2>Fifteen dependencies did not disappear</h2>

  <p>
    Bun's release page covers everything shipped since 1.3.0 rather than only symbols first added by the 1.4.0 tag.
    Feature headings carry version chips. <code>Bun.Image</code> first shipped in 1.3.14; parts of
    <code>Bun.Terminal</code> date to 1.3.5; <code>Bun.WebView</code> spans 1.3.12 and 1.4.0. August 20 is still a
    real boundary: 1.3.14 was the final Zig release, and 1.4.0 is the first stable Rust one.
  </p>

  <p>
    Read the fifteen-to-one claim as product positioning, not interface parity. These are Bun-native ways to perform
    common jobs. They do not implement every package API, and adopting them trades portable npm contracts for a
    tighter runtime contract.
  </p>

  ${CompareTable({
    headers: ['Package-shaped job', 'Bun surface', 'What remains outside the line count'],
    rows: [
      ['Sharp image work', 'Bun.Image', 'Native codecs, OS image facilities, platform-specific formats'],
      ['Puppeteer browser work', 'Bun.WebView', 'System WebKit or an installed Chrome-family browser'],
      ['Marked parsing', 'Bun.markdown', 'Application-owned sanitization for untrusted HTML'],
      ['node-pty terminals', 'Bun.Terminal', 'POSIX PTYs or Windows ConPTY and their process semantics'],
      ['node-cron scheduling', 'Bun.cron', 'Process lifetime or the operating system scheduler'],
    ],
    highlightRows: [3],
  })}

  ${PullQuote({
    content: html`<p>A dependency can leave the lockfile without leaving the system.</p>`,
  })}

  <p>
    Integration can still earn the transfer. It can remove version skew, repeated parsing, process boundaries,
    install time, and adapter code, while giving one maintainer enough control to optimize an end-to-end path.
    Independent packages have strengths worth naming: their own release cadence, a public interface shared by
    several runtimes, and the option to replace one subsystem without replacing the runtime. Bun wins the trade only
    when its implementation and operating boundary are better for the workload.
  </p>

  <h2>A terminal call now ends inside the runtime</h2>

  <p>
    <code>Bun.Terminal</code> is the cleanest small example. A TypeScript program supplies dimensions and callbacks,
    hands the terminal to <code>Bun.spawn()</code>, then reads and writes a pseudo-terminal without importing
    <code>node-pty</code>. In the tagged 1.4 source, the native object stores the master file descriptors, reader,
    writer, and event-loop handle. On Windows it also owns the ConPTY handle. The subprocess retains a pointer to the
    attached terminal and calls back into it on exit. Bun coordinates both objects, so the PTY lifecycle becomes part
    of the runtime lifecycle.
  </p>

  ${FlowDiagram({
    label: 'Bun.Terminal execution path',
    steps: [
      {
        eyebrow: 'Create',
        title: 'Bun.Terminal',
        detail: html`Columns, rows, data and exit callbacks`,
        connector: 'attach',
        tone: 'warm',
      },
      {
        eyebrow: 'Spawn',
        title: 'Child process',
        detail: html`Child process attaches to the PTY`,
        connector: 'bridge',
        tone: 'blue',
      },
      {
        eyebrow: 'Own',
        title: 'Native PTY',
        detail: html`POSIX descriptors or Windows ConPTY`,
        connector: 'schedule',
        tone: 'rust',
      },
      {
        eyebrow: 'Deliver',
        title: 'Runtime events',
        detail: html`Bun event loop returns data and exit`,
        tone: 'blue',
      },
    ],
  })}

  <p>
    I downloaded the official macOS arm64 1.4.0 artifact, matched its SHA-256 to GitHub's release metadata, and
    confirmed revision <code>34cbb9a40</code>. A small PTY program spawned <code>/bin/sh</code>, received the marker
    written by the child, and observed exit code zero. That reproduces the narrow path. It does not prove
    <code>node-pty</code> parity, Windows ConPTY behavior, or resilience under an interactive agent's long session.
  </p>

  ${Callout({
    label: 'One binary still has seams',
    body: html`<p>
      Built-in means Bun owns the JavaScript API and integration path. It does not mean Bun wrote every layer below
      it. JavaScriptCore, uSockets, BoringSSL, SQLite, native codecs, browser engines, and operating-system services
      remain part of the deployed system.
    </p>`,
  })}

  <h2>Rust is the payment for the larger boundary</h2>

  <p>
    The rewrite targeted cleanup failures rather than missing feature capacity. Jarred Sumner's account describes
    recurring use-after-free, double-free, and forgotten-cleanup bugs across a large native codebase. The team
    mechanically ported 535,496 lines of Zig with Claude Code, kept the TypeScript test suite as the behavioral
    contract, then used Rust ownership and sanitizer builds to expose lifetime problems.
  </p>

  <p>
    That mechanism is credible; the phrase “Bun is memory-safe now” outruns the evidence. Bun's own post says roughly
    four percent of the Rust code uses <code>unsafe</code>, and the runtime still crosses large C and C++ boundaries.
    Rust can make Bun-owned resource cleanup more deterministic and move more lifetime errors to compile time. It
    cannot make a protocol correct, model every event-loop ordering, or prove an FFI dependency safe.
  </p>

  ${CompareTable({
    headers: ['Claim', 'Evidence', 'Boundary'],
    rows: [
      ['The rewrite preserved behavior', 'Maintainers report six green platforms and the full suite passing', 'Integration-only states still escape test coverage'],
      ['The rewrite reduced leak exposure', 'Rust cleanup, ASAN wiring, and fixed 1.3.14-repro bugs', 'Native libraries and unsafe code remain'],
      ['1.4 uses less CPU and memory', 'Published Bun and Claude Code measurements', 'Maintainer-run workloads, not an independent benchmark here'],
    ],
    highlightRows: [1],
  })}

  <p>
    The strongest outside evidence comes from a failure, not a benchmark. Prisma Compute had two Bun 1.3 problems:
    memory growth while reading S3 objects and a SQL connection pool that did not recover after scale-to-zero. Prisma
    says the Rust canary passed both tests and launched its public beta on that build. It also explicitly refuses the
    larger conclusion: two repaired failure modes do not prove every pool or memory problem fixed.
  </p>

  ${SectionBreak()}

  <h2>Compatibility percentages cannot model an event loop</h2>

  <p>
    Bun reports 1,517 more Node.js suite tests and pass rates of at least 97 percent for several core modules. That is
    valuable evidence because compatibility is an accumulation of small semantics. Production workloads still add
    states the suite does not model. A post-release WebSocket report found that delaying authentication before
    <code>handleUpgrade()</code> could leave an upgrade hanging in 1.4.0. The repair merged two days after the release
    tag. A broad suite could be green while one ordering between authentication, upgrade, and socket lifecycle was wrong.
  </p>

  <p>
    The timing matters more than using the bug as a scare story. The issue had a bounded reproduction, maintainers
    repaired it, and the fix was not in 1.4.0. “Fixed on main” and “safe in the tagged binary” are different states.
    Pinning a runtime makes that distinction operational instead of rhetorical.
  </p>

  ${Prognosis({
    tag: 'migration gate',
    title: 'Make the compatibility claim workload-specific',
    body: html`<p>
      Run the same service under its current Node version and pinned Bun for seven days—or a predeclared production
      volume. Promote only after response bytes, status codes, durable writes, queue effects, and error classification
      agree; no Bun-only hangs appear; diagnostics remain complete; and one declared resource gain survives.
    </p>`,
  })}

  <h2>The security obligation moved too</h2>

  <p>
    I also passed an image containing a raw <code>onerror</code> attribute through <code>Bun.markdown.html()</code> on
    the official release binary. The attribute survived, exactly as Bun's documentation warns. That is a parser
    contract, not a security boundary. The important point is ownership. Deleting a Markdown package does not delete
    the application's obligation to sanitize untrusted content.
  </p>

  <p>
    The browser story has the same shape. <code>Bun.WebView</code> can remove Puppeteer from a supported automation
    path, but macOS uses system WebKit and other platforms use an installed Chrome-family browser. The API is
    experimental. A deployment may have fewer npm nodes while depending more heavily on OS versions, browser
    provisioning, profile isolation, and Bun's release cadence.
  </p>

  ${PullQuote({
    content: html`<p>The package graph measures who you install. It does not measure everything you trust.</p>`,
  })}

  <h2>Anthropic is both the advantage and the bias</h2>

  <p>
    Anthropic acquired Bun in December 2025. Claude Code ships as a Bun executable and exercised the Rust port for
    months before stable release. That gives Bun something most runtimes lack: funding plus a demanding, long-lived,
    widely distributed owner workload. Terminal control, browser automation, package review, test selection,
    self-contained executables, and machine-readable performance reports make sense together when AI coding tools
    are a strategic user.
  </p>

  <p>
    The same evidence is correlated. Claude Code proves Bun can carry serious work, but it is no longer an independent
    customer choosing among neutral vendors. Prisma's beta and Vercel's first-party Bun runtime broaden the case,
    while Vercel's public-beta label and documented Node-relative gaps keep it open. Bun's reported monthly downloads
    do not reveal how many teams use the package manager, the runtime, a compiled CLI, or production servers.
  </p>

  <p>
    <a href="/oss-radar-02-the-toolchain-is-the-moat">Bun's original moat was the integrated JavaScript toolchain</a>.
    Version 1.4 pushes that integration upward into application work. Node compatibility is becoming the entry
    contract beneath a Bun-specific toolkit, not the final destination. That is a stronger product and a larger bet.
  </p>

  <h2>Adopt by canary, not by ambient upgrade</h2>

  ${Prognosis({
    tag: 'try now',
    title: 'Use a pinned runtime where you can measure the whole path',
    body: html`<p>
      Bun 1.4 is a credible candidate for TypeScript CLIs, coding tools, greenfield services, and incremental package,
      test, or bundling adoption. Record the exact revision, keep rollback cheap, and test the Bun-native API on every
      operating system you ship.
    </p>`,
  })}

  ${Prognosis({
    tag: 'wait or dual-run',
    title: 'Do not treat Node compatibility as an in-place guarantee',
    body: html`<p>
      Gate services with delayed WebSocket authentication, browser automation, Bun-native operating-system APIs, and
      workloads that depend on exact Node behavior. Wait when the migration needs mature host observability or
      cross-runtime behavior that your application cannot independently verify.
    </p>`,
  })}

  <p>
    Bun 1.4 preserved enough behavior through a source-language migration to keep widening the runtime boundary. That
    combination deserves a serious production trial because the integration is real, the test investment is large,
    and the canary evidence reaches beyond microbenchmarks. A blind replacement is still unjustified because every
    deleted package line concentrates more behavior behind one upgrade.
  </p>

  <p>
    The package graph shrank. The dependency became Bun.
  </p>

  ${Sources({
    items: [
      {
        claim: 'Bun v1.4.0 was published on August 20, 2026 at commit 34cbb9a40',
        why: 'The release record fixes the version, date, source baseline, and official binary artifacts used by this review.',
        ref: 'Bun v1.4.0 release',
        url: 'https://github.com/oven-sh/bun/releases/tag/bun-v1.4.0',
      },
      {
        claim: 'The Bun 1.4 post is a roundup since 1.3.0 and labels the release that first shipped each feature',
        why: 'This prevents release-train features such as Bun.Image from being misreported as new in the 1.4.0 tag.',
        ref: 'Bun 1.4 release post',
        url: 'https://bun.com/blog/bun-v1.4',
      },
      {
        claim: 'The official 1.4.0 macOS arm64 binary matched its published digest and passed the PTY, Markdown, JSON5, and string-width checks used here',
        why: 'The public record preserves the exact script, binary identity, outputs, platform, and limits behind the first-person reproduction claims.',
        ref: 'Local reproduction record',
        url: 'https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/bun-1-4/05-local-reproduction.md',
      },
      {
        claim: 'Bun 1.4 is the first Rust release after a mechanically staged Zig migration',
        why: 'The maintainer account supplies the motivation, process, test strategy, production canaries, scale, and explicit limits of the rewrite.',
        ref: 'Bun is rewriting itself in Rust',
        url: 'https://bun.com/blog/bun-in-rust',
      },
      {
        claim: 'The tagged Bun.Terminal object owns PTY descriptors, I/O, event-loop state, and a Windows ConPTY handle',
        why: 'Pinned source shows where the JavaScript call becomes runtime-owned native lifecycle instead of an external package wrapper.',
        ref: 'Bun.Terminal implementation',
        url: 'https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/api/bun/Terminal.rs#L86-L174',
      },
      {
        claim: 'The tagged Subprocess object retains the pointer to its attached terminal',
        why: 'The ownership direction explains how Bun coordinates process exit with the runtime-owned PTY without putting a child-process reference on Terminal.',
        ref: 'Bun Subprocess implementation',
        url: 'https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/api/bun/subprocess.rs#L121-L139',
      },
      {
        claim: 'Bun.Image routes image work through native codecs and operating-system image facilities',
        why: 'The implementation supports the table\'s narrower point: an npm entry can disappear while codec and platform dependencies remain.',
        ref: 'Bun.Image pipeline',
        url: 'https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/image/codecs.rs#L22-L83',
      },
      {
        claim: 'Bun.markdown allows raw HTML and does not sanitize untrusted output',
        why: 'The documented boundary proves that a built-in parser does not absorb the application security job.',
        ref: 'Bun.markdown release notes',
        url: 'https://bun.com/blog/bun-v1.4#bunmarkdown',
      },
      {
        claim: 'Bun.WebView uses system WebKit or an installed Chrome-family browser and remains experimental',
        why: 'The outside browser and platform contract bounds the “no Puppeteer” product claim.',
        ref: 'Pinned Bun.WebView documentation',
        url: 'https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/docs/runtime/webview.mdx',
      },
      {
        claim: 'A delayed-authentication WebSocket upgrade path could hang in Bun 1.4.0',
        why: 'The bounded production report shows why broad compatibility rates and a specific event-loop ordering must be evaluated separately.',
        ref: 'Bun issue #39766',
        url: 'https://github.com/oven-sh/bun/issues/39766',
      },
      {
        claim: 'The delayed WebSocket upgrade repair merged on August 22, after the 1.4.0 release commit',
        why: 'The merged test and implementation change proves that “fixed on main” was not the behavior of the pinned release binary.',
        ref: 'Bun pull request #39642',
        url: 'https://github.com/oven-sh/bun/pull/39642',
      },
      {
        claim: 'Prisma Compute launched its public beta on Bun\'s Rust canary after two specific failure tests improved',
        why: 'This is independent first-hand runtime evidence with explicit workloads and limits, not a Bun microbenchmark.',
        ref: 'Prisma Compute production report',
        url: 'https://www.prisma.io/blog/bun-rust-rewrite-prisma-compute',
      },
      {
        claim: 'Vercel offers a first-party Bun Functions runtime in public beta with documented gaps beside Node',
        why: 'Hosting support broadens adoption evidence while preserving the difference between availability and operational parity.',
        ref: 'Vercel Bun runtime',
        url: 'https://vercel.com/docs/functions/runtimes/bun',
      },
      {
        claim: 'Anthropic acquired Bun and funds it as infrastructure for Claude Code, the Agent SDK, and future AI coding products',
        why: 'Ownership explains both Bun\'s production feedback loop and the strategic user behind the expanding application toolkit.',
        ref: 'Bun joins Anthropic',
        url: 'https://bun.com/blog/bun-joins-anthropic',
      },
      {
        claim: 'Anthropic describes Claude Code as Bun infrastructure while committing to Bun\'s open-source development',
        why: 'The buyer\'s announcement confirms the acquisition and also shows why Claude Code remains correlated owner evidence.',
        ref: 'Anthropic acquisition announcement',
        url: 'https://www.anthropic.com/news/anthropic-acquires-bun-as-claude-code-reaches-usd1b-milestone',
      },
    ],
  })}
</article>`;
}
