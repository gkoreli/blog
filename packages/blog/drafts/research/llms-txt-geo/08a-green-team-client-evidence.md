# Green team: where agent-readable web surfaces create real value

**Status:** Constructive evidence audit. Not article prose.
**Checked:** 2026-08-25
**Question:** What is the strongest current case that an `llms.txt` index, page-level Markdown, a full dump, link relations, or adjacent agent-readable conventions help a real client do useful work?

This report deliberately builds the best viable positive case. It does not ask whether `llms.txt` raises organic AI-search visibility. It asks which clients consume these surfaces now, what job they do, how the path can be reproduced, and what must ship next for the useful cases to spread.

## Verdict

The strongest positive case is not crawler discovery. It is a controlled documentation workflow:

1. a user, project skill, or MCP server points an agent at a small index;
2. the agent chooses one relevant page instead of guessing routes or crawling a site;
3. the server returns clean Markdown, either at a stable Markdown URL or through HTTP content negotiation;
4. the agent spends its context on the page rather than navigation and presentation markup.

That path exists today. It appears in maintained first-party Google, tldraw, Streamlit, Prismatic, Cloudflare, Checkly, and LangChain code or documentation. Two small controlled studies also report large cost reductions once the agent actually uses the machine-readable layer. The local reproduction in this audit used LangChain's `mcpdoc` client to fetch gkoreli.com's live `llms.txt` and then a linked post Markdown endpoint.

The constructive claim is therefore falsifiable and bounded:

> An agent-readable index plus clean page representations can reduce navigation mistakes and input cost when the agent is explicitly configured to use them. The current missing link is automatic client adoption, not the ability of the format to carry useful context.

This case does **not** transfer to organic search ranking. No constructive evidence reviewed here shows that publishing these resources by itself increases open-web retrieval or citations.

## Artifact and repository baselines

| Project | Baseline | Checked state | Why it matters |
|---|---|---|---|
| llms.txt proposal | [`AnswerDotAI/llms-txt@a7cd84f`](https://github.com/AnswerDotAI/llms-txt/tree/a7cd84fd366b52a29aeb54a8d5fb74aa5d3f6cc2) | `main`, 2026-08-10 revision | Defines the small index, page Markdown, scoped indexes, and v2 link relations. |
| Google Gemini skills | [`google-gemini/gemini-skills@b40dd8d`](https://github.com/google-gemini/gemini-skills/tree/b40dd8d9c771ba6e84c0ff6502875e3f42b4ec14) | `main` on 2026-08-25 | First-party agent instructions that consume an index and individual Markdown pages. |
| LangChain `mcpdoc` | [`langchain-ai/mcpdoc@8d01c08`](https://github.com/langchain-ai/mcpdoc/tree/8d01c08598e3f19fd6318bded3ffdcda85db03a4) | `main`; commit dated 2026-08-20 | A real MCP client that turns user-selected `llms.txt` sources into auditable agent tools. |
| tldraw | [`tldraw/tldraw@2db958f`](https://github.com/tldraw/tldraw/tree/2db958ff2e5cf3ab5221ba3a613ff1d69e382e0c) | `main` on 2026-08-25 | A first-party migration skill that downloads, caches, and searches `llms-full.txt`. |
| Streamlit agent skills | [`streamlit/agent-skills@c69a265`](https://github.com/streamlit/agent-skills/tree/c69a265613f17cdd69d42e6f67b704214178fae5) | `main` on 2026-08-25 | A maintained fallback from packaged skills to the hosted full documentation dump. |
| Prismatic skills | [`prismatic-io/prismatic-skills@b28d169`](https://github.com/prismatic-io/prismatic-skills/tree/b28d1699882c5a457a12a904b63c162c881192a8) | `main`; commit dated 2026-08-24 | A first-party index-to-`.md` workflow with executable eval assertions. |
| Browserbase skills | [`browserbase/skills@d15a21f`](https://github.com/browserbase/skills/tree/d15a21ffde5a020feb39393603089f3824389eba) | `main`; commit dated 2026-08-18 | A trace-based agent-DX audit that records when `llms.txt` supplies later URLs. |
| a14y | [`timothyjordan/a14y@07ef2bb`](https://github.com/timothyjordan/a14y/tree/07ef2bbb8593dd90d698246ee3a83f1466446a6b) | `main`; commit dated 2026-08-04 | Source project for two small controlled agent-readability benchmarks. |

## Keep the surfaces separate

| Surface | Present job | Client that uses it | Constructive evidence | What it does not establish |
|---|---|---|---|---|
| Small `llms.txt` index | A curated map from a known site or product to relevant pages | Google Gemini skills, Prismatic skill, LangChain `mcpdoc` | Code-inspected and locally reproduced | Default probing, search ranking, or citation lift |
| Page-level Markdown | A low-noise representation of one selected page | Google skills fetch `.md.txt`; Prismatic fetches `.md`; Claude Code, Cursor, and OpenCode request Markdown through `Accept` in a first-hand client test | Code-inspected, reported, and locally reproduced | That Markdown makes a page enter a search candidate set |
| Full dump | A locally cacheable corpus for grep and fixed-scope lookup | tldraw migration skill; Streamlit fallback | Code-inspected and endpoint fetch reproduced | That one giant file scales across large or unrelated sites |
| HTTP content negotiation | The same canonical URL returns HTML to browsers and Markdown to capable agents | Claude Code, Cursor, OpenCode in Checkly's header test; Cloudflare and Vercel serve it | First-hand reported client test and response reproduced | Universal client support |
| `rel="alternate"` / `rel="describedby"` | A page declares its Markdown twin and covering index | No consuming client found in this audit | Proposed by v2; ordinary HTTP link machinery is deployable | That current mainstream agents follow the relations |
| Agent skill / project instruction | Supplies the missing instruction to start from the index or Markdown source | Google, tldraw, Streamlit, Prismatic | Code-inspected | Unprompted open-web adoption |
| MCP documentation server | Makes the index workflow explicit, allowlisted, and inspectable | LangChain `mcpdoc` with Cursor, Windsurf, Claude Desktop, or Claude Code as hosts | Code-inspected and local tool calls reproduced | Organic discovery without user configuration |

## Claim table

| Claim | Client or workflow | Evidence state | Strongest source or test | Inference | Falsifier |
|---|---|---|---|---|---|
| A maintained Google agent skill tells the agent to fetch an `llms.txt` index, choose a relevant `.md.txt` page, and fetch that page when its preferred docs MCP is absent. | Coding agent working on Gemini API or Live API code | **Code-inspected** | [Pinned Gemini API skill](https://github.com/google-gemini/gemini-skills/blob/b40dd8d9c771ba6e84c0ff6502875e3f42b4ec14/skills/gemini-api-dev/SKILL.md) and [pinned Live API skill](https://github.com/google-gemini/gemini-skills/blob/b40dd8d9c771ba6e84c0ff6502875e3f42b4ec14/skills/gemini-live-api-dev/SKILL.md#L289-L323) | The small index is a working fallback protocol inside a real first-party skill, not only a file Google happens to publish. | Remove the workflow from the maintained skill, or show that supported harnesses cannot execute its two fetches. |
| Google's live index resolves a broad topic to a clean page without route guessing. | Any user-directed fetch client | **Reproduced** | On 2026-08-25, `https://ai.google.dev/gemini-api/docs/llms.txt` was 28,526 bytes / 182 lines; it listed `function-calling.md.txt`, which returned 52,616 bytes and opened with the expected Function Calling definition. | An index can be a compact route table even when the chosen page is larger than the index. | A frozen task set finds no reduction in 404s, fetches, time, or incorrect page selection versus ordinary navigation. |
| A current open-source MCP server turns configured `llms.txt` files into `list_doc_sources` and `fetch_docs` tools for agent hosts. | Cursor, Windsurf, Claude Desktop, Claude Code, or another MCP host | **Code-inspected; reproduced locally** | [`mcpdoc/main.py`](https://github.com/langchain-ai/mcpdoc/blob/8d01c08598e3f19fd6318bded3ffdcda85db03a4/mcpdoc/main.py) and [README client setup](https://github.com/langchain-ai/mcpdoc/blob/8d01c08598e3f19fd6318bded3ffdcda85db03a4/README.md) | `llms.txt` can serve as a portable source manifest across hosts instead of requiring a docs-specific integration for each one. | The tool cannot fetch a valid index and child page, or hosts routinely ignore the exposed workflow despite explicit server instructions. |
| gkoreli.com's current index and page Markdown are already consumable through that client. | Locally instantiated `mcpdoc` server | **Reproduced** | With `mcpdoc==0.0.10` and `mcp<2`, `list_doc_sources` returned gkoreli.com; `fetch_docs` returned 7,172 characters from `/llms.txt` and 10,652 characters from `/the-agentic-product-engineer.md`; an off-domain request was refused. | The blog has a working user-directed agent access path today even though its own traffic metric did not measure it. | Repeat against a clean environment and fail to retrieve or preserve the linked Markdown content. |
| An official tldraw skill fetches `llms-full.txt`, caches it for 30 days, and tells the agent to grep it only when the migration needs a specific API pattern. | Coding agent migrating a tldraw project | **Code-inspected; endpoint fetch reproduced** | [`tldraw-migrate/SKILL.md` lines 18–30](https://github.com/tldraw/tldraw/blob/2db958ff2e5cf3ab5221ba3a613ff1d69e382e0c/skills/tldraw-migrate/SKILL.md#L18-L30) and [lookup instruction](https://github.com/tldraw/tldraw/blob/2db958ff2e5cf3ab5221ba3a613ff1d69e382e0c/skills/tldraw-migrate/SKILL.md#L162-L173) | A full dump has a real job when the agent needs repeated, local, version-adjacent symbol lookup and the skill prevents eager ingestion. | Targeted page retrieval matches or beats the cached dump on the same migrations with lower download and staleness cost. |
| Streamlit keeps a hosted full dump as a fallback when its preferred packaged agent skills are unavailable or old. | Coding agent in a Streamlit project | **Code-inspected** | [`streamlit/agent-skills/AGENTS.md` lines 17–36](https://github.com/streamlit/agent-skills/blob/c69a265613f17cdd69d42e6f67b704214178fae5/AGENTS.md#L17-L36) | A full dump is useful as a compatibility layer across package generations, not only as a primary docs interface. | The fallback disappears, is never invoked, or produces stale guidance in a version-controlled task test. |
| Prismatic's official skill requires an index-first, page-Markdown-second workflow and forbids the oversized full dump. | Agent answering Prismatic product questions | **Code-inspected; eval configured** | [Pinned skill](https://github.com/prismatic-io/prismatic-skills/blob/b28d1699882c5a457a12a904b63c162c881192a8/plugin/skills/prismatic-docs/SKILL.md) and [config-pages eval](https://github.com/prismatic-io/prismatic-skills/blob/b28d1699882c5a457a12a904b63c162c881192a8/evals/cases/prismatic-docs/config-pages.ts) | Product teams are beginning to test the exact chain—index, `.md` fetch, accurate answer, human-readable citation—as agent behavior. | Published eval runs fail to fetch `.md`, invent features, or do no better than search-first baselines. |
| Three of seven tested coding-agent fetch tools asked for Markdown with the HTTP `Accept` header in February 2026. | Claude Code 2.1.38, Cursor 2.4.28, OpenCode 1.2.5 | **Reported, first-hand protocol test** | [Checkly's httpbin header test](https://www.checklyhq.com/blog/state-of-ai-agent-content-negotation/) | Page-level Markdown is already automatically selected by some clients without a site-specific URL rule. | Repeat with the current versions and observe that none sends or honors `Accept: text/markdown`. |
| Clean Markdown materially cuts the representation cost of real pages. | Any client that fetches or negotiates Markdown | **Reproduced** | On 2026-08-25, gkoreli.com's selected post measured 7,683 `cl100k_base` tokens as HTML versus 2,476 as its `.md` endpoint, a 67.8% reduction. The Cloudflare test page measured 64,821 tokens as HTML versus 3,791 as negotiated Markdown, a 94.2% reduction; Cloudflare's response itself reported 46,485 original and 4,289 Markdown tokens. | The representation can create a large, immediate input-budget benefit even before measuring answer quality. | A representative task set shows equal total agent tokens because later retries or lost context erase the body-size savings. |
| A small controlled benchmark found that explicitly telling the agent to start from `llms.txt` cut tokens by 33% on the same page while preserving or improving judged answer quality. | Claude Code 2.1.141 in isolated Docker | **Reported, first-party benchmark** | [a14y `llms-txt-linking-2026-06-27`](https://a14y.dev/research/llms-txt-linking/) | The value becomes available as soon as the agent's instruction layer knows about the index. | A preregistered replication across sites, tasks, and agents finds no cost or quality advantage. |
| Cloudflare reports that a hierarchical index-to-Markdown design beat other large technical docs sets by 31% in tokens and 66% in time on its test. | Kimi-k2.5 through OpenCode, explicitly pointed at docs indexes | **Reported, first-party benchmark** | [Cloudflare Agent Readiness, benchmark section](https://blog.cloudflare.com/agent-readiness/#benchmark-results-faster-and-cheaper) | Scoped indexes may matter more than one enormous root file because they let a client pick the next page in one pass. | Release the prompt and comparison corpus; a matched reproduction removes or reverses the advantage. |
| Browserbase's maintained agent-experience audit distinguishes guessed URLs from URLs found in `llms.txt` and says to credit the index when it recovers after guessed 404s. | Multi-agent documentation audit | **Code-inspected; evaluation mechanism enabled** | [`agent-experience/SKILL.md`](https://github.com/browserbase/skills/blob/d15a21ffde5a020feb39393603089f3824389eba/skills/agent-experience/SKILL.md) | Tool traces can now measure the index's actual navigation contribution rather than infer it from publication. | Real audits record no `FROM LLMS.TXT` transitions or no reduction in failed guesses when the file exists. |
| V2 link relations create a technically simple way for a client that has already fetched a page to locate the Markdown representation and applicable index. | Future browser or fetch client | **Proposed; no consuming client found** | [Pinned v2 proposal](https://github.com/AnswerDotAI/llms-txt/blob/a7cd84fd366b52a29aeb54a8d5fb74aa5d3f6cc2/nbs/index.qmd) and [live proposal](https://llmstxt.org/) | The mechanism could remove the need for URL guessing because it reuses standard HTTP links instead of inventing a new parser channel. | A mainstream client implements the resolver and still never follows either relation in controlled navigation tasks. |

## Strongest client evidence

### 1. Google uses the index as a fallback routing layer

The clearest first-party example is not a search crawler. It is a Google-maintained agent skill.

Both the general Gemini API skill and the Live API skill establish this order:

1. use Google's docs MCP when `search_docs` is installed;
2. otherwise fetch the Gemini `llms.txt` index;
3. select a page from the `.md.txt` links;
4. fetch only that page.

This hierarchy matters. Google does not present `llms.txt` as its most capable interface. It presents it as a portable fallback when the richer search tool is absent. That is a credible place for a simple open file: below product-specific retrieval, above route guessing and broad browsing.

The workflow is reproducible with ordinary HTTP. On the check date, the index listed two Function Calling entries and the selected page returned clean source text. The index supplied the exact `.md.txt` path, so the client did not need to infer Google's route convention.

**Implication for the article:** “Google Search ignores it” and “a Google coding skill consumes it” can both be true. They refer to different clients and jobs.

### 2. `mcpdoc` turns the convention into an inspectable agent tool

LangChain's `mcpdoc` is the strongest generic client found. The user supplies one or more indexes. The MCP server exposes two tools:

- `list_doc_sources`, which names the configured indexes;
- `fetch_docs`, whose description instructs the model to fetch the index, inspect its URLs, and then fetch the relevant page.

The implementation also derives an allowlist from the index's origin. A configured gkoreli.com source could fetch the live index and article Markdown, while an `example.com` request was rejected. This makes the workflow auditable and bounds where a publisher-controlled index can send the agent by default.

The local reproduction was:

```sh
uv run --with 'mcpdoc==0.0.10' --with 'mcp<2' python - <<'PY'
import asyncio
from mcpdoc.main import create_server

async def main():
    server = create_server([
        {"name": "gkoreli", "llms_txt": "https://gkoreli.com/llms.txt"}
    ])
    print([tool.name for tool in await server.list_tools()])

    for url in [
        "https://gkoreli.com/llms.txt",
        "https://gkoreli.com/the-agentic-product-engineer.md",
        "https://example.com/",
    ]:
        _, structured = await server.call_tool("fetch_docs", {"url": url})
        content = structured["result"]
        print(url, len(content), content[:80].replace("\n", " | "))

asyncio.run(main())
PY
```

The server exposed both tools and returned the blog's current content. One maintenance caveat surfaced: a clean `uvx --from mcpdoc==0.0.10 mcpdoc --version` resolved MCP 2.x and failed because `mcp.server.fastmcp` moved or disappeared. Adding `mcp<2` made the current release work. The client path is real, but its declared dependency range needs an upper bound or MCP 2 migration.

**Implication for the article:** A site owner does not need a private integration to make an index useful. A reader can configure an existing cross-host client. The adoption step still belongs to the user or project, not the publisher alone.

### 3. Official skills make consumption deterministic

The positive pattern repeats across product-maintained skills:

- [tldraw's migration skill](https://github.com/tldraw/tldraw/blob/2db958ff2e5cf3ab5221ba3a613ff1d69e382e0c/skills/tldraw-migrate/SKILL.md#L18-L30) executes `curl https://tldraw.dev/llms-full.txt`, caches the result for 30 days, and tells the agent to grep it for a specific API only when needed.
- [Streamlit's meta-skill](https://github.com/streamlit/agent-skills/blob/c69a265613f17cdd69d42e6f67b704214178fae5/AGENTS.md#L17-L36) falls back to its hosted full dump when bundled package skills are unavailable or predate the new structure.
- [Prismatic's docs skill](https://github.com/prismatic-io/prismatic-skills/blob/b28d1699882c5a457a12a904b63c162c881192a8/plugin/skills/prismatic-docs/SKILL.md) takes the opposite size strategy: fetch the small index, locate the exact `.md` URL, and never use the full dump because it exceeds 10 MB and times out.

These are not competing verdicts. They reveal the decision boundary:

| Corpus shape | Useful client strategy |
|---|---|
| A bounded SDK corpus used repeatedly during one migration | Cache a full dump, then grep narrow ranges. |
| A large product-docs tree with more than 200 pages | Read a small semantic index, then fetch one page. |
| A package with version-matched bundled skills | Prefer the local package context; keep the hosted dump as a fallback. |

The value comes from choosing the representation for the job, not from treating every `llms-*` file as equally good.

## Page-level Markdown has the broadest constructive case

The positive evidence for clean Markdown is stronger than the evidence for the index filename.

### Real clients already negotiate it

Checkly sent each coding agent's native fetch tool to `httpbin.org/headers`. In that February 2026 snapshot:

- Claude Code 2.1.38 sent `Accept: text/markdown, text/html, */*`;
- Cursor 2.4.28 ranked `text/markdown` first;
- OpenCode 1.2.5 assigned Markdown the highest quality weight;
- Codex, Gemini CLI, GitHub Copilot, and Windsurf did not prefer Markdown in that test.

That is direct client behavior, not a publisher assumption. It also gives a clean falsifier: rerun the same httpbin test with current clients.

### Major serving layers now implement it

Cloudflare's [Markdown for Agents](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/) converts opted-in HTML responses at the edge when a client requests `text/markdown`. It sets `Content-Type`, adds `Vary: Accept`, preserves security and cache headers, and returns token-count headers. Vercel's [documentation implementation](https://vercel.com/blog/making-agent-friendly-pages-with-content-negotiation) does the same through application rewrites and shared content.

This matters because it removes site-specific `.md` guessing for clients that already negotiate. The canonical human URL becomes the agent URL too.

### The local byte and token difference is large

The audit fetched the same gkoreli.com post as HTML and Markdown and encoded both with `cl100k_base`:

| Representation | Bytes | Tokens | Change from HTML |
|---|---:|---:|---:|
| `/the-agentic-product-engineer` | 27,554 | 7,683 | baseline |
| `/the-agentic-product-engineer.md` | 10,756 | 2,476 | −67.8% tokens |

The same check against Cloudflare's Markdown-for-Agents page produced:

| Representation | Bytes | Tokens | Change from HTML |
|---|---:|---:|---:|
| HTML | 186,385 | 64,821 | baseline |
| Negotiated Markdown | 17,190 | 3,791 | −94.2% tokens |

The exact percentages should not become a universal marketing number. They prove a simpler fact: for these two real pages, the clean representation was much smaller before the agent reasoned about anything.

The open test is whether total task cost falls by the same amount after navigation, follow-up fetches, and answer validation. That is what the planned blog benchmark should measure.

## Controlled evidence of task-level value

### a14y: the prompt activates the layer

The a14y linking benchmark ran five arms with five repetitions each against identical content. The page-side signals did not trigger use. One prompt line—`check /llms.txt first`—did:

- index fetches moved from 0/5 to 5/5;
- mean tokens fell from 266,591 in the no-link control to 177,735, a 33% reduction;
- the nudge arm passed 5/5 and had the highest reported judge mean, 88.8;
- the agent made more HTTP requests but chose lean `.md` pages, so total tokens still fell.

The earlier a14y study changed five discovery files as a bundle, not `llms.txt` alone. It reported 123K versus 240K mean tokens, 9.7 versus 20 tool calls, and tied answer quality across three runs per condition. Treat that result as evidence for an agent-readable discovery layer, not an isolated estimate for the index.

Both studies are small, use one site and one agent family, and come from a project that sells an agent-readiness score. Their value is methodological: they publish the prompt, conditions, per-run data, judge summaries, and a mechanism that another team can challenge.

### Cloudflare: hierarchy matters on a large corpus

Cloudflare describes a different test. It split more than 5,000 documentation pages into product-level indexes, pointed Kimi-k2.5 through OpenCode at those indexes, and asked specific technical questions. It reports 31% fewer tokens and answers 66% faster than the average comparison site.

Cloudflare has not published enough detail in the cited post to treat this as an independently reproducible effect size. The useful design clue is the client path:

```text
root index
  → product index that fits in context
    → one described /index.md page
      → answer
```

That path avoids the full-dump grep loop Cloudflare observed on other large docs sets. It is a concrete positive theory for scoped `llms.txt` files: they let an agent narrow a large corpus before it spends tokens on page content.

## Link relations: the promising mechanism that still lacks a client

The August 2026 proposal adds two relations:

- `rel="alternate" type="text/markdown"` points to a page's Markdown representation;
- `rel="describedby"` points to the `llms.txt` that covers the page's path.

They can be emitted in HTML or an HTTP `Link` header. The design is constructive for three reasons:

1. it reuses generic Web linking instead of asking every client to hard-code `/llms.txt` and `.md` suffixes;
2. the header form works for non-HTML responses and can be added at a CDN;
3. path-scoped indexes let a large site delegate ownership by documentation subtree.

No code-inspected mainstream client in this audit parsed those relations for this purpose. That missing consumer is exact and small. A fetch layer needs to:

1. inspect the response `Link` header and HTML `<link>` elements;
2. prefer a `text/markdown` alternate when the task needs page text;
3. treat `describedby` as untrusted publisher data, fetch it within the current origin or an explicit allowlist, and expose the transition in the trace;
4. fall back to the HTML representation if the Markdown fetch fails or loses needed content.

Browserbase's [agent-experience skill](https://github.com/browserbase/skills/blob/d15a21ffde5a020feb39393603089f3824389eba/skills/agent-experience/SKILL.md) supplies a useful evaluation model for step three: label every page request by provenance—training prior, prior page, `llms.txt`, or guessed 404—and credit the index only when the trace shows that it supplied the route.

### Adoption test for the v2 relations

Do not infer success from the links appearing in page source. Test:

- 20 frozen tasks across at least four differently structured sites;
- client with resolver disabled versus enabled;
- same model, tool budget, and page corpus;
- pass marks: fewer guessed 404s, no loss in answer accuracy, lower median input tokens, and a trace showing the relation caused the transition;
- security check: an off-origin or instruction-shaped target does not bypass the client's trust rules.

If the resolver produces no navigation or cost improvement, the relation remains tidy metadata rather than useful infrastructure.

## Adjacent conventions that make the positive path more likely

### Agent Skills supply the missing instruction

The a14y benchmark and current client code point to the same bottleneck: the file creates value after an instruction activates it.

Agent Skills are the nearest adoption path because they can encode that instruction once per product. Google's skills already do this for the small index; tldraw does it for the full dump; Prismatic specifies and evaluates an index-to-page chain. A skill can also choose a richer MCP search tool first and keep `llms.txt` as a portable fallback.

This is more flexible than expecting every general browser to probe every site. The publisher controls the documentation and the skill; the user chooses to install it; the harness already knows how to load it.

### HTTP content negotiation removes URL conventions

`Accept: text/markdown` is a standard request preference. It works at the representation layer, below any specific agent framework. Three tested clients already send it, and Cloudflare and Vercel already serve it. Its near-future path requires less coordination than v2:

```text
client prefers Markdown
  → ordinary canonical URL
    → CDN or origin returns Markdown with Vary: Accept
```

The exact missing links are broader client support, correct cache variation, and equivalence tests that ensure interactive or structured content does not disappear in conversion.

### MCP gives the publisher a richer optional layer

An index works for static navigation. Search over a large or fast-changing corpus can do better through a docs MCP server. The constructive architecture is layered:

```text
docs MCP/search tool when configured
  → llms.txt + targeted Markdown as portable fallback
    → normal HTML browsing as universal fallback
```

Google's skill already encodes this order. The format does not have to defeat MCP to matter; it can be the lowest common denominator beneath it.

## Practical decision by goal

| Goal | Keep or add | Why the positive evidence supports it | Measurement |
|---|---|---|---|
| Help a configurable coding agent use product docs | Small, described index plus page Markdown; add a skill that names the index | This is the best-supported current use case | Task accuracy, guessed 404s, fetched bytes, input tokens, elapsed time |
| Support repeated lookup in one bounded SDK corpus | A versioned or regularly refreshed full dump, cached locally and grepped lazily | tldraw demonstrates this workflow | Cache hit rate, staleness errors, lookup time versus targeted fetch |
| Support many agent fetch clients from canonical URLs | `Accept: text/markdown`, `Vary: Accept`, and a `.md` fallback | Some real clients already negotiate; serving support is mature | Negotiated response share, token reduction, content-equivalence failures |
| Let a reached page advertise its agent forms | Add v2 alternate/describedby relations after the files exist | Cheap, coherent future path | Relation-follow traces; do not count presence as use |
| Improve organic AI-search visibility | Do not assign this job to these files | No constructive client evidence reviewed here supports it | Provider-specific indexing and citation telemetry |
| Make a personal blog available to readers' agents | Keep generated index and Markdown; publish a short “use this blog with your agent” workflow or skill only if readers need it | Existing clients can consume the blog now; marginal generation cost is low | Direct static fetch logs plus reader-reported tasks, not a browser beacon called “AI Reads” |

## What should change in the planned gkoreli.com benchmark

The existing E2 benchmark should test a constructive hypothesis rather than only ask whether Markdown beats HTML in the abstract.

### Conditions

1. **HTML navigation:** give the agent only the site root and normal web fetch.
2. **Configured index:** give the same agent one instruction to start from `/llms.txt`, then allow linked page fetches.
3. **Generic MCP client:** expose the same index through `mcpdoc`, recording tool calls.
4. **Full dump:** supply `llms-full.txt` but require local search before reading ranges.

### Scores

- factual answer accuracy against the frozen answer key;
- correct source and claim coverage;
- citation URL correctness;
- total input tokens, fetched bytes, elapsed time, and tool calls;
- guessed or failed routes;
- whether the answer relied on stale or irrelevant material;
- request provenance: supplied root, index, prior page, guessed URL, or full-dump search.

### Green-team pass marks

Pre-register at least one useful threshold rather than demand victory everywhere:

- configured index or MCP reduces median failed/guessed routes by at least 50%; **or**
- it reduces median input tokens by at least 25% with no more than a two-point accuracy loss; **or**
- it improves source coverage by at least one required source on questions that span posts.

For the full dump, require a win on multi-post synthesis without a material staleness or token penalty. For single-page lookup, expect the targeted Markdown condition to win.

### What would make us remove an artifact

- Remove or stop advertising the full dump if targeted retrieval matches it on every task and the dump creates update or context cost.
- Keep the index but stop investing in prose curation if descriptions do not change selection accuracy versus titles and URLs alone.
- Skip v2 link relations beyond a cheap implementation if no tested client follows them after a reasonable observation window.
- Keep page Markdown as long as it stays generated from the canonical source and demonstrates a material representation-cost reduction.

## Constructive theory map

| Theory | Evidence for | Evidence against or gap | Direction state | What would disprove it |
|---|---|---|---|---|
| A small semantic index is a useful lowest-common-denominator docs API. | Google skills, Prismatic skill, `mcpdoc`, a14y nudge result | Requires explicit client or instruction; no default adoption denominator | **Enabled and used in bounded workflows** | Multi-client task tests show no navigation or cost benefit over normal docs browsing. |
| Page-level Markdown is the durable value, even if `llms.txt` is replaced. | Automatic `Accept` behavior in three clients, Google/Prismatic page fetches, large reproduced token reductions | Conversion can omit interactive state; not every agent negotiates | **Shipped and increasingly consumed** | End-to-end tasks erase the cost benefit or produce worse factual answers because content is lost. |
| Full dumps are valuable for bounded, repeated local lookup. | tldraw cache-and-grep workflow; Streamlit fallback | Dumps grow, stale, and exceed context; Prismatic explicitly rejects its 10 MB dump | **Shipped, niche** | Targeted Markdown or docs search consistently beats the dump on migration and cross-reference tasks. |
| Link relations can make the machine-readable layer self-discovering after page retrieval. | Standard link mechanism; simple CDN deployment; clear scoping rule | No consuming client found; page-link tests from a14y did not activate Claude in its snapshot | **Proposed** | A conforming resolver adds no measurable transition, cost, or accuracy benefit. |
| Skills and MCP are the adoption bridge. | Current official skills and `mcpdoc` already encode the missing instruction | Installation remains user- or project-directed; ecosystems may converge elsewhere | **Shipped and expanding** | Maintainers remove the index paths in favor of package-local context or search tools with no fallback demand. |

## The strongest positive case for the article

The article should not merely soften the red-team verdict. It should name the useful system that remains:

> `llms.txt` is valuable when it behaves like a manifest in a workflow you control. The index narrows the site, page Markdown narrows the bytes, and a skill or MCP tool tells the agent when to use both. That is already enough to help coding and documentation agents. It is a different product from organic AI search.

This position is more flexible than “keep it because it is cheap.” It gives every artifact a job, a client, and a removal test.

The green-team movement for Goga's own story is also stronger:

1. We built an “AI-readable” stack with an overstated discovery story.
2. The audit removed the search promise.
3. A second audit found that the stack is not empty: an existing MCP client can consume the live blog today, and its page Markdown cuts the selected article's representation tokens by roughly two-thirds.
4. The new question becomes whether any reader or agent has a task that benefits from that path—and whether we can measure the task without pretending it is organic search.

That is adaptation, not retreat.

## Sources and rationale

| Source | Evidence state | Why it is here |
|---|---|---|
| [llms.txt proposal at baseline](https://github.com/AnswerDotAI/llms-txt/tree/a7cd84fd366b52a29aeb54a8d5fb74aa5d3f6cc2) | Proposed format | Defines each artifact and the new link mechanism; it does not prove adoption. |
| [Google Gemini API skill at baseline](https://github.com/google-gemini/gemini-skills/blob/b40dd8d9c771ba6e84c0ff6502875e3f42b4ec14/skills/gemini-api-dev/SKILL.md) | Code-inspected | Strongest first-party small-index plus page-Markdown client workflow. |
| [Google Gemini Live API skill at baseline](https://github.com/google-gemini/gemini-skills/blob/b40dd8d9c771ba6e84c0ff6502875e3f42b4ec14/skills/gemini-live-api-dev/SKILL.md#L289-L323) | Code-inspected | Confirms the pattern exists in more than one maintained Google skill. |
| [LangChain `mcpdoc` at baseline](https://github.com/langchain-ai/mcpdoc/tree/8d01c08598e3f19fd6318bded3ffdcda85db03a4) | Code-inspected and locally reproduced | Generic client that converts configured indexes into allowlisted, auditable MCP tools. |
| [tldraw migration skill at baseline](https://github.com/tldraw/tldraw/blob/2db958ff2e5cf3ab5221ba3a613ff1d69e382e0c/skills/tldraw-migrate/SKILL.md#L18-L30) | Code-inspected and endpoint reproduced | Strongest full-dump client: download, cache, grep, and use during a real migration. |
| [Streamlit agent-skills instructions](https://github.com/streamlit/agent-skills/blob/c69a265613f17cdd69d42e6f67b704214178fae5/AGENTS.md#L17-L36) | Code-inspected | Shows a full dump serving as a compatibility fallback beneath package-local skills. |
| [Prismatic docs skill](https://github.com/prismatic-io/prismatic-skills/blob/b28d1699882c5a457a12a904b63c162c881192a8/plugin/skills/prismatic-docs/SKILL.md) and [eval case](https://github.com/prismatic-io/prismatic-skills/blob/b28d1699882c5a457a12a904b63c162c881192a8/evals/cases/prismatic-docs/config-pages.ts) | Code-inspected; eval configured | Defines and tests the small-index-to-targeted-Markdown path while rejecting an oversized full dump. |
| [Browserbase agent-experience skill](https://github.com/browserbase/skills/blob/d15a21ffde5a020feb39393603089f3824389eba/skills/agent-experience/SKILL.md) | Code-inspected | Supplies a trace vocabulary that can attribute a page choice to the index instead of guessing. |
| [Checkly content-negotiation client test](https://www.checklyhq.com/blog/state-of-ai-agent-content-negotation/) | First-hand reported protocol test | Direct evidence that three named coding-agent clients requested Markdown in a frozen version snapshot. |
| [Cloudflare Markdown for Agents](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/) | First-party shipped product; response reproduced | Shows mature, standards-based Markdown serving and exposes token counts for measurement. |
| [Cloudflare Agent Readiness](https://blog.cloudflare.com/agent-readiness/) | First-party benchmark and product design report | Strongest current positive report for hierarchical indexes and targeted Markdown on a large docs corpus. |
| [Vercel content negotiation](https://vercel.com/blog/making-agent-friendly-pages-with-content-negotiation) | First-party implementation report | Shows the same canonical URL can serve agent Markdown and human HTML through standard HTTP. |
| [a14y linking benchmark](https://a14y.dev/research/llms-txt-linking/) | Small first-party controlled benchmark | Isolates the instruction that activates the index and reports task-level cost and quality. |
| [a14y scorecard eval](https://a14y.dev/research/scorecard-evals/) | Small bundled-treatment benchmark | Supports the wider discovery-layer theory but cannot isolate `llms.txt`. |

## Reproduction notes

All local checks ran from `/Users/goga/Documents/goga/blog` on 2026-08-25.

### Google index to page

```sh
curl -fsSL https://ai.google.dev/gemini-api/docs/llms.txt -o index.txt
rg 'Function calling' index.txt
curl -fsSL https://ai.google.dev/gemini-api/docs/function-calling.md.txt
```

### tldraw full dump

```sh
curl --fail -sS https://tldraw.dev/llms-full.txt -o tldraw-full.txt
rg 'registerExternalContentHandler|TLBaseShape' tldraw-full.txt
```

The fetched dump was 2,199,498 bytes and 67,649 lines. This reinforces the skill's lazy-grep instruction; it is not sensible to inject the whole file by default.

### `mcpdoc` against gkoreli.com

The reproduction instantiated `create_server` with `https://gkoreli.com/llms.txt`, listed its tools, and called `fetch_docs` for the index, a linked `.md` post, and an off-origin URL. MCP 1.x was pinned because the published `mcpdoc==0.0.10` dependency range currently admits an incompatible MCP 2.x release.

### Token comparison

The four live response bodies were encoded with `tiktoken`'s `cl100k_base`. These figures measure representation size, not complete agent-run cost. Preserve that distinction in the article.
