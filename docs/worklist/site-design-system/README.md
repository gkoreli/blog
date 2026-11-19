# Publication design system implementation

Status: complete — published and verified November 15, 2026 UTC. Scope: shared visual rules and the publication, report and utility compositions that consume them. Preserve article content, measurement records, policy disclosures and native navigation while improving their presentation.

The earlier [tool and Stats work](../../../packages/blog/drafts/research/ai-site-audit/02-tools-product-exploration.md) supplies the accepted compact navigation and data-display patterns. [Publication search](../blog-search/delivery-2026-11-14.md) shipped after the visual review and must be reused for discovery.

## Work and acceptance

| Area | Required result | Acceptance evidence |
| --- | --- | --- |
| 01 Readability | Semantic text colors remain readable on their supported surfaces in both themes; metadata is not faded by component opacity. | Token contrast checks and actual archive, article, control and report views. |
| 02 Article reach | Five source metrics use the shared metric composition; all source, weekly, article and history data remain. | Identical saved-report comparison and responsive views. |
| 03 Provenance | Page assembly owns exactly one research footprint; authored explanation remains in HTML and Markdown. | Rendered ownership/unique-ID checks and content preservation. |
| 04 Links | Shared sections own complete link/focus states without depending on an incidental ancestor. | Standalone/rich article examples and both themes. |
| 05 License | Public license destinations work, public copy explains scope without repository paths or duplicated citation text. | Rendered destinations and policy-preservation check. |
| 06 Report scope | Independent report calendars and selections are visibly bounded; filter ownership is unambiguous. | Both report contexts, selection behavior and unchanged data. |
| 07 Discovery | Archives retain topic navigation and full chronology; shared navigation opens the shipped search. | Topic destinations, native search fallback and complete article inventory, with no inline archive search form. |
| 08 Reading navigation | Long articles expose stable, useful section navigation in their actual reading shell. | Markdown/rich/immersive articles, native links and phone layouts. |
| 09 Tables | Full evidence remains available with an overflow cue, focusable scrolling and retained row identity where appropriate. | Long-label/merged-cell fixtures and actual technical articles. |
| 10 Interaction density | Frequent phone targets and narrow section navigation follow one interaction scale. | 320px and 393px targets, menu Escape/scroll lock and section-index behavior. |
| 11 Policy structure | Privacy starts with reader-oriented context and links into the complete technical disclosure. | All original substantive policy text and accessible section destinations. |
| 12 Visual workspace | The lab puts its experiment in view without oversized introductory spacing. | Desktop/phone composition and retained controls, explanation and diagnostics. |
| 13 Project identity | About distinguishes real projects with authored visual treatments and clear destinations. | Actual project content and responsive presentation. |

## Module boundaries

- The design package owns semantic color, spacing, focus and target contracts; publication components consume those roles.
- Publication composition owns article structure, contents, table affordances and provenance placement. Search indexes that prepared publication content without owning its reading interface.
- Report presentation consumes validated analytics contracts. Calendar and selection scopes remain explicit domain facts; presentation changes do not rewrite stored observations or relabel UTC aggregates.
- Shared renderers own their complete markup and interaction states. Page callers supply domain data and intent rather than reproducing layout internals.

## Implementation checkpoint — November 15 UTC

Shared semantic inks, control boundaries, targets and focus geometry are implemented. Publication preparation owns stable section IDs, one reading outline, complete table frames and one provenance slot. Archives reuse the existing section-scoped search. About, Privacy, License, the lab, Article reach and the independent Stats report contexts consume the shared patterns. The newer search sessions, Agent access exploration and shared time kernel remain intact.

Workspace types, 471 site tests, 504 analytics tests, 35 Markdown validations and an isolated 46-article build pass. A separate comparison against the preceding built publication preserves all 46 article bodies, 124 tables and 2,703 cells, all 39 original privacy paragraphs and the complete archive chronology. Nine provenance pages now have one section each; the two custom explanations remain in HTML and Markdown. All 65 complete documents have unique IDs. These are local results, separate from deployment or current hosted behavior.

Responsive visual review covers the affected patterns at 1440px, 900px, 393px and 320px, in both themes. All 24 recorded views have no page overflow. Article reach preserves every displayed metric, table cell, source explanation and policy note across seven identical-fixture views, including alternate sorts and every history scope. Native search returns only the selected section without JavaScript. Table panning retains the first-column identity; contents links reach their headings; the wide reading rail remains visible during scrolling. Search restores focus on Escape, and phone menu/search/theme controls use 44px targets with working menu dismissal and scroll locking.

Review corrected a duplicated Agent access index, its unavailable-state destinations, the reading-rail wrapper and a sparse palette grid. Agent client/role intersections, empty results, controlled failure/retry and independent report selections retain their evidence boundaries. Calculation times preserve exact UTC instants while displaying local labels. The lab now reuses the same native section index; its first phone scene begins near 554px, retaining all four experiments and sixteen sliders. About uses four distinct project drawings and complete descriptions.

The final local checks also pass fifteen time-kernel tests, shared-time source-boundary enforcement, referral-policy and private-prompt guards. The built publication has eighteen canonical marked UTC instants after removing the four duplicated provenance instances. No analytics query, schema, observation, collection or identity contract changes. Delivery and fresh hosted acceptance are recorded separately below. Private screenshots and comparison captures remain outside Git.

## Delivery and fresh acceptance

Implementation `b30bf1ba` is integrated and published on main as `ed7c5965`. Cloudflare build `5139622a-92df-44ca-9295-2b905499fab2` is ready, with active version `4bf7b0fb` at 100% traffic. The [acceptance receipt](acceptance-2026-11-15.json) records all thirteen areas separately, ten ordinary public page responses and eight exact served asset matches.

Seven fresh live browser views confirm healthy reports, viewer-local daily labels and calculation times, retained native UTC instants, compact metrics, scoped search, sticky reading navigation and a single complete provenance section. Desktop and 320px/393px phone views have no page overflow; all sixteen Stats reading notes and seventeen method paragraphs remain. The browser viewport override and original theme are restored. Both isolated QA servers preserve their original forty-eight rows and are stopped. No required implementation or acceptance work remains.

## Sidebar utility follow-up

The separate [November 15 sidebar correction](sidebar-utilities-2026-11-15.md) unifies the icon controls and moves search beside Contents. It preserves the completed thirteen-area acceptance above and records its own delivery and current serving checks.

The [archive search correction](archive-search-removal-2026-11-15.md) removes the extra content forms from all three archives while preserving their topic links and article inventories. It supersedes the earlier inline archive-form presentation only.

## November 19 archive revision

Archive headers use a single collapsed topic index. Each article title links directly to the article, and article headers and listings omit visual tag rows. Topic metadata continues to supply the section index and search. This supersedes the earlier per-entry topic presentation.

On Engineering at 1280px, the topic block occupies 29px of height, down from 200px. Its disclosure target measures 152px wide, down from 728px. The first article title moves up 227px at a 390px viewport. Keyboard activation opens the full list of 66 section-scoped topics. Workspace types, the 48-article production build and all 471 blog tests passed.
