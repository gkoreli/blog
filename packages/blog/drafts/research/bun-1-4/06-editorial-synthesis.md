# Bun 1.4 OSS Radar editorial synthesis

Checked: 2026-08-26
Governing form: OSS Radar single-project deep dive
Release baseline: [`bun-v1.4.0` / `34cbb9a40b4bd1bd767d134a7065e66c2432a676`](https://github.com/oven-sh/bun/commit/34cbb9a40b4bd1bd767d134a7065e66c2432a676)

## Article passport

- **Working URL:** `/oss-radar-05-bun-1-4`
- **Living center:** Bun moved more application work into one runtime at the same moment it rewrote its Zig core in Rust because its existing scope had become a stability problem. Package deletion is a transfer of responsibility, not the removal of dependency.
- **Why now:** Bun 1.4.0 shipped six days ago. The tag, release-wide product statement, production reports, and first stable regressions can be separated cleanly before later 1.4.x fixes blur the boundary.
- **Portfolio role:** Reader-growth. A runtime adopter can use the piece to decide whether to pin, test, wait, or keep Node/package boundaries.
- **Working H1:** `Bun 1.4 Made the Runtime the Dependency`
- **Concrete artifacts:** release SHA, Rust source cutover, fifteen built-in job mappings, `Bun.Terminal` implementation and local reproduction, unsanitized `Bun.markdown` output, Node test counts, Anthropic ownership, stable-1.4 issue/repair states.
- **Reader decision:** Bun 1.4 is a serious pinned migration candidate. It is not evidence for an untested Node replacement or for deleting a package solely because a similarly shaped built-in exists.
- **Claim boundary:** the article will not call the runtime memory-safe, the built-ins package-compatible, the release 97% Node-compatible, the 15 mappings zero dependency, or Claude Code independent adoption evidence.
- **Internal relationship:** boundary companion to [`The Toolchain Is the Moat`](/oss-radar-02-the-toolchain-is-the-moat); this article tests what toolchain ownership does to a runtime adopter.

## Working verdict

Bun 1.4.0 released on August 20 with its Zig source cut over to Rust and a release narrative that moves fifteen common package jobs into one binary. Those changes belong together. Bun is taking more responsibility for application behavior while using Rust, upstream tests, and production canaries to make that larger boundary safer. The package graph can shrink, but the dependency does not disappear: it moves into Bun, its linked libraries, operating-system services, and Anthropic's release process. Try 1.4 as a pinned, measured migration. Do not swap it blindly for Node.

Falsifier: this verdict becomes too cautious when independent teams can adopt several Bun-specific APIs across two stable release lines, first-party hosts reach operational parity, and matched service shadows show no recurring Bun-only compatibility work. It becomes too generous if the new APIs remain release demos or stable patch lines keep exposing ordinary runtime regressions at event-loop and protocol seams.

## Article lane

1. State the dependency-transfer verdict in the first 100 words.
2. Show the release's fifteen-to-one product statement, while stating that the release post covers the whole 1.3→1.4 interval and does not promise package-interface parity.
3. Trace `Bun.Terminal`: JavaScript call → Bun runtime → POSIX PTY/Windows ConPTY → child process → callback. Pair the shipped path with the local macOS-arm64 reproduction.
4. Explain why Rust and the wider built-in surface belong in one article: the maintainer chose compiler-enforced lifetime checks because Bun's existing breadth kept producing cleanup and lifetime failures.
5. Test the trust transfer with one compatibility report and one security/portability boundary. Keep the rest in sources.
6. Explain Anthropic's double role as owner and production consumer: funding and a demanding canary improve the release path, while independent market proof and roadmap neutrality remain separate questions.
7. Give try-now/wait advice and two predeclared migration tests. Stop.

## Claim table

| Claim | Product says | Code, test, or report | Evidence state | Inference | Why it matters |
|---|---|---|---|---|---|
| Bun 1.4.0 shipped August 20 at `34cbb9a…` | Official release and blog | Tag resolves to the baseline SHA | **Code-inspected / reported** | None | Fixes the cutoff so post-tag repairs stay post-tag |
| The release presents fifteen package jobs as built in | Release animation and sections | Public declarations and call sites exist for the representative APIs | **Code-inspected + stated mapping** | Similar job does not mean interface parity | Supports the responsibility-transfer thesis without saying zero dependency |
| The release post is a rollup since 1.3.0 | The post says so and labels features by first version | `Bun.Image`, `Bun.WebView`, `Bun.Terminal`, and others have 1.3.x labels | **Reported** | The 1.4 tag packages a product direction more than a single-tag feature delta | Prevents false release attribution |
| `Bun.Terminal` owns the JavaScript-to-PTY path | Built-in PTY works on macOS, Linux, and Windows | Pinned types/implementation plus a local 1.4.0 macOS-arm64 marker test | **Code-inspected + reproduced** | It removes a native-addon package while retaining OS PTY/ConPTY reliance | Makes “built in” concrete |
| `Bun.markdown` is not a security boundary | Release warns raw HTML, handlers, and `javascript:` URLs pass through | Local reproduction preserved an `onerror` attribute | **Reproduced** | Package deletion does not delete application sanitization work | Shows risk moving rather than vanishing |
| The Rust cutover targets stability, not fashion | Maintainer names recurring lifetime and cleanup bugs | Tag contains Rust rather than Zig; same language-independent suite used | **Code-inspected + maintainer-stated** | Wider runtime scope made earlier memory discipline harder to sustain | Connects implementation choice to product theory |
| Rust does not make the whole runtime memory-safe | Rewrite cites safe-Rust benefits | Maintainer reports `unsafe`; Bun still embeds C/C++ engines/libraries | **Maintainer-stated + code-inspected** | Compiler checks reduce a class of failures, not all runtime risk | Keeps the verdict honest |
| Node compatibility improved but remains workload-specific | +1,517 newly passing upstream Node tests; selected modules reach 97–100% | Other module counts remain lower; stable async/protocol reports exist | **Shipped metrics + reported limits** | Test counts justify evaluation, not blind replacement | Sets the migration gate |
| Stable 1.4.0 had a delayed WebSocket-upgrade regression | Issue #39766 reports a production auth path; repair #39642 adds tests | Repair merged August 22, after the tag | **Reported + merged after baseline** | A common API can exist while one event-loop seam differs | One bounded counterexample to “drop-in” |
| Anthropic funds and uses Bun | Bun and Anthropic say Bun powers Claude Code and future coding tools | Claude Code used the Rust port before stable; Prisma provides an independent beta report | **First-party reported** | Owner workload is a strong canary but not independent adoption proof | Clarifies support and concentration |

## Product map

| Role | Layer | Boundary |
|---|---|---|
| Replaces | Node for compatible workloads; selected npm tool and package jobs | Replacement is task-specific, not complete interface equivalence |
| Wraps | Node/npm contracts, JavaScriptCore, system browsers, OS schedulers, PTY/ConPTY | The outside layer remains part of behavior and trust |
| Extends | JavaScript runtime into package management, testing, building, diagnostics, and OS-facing application APIs | Bun-specific APIs trade portability for integration |
| Relies on | Node behavior/tests, npm registry/packages, WebKit/JavaScriptCore, native libraries, OS services, Anthropic | One binary is still a graph of upstream and ownership dependencies |
| May enter | Execution and diagnostics substrate beneath coding agents | Direction is stated; permissions, approvals, durable task identity, and audit policy are missing |

## Theory test

| Theory | Evidence for | Evidence against | State | Falsifier |
|---|---|---|---|---|
| **Maintainer:** an integrated Node-compatible binary becomes the preferred environment for human- and AI-written JavaScript | Bun-owned APIs, Rust cutover, Claude Code canary, Prisma beta, Vercel beta, broader Node tests | incomplete compatibility, experimental WebView, host gaps, Bun-specific portability cost | **Stated and shipping** | Independent multi-API production adoption fails to appear after two stable lines |
| **Rival:** Bun remains a selective accelerator over Node/npm while application work stays in portable packages | explicit one-tool adoption, npm/Node contracts, mature package interfaces and independent upgrade cadence | Claude Code and Prisma run Bun; application APIs now cover OS-facing work | **Inferred** | independent products adopt the runtime plus several Bun APIs and hosts reach parity |

The article should not pretend this release settles the theories. It proves Bun has crossed the technical boundary into a wider application layer. Adoption evidence decides whether users follow.

## Reader-facing evidence selection

- **Use:** five representative package-job mappings in one compact table.
- **Trace:** `Bun.Terminal` end to end, with local reproduction and OS boundary.
- **Counterexample:** delayed WebSocket authentication path fixed after the 1.4.0 tag.
- **Security/portability boundary:** unsanitized Markdown output; praise portable packages for independent cadence and cross-runtime APIs.
- **Direction:** Anthropic ownership and agent-oriented workload, stated rather than inferred roadmap.
- **Keep in source drawer:** Windows rejected-read report, HTTP/2 stall, large parallel-suite deadlock, old-mac AVX report, audit registry disclosure, full breaking-change list, every benchmark.

## Decision tests

1. **Dependency-transfer test:** replace two packages with Bun built-ins behind the same application interface. Use one commit, fixture set, platform matrix, and acceptance checks. Pass only if behavior, security checks, and operations match before counting lockfile or startup gains.
2. **Runtime shadow test:** run the same commit, lockfile, traffic corpus, native addons, environment, and acceptance checks under current Node and pinned Bun for seven days or a predeclared request volume. Pass only with zero Bun-only correctness failures or hangs, complete diagnostics, and a predeclared resource gain that pays for the migration.

## Ending

Try Bun 1.4 now for greenfield Bun-native tools, self-contained TypeScript CLIs, and a pinned canary lane where the owner controls tests and deployment. Wait or dual-run when the service depends on complete Node behavior, direct native-addon ABIs, mature host observability, or cross-runtime source portability. The release makes Bun credible enough to carry more responsibility. It does not make that responsibility disappear.

## Discovery-positioning brief

### Baseline audit

| Dimension | Finding |
|---|---|
| Publication role | Reader-growth: a cold runtime adopter can leave with a migration decision and two gates |
| Title | Voice-bearing and falsifiable; keeps the living center while carrying the Bun 1.4 handle |
| Metadata | Concrete release, fifteen-job movement, Rust runtime, and compatibility/maintenance transfer are aligned |
| H1 / headings | One H1; headings move through package boundary, code trace, substrate, compatibility, security, owner, and decision |
| Standfirst / lede | Release identity and adoption verdict land in the first paragraph |
| Keywords | Bun 1.4, JavaScript runtime, Rust rewrite, Node compatibility, Bun.Terminal, Bun.Image, Bun.WebView |
| Internal links | One contextual link to OSS Radar #02; normal afterword resolves the earlier issue as the next read |
| Link-worthiness | Pinned source trace, checksum-verified local reproduction, two migration tests, and public research directory |

### Content inventory and intent map

- **Unique asset:** the dependency-transfer theory connects the fifteen-to-one release animation to the Rust rewrite rather than treating them as separate news items.
- **Code asset:** pinned `Bun.Terminal` lifecycle trace and a local PTY reproduction on the official 1.4.0 artifact.
- **Decision asset:** a canary verdict plus a matched Node/Bun runtime-shadow test.
- **Reader job:** “Tell me what Bun 1.4 actually changes, where the dependency went, and whether I should migrate.”
- **Search job:** Bun 1.4 review, Bun 1.4 Rust rewrite, Bun vs Node compatibility, Bun built-ins, Bun production readiness.
- **Poor-fit job to avoid:** package-by-package API reference or a universal Bun-versus-Node benchmark leaderboard.

### Candidate doorway packages

1. **Selected**
   - H1: `Bun 1.4 Made the Runtime the Dependency`
   - `seoTitle`: `Bun 1.4 Review: The Runtime Is the Dependency`
   - description: `Bun 1.4 moves fifteen package jobs into one Rust-based binary. The package graph shrinks, but compatibility and maintenance move into the runtime.`
   - standfirst: the release date, Rust cutover, fifteen jobs, bounded mechanism, and pinned-canary verdict.
2. **More literal, weaker voice**
   - H1: `Bun 1.4 Moved Dependencies Into the Runtime`
   - Useful for immediate mechanism clarity, but it flattens the thesis into a past-tense changelog claim.
3. **Higher apparent utility, worse intent fit**
   - H1: `What Bun 1.4 Actually Replaces`
   - Could attract package-parity and migration-reference intent the article deliberately refuses to satisfy.

The selected package keeps the title's useful double meaning: Bun becomes the application's runtime dependency and the container of formerly separate dependency work. The `seoTitle` adds “review” for a cold searcher without turning the H1 into comparison sludge. The description states both the release artifact and the consequence.

### Distribution and share mechanics

- **Reader contact:** runtime maintainers and Bun adopters can answer with a failing workload, a successful shadow result, or a correction to the pinned code trace.
- **Armed:** the two migration gates give an adopter a concrete way to resist “just switch the runtime” pressure.
- **Vindicated:** package maintainers and cautious platform engineers see the remaining native, browser, OS, and security boundaries named without dismissing integration.
- **Seen:** teams interested in Bun but unwilling to treat download counts or compatibility percentages as production proof get a position between hype and rejection.
- **Link targets:** the pinned Terminal path, reproduction artifact, source rationales, and final footprint manifest are more defensible external references than the thesis alone.
- **Primary distribution handles:** Bun 1.4, first stable Rust release, fifteen built-in jobs, pinned canary rather than blind Node replacement.
- **Internal trail:** preserve the single prose link to `/oss-radar-02-the-toolchain-is-the-moat`; do not add a formal series because the OSS Radar issue number already supplies the publication sequence and the posts do not form a required reading order.

### Pre-publish shareable-engineering check

- Concrete title with a tool handle: yes.
- Falsifiable position: yes; the theory and its falsifiers are recorded above.
- Evidence boundary labels: yes; reproduced, code-inspected, maintainer-reported, proposed, and inference remain separate in the artifacts and article prose.
- One deep source trace: yes, `Bun.Terminal`.
- Independent adoption evidence: yes, Prisma and Vercel, with beta limits.
- Counterevidence: yes, the post-tag WebSocket repair plus security and portability boundaries.
- Honest doorway package: yes; no keyword rewrites to the body are warranted.
- Citation rationales: yes, every reader-facing Source item explains why it earned a place.
- Glossary: not warranted; the article defines PTY/ConPTY and other uncommon terms in context.
