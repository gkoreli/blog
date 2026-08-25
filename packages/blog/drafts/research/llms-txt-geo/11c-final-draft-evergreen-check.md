# Final cold-reader and evergreen usefulness check

**Draft reviewed:** `packages/blog/drafts/019-does-llms-txt-work.md`  
**Review date:** 2026-08-25  
**Review posture:** cold technical reader arriving from search, not a collaborator familiar with the research  
**Overall verdict:** **conditional pass for publication**

The draft now does the job promised by its title and search-facing metadata. A reader can get a bounded answer in the first two paragraphs, make a build decision from the first table, understand what each artifact does, reproduce the delivery checks, and choose a measurement method without being told that `llms.txt` creates discovery or traffic. The live implementation gives the article first-party value that generic `llms.txt` explainers do not have.

There is one release blocker outside the argument: two evidence-ledger links point at currently untracked research files on the repository's `main` branch. They will be broken if the article is published before those artifacts are committed and reachable. There is also one small but real usability gap in the `curl` block: the negotiated-Markdown command prints the body but not the headers even though the next paragraph tells the reader to inspect `Content-Type` and `Vary`.

## Pass/fail summary

| Gate | Result | Cold-reader finding |
|---|---|---|
| Primary verdict: “Does `llms.txt` work?” | **Pass** | Lines 15–17 answer immediately: no demonstrated open-web ranking/citation lift; real but smaller utility for a client that already knows the site. |
| Build/no-build decision | **Pass** | Lines 21–28 give distinct advice for a personal blog, developer docs, a large/versioned corpus, and Google AI visibility. |
| Definition and artifact boundaries | **Pass** | Lines 30–40 distinguish proposal, `robots.txt`, sitemap, root map, page Markdown, and full dump without treating any one representation as universal. |
| Implementation guidance | **Pass with one P1 fix** | Canonical generation, HTML link relations, explicit `.md` paths, content negotiation, cache variation, and delivery checks are present. The third command does not expose the response headers it tells the reader to inspect. |
| Testing and analytics | **Pass** | The five-layer test ladder separates delivery, request, task, citation, and referral evidence. The first-party metric failure makes this section unusually useful. |
| Decision tables | **Pass** | The opening table answers “should I build it?”; the stage table answers “what does work mean?”; the closing artifact table answers “what should I keep investing in?” Each table makes a different decision. |
| FAQ coverage | **Pass** | The six questions cover rankings/AI Overviews, named clients, `robots.txt` and sitemap, full dumps, page Markdown, and proof of use. It functions as a useful search landing surface without repeating the article mechanically. |
| GEO boundary | **Pass** | The article defines GEO, explains that the cited experiments begin with supplied/fixed retrieval, and refuses to convert after-retrieval effects into discovery claims. |
| Search-facing promise | **Pass** | H1, `seoTitle`, description, and orientation sentence all match what the body delivers. None promises traffic, rankings, or citations. |
| First-party distinctiveness | **Pass** | The unusable `ai_fetches` metric, edge snapshot, live token comparison, and MCP reproduction are evidence that only this implementation can supply. |
| Internal continuity | **Pass** | The links to the eval-adoption article and map-first/codemap article are contextual and resolve to existing posts. |
| Evidence links at release | **Fail until release condition is met** | The `06-edge-baseline` and `08a-green-team-client-evidence` files are untracked locally while the article links to their future `main`-branch URLs. |

## Query-intent coverage

The article can honestly satisfy the following durable query families.

| Reader intent | Answer location | Result |
|---|---|---|
| “Does llms.txt work?” / “Is llms.txt worth it?” | Opening verdict; “Should you add”; stage verdict; FAQ | **Pass** |
| “Does llms.txt help SEO, Google AI Overviews, or AI citations?” | Opening; Google section; GEO section; FAQ | **Pass** |
| “What is llms.txt?” / “Is it a standard?” | “What llms.txt is—and what it is not” | **Pass** |
| “llms.txt vs robots.txt vs sitemap.xml” | Artifact distinctions; FAQ | **Pass** |
| “llms.txt vs llms-full.txt” | Artifact distinctions; client examples; artifact decision table; FAQ | **Pass** |
| “How do I implement and validate llms.txt?” | Minimal file, source-of-truth rule, link relations, `curl` block | **Pass with command fix** |
| “Do ChatGPT, Claude, Perplexity, or coding agents use llms.txt?” | Provider-role discussion; maintained client examples; FAQ | **Pass** |
| “How do I track AI crawlers or prove use?” | Analytics failure; edge evidence; six stages; test ladder; FAQ | **Pass** |
| “Should I serve Markdown to AI agents?” / content negotiation | Page-Markdown section; measured representation comparison; FAQ | **Pass** |
| “What is GEO, and what evidence supports it?” | Bounded GEO section and evidence ledger | **Pass** |

The draft does not need to broaden into a generic crawler-blocking guide, schema tutorial, or comprehensive SEO guide. Those adjacent intents would weaken the living center and attract readers whose task the article does not actually solve.

## Required before publication

### P0 — Make the companion evidence links real

Lines 326 and 330 link to:

- `packages/blog/drafts/research/llms-txt-geo/06-edge-baseline-2026-08-24.md`
- `packages/blog/drafts/research/llms-txt-geo/08a-green-team-client-evidence.md`

Both files are currently untracked, while their public links assume they already exist on `main`. Publish them in the same release, replace the links with stable public artifacts, or remove those two external-facing links. A cold reader should never meet a 404 where the article promises the reproducible first-party evidence behind its strongest claims.

**Decision threshold:** do not publish the article with either link unresolved. After the release commit is reachable, request both URLs and require an HTTP 200 before considering this gate passed.

### P1 — Make the negotiated-Markdown command inspect what the prose names

The first two commands display headers and discard the body. The third command does the reverse:

```bash
curl -sS -H 'Accept: text/markdown' https://example.com/article
```

That is useful for viewing Markdown, but it cannot verify the `Content-Type` or `Vary: Accept` behavior named immediately afterward. The smallest correction is to make the header inspection explicit, for example:

```bash
curl -sS -D - -H 'Accept: text/markdown' https://example.com/article -o /dev/null
```

If redirect completion is part of the advertised check, add `-L` consistently or tell the reader that the first response is intentionally being inspected. Do not add a large implementation tutorial; one corrected command and one sentence are enough.

**Decision threshold:** a reader copying each command should be able to observe every response property the next paragraph tells them to check.

## Recommended but non-blocking

### P2 — Preserve the qualifier beside the 67.8% result

The measured reduction is a strong extraction/share point. Its protection is the next paragraph: one page, one tokenizer, representation result rather than task result. Keep those qualifications immediately adjacent in any later edit or excerpt. Do not turn the number into “Markdown makes agents 68% more efficient.”

### P2 — Keep provider statements dated

The article already states an evidence date near the opening and separates volatile provider behavior from stable measurement boundaries in the ledger. That is enough. On meaningful updates, re-check the provider documentation and maintained client code; do not bump the date for metadata-only edits.

### P2 — Validate the minimal example during the same build/release check

The sample advertises `/the-agentic-product-engineer.md` and `/posts.json`, and the prose advertises the live `/llms.txt`. The article says advertised URLs should be build-validated. The release check should exercise those actual URLs, not only the `example.com` placeholders shown to readers.

## What should not be added

- Do not add an acquisition forecast, traffic promise, or “GEO checklist.” The draft's value is that it refuses those unsupported conversions.
- Do not add more client names merely to look comprehensive. The current maintained examples already demonstrate index-first, dump-first, and version-local/fallback patterns.
- Do not collapse crawler requests, model use, citations, and referrals into one dashboard metric. Their separation is the article's most reusable contribution.
- Do not replace the first-person failure with a generic implementation tutorial. The broken metric is the evidence that earns the recommendations.
- Do not weaken the opening verdict with vague “it depends” language. The article already explains exactly what depends on the stage.

## Final acquisition and trust judgment

This is a durable acquisition asset because it answers a stable decision, not because it tries to capture every acronym. Its best-fit reader arrives asking whether `llms.txt` works, learns that “works” contains six different events, and leaves with a smaller implementation and an honest test plan. That reader is relevant to this blog's actual subject: engineers building and measuring agent-facing systems.

The article makes no misleading traffic-facing promise. Its search title says it will explain what works, what does not, and how to test; the body does all three. The description asks whether `llms.txt` improves AI search rather than claiming that it does. The only publication conditions are operational accuracy: make the research links resolvable and make the negotiated-response command show the headers the prose asks readers to inspect.

**Final gate:** **pass once P0 is resolved; strongly recommend completing P1 in the same edit.**
