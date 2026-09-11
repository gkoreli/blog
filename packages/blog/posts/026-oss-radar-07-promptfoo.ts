import { staticHtml as html } from '@nisli/core/static';
import type { PostMeta } from '../src/lib/frontmatter.js';
import { FlowDiagram, OssRadarHero, Sources } from '../src/templates/components.js';

export const meta: PostMeta = {
  title: 'OSS Radar #07: Can Promptfoo Preserve the Evidence Behind an AI Answer?',
  seoTitle: 'Promptfoo Review: Preserving AI Citation Evidence',
  alternativeHeadline: 'Citation fields, failed attempts, and trace joins through Promptfoo 0.122.2',
  date: '2026-09-10',
  description: 'Promptfoo can retain citation evidence with explicit capture. We tested adapter omissions, failed attempts, database export, and local trace joins.',
  section: 'oss-radar', layout: 'immersive', featured: false,
  tags: ['oss-radar', 'promptfoo', 'ai-evaluation', 'analytics'],
  images: [], slug: 'oss-radar-07-promptfoo',
};

const sources = [
  {
    "claim": "The installed runner omitted citation fields in its built-in summary; custom capture retained them",
    "why": "Records the package identity, local setup, commands, outputs, and exclusions behind the verdict.",
    "ref": "Installed experiment method · Sep 8, 2026",
    "url": "https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/README.md"
  },
  {
    "claim": "Three fixture evaluations made two local HTTP requests and no live model calls",
    "why": "Keeps retention counts, zero API spend, and the blocked request beside their limits.",
    "ref": "Recorded measurements · Sep 8, 2026",
    "url": "https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/recorded/result.json"
  },
  {
    "claim": "The built-in cache retained the complete parsed fixture",
    "why": "Bounds the omission to the tested summary rather than every Promptfoo store.",
    "ref": "Saved cache entry · Sep 8, 2026",
    "url": "https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/recorded/transport-cache-entry.json"
  },
  {
    "claim": "Custom raw response text and evidence metadata survived summary export",
    "why": "Lets a reader inspect the preserved fields directly.",
    "ref": "Saved custom summary · Sep 8, 2026",
    "url": "https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/recorded/custom-capture.json"
  },
  {
    "claim": "The capture provider uses existing response fields and verifies serialized results",
    "why": "Shows the repair, the equality checks, and the network guard without hiding them behind prose.",
    "ref": "Runnable installed probe · Sep 8, 2026",
    "url": "https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/probe-installed.ts"
  },
  {
    "claim": "Triggers, request identity, citations, and source review require different records",
    "why": "Maps each question to an observer and records the prior art and unrun tests.",
    "ref": "Trigger and citation research · Sep 8, 2026",
    "url": "https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/04-trigger-provenance-and-ai-citations.md"
  },
  {
    "claim": "Citation presence and source support need explicit units and missing-data states",
    "why": "Makes the planned denominators inspectable without presenting them as deployed analytics.",
    "ref": "Proposed measurement contract · Sep 8, 2026",
    "url": "https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/07-citation-measurement-contract.md"
  },
  {
    "claim": "Ten controlled cases retained final response text and all eleven attempts across exports",
    "why": "Records the failure matrix, database restart, installation difference, and the tested boundary.",
    "ref": "Capture and export experiment · Sep 8, 2026 (PDT)",
    "url": "https://github.com/gkoreli/blog/blob/5fc2dc5dc40ad2397a78325e3a192485b44e8cb5/packages/blog/drafts/research/oss-radar-07/repro/capture/README.md"
  },
  {
    "claim": "The retry's failed and successful attempts survived the restarted CLI export",
    "why": "Lets a reader check both attempts rather than relying on an aggregate pass count.",
    "ref": "Saved retry export · Sep 8, 2026 (PDT)",
    "url": "https://github.com/gkoreli/blog/blob/5fc2dc5dc40ad2397a78325e3a192485b44e8cb5/packages/blog/drafts/research/oss-radar-07/repro/capture/recorded/retry-cli-export.json"
  },
  {
    "claim": "The capture provider records field states and attempts before deriving the answer",
    "why": "Makes absent/empty states and charge limitations inspectable.",
    "ref": "Capture implementation · Sep 8, 2026 (PDT)",
    "url": "https://github.com/gkoreli/blog/blob/5fc2dc5dc40ad2397a78325e3a192485b44e8cb5/packages/blog/drafts/research/oss-radar-07/repro/capture/capture-provider.ts"
  },
  {
    "claim": "A saved attempt links to the local trace by explicit IDs",
    "why": "Contains the matching evaluation, test-case, trace, and target-span identifiers.",
    "ref": "Saved full export with trace · Sep 8, 2026 (PDT)",
    "url": "https://github.com/gkoreli/blog/blob/5fc2dc5dc40ad2397a78325e3a192485b44e8cb5/packages/blog/drafts/research/oss-radar-07/repro/capture/recorded/full-cli-export.json"
  },
  {
    "claim": "The runner supplies test roots and target context",
    "why": "Explains the local trace path exercised by the continuation.",
    "ref": "Evaluator tracing implementation · Sep 8, 2026 (checked)",
    "url": "https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/tracing/evaluatorTracing.ts"
  },
  {
    "claim": "The inspected implementation is MIT-licensed",
    "why": "Establishes the open-source terms for the code inspected here.",
    "ref": "Promptfoo license · Sep 8, 2026 (checked)",
    "url": "https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/LICENSE"
  },
  {
    "claim": "The project includes evaluation, red teaming, and code review",
    "why": "Defines the application-testing scope against which this workload is judged.",
    "ref": "Pinned project overview · Sep 8, 2026 (checked)",
    "url": "https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/README.md"
  },
  {
    "claim": "Founders describe the move toward application security and commit to continued open-source development",
    "why": "Supplies their stated purpose and cross-provider commitment rather than an inferred roadmap.",
    "ref": "Founders' announcement · Mar 9, 2026",
    "url": "https://www.promptfoo.dev/blog/promptfoo-joining-openai/"
  },
  {
    "claim": "Red teaming combines plugins, attack strategies, and targets",
    "why": "Defines the adversarial-testing workflow; it was inspected, not exercised in this experiment.",
    "ref": "Red-team architecture · Sep 8, 2026 (checked)",
    "url": "https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/site/docs/red-team/architecture.md"
  },
  {
    "claim": "The red-team run connects case generation to evaluation",
    "why": "Checks the documented workflow against shipped orchestration code.",
    "ref": "Red-team run implementation · Sep 8, 2026 (checked)",
    "url": "https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/redteam/shared.ts"
  },
  {
    "claim": "Code scanning calls an agent service to perform a scan",
    "why": "Shows the service dependency behind the scanner's local entry point.",
    "ref": "Scanner implementation · Sep 8, 2026 (checked)",
    "url": "https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/codeScan/scanner/index.ts"
  },
  {
    "claim": "The GitHub Action runs scanning and handles review output",
    "why": "Locates code review within the development workflow.",
    "ref": "Scanner action implementation · Sep 8, 2026 (checked)",
    "url": "https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/code-scan-action/src/main.ts"
  },
  {
    "claim": "The runner added tracing and fuller usage accounting in August",
    "why": "Explains why execution records are relevant to this month's adoption question.",
    "ref": "Promptfoo 0.122.1 · Aug 26, 2026",
    "url": "https://github.com/promptfoo/promptfoo/releases/tag/0.122.1"
  },
  {
    "claim": "The experiment installed runner version 0.122.2",
    "why": "Fixes the tested release separately from the scanner-action track.",
    "ref": "Promptfoo 0.122.2 · Aug 28, 2026",
    "url": "https://github.com/promptfoo/promptfoo/releases/tag/0.122.2"
  },
  {
    "claim": "Promptfoo 0.123.0 shipped after the tested release",
    "why": "Marks the newer release separately from the installed experiments, which remain pinned to 0.122.2.",
    "ref": "Promptfoo 0.123.0 · Sep 10, 2026",
    "url": "https://github.com/promptfoo/promptfoo/releases/tag/0.123.0"
  },
  {
    "claim": "The scanner action received installation and dependency hardening",
    "why": "Distinguishes recent maintenance from the scanner's earlier introduction.",
    "ref": "Scanner action 0.2.0 · Aug 28, 2026",
    "url": "https://github.com/promptfoo/promptfoo/releases/tag/code-scan-action-0.2.0"
  },
  {
    "claim": "The scanner's engineering introduction predates August",
    "why": "Provides the original design account and prevents a false launch chronology.",
    "ref": "Building a security scanner for LLM apps · Dec 16, 2025",
    "url": "https://www.promptfoo.dev/blog/building-a-security-scanner-for-llm-apps/"
  },
  {
    "claim": "Promptfoo identifies itself as part of OpenAI",
    "why": "Records the project's current affiliation without inventing an acquisition closing date.",
    "ref": "Promptfoo about page · Sep 10, 2026 (checked, PDT)",
    "url": "https://www.promptfoo.dev/about/"
  },
  {
    "claim": "OpenAI announced a plan to integrate Promptfoo capabilities into Frontier",
    "why": "Sources the buyer's stated direction; it does not verify completion of that integration.",
    "ref": "OpenAI acquisition announcement · Mar 9, 2026",
    "url": "https://openai.com/index/openai-to-acquire-promptfoo/"
  },
  {
    "claim": "The scanner action defaults to Promptfoo's cloud API",
    "why": "Shows why an open-source entry point does not make every feature an offline workflow.",
    "ref": "Scanner action configuration · Sep 8, 2026 (checked)",
    "url": "https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/code-scan-action/action.yml"
  },
  {
    "claim": "An application can implement Promptfoo's provider interface",
    "why": "Establishes the supported extension point used by the prototype.",
    "ref": "Custom-provider documentation · Sep 8, 2026 (checked)",
    "url": "https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/site/docs/providers/custom-api.md"
  },
  {
    "claim": "The OpenRouter adapter normalizes the provider response",
    "why": "Locates the smaller response object that the evaluator receives.",
    "ref": "OpenRouter provider implementation · Sep 8, 2026 (checked)",
    "url": "https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/providers/openrouter.ts"
  },
  {
    "claim": "Provider responses may carry raw data and arbitrary metadata",
    "why": "Explains why preserving the fixture required capture code without a framework fork.",
    "ref": "Provider response contract · Sep 8, 2026 (checked)",
    "url": "https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/contracts/providers.ts"
  },
  {
    "claim": "The telemetry opt-out can still initiate a disabled-event beacon",
    "why": "Explains the attempted request recorded by the guarded probe.",
    "ref": "Telemetry implementation · Sep 8, 2026 (checked)",
    "url": "https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/telemetry.ts"
  },
  {
    "claim": "An upstream user reported the opt-out beacon; the issue remained open",
    "why": "Adds an independently reported failure path, checked against code and our installed run.",
    "ref": "Promptfoo issue #9968 · Sep 10, 2026 (checked, PDT)",
    "url": "https://github.com/promptfoo/promptfoo/issues/9968"
  },
  {
    "claim": "Publishers already have a product that reports AI citation activity",
    "why": "Bounds our novelty claim and shows the limits of a provider-defined citation view.",
    "ref": "Bing AI Performance preview · Feb 10, 2026",
    "url": "https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview"
  },
  {
    "claim": "An activity's start and an agent's responsibility are separate provenance relations",
    "why": "Provides a stable vocabulary for task history without collapsing it into a human/bot label.",
    "ref": "W3C PROV-DM · Apr 30, 2013",
    "url": "https://www.w3.org/TR/2013/REC-prov-dm-20130430/"
  },
  {
    "claim": "The human/bot binary is contested in bot-authentication design",
    "why": "Records a concrete prior argument; this individual draft is not an agreed standard.",
    "ref": "Web Bot Auth use-case draft, Appendix A.4 · Apr 1, 2026",
    "url": "https://datatracker.ietf.org/doc/html/draft-nottingham-webbotauth-use-cases-02#appendix-A.4"
  },
  {
    "claim": "The bot-signature draft leaves human authentication and delegation out of scope",
    "why": "Bounds what verified request identity can establish; the document remains a draft.",
    "ref": "HTTP Message Signatures for automated traffic, §4.6 · Sep 1, 2026",
    "url": "https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-00#section-4.6"
  },
  {
    "claim": "A supporting citation does not establish the model's actual reliance on it",
    "why": "Separates support review from causal attribution; its tested systems do not establish 2026 model-wide rates.",
    "ref": "Wallat et al., Correctness is not Faithfulness in RAG Attributions · Dec 23, 2024",
    "url": "https://arxiv.org/abs/2412.18004"
  },
  {
    "claim": "Citation quality can be evaluated separately from answer correctness",
    "why": "Provides the ALCE research basis for source-support evaluation, not a score for our unrun study.",
    "ref": "Gao et al., Enabling Large Language Models to Generate Text with Citations · Dec 2023",
    "url": "https://aclanthology.org/2023.emnlp-main.398/"
  }
];

export function preamble() {
  return OssRadarHero({
    issueNum: 'Issue #07', date: 'September 2026',
    tags: 'open source · AI evaluation · citations · analytics',
    title: html`<h1>Promptfoo: Can It Preserve the Evidence <em>Behind an AI Answer?</em></h1>`,
    subtitle: 'The answer survived. Its structured citations depended on the adapter. We tested the capture, failures, and exports.',
    author: 'Goga Koreli', readTime: '12 min read', canvasMode: 'evidence', canvasSeed: 7,
    footprint: { label: 'Runnable experiments · captured records · research notes', url: 'https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-07' },
  });
}

export function article() {
  return html`<article class="post-content">
<p class="post-lede">Promptfoo&#39;s evaluation runner can keep citation evidence through its database and JSON exports, provided we capture it explicitly. In our September 8 checks of version 0.122.2, the built-in OpenRouter summary omitted the fixture&#39;s structured citation fields; the transport cache retained them. A custom provider also preserved successful and failed attempt records after a database restart. This makes Promptfoo worth trying for citation evaluation, with a tested capture layer. All responses in these checks were synthetic. <a href="https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/README.md" target="_blank" rel="noopener">Original comparison</a>; <a href="https://github.com/gkoreli/blog/blob/5fc2dc5dc40ad2397a78325e3a192485b44e8cb5/packages/blog/drafts/research/oss-radar-07/repro/capture/README.md" target="_blank" rel="noopener">failure and export checks</a>.</p>
<ul>
<li><strong>The adapter decides what reaches the evaluator.</strong> Answer text survived all three original paths; structured citations survived the cache and custom capture.</li>
<li><strong>The repair survives more than a successful response.</strong> Ten controlled cases retained every attempt through the library exporter and a fresh CLI process. One local trace also kept the explicit link to its saved attempt.</li>
<li><strong>Preservation is the first step in citation evaluation.</strong> Counting an answer&#39;s references, checking their support, and explaining what triggered a run need different records.</li>
</ul>
<h2>What Promptfoo is building</h2>
<p>Promptfoo is a command-line tool and library for testing AI applications, with an <a href="https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/LICENSE" target="_blank" rel="noopener">MIT-licensed open-source implementation</a>. You supply test cases, choose models or an application to call, and define checks. It runs the cases and lets you compare results. The <a href="https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/README.md" target="_blank" rel="noopener">project overview</a> also puts adversarial testing and code review within its scope.</p>
<p>Its public purpose is to help teams ship secure, reliable AI applications. Founders Ian Webster and Michael D&#39;Angelo <a href="https://www.promptfoo.dev/blog/promptfoo-joining-openai/" target="_blank" rel="noopener">describe a shift</a> from systematic application testing toward the security and behavioral risks that blocked deployment. That explains why the project reaches beyond comparing answers.</p>
<div class="compare-table-scroll"><table class="compare-table" style="min-width:44rem">
<thead>
<tr>
<th>Part</th>
<th>What it does</th>
<th>Evidence</th>
</tr>
</thead>
<tbody><tr>
<td>Evaluations</td>
<td>Runs chosen cases against providers or applications and checks their responses</td>
<td>Our <a href="https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/README.md" target="_blank" rel="noopener">installed evaluation</a> exercises this path</td>
</tr>
<tr>
<td>Red teaming</td>
<td>Generates adversarial cases, applies attack strategies, and tests a target application</td>
<td>The <a href="https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/site/docs/red-team/architecture.md" target="_blank" rel="noopener">architecture</a> defines the parts; the <a href="https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/redteam/shared.ts" target="_blank" rel="noopener">run implementation</a> connects generation to evaluation</td>
</tr>
<tr>
<td>Code scanning</td>
<td>Reviews code changes for LLM-related security risks and supplies findings in the development workflow</td>
<td>The <a href="https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/codeScan/scanner/index.ts" target="_blank" rel="noopener">scanner implementation</a> calls a scan service; the <a href="https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/code-scan-action/src/main.ts" target="_blank" rel="noopener">GitHub Action</a> handles the review workflow</td>
</tr>
</tbody></table></div>
<p>August&#39;s work strengthened the records behind those tests. The <a href="https://github.com/promptfoo/promptfoo/releases/tag/0.122.1" target="_blank" rel="noopener">August 26 release</a> added per-test roots, target spans, agent telemetry integrations, and fuller token accounting. The <a href="https://github.com/promptfoo/promptfoo/releases/tag/code-scan-action-0.2.0" target="_blank" rel="noopener">August 28 scanner-action release</a> hardened its installation and dependencies. These are different release tracks. Our installed runner came from the separate <a href="https://github.com/promptfoo/promptfoo/releases/tag/0.122.2" target="_blank" rel="noopener">0.122.2 release</a>, also published August 28. The scanner itself predates August: its <a href="https://www.promptfoo.dev/blog/building-a-security-scanner-for-llm-apps/" target="_blank" rel="noopener">engineering introduction</a> appeared in December 2025.</p>
<p><a href="https://github.com/promptfoo/promptfoo/releases/tag/0.123.0" target="_blank" rel="noopener">Promptfoo 0.123.0</a> shipped on September 10. The experiments here remain pinned to 0.122.2; we have not rerun them on the newer release.</p>
<p>I read that work as an effort to make AI testing part of the normal development process: run a test, inspect the execution, locate a failure, and check a repair. Traces and accounting help explain what happened inside a test. They do not make its judgments correct or its evidence complete.</p>
<p>The project now <a href="https://www.promptfoo.dev/about/" target="_blank" rel="noopener">identifies itself as part of OpenAI</a>. Its founders&#39; March announcement commits to maintaining open-source red teaming, scanning, and evals across providers. <a href="https://openai.com/index/openai-to-acquire-promptfoo/" target="_blank" rel="noopener">OpenAI's announcement</a> sets out an additional direction: integrate testing, remediation, reporting, and traceability into Frontier. That is a stated product plan; these sources do not establish that the promised integration has shipped.</p>
<p>The distinction matters for adoption. The MIT runner gives us inspectable code and an extension interface. A connected feature can still depend on a service: the scanner&#39;s <a href="https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/code-scan-action/action.yml" target="_blank" rel="noopener">default API host</a> is Promptfoo&#39;s cloud. We need to judge the specific path we use. For this blog, the relevant bet is whether its reusable evaluation and execution records can support our citation study; the citation pipeline remains work we must build and verify.</p>
<h2>Citation analytics needs the answer</h2>
<p>Our <a href="/first-party-analytics-for-a-personal-blog">blog analytics</a> can record requests that reach the site. A citation exists in an answer somewhere else. Bringing those observations together starts with preserving what each system can see.</p>
<p>AI citations are a topic; counting them is analytics, and checking whether their sources support an answer is evaluation. There is already publisher-facing prior art. Microsoft&#39;s <a href="https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview" target="_blank" rel="noopener">AI Performance preview</a>, announced February 10, reports citation activity across its supported AI surfaces and selected partners. Its coverage is defined by that product. It does not audit every cited claim.</p>
<p>The opportunity for this blog is to publish inspectable cases: the question, captured answer, cited source, review, and records that connect them. We can then compare those cases with our request observations where a defensible connection exists. Whether the blog appears in the answers remains an open result. The capture method should still help another engineer if it does not.</p>
<h2>Where provider evidence enters the result</h2>
<p>Promptfoo&#39;s <a href="https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/site/docs/providers/custom-api.md" target="_blank" rel="noopener">custom-provider interface</a> lets an operator bring an application into the runner. For this study, that division is useful: reuse the evaluation machinery and retain provider-specific evidence explicitly.</p>
<p>The adapter and experiment sections are for engineers choosing or implementing this path. The pinned <a href="https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/providers/openrouter.ts" target="_blank" rel="noopener">OpenRouter provider</a> sends the request through a cache-aware transport, then builds a smaller response from answer text, usage, and completion information. It does not copy the fixture&#39;s citation list or answer annotations into that response. The evaluator receives the smaller object.</p>
<p>The shared <a href="https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/contracts/providers.ts" target="_blank" rel="noopener">response contract</a> allows both <code>raw</code> and arbitrary metadata. This changes the adoption question. We need to test the chosen adapter and export path, rather than assume either that the whole framework preserves everything or that it cannot preserve the evidence at all.</p>
${FlowDiagram({ label: "Built-in OpenRouter response path in the original fixture", steps: [ { eyebrow: "Transport", title: "Full parsed response", detail: html`The cache retains the citation list and annotation.`, connector: "adapter reads", tone: "blue" }, { eyebrow: "Adapter", title: "Selected fields", detail: html`Answer, usage, cache state, cost, and finish reason.`, connector: "evaluator gets", tone: "warm" }, { eyebrow: "Summary", title: "Answer retained", detail: html`Structured citations are absent in this tested path.`, tone: "rust" } ] })}
<h2>What survived the installed-package check</h2>
<p>The installed experiment located the omission and tested a repair with the same response. It used one invented payload containing one distinct source URL, represented in a citation list and an annotation. No live model answered the question.</p>
<p>We ran the built-in provider against a local HTTP server, repeated the evaluation with caching enabled, then sent the same payload through a custom capture provider. Each evaluation used the public summary API and a text assertion. The script serialized the summaries and read them back before checking the fields. <a href="https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/README.md" target="_blank" rel="noopener">Runnable probe and saved outputs</a>.</p>
<div class="compare-table-scroll"><table class="compare-table" style="min-width:44rem">
<thead>
<tr>
<th>Observed path</th>
<th align="right">New local requests</th>
<th>Answer text</th>
<th align="right">Citation-list entries retained</th>
<th align="right">Annotations retained</th>
</tr>
</thead>
<tbody><tr>
<td>Built-in provider, fresh summary</td>
<td align="right">1</td>
<td>Preserved</td>
<td align="right">0</td>
<td align="right">0</td>
</tr>
<tr>
<td>Built-in provider, cached summary</td>
<td align="right">0</td>
<td>Preserved</td>
<td align="right">0</td>
<td align="right">0</td>
</tr>
<tr>
<td>Custom capture provider, fresh summary</td>
<td align="right">1</td>
<td>Preserved</td>
<td align="right">1</td>
<td align="right">1</td>
</tr>
</tbody></table></div>
<p>The <a href="https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/recorded/transport-cache-entry.json" target="_blank" rel="noopener">built-in transport cache</a> retained the full parsed fixture, including both citation fields. The <a href="https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/recorded/custom-capture.json" target="_blank" rel="noopener">custom summary</a> retained the exact decoded response text, its hash, the mock request ID, and the structured fields. The omission occurs between the adapter and the summary; the evidence remains available in the cache.</p>
<p>The repair uses fields Promptfoo already accepts. This is the return object from the <a href="https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/probe-installed.ts" target="_blank" rel="noopener">tested capture provider</a>, after reading the response text and parsing the fixture:</p>
<pre class="shiki shiki-themes github-light github-dark" style="--shiki-light:#24292e;--shiki-dark:#e1e4e8;--shiki-light-bg:#fff;--shiki-dark-bg:#24292e" tabindex="0"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583">return</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8"> {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8">  output: parsed.choices[</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF">0</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8">].message.content,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8">  raw,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8">  metadata: { evidence: {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8">    providerCitations: parsed.citations,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8">    answerAnnotations: parsed.choices[</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF">0</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8">].message.annotations,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8">    requestId: response.headers.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0">get</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8">(</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF">'x-request-id'</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8">),</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8">    responseSha256: </span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0">sha256</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8">(raw),</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8">    providerReportedUsage: parsed.usage,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8">  } },</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8">};</span></span></code></pre>
<p>This changes what the runner can retain without changing the answer assertion. That original prototype handles the successful fixture only; its saved usage fields are invented inputs, not a billing record.</p>
<p>The fixture&#39;s repeated URL is one source, not two lost citations. Its annotation offsets are not validated, and the text assertion checks transport rather than truth. Tracing, database persistence, CLI export, streaming, failure handling, and live billing were outside that original check. The next experiment covers several of those gaps. The <a href="https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/recorded/result.json" target="_blank" rel="noopener">recorded result</a> keeps those limits beside the measurements.</p>
<p>For a real answer, missing citation fields would mean we could not assess citations through that field. They would not mean the model cited nothing. The controlled fixture lets us establish an omission because we know what entered the adapter.</p>
<h2>What survived failures, a restart, and tracing</h2>
<p>The capture layer now preserves failed attempts as well as successful answers. We extended the experiment to ten controlled cases on a Mac, saved each response before parsing it, and checked the same records in the public summary, Promptfoo&#39;s JSON exporter, and a separate CLI process reopening the database. All ten retained the complete provider response used by our capture layer. <a href="https://github.com/gkoreli/blog/blob/5fc2dc5dc40ad2397a78325e3a192485b44e8cb5/packages/blog/drafts/research/oss-radar-07/repro/capture/README.md" target="_blank" rel="noopener">Method and recorded results</a>.</p>
<div class="compare-table-scroll"><table class="compare-table" style="min-width:44rem">
<thead>
<tr>
<th>Condition</th>
<th align="right">Evaluations</th>
<th align="right">HTTP attempts</th>
<th>What the exported record retains</th>
</tr>
</thead>
<tbody><tr>
<td>Successful responses</td>
<td align="right">4</td>
<td align="right">4</td>
<td>The answer plus present, absent, empty, or null citation fields</td>
</tr>
<tr>
<td>Five failure conditions</td>
<td align="right">5</td>
<td align="right">5</td>
<td>Malformed JSON, HTTP 429, an error envelope, no answer, and truncation</td>
</tr>
<tr>
<td>HTTP 429 → success</td>
<td align="right">1</td>
<td align="right">2</td>
<td>Both attempts, their statuses, and the final answer</td>
</tr>
</tbody></table></div>
<p>Those counts measure record retention. Five evaluations passed the text assertion; five deliberately failed. A successful export of an error is a useful result for this workload. It keeps a later analyst from quietly excluding a failed request or treating it as an answer with no citations. The <a href="https://github.com/gkoreli/blog/blob/5fc2dc5dc40ad2397a78325e3a192485b44e8cb5/packages/blog/drafts/research/oss-radar-07/repro/capture/recorded/retry-cli-export.json" target="_blank" rel="noopener">retry export</a> shows both attempts after restart.</p>
<p>Local tracing also did useful work. The full-success case produced three spans: the test case, provider target, and assertion. Our capture saved the evaluation ID, test-case ID, and <code>traceparent</code> supplied by Promptfoo. They matched the <a href="https://github.com/gkoreli/blog/blob/5fc2dc5dc40ad2397a78325e3a192485b44e8cb5/packages/blog/drafts/research/oss-radar-07/repro/capture/recorded/full-cli-export.json" target="_blank" rel="noopener">exported trace</a>, including the exact target span, through both exporters. That is an observed connection between records, rather than a guess from matching timestamps. The pinned <a href="https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/tracing/evaluatorTracing.ts" target="_blank" rel="noopener">tracing implementation</a> explains how the runner supplies that context.</p>
<p>A trace still describes only the participating system. We did not capture a remote provider&#39;s retrieval history, and the two retry attempts live in our metadata rather than separate spans. The fixture&#39;s reported cost remains invented. These checks establish local retention and joins; live response shape, source review, and billing remain untested.</p>
<h2>Who started the task, and what did the answer cite?</h2>
<p>An assistant can use a blog on someone&#39;s behalf without that person visiting the site. A person can ask for an article now or commission a report that runs every week. Both serve a human goal. The immediate trigger differs, and neither tells us what the answer cited.</p>
<p>That distinction has prior art. W3C&#39;s <a href="https://www.w3.org/TR/2013/REC-prov-dm-20130430/" target="_blank" rel="noopener">provenance model</a> records what started an activity separately from who bears responsibility for it. A Web Bot Auth <a href="https://datatracker.ietf.org/doc/html/draft-nottingham-webbotauth-use-cases-02#appendix-A.4" target="_blank" rel="noopener">use-case draft</a> likewise questions the human/bot binary. The <a href="https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-00#section-4.6" target="_blank" rel="noopener">protocol draft</a> leaves human authentication and delegation outside its scope.</p>
<p>A citation belongs to the answer. We need the captured output to observe it, then the source to check whether it supports the claim. Even that leaves a further question: did the model rely on the source? <a href="https://arxiv.org/abs/2412.18004" target="_blank" rel="noopener">Research on citation faithfulness</a> distinguishes actual reliance from a reference that merely agrees with the answer.</p>
<div class="compare-table-scroll"><table class="compare-table" style="min-width:44rem">
<thead>
<tr>
<th>Question</th>
<th>Record that can answer it</th>
<th>What remains unknown</th>
</tr>
</thead>
<tbody><tr>
<td>What started this run?</td>
<td>A captured submission or scheduler event linked to the run</td>
<td>A website request alone does not establish that event</td>
</tr>
<tr>
<td>Which client made the request?</td>
<td>A verified request signature and its key identity</td>
<td>Human authorization, the immediate trigger, and the later answer</td>
</tr>
<tr>
<td>Did the answer cite the article?</td>
<td>The captured answer and its citation fields</td>
<td>Whether a fresh request reached the article&#39;s origin</td>
</tr>
<tr>
<td>Does the source support the claim?</td>
<td>A review of the claim against the retained source</td>
<td>Whether the model actually relied on that source</td>
</tr>
</tbody></table></div>
<p>For controlled runs, we can preserve the submission or scheduler event and link it to the captured output. A receiving website usually lacks that history. The <a href="https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/04-trigger-provenance-and-ai-citations.md" target="_blank" rel="noopener">research artifact</a> separates task authority, trigger, URL selection, request identity, content access, citation, and source review. Promptfoo can organize records supplied to it; the trace cannot invent the missing ones.</p>
<h2>What still needs code</h2>
<p>The remaining work is in the live capture and source review. The local tests now cover response variants, failed attempts, a bounded retry, database export, and one trace join. They do not establish what a live service returns or what its citations support.</p>
<p>Our <a href="https://github.com/gkoreli/blog/blob/5fc2dc5dc40ad2397a78325e3a192485b44e8cb5/packages/blog/drafts/research/oss-radar-07/repro/capture/capture-provider.ts" target="_blank" rel="noopener">capture provider</a> saves request text and each decoded response before selecting fields. It records missing citation fields separately from empty lists and leaves charge unknown when the response does not expose it. Even a provider-reported charge needs reconciliation with its billing record. Source review needs its own claim boundaries and support rubric. Earlier work such as <a href="https://aclanthology.org/2023.emnlp-main.398/" target="_blank" rel="noopener">ALCE</a> gives citation evaluation a research basis; a returned URL alone is not a support judgment.</p>
<p>The <a href="https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/07-citation-measurement-contract.md" target="_blank" rel="noopener">proposed measurement contract</a> keeps counts honest. Citation presence uses assessable answers as its denominator and reports observation coverage alongside it. Support uses reviewed claim–citation relationships. Requests, unique URLs, citation occurrences, and people never become interchangeable units. A capture hash helps detect changed bytes; it does not authenticate the provider or make an answer true.</p>
<p>Collection also needs a known network boundary. Our first attempt encountered an unexpected telemetry request despite the opt-out. The final probe blocked one such POST before transmission, matching the pinned <a href="https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/telemetry.ts" target="_blank" rel="noopener">telemetry implementation</a> and the <a href="https://github.com/promptfoo/promptfoo/issues/9968" target="_blank" rel="noopener">upstream report</a>, still open at publication. This does not establish prompt disclosure. It does mean the opt-out alone was insufficient for this restricted local run. The method records the interruption and the guard.</p>
<p>The larger adoption test is whether these additions remain a small capture layer while Promptfoo supplies useful execution and review machinery. A direct runner remains a reasonable alternative if maintaining the integration means rebuilding those parts ourselves.</p>
<h2>The next decision</h2>
<p>Promptfoo is worth the next bounded trial for this blog&#39;s citation-evaluation workload. The tested interface can retain evidence, and the built-in cache gives useful counterevidence to the strongest loss claim. Anyone who needs complete records from the built-in OpenRouter summary should first add and verify capture on the route they will use.</p>
<p>The local trace and export checks have passed. The next test is a live preflight that retains the request, answer, exposed citation fields, and charge provenance, then checks the cited source against the answer. A service that does not expose the needed evidence, or an integration that forces us to rebuild most of the runner, would change this decision. The <a href="https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-07/00-worklist-index.md" target="_blank" rel="noopener">worklist</a> keeps that test separate from the larger citation-frequency study.</p>
<p>Try Promptfoo when you want its test runner, assertions, and result inspection enough to maintain explicit capture. If you need a complete citation archive from an unmodified adapter, wait or use a direct runner you can audit. Keep the captured records independently replayable; wider adoption depends on the live evidence.</p>

<section id="sources-and-evidence" aria-label="Sources and evidence">
${Sources({items: sources})}
<p>Dates are publication dates unless marked <strong>checked</strong>. Pinned Promptfoo code and documentation refer to the tested 0.122.2 release. Our artifacts record a synthetic-response experiment; the standards and studies supply concepts and methods, not measurements of this blog&#39;s citation rate.</p>

<h3>Research record</h3>
<p>The <a href="https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-07/00-worklist-index.md" target="_blank" rel="noopener">worklist</a> links the experiments, research notes, and open work. The <a href="https://github.com/gkoreli/blog/blob/main/packages/blog/prompts/oss-radar-07-promptfoo.prompts.md" target="_blank" rel="noopener">verbatim shaping prompts</a> are preserved for this issue at the author&#39;s request. The methods record the runtimes, dependency lock, scripts, results, and failed setup attempts. Codex executed the experiments for this article; Goga supplied the workload and editorial direction. Research-session token totals and hands-on time have not been measured.</p>

</section>
<h2 id="glossary">Glossary</h2>
<table>
<thead>
<tr>
<th>Term / Claim</th>
<th>Source</th>
<th>Date</th>
</tr>
</thead>
<tbody><tr>
<td><strong>Provider adapter:</strong> code that calls a model or application and returns the fields Promptfoo evaluates.</td>
<td><a href="https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/site/docs/providers/custom-api.md" target="_blank" rel="noopener">Custom-provider interface</a></td>
<td>Sep 8, 2026 (checked)</td>
</tr>
<tr>
<td><strong>Evaluation:</strong> running defined cases and checking the returned answer or behavior.</td>
<td><a href="https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/README.md" target="_blank" rel="noopener">Promptfoo overview</a></td>
<td>Sep 8, 2026 (checked)</td>
</tr>
<tr>
<td><strong>Red teaming:</strong> testing a target with generated adversarial cases and attack strategies.</td>
<td><a href="https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/site/docs/red-team/architecture.md" target="_blank" rel="noopener">Red-team architecture</a></td>
<td>Sep 8, 2026 (checked)</td>
</tr>
<tr>
<td><strong>Raw response:</strong> the response text retained by our capture provider before selecting answer and citation fields.</td>
<td><a href="https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/probe-installed.ts" target="_blank" rel="noopener">Tested capture implementation</a></td>
<td>Sep 8, 2026</td>
</tr>
<tr>
<td><strong>Citation analytics:</strong> counts and trends over observed citations, with a declared coverage boundary.</td>
<td><a href="https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview" target="_blank" rel="noopener">Bing AI Performance</a></td>
<td>Feb 10, 2026</td>
</tr>
<tr>
<td><strong>Source list / answer citation:</strong> provider-returned sources and references attached to an answer are distinct fields; a source entry alone need not be an answer citation.</td>
<td><a href="https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/07-citation-measurement-contract.md" target="_blank" rel="noopener">Our proposed measurement contract</a></td>
<td>Sep 8, 2026</td>
</tr>
<tr>
<td><strong>Trigger / responsibility:</strong> the event starting an activity differs from the agent responsible for it.</td>
<td><a href="https://www.w3.org/TR/2013/REC-prov-dm-20130430/" target="_blank" rel="noopener">W3C PROV-DM</a></td>
<td>Apr 30, 2013</td>
</tr>
<tr>
<td><strong>Verified request identity:</strong> a signed request can identify its key holder; it does not establish a fresh human action or a citation.</td>
<td><a href="https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-00#section-4.6" target="_blank" rel="noopener">Bot-signature draft, §4.6</a></td>
<td>Sep 1, 2026</td>
</tr>
<tr>
<td><strong>Citation support:</strong> whether a cited source supports the associated claim.</td>
<td><a href="https://aclanthology.org/2023.emnlp-main.398/" target="_blank" rel="noopener">ALCE</a></td>
<td>Dec 2023</td>
</tr>
<tr>
<td><strong>Citation faithfulness:</strong> whether the model actually relied on the cited source.</td>
<td><a href="https://arxiv.org/abs/2412.18004" target="_blank" rel="noopener">Wallat et al.</a></td>
<td>Dec 23, 2024</td>
</tr>
</tbody></table>

</article>`;
}
