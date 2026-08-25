# llms.txt and GEO — Thesis Red-Team

**Status:** Research artifact. Not article prose.  
**Checked:** 2026-08-24  
**Scope:** Strongest primary, first-party, and peer-reviewed evidence that could falsify, narrow, or complicate the working thesis.  
**Repository edits:** This file only.

## Thesis under test

> `llms.txt` is bounded agent-navigation/consumption infrastructure, not presently an AI-search ranking/citation lever; crawlability/relevance govern selection and evidence-rich formatting helps after retrieval.

## Executive verdict

The thesis survives, but not in that wording.

The evidence still supports the main decision: there is no demonstrated organic AI-search ranking or citation lift from publishing `llms.txt`, and Google Search explicitly says it ignores the file. There is also direct evidence that at least one real agent workflow uses an `llms.txt` index to navigate developer documentation. The strongest use case is therefore real, not merely hypothetical.

Three phrases need correction:

1. **“Infrastructure” is too mature a word.** `llms.txt` is an optional convention with some concrete client use, broad publication, and no provider-wide interoperability commitment.
2. **“Crawlability/relevance govern selection” is too complete.** Crawlability and indexability are gates, not sufficient causes. Selection is provider-specific and can also depend on source quality, freshness, authority, query fan-out, candidate rank, context allocation, policy, and answer needs.
3. **“Evidence-rich formatting helps” is too general.** Content and presentation can alter citation and use after a source enters the candidate set, but newer controlled studies find that generic quote/statistics/formatting recipes transfer poorly. Topical fit and context position are more consistent. High-level content substance matters more than formatting alone.

### Recommended thesis

> `llms.txt` is an optional, low-cost navigation convention with direct evidence in documentation-agent workflows, but no demonstrated organic AI-search ranking or citation lift. For open-web AI search, provider-documented eligibility, indexing, relevance, and source quality come first. Once a source enters the candidate context, its content and presentation can change how it is used or cited, but those effects are conditional and engine-specific.

This version keeps the article’s disagreeable position while making every boundary falsifiable.

## Verdict impact at a glance

| Part of the thesis | Red-team result | Verdict impact |
|---|---|---|
| `llms.txt` is useful for agent navigation | Directly supported by an official Google Gemini skill that tells an agent to fetch an `llms.txt` docs index | Strengthen this part from “plausible” to “demonstrated in at least one bounded workflow” |
| `llms.txt` is not an AI-search lever | Explicitly true for Google Search; not publicly demonstrated for other providers | Keep, but say “no demonstrated organic lift” rather than implying proof of universal non-use |
| Discovery, retrieval, and consumption are distinct | Supported by 2026 GEO studies that freeze retrieval and by Bing’s separate citation telemetry | Keep and expand: indexing, candidate retrieval, context allocation, citation, absorption, and traffic can diverge |
| Evidence-rich formatting helps after retrieval | Directionally true, but generic recipes are not stable | Rewrite as “content and presentation can matter conditional on retrieval; relevance and substance beat formatting recipes” |
| The whole AI-readable stack can be judged from the Ahrefs `llms.txt` study | False | Separate the small index file, page-level Markdown alternatives, and the full-context dump |

## Strongest counterevidence

### 1. A real first-party agent workflow uses `llms.txt`

Google’s official `google-gemini/gemini-skills` repository contains a Gemini Live API development skill that prefers a documentation MCP server, then explicitly falls back to the Gemini documentation `llms.txt` index. The skill tells the agent to fetch that index, discover page links, and fetch page-level Markdown.

- **Evidence state:** Code-inspected, first-party.
- **Baseline:** [`b40dd8d9c771ba6e84c0ff6502875e3f42b4ec14`](https://github.com/google-gemini/gemini-skills/blob/b40dd8d9c771ba6e84c0ff6502875e3f42b4ec14/skills/gemini-live-api-dev/SKILL.md#L448-L474), checked 2026-08-24.
- **What it proves:** One maintained Google agent instruction package uses `llms.txt` as a docs-navigation fallback.
- **What it does not prove:** Gemini search, Google Search, or Gemini CLI automatically probes arbitrary sites for the file; nor does it establish an adoption rate.
- **Verdict impact:** The article should not call the documentation use case speculative. It should call it concrete but bounded.

The v2 proposal’s author also says coding agents use the files reliably and revised the proposal around that observed workflow. This is a primary maintainer report, not an independent adoption study.

- [llms.txt v2 change notes](https://llmstxt.org/changes.html)
- **Evidence state:** Reported, primary maintainer claim.
- **Verdict impact:** Useful product-theory evidence; insufficient by itself for a market-wide claim.

Chrome’s Lighthouse documentation adds a second first-party signal. It says the file may save agents from crawling more of a site, while treating a missing file as N/A because the convention is optional.

- [Chrome Lighthouse `llms.txt` audit](https://developer.chrome.com/docs/lighthouse/agentic-browsing/llms-txt)
- **Evidence state:** First-party product documentation; no published task benchmark.
- **Verdict impact:** Supports “optional agent aid,” not “search signal.”

### 2. Bing’s current publisher guidance makes citation selection richer than crawlability plus relevance

Bing Webmaster Tools now exposes AI citation data across Microsoft Copilot, Bing AI summaries, and some partner integrations. Its first-party guidance separates total citations, cited pages, and grounding queries, and warns that these counts do not establish ranking, authority, placement, or a page’s role in an answer.

Bing tells publishers to inspect indexed-but-less-cited pages and improve:

- depth and expertise;
- structure and clarity;
- examples, data, and cited sources;
- freshness and accuracy;
- consistency across text, image, and video.

It also recommends IndexNow for faster discovery of content changes.

- [Bing AI Performance announcement, 2026-02-10](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview)
- **Evidence state:** First-party provider product documentation and operating guidance.
- **Evidence strength:** Strong for what Bing measures and recommends; not a controlled causal experiment proving each recommendation raises citations.
- **Verdict impact:** Add Bing to the provider section. Replace “crawlability/relevance govern selection” with a broader, explicitly incomplete set of documented gates and signals.

The absence of `llms.txt` from this guidance is relevant but not proof of non-use. Unlike Google, Bing does not explicitly say it ignores the file.

### 3. Peer-reviewed 2026 GEO research strengthens the stage boundary but weakens the simple formatting recipe

#### FeatGEO: strong content effects, fixed candidate set

Liu and Xu’s ACL 2026 long paper evaluates three generative engines: GPT-4o-mini, Gemini 2.5 Flash, and Qwen-plus. Its feature-level optimization improved the paper’s citation-visibility measure by 37%, 73%, and 96% relative to baseline, respectively.

That looks like strong counterevidence to a dismissive GEO verdict. The method boundary matters:

- each test used a fixed set of five retrieved pages plus one advertiser-controlled page;
- the advertiser page was assumed to have already entered the candidate set;
- the paper explicitly says it does not model upstream retrieval or ranking;
- the intended conclusion is citation optimization conditional on retrieval.

The paper also reports that isolated text heuristics did not consistently help and often reduced visibility. Its analysis attributes citation effects more to document-level content properties than to isolated lexical changes; formatting contributes more reliably to perceived quality than to visibility.

- [“Think Before Writing: Feature-Level Multi-Objective Optimization for Generative Citation Visibility,” ACL 2026](https://aclanthology.org/2026.acl-long.929/)
- [DOI](https://doi.org/10.18653/v1/2026.acl-long.929)
- **Evidence state:** Peer-reviewed, primary experiment.
- **Verdict impact:** Keep “conditional on retrieval.” Remove any reusable formula that citations, quotations, statistics, or formatting will reliably produce lift across engines.

#### MAGEO: large gains are deliberately isolated from retrieval

Wu et al.’s ACL Findings 2026 paper builds a twin-branch protocol around a frozen retrieval list. It replaces one target document in situ and compares generation with and without the edit under the same candidates. The paper does this to isolate content effects from retrieval drift.

Its own formulation therefore supports both sides of the article’s argument:

- content edits can materially change citation visibility and attribution inside a fixed candidate context;
- the experiment does not show that the edited page would be discovered, retrieved, or ranked organically.

- [“From Experience to Skill: Multi-Agent Generative Engine Optimization via Reusable Strategy Learning,” ACL Findings 2026](https://aclanthology.org/2026.findings-acl.2149/)
- [DOI](https://doi.org/10.18653/v1/2026.findings-acl.2149)
- **Evidence state:** Peer-reviewed, primary experiment.
- **Verdict impact:** Cite this newer study beside the 2024 GEO paper. It shows that the conditional-on-retrieval boundary is not a quirk of one old benchmark; researchers still freeze retrieval when they want causal attribution.

#### Competitive GEO: relevance and position beat formatting

Vishwakarma et al.’s SIGIR 2026 study ran 252,000 paired trials across six LLMs. It injected exactly two candidate sources into context and varied one of 18 factors at a time. Topical relevance and list position had the largest effects on which source received the first citation. Completeness and trust cues had smaller effects; formatting-only edits had little impact.

- [“What Gets Cited: Competitive GEO in AI Answer Engines,” SIGIR 2026](https://arxiv.org/abs/2605.25517)
- [DOI](https://doi.org/10.1145/3805712.3808445)
- **Evidence state:** Peer-reviewed conference paper, primary controlled experiment.
- **Verdict impact:** Change “evidence-rich formatting helps” to “topical fit and content substance are more consistent than formatting; after retrieval, presentation can still change citation behavior.”

### 4. The most direct-looking `llms.txt` performance study does not isolate `llms.txt`

A 2026 WordLift preprint reports roughly 30% accuracy gains for an “enhanced entity page” in controlled Vertex AI RAG and agentic RAG conditions. The page includes `llms.txt`-style instructions, which makes the paper look like direct evidence for the convention.

It is not an isolated test of `llms.txt`. The treatment bundles:

- a natural-language summary;
- embedded JSON-LD;
- visible linked-entity navigation;
- `llms.txt`-style instructions;
- a neural-search skill reference;
- breadcrumbs;
- materialized linked data.

The paper says its largest gains come from link materialization, not structured data alone. It also acknowledges that its ground truths come from the same knowledge graph used to create the enhanced pages, which can favor the treatment, and that most baseline documents exceeded the embedding truncation limit.

- [“Structured Linked Data as a Memory Layer for Agent-Orchestrated Retrieval,” arXiv 2026](https://arxiv.org/abs/2603.10700)
- [Reproduction repository](https://github.com/wordlift/seo3-reasoning-web/tree/39e9c8ad7be19734a9c7a326a7d64031f6339b8e)
- **Evidence state:** Primary controlled experiment, preprint; bundled treatment with acknowledged circularity and truncation confounds.
- **Verdict impact:** Include it as the strongest apparent counterexample, then explain why it supports self-contained agent-readable pages in a private RAG index rather than proving `llms.txt` improves open-web discovery or citation.

### 5. Treating `llms.txt` as trusted “guidance” creates a security boundary

The v2 proposal allows background information and guidance and expects agents to read the file before following links. That makes the file external, publisher-controlled content. It does not make the content trusted instructions.

OpenAI’s current prompt-injection guidance says third-party internet content can mislead agents and that defenses remain layered rather than complete. Its agent-security work treats following links and interacting with tools as possible sinks for malicious external instructions.

- [OpenAI: Understanding prompt injections](https://openai.com/safety/prompt-injections/)
- [OpenAI: Designing AI agents to resist prompt injection](https://openai.com/index/designing-agents-to-resist-prompt-injection/)
- **Evidence state:** First-party deployed-agent security guidance.
- **Verdict impact:** “Cheap to generate” is not the entire cost. A client must treat the file as untrusted data, and a publisher should version-control, constrain, and monitor it. Do not describe `llms.txt` as a privileged instruction channel.

This does not make `llms.txt` uniquely dangerous; any web page can carry indirect prompt injection. The convention’s instruction-shaped field makes the trust distinction worth stating.

## Overstatements to correct

| Current or likely wording | Problem | Safer replacement |
|---|---|---|
| “`llms.txt` is infrastructure” | Implies standardized, broad, interoperable client support | “`llms.txt` is an optional navigation convention with concrete docs-agent use” |
| “`llms.txt` is not a citation lever” | Categorical across opaque providers; also blurs organic selection with citation after a user-directed agent follows its links | “No public evidence shows that publishing `llms.txt` independently raises organic AI-search rankings or citations; Google explicitly says it does not” |
| “No major AI provider supports it” | “Support” can mean publishing, consuming, recommending, or ranking | Name the exact layer: providers publish it for docs; one official Google skill consumes it; Google Search ignores it; no reviewed provider promises organic ranking lift |
| “Crawlability and relevance govern selection” | Crawlability is a prerequisite, not a sufficient selection rule; “govern” hides other opaque stages | “Documented prerequisites and major signals include crawlability, indexability, relevance, freshness, and source quality; actual selection remains provider-specific and opaque” |
| “Evidence-rich formatting helps after retrieval” | Formatting, evidence, and content substance are different variables; generic tactics can hurt | “Once retrieved, content substance and presentation can affect use and citation, but relevance is more consistent than formatting and effects vary by engine and query” |
| “The GEO evidence says citations, quotes, and statistics work” | True in the 2024 benchmark, not a stable cross-engine recipe | Attribute it to that benchmark, then add 2026 evidence showing weak transfer for isolated heuristics |
| “`llms.txt` is primarily stage three” | V2 adds page-level link relations for local discovery after a client reaches a page | “Its core job is navigation and consumption; v2 also adds in-site discovery, not proof of organic search discovery” |
| “The AI-readable stack gets almost no use because 97% of files were unread” | Ahrefs measured the small `/llms.txt` index only | “In Ahrefs’ May 2026 customer sample, 97% of valid index files got no requests; the study did not test per-page Markdown utility or full-context dumps” |
| “AI bots never probe missing files” | One month and one technically skewed customer population cannot prove universal behavior | “Ahrefs observed zero AI-bot requests to missing paths in its May 2026 sample” |
| “Coding agents use `llms.txt` reliably” | Maintainer observation lacks a denominator | “The maintainer reports reliable coding-agent use, and one official Google skill provides a reproducible example” |
| “It is free, so keep it” | Ignores staleness, compromise, duplicate endpoints, monitoring, and client trust | “Keep it when generation and review are near-zero cost; do not treat it as trusted instructions or invest without observed use” |

## Distinctions the article must preserve

### The small index is not the Markdown alternative

The current v2 proposal contains two related ideas:

1. a concise `llms.txt` overview that points to useful resources;
2. clean page-level Markdown alternatives discoverable through `.md` URLs and link relations.

Ahrefs explicitly studied the index file only. Its request-rate result cannot tell us whether a user-directed agent performs better with page-level Markdown after receiving the URL.

### The full dump is no longer the center of v2

The v2 change notes say the context-expansion tooling is no longer part of the proposal. The proposal now expects agents to search the small index and fetch detail only when needed.

That means gkoreli.com’s 375 KB `llms-full.txt` is a separate implementation choice or community convention, not evidence that the current proposal requires one giant site dump. Evaluate it in its own benchmark condition.

### Search crawler, user-directed agent, and coding agent are different clients

- A search crawler may build an index before any user asks a question.
- A user-directed agent may fetch a known URL during a task.
- A coding agent may be explicitly instructed by a skill to start from a docs index.

The same request path does not imply the same product purpose. The article should never move evidence from one client class to another without marking the inference.

## Revised evidence hierarchy for the article

| Question | Best available evidence | Strength | Remaining gap |
|---|---|---|---|
| Does Google Search use `llms.txt` for visibility? | [Google’s 2026 generative AI search guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) | Explicit first-party “ignores them” statement | None for Google Search as of the check date |
| Can a real agent use it for docs navigation? | [Pinned Google Gemini skill](https://github.com/google-gemini/gemini-skills/blob/b40dd8d9c771ba6e84c0ff6502875e3f42b4ec14/skills/gemini-live-api-dev/SKILL.md#L448-L474) | Code-inspected first-party example | Prevalence and measured task benefit |
| Do other search providers promise ranking or citation lift? | OpenAI, Anthropic, Perplexity, and Bing publisher guidance | First-party documentation, mostly silent on `llms.txt` | Undocumented internal behavior remains unknowable |
| How often is the index fetched? | [Ahrefs’ 137,210-domain log study](https://ahrefs.com/blog/llmstxt-study/) | Large first-party observational dataset with stated bias | One customer population, one month, fetch rather than use |
| Can content edits change citation after retrieval? | ACL 2026 FeatGEO and MAGEO; SIGIR 2026 competitive GEO | Peer-reviewed controlled experiments | Organic retrieval, longitudinal stability, and traffic impact |
| Does `llms.txt` itself improve an agent task? | No isolated study found | Unproven | Run E2 with fixed tasks and supplied source paths |
| Does v2 linking improve discovery? | Proposal mechanism only | Proposed | Establish server-side baseline, then test link relations |

## Article changes this red-team should cause

1. **Split the thesis sentence.** Give `llms.txt` and GEO separate verdicts. The former lacks organic-search evidence; the latter has real but mostly conditional citation evidence.
2. **Add Bing.** It offers the strongest current publisher-facing distinction between citations, cited pages, and grounding queries, plus practical measurement the blog may be able to use.
3. **Update the GEO research section beyond 2024.** The 2026 papers make the piece more credible and produce a better conclusion: optimization after retrieval is real, but generic tactics are unstable.
4. **Change the practical rule from “add evidence-rich formatting” to “publish unique, relevant, self-contained evidence in a structure humans can follow.”** Formatting is support, not the load-bearing signal.
5. **Separate three artifacts in the implementation audit:** small index, page-level Markdown, and full dump. Give each its own job and evidence.
6. **State the client trust rule:** `llms.txt` is untrusted publisher content, not a system prompt.
7. **Keep the planned E2 benchmark.** It is still the test that can produce new first-party knowledge. Ask whether the supplied index and Markdown pages improve factual accuracy, source coverage, fetch cost, time, and citation correctness over normal HTML navigation.
8. **Add a measurement path through Bing Webmaster Tools** if the site is eligible, while retaining edge request logs for actual file fetches. Bing citation telemetry and server fetch logs answer different questions.

## Final red-team decision

No evidence found overturns the article’s bounded verdict on organic `llms.txt` visibility. The strongest direct counterevidence proves a narrower positive case: an official Google agent skill uses the file to navigate known developer documentation. The strongest GEO evidence also supports a narrower positive case: content changes can alter citation and use after retrieval, but newer studies do not validate a universal quotes/statistics/formatting formula and do not establish organic discovery.

The article should therefore argue neither that `llms.txt` is dead nor that GEO is fake. Its defensible position is:

> `llms.txt` can help an agent that already has a reason to enter your site. It has not been shown to create that reason. GEO can change what happens after a source is retrieved, but the durable way to deserve retrieval is still unique, relevant, well-supported work—not a machine-facing content ritual.

## Source rationale

| Source | Why it is here |
|---|---|
| [llms.txt v2 proposal](https://llmstxt.org/) and [change notes](https://llmstxt.org/changes.html) | Defines the intended job, v2 discovery relations, current consumption model, and maintainer adoption claim |
| [Pinned Google Gemini skill](https://github.com/google-gemini/gemini-skills/blob/b40dd8d9c771ba6e84c0ff6502875e3f42b4ec14/skills/gemini-live-api-dev/SKILL.md#L448-L474) | Strongest direct code evidence of a maintained agent workflow consuming an `llms.txt` docs index |
| [Google generative AI search guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) | Explicit provider boundary: Google Search ignores the file and relies on ordinary Search eligibility and ranking systems |
| [Bing AI Performance](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview) | Adds first-party citation telemetry and a broader set of documented publisher levers |
| [Ahrefs log study](https://ahrefs.com/blog/llmstxt-study/) | Best cross-domain observational evidence on index-file fetches, with clear sample and inference limits |
| [FeatGEO, ACL 2026](https://aclanthology.org/2026.acl-long.929/) | Shows strong conditional citation effects and explicitly excludes upstream retrieval |
| [MAGEO, ACL Findings 2026](https://aclanthology.org/2026.findings-acl.2149/) | Uses a frozen retrieval list, strengthening the stage distinction across newer work |
| [Competitive GEO, SIGIR 2026](https://arxiv.org/abs/2605.25517) | Large controlled study finding relevance and position stronger than formatting-only changes |
| [WordLift structured-data preprint](https://arxiv.org/abs/2603.10700) | Strongest apparent direct counterexample involving `llms.txt`-style instructions; included to show why bundled treatments do not prove the file’s effect |
| [OpenAI prompt-injection guidance](https://openai.com/safety/prompt-injections/) | Establishes the client trust boundary for instruction-shaped external content |
