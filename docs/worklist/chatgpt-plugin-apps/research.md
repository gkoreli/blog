# First research pass

September 29, 2026, Pacific time. Evidence classes: documented contract, source inspection, editorial inference, and proposed experiment. No live host behavior was measured.

## 1. Interface plus actions is the useful product distinction

The architecture describes skills, MCP tools, and optional UI. The extensions add direct app entrypoints and richer host integration. The concrete change to examine is an app that remains available for inspection and editing while the assistant operates meaningful domain actions.

The pinned specification defines global, thread, and file entrypoints. Global/thread entrypoints receive empty arguments; a file entrypoint receives an opaque resource URI. The file viewer can use host resource APIs, including permitted writes. This is a richer interface contract, not evidence that every app should move into ChatGPT. Sources: D1, D2, G1.

## 2. The CAD example has inspectable distinctions

G5 lines 599–664 define `read_view`, `open_part`, `configure_view`, `rotate_geometry`, and `save_file`. Lines 763–777 answer mounted-app `tools/list` and `tools/call` requests. The example thus exposes operations on the current mounted viewer, not only remote catalog tools.

The save implementation at lines 377–410 requires a writable STL file and an ETag. It sends `ifMatch` to `openai/resources/write`. On conflict it reports that the external change prevented saving. Rotation marks an unsaved geometry edit. Changing a view has separate semantics. These are code findings; tests and runtime behavior were not exercised.

Possible lesson: a plugin should preserve the domain’s distinctions among observing, changing a view, editing a draft, and persisting an edit. This interpretation connects the example to product design without claiming the API makes agents more capable by itself.

## 3. Context sharing creates a design obligation

G1 specifies that each `ui/update-model-context` call replaces the context previously supplied by the same app instance. Content `_meta` is excluded from model input. Supported visible content becomes removable attachments, while assistant-audience content can be hidden from the user. Do not generalize this to context compaction, memory deletion, or replacement of prior conversation messages.

Design question: which selected state is sufficient for the task, how does it become stale, and can the person see what the assistant is using? Proposed quality tests should include changed selection, externally changed files, removed attachments, and requests unrelated to the app.

## 4. Discovery and invocation need separate measurement

D4 establishes metadata’s role in selecting available tools and recommends labelled direct, indirect, and negative prompts. It does not disclose recommendation-ranking weights among directory plugins or prove organic reach. D5 establishes publication mechanics. Neither establishes a conversion rate.

Keep five proposed measures distinct: recommendations seen, installs, appropriate tool calls, successful tasks, and repeat use. A backend request can support an invocation observation; it cannot independently measure recommendation impressions, all user intent, or satisfaction. Whether the platform exposes those measures remains open.

## 5. Platform scope materially limits the announcement

G1’s launch matrix says its web column means the Work browser and excludes classic ChatGPT. It lists file entrypoints, file opening/resources, and composer mentions as desktop-only. D2 additionally says Free/Go web extensions are coming soon. These are documentary claims, not observations of the user’s account or every rollout cohort.

The public docs show a file-extension code example using `extensions: ["stl"]`; the pinned specification requires leading-dot extension forms and the SDK example uses `.csv`/`.tsv`. Record this mismatch for a future implementation; the draft follows the pinned contract and avoids copying the questionable snippet. Do not report a confirmed runtime bug.

## 6. Shared standards and host ownership coexist

D1 recommends MCP Apps as the foundation and optional ChatGPT extensions when needed. G2 says extension fields can remain unavailable after initialization when a host lacks support. Shared tools/UI therefore do not establish universal support for all host integration.

P1 supplies Goga’s existing goal: an application lends capabilities while a user chooses the agent. The plugin model supplies capabilities inside a host-owned assistant. This offers a real comparison; do not call the announcement proof that AgentPort is right, wrong, complete, or obsolete.

## 7. Business feasibility is an open question

D5 describes identity verification, package checks, review, and a separate publish action. D6 describes current eligible physical-goods checkout and selected partners for embedded payment. The first pass does not establish software-plugin pricing, revenue share, expected distribution, or ownership of a customer relationship. Avoid extrapolating the audience claim into a viable business.

## Two proposed product probes

1. **Research evidence workspace:** a claim list beside source passages, checked/open status, and one correction operation. Compare it with an ordinary document or current research workflow. Measure whether evidence is easier to inspect and correct; later measure repeated use.
2. **Specialist file editor:** one structured file type with visible state, domain-specific operations, and conflict-aware saving. Compare inspection, requested edit, review, and persistence inside versus outside the host.

These are ideas from the research synthesis. Neither has been built or selected as Goga’s next project.

## October 3 source refresh and article development

Checked October 3, 2026 UTC. Official architecture, extensions, quickstart, metadata, submission, monetization, and user-facing plugin pages were fetched over HTTPS. The original announcement also loaded directly: September 29, 2026, 5:48 PM as displayed by X. Its text supports attribution of apps and in-conversation recommendations; the stated audience remains a vendor claim rather than an independently measured premise.

Extension source pin: `ca16cb3bc015baaa1b849082d8755bbef18770cb`. Compared with `e314720a0daac326217d1f123fcf51647868fa9f`, the specification now pins its MCP Apps draft reference and links some sections to the stable January 26 document. The other intervening commit updates issue templates. The inspected CAD controller and server registration are unchanged.

Additional source findings:

- Server tools `cad.search`, `cad.view`, and `cad.configureView` act on catalog/opening workflows. The server's configure description explicitly directs existing-view edits to mounted tools (`register.ts`, lines 210–271).
- The mounted controller supplies `read_view`, `open_part`, `configure_view`, `rotate_geometry`, and `save_file`, then registers `tools/list` and `tools/call` handlers (lines 599–664 and 763–777).
- The save operation snapshots an edit sequence. A successful response leaves dirty state true if newer edits exist, distinguishing a saved earlier rotation from current unsaved changes (lines 377–410).
- Context contains current part/file, camera/display settings, dimensions, note, selection, and edit state, with an optional captured image (lines 418–458). Context attachment status is derived from host notifications rather than assuming a successful send establishes the attached state.
- The documented platform and Free/Go caveats remain in the refreshed pages. Commerce still describes current physical-goods scope and selected partners; no software subscription entitlement or new monetization result is established.

Editorial proposals derived from those findings: an evidence workspace with target IDs, expected revisions, source relationships, and visible correction review; a single-format editor with validation, diff, and conditional saving. Compare the underlying workflow in a standalone interface and a ChatGPT host to isolate the integration's benefit. None of these proposals was implemented or measured.

Publication review checks the source pins, claim scope, contextual links, metadata, prompt provenance, and static diagram. The new article is a research-based engineering exploration, not a live plugin test report.

## October 3 second-pass prior art

The owner's request for three new evidence-backed questions led to a correction of launch novelty, a generated-app alternative, and a more specific portability plan. [The review](prior-art-and-editorial-review.md) contains answers, primary-source links, code inspection, selected HN objections, title/opening choices, and prose revisions.

The important historical finding is that OpenAI's October 2025 launch already describes interactive apps and relevant app suggestions. The September article now credits the documented host extensions rather than implying the whole UI/discovery concept is new. Jupyter's shared object/views and VS Code's document/editor responsibilities provide proposed implementation patterns. Willison and Anthropic supply generated-app prior art. The SDK at `82221c0c8ce7661efa6771c9d461511b1650495f` supplies a standard UI-to-server call and hybrid rendering guidance. No live app, portability comparison, user study, commercial test, or recommendation observation was run.

## October 4 release and founder question

The [assessment](release-and-founder-assessment.md) adds registry publication evidence, current rollout/commerce reads, planned custom GPT retirement, and migration gaps. The dedicated OpenAI FAQ schedules retirement for December 11, with qualified Enterprise deferrals, and says custom actions and sharing settings do not transfer. This is stronger evidence of a platform transition than the launch post alone, while availability and future results remain distinct.

GPT Store creation counts and App Store reported earnings are used for different questions: interest in building versus a demonstrated commercial ecosystem. Neither predicts a startup's success. Shopify's historical terms inform supporting notes only. The article adds a practical migration opportunity and proposed tests for task completion, repeat use, payment, and operating cost. No user study, business outcome, or live plugin result is claimed.
