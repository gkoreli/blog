import { staticHtml as html } from '@nisli/core/static';
import type { PostMeta } from '../src/lib/frontmatter.js';
import { FlowDiagram, OssRadarHero } from '../src/templates/components.js';

const researchFootprint = {
  "sessions": 8,
  "artifacts": 23,
  "totalTokens": 43272331,
  "inputTokens": 43096350,
  "cachedInputTokens": 40628992,
  "outputTokens": 175981,
  "reasoningOutputTokens": 59745,
  "wallClockMinutes": 3068,
  "startedAt": "2026-09-09T00:18:40.705Z",
  "measuredAt": "2026-09-11T03:26:22.382Z",
  "provenanceUrl": "https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-07/19-research-footprint.md",
  "scope": "Measured portion: recovered Codex research, canvas work, automatic reviews, publication checks, sharing preparation, and accounting. Original ChatGPT research has no recovered usage log. The mixed analytics/publication parent and one review without usage are excluded. These are contributing-session totals, not the complete research total or an exclusive writing cost. This frozen snapshot covered 15 human prompts. Two later prompts, the real CLI experiments, and follow-up reviews are outside its measured cutoff; the prompt page includes those later requests."
};

export const meta: PostMeta = {
  title: 'OSS Radar #07: Can Promptfoo Preserve the Evidence Behind an AI Answer?',
  seoTitle: 'Promptfoo Review: Preserving AI Citation Evidence',
  alternativeHeadline: 'Citation fields, failed attempts, and trace joins through Promptfoo 0.122.2',
  date: '2026-09-10', lastModified: '2026-09-10',
  description: 'Promptfoo preserved real Codex and Claude answers through database exports. A cited claim was still wrong. Our tests show what capture and review require.',
  section: 'oss-radar', layout: 'immersive', featured: false,
  tags: ['oss-radar', 'promptfoo', 'ai-evaluation', 'analytics'],
  images: [], slug: 'oss-radar-07-promptfoo',
  researchFootprint,
};

const sources = [
  {
    "claim": "The installed runner omitted citation fields in its built-in summary; custom capture retained them",
    "why": "Records the package identity, local setup, commands, outputs, and exclusions behind the verdict.",
    "ref": "Installed experiment method",
    "url": "https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/README.md",
    "date": "Sep 8, 2026"
  },
  {
    "claim": "Three fixture evaluations made two local HTTP requests and no live model calls",
    "why": "Keeps retention counts, zero API spend, and the blocked request beside their limits.",
    "ref": "Recorded measurements",
    "url": "https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/recorded/result.json",
    "date": "Sep 8, 2026"
  },
  {
    "claim": "The built-in cache retained the complete parsed fixture",
    "why": "Bounds the omission to the tested summary rather than every Promptfoo store.",
    "ref": "Saved cache entry",
    "url": "https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/recorded/transport-cache-entry.json",
    "date": "Sep 8, 2026"
  },
  {
    "claim": "Custom raw response text and evidence metadata survived summary export",
    "why": "Lets a reader inspect the preserved fields directly.",
    "ref": "Saved custom summary",
    "url": "https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/recorded/custom-capture.json",
    "date": "Sep 8, 2026"
  },
  {
    "claim": "Raw response: the response text retained by our capture provider before selecting answer and citation fields.",
    "why": "Shows the repair, the equality checks, and the network guard without hiding them behind prose.",
    "ref": "Runnable installed probe",
    "url": "https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/probe-installed.ts",
    "date": "Sep 8, 2026"
  },
  {
    "claim": "Triggers, request identity, citations, and source review require different records",
    "why": "Maps each question to an observer and records the prior art and unrun tests.",
    "ref": "Trigger and citation research",
    "url": "https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/04-trigger-provenance-and-ai-citations.md",
    "date": "Sep 8, 2026"
  },
  {
    "claim": "Source list / answer citation: provider-returned sources and references attached to an answer are distinct fields; a source entry alone need not be an answer citation.",
    "why": "Makes the planned denominators inspectable without presenting them as deployed analytics.",
    "ref": "Proposed measurement contract",
    "url": "https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/07-citation-measurement-contract.md",
    "date": "Sep 8, 2026"
  },
  {
    "claim": "Ten controlled cases retained final response text and all eleven attempts across exports",
    "why": "Records the failure matrix, database restart, installation difference, and the tested boundary.",
    "ref": "Capture and export experiment",
    "url": "https://github.com/gkoreli/blog/blob/5fc2dc5dc40ad2397a78325e3a192485b44e8cb5/packages/blog/drafts/research/oss-radar-07/repro/capture/README.md",
    "date": "Sep 8, 2026 (PDT)"
  },
  {
    "claim": "The retry's failed and successful attempts survived the restarted CLI export",
    "why": "Lets a reader check both attempts rather than relying on an aggregate pass count.",
    "ref": "Saved retry export",
    "url": "https://github.com/gkoreli/blog/blob/5fc2dc5dc40ad2397a78325e3a192485b44e8cb5/packages/blog/drafts/research/oss-radar-07/repro/capture/recorded/retry-cli-export.json",
    "date": "Sep 8, 2026 (PDT)"
  },
  {
    "claim": "The capture provider records field states and attempts before deriving the answer",
    "why": "Makes absent/empty states and charge limitations inspectable.",
    "ref": "Capture implementation",
    "url": "https://github.com/gkoreli/blog/blob/5fc2dc5dc40ad2397a78325e3a192485b44e8cb5/packages/blog/drafts/research/oss-radar-07/repro/capture/capture-provider.ts",
    "date": "Sep 8, 2026 (PDT)"
  },
  {
    "claim": "A saved attempt links to the local trace by explicit IDs",
    "why": "Contains the matching evaluation, test-case, trace, and target-span identifiers.",
    "ref": "Saved full export with trace",
    "url": "https://github.com/gkoreli/blog/blob/5fc2dc5dc40ad2397a78325e3a192485b44e8cb5/packages/blog/drafts/research/oss-radar-07/repro/capture/recorded/full-cli-export.json",
    "date": "Sep 8, 2026 (PDT)"
  },
  {
    "claim": "The runner supplies test roots and target context",
    "why": "Explains the local trace path exercised by the continuation.",
    "ref": "Evaluator tracing implementation",
    "url": "https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/tracing/evaluatorTracing.ts",
    "date": "Sep 8, 2026 (checked)"
  },
  {
    "claim": "The inspected implementation is MIT-licensed",
    "why": "Establishes the open-source terms for the code inspected here.",
    "ref": "Promptfoo license",
    "url": "https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/LICENSE",
    "date": "Sep 8, 2026 (checked)"
  },
  {
    "claim": "Evaluation: running defined cases and checking the returned answer or behavior.",
    "why": "Defines the application-testing scope against which this workload is judged.",
    "ref": "Pinned project overview",
    "url": "https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/README.md",
    "date": "Sep 8, 2026 (checked)"
  },
  {
    "claim": "Founders describe the move toward application security and commit to continued open-source development",
    "why": "Supplies their stated purpose and cross-provider commitment rather than an inferred roadmap.",
    "ref": "Founders' announcement",
    "url": "https://www.promptfoo.dev/blog/promptfoo-joining-openai/",
    "date": "Mar 9, 2026"
  },
  {
    "claim": "Red teaming: testing a target with generated adversarial cases and attack strategies.",
    "why": "Defines the adversarial-testing workflow; it was inspected, not exercised in this experiment.",
    "ref": "Red-team architecture",
    "url": "https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/site/docs/red-team/architecture.md",
    "date": "Sep 8, 2026 (checked)"
  },
  {
    "claim": "The red-team run connects case generation to evaluation",
    "why": "Checks the documented workflow against shipped orchestration code.",
    "ref": "Red-team run implementation",
    "url": "https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/redteam/shared.ts",
    "date": "Sep 8, 2026 (checked)"
  },
  {
    "claim": "Code scanning calls an agent service to perform a scan",
    "why": "Shows the service dependency behind the scanner's local entry point.",
    "ref": "Scanner implementation",
    "url": "https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/codeScan/scanner/index.ts",
    "date": "Sep 8, 2026 (checked)"
  },
  {
    "claim": "The GitHub Action runs scanning and handles review output",
    "why": "Locates code review within the development workflow.",
    "ref": "Scanner action implementation",
    "url": "https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/code-scan-action/src/main.ts",
    "date": "Sep 8, 2026 (checked)"
  },
  {
    "claim": "The runner added tracing and fuller usage accounting in August",
    "why": "Explains why execution records are relevant to this month's adoption question.",
    "ref": "Promptfoo 0.122.1",
    "url": "https://github.com/promptfoo/promptfoo/releases/tag/0.122.1",
    "date": "Aug 26, 2026"
  },
  {
    "claim": "The experiment installed runner version 0.122.2",
    "why": "Fixes the tested release separately from the scanner-action track.",
    "ref": "Promptfoo 0.122.2",
    "url": "https://github.com/promptfoo/promptfoo/releases/tag/0.122.2",
    "date": "Aug 28, 2026"
  },
  {
    "claim": "Promptfoo 0.123.0 shipped after the tested release",
    "why": "Marks the newer release separately from the installed experiments, which remain pinned to 0.122.2.",
    "ref": "Promptfoo 0.123.0",
    "url": "https://github.com/promptfoo/promptfoo/releases/tag/0.123.0",
    "date": "Sep 10, 2026"
  },
  {
    "claim": "The scanner action received installation and dependency hardening",
    "why": "Distinguishes recent maintenance from the scanner's earlier introduction.",
    "ref": "Scanner action 0.2.0",
    "url": "https://github.com/promptfoo/promptfoo/releases/tag/code-scan-action-0.2.0",
    "date": "Aug 28, 2026"
  },
  {
    "claim": "The scanner's engineering introduction predates August",
    "why": "Provides the original design account and prevents a false launch chronology.",
    "ref": "Building a security scanner for LLM apps",
    "url": "https://www.promptfoo.dev/blog/building-a-security-scanner-for-llm-apps/",
    "date": "Dec 16, 2025"
  },
  {
    "claim": "Promptfoo identifies itself as part of OpenAI",
    "why": "Records the project's current affiliation without inventing an acquisition closing date.",
    "ref": "Promptfoo about page",
    "url": "https://www.promptfoo.dev/about/",
    "date": "Sep 10, 2026 (checked, PDT)"
  },
  {
    "claim": "OpenAI announced a plan to integrate Promptfoo capabilities into Frontier",
    "why": "Sources the buyer's stated direction; it does not verify completion of that integration.",
    "ref": "OpenAI acquisition announcement",
    "url": "https://openai.com/index/openai-to-acquire-promptfoo/",
    "date": "Mar 9, 2026"
  },
  {
    "claim": "The scanner action defaults to Promptfoo's cloud API",
    "why": "Shows why an open-source entry point does not make every feature an offline workflow.",
    "ref": "Scanner action configuration",
    "url": "https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/code-scan-action/action.yml",
    "date": "Sep 8, 2026 (checked)"
  },
  {
    "claim": "Provider adapter: code that calls a model or application and returns the fields Promptfoo evaluates.",
    "why": "Establishes the supported extension point used by the prototype.",
    "ref": "Custom-provider documentation",
    "url": "https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/site/docs/providers/custom-api.md",
    "date": "Sep 8, 2026 (checked)"
  },
  {
    "claim": "The OpenRouter adapter normalizes the provider response",
    "why": "Locates the smaller response object that the evaluator receives.",
    "ref": "OpenRouter provider implementation",
    "url": "https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/providers/openrouter.ts",
    "date": "Sep 8, 2026 (checked)"
  },
  {
    "claim": "Provider responses may carry raw data and arbitrary metadata",
    "why": "Explains why preserving the fixture required capture code without a framework fork.",
    "ref": "Provider response contract",
    "url": "https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/contracts/providers.ts",
    "date": "Sep 8, 2026 (checked)"
  },
  {
    "claim": "The telemetry opt-out can still initiate a disabled-event beacon",
    "why": "Explains the attempted request recorded by the guarded probe.",
    "ref": "Telemetry implementation",
    "url": "https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/telemetry.ts",
    "date": "Sep 8, 2026 (checked)"
  },
  {
    "claim": "An upstream user reported the opt-out beacon; the issue remained open",
    "why": "Adds an independently reported failure path, checked against code and our installed run.",
    "ref": "Promptfoo issue #9968",
    "url": "https://github.com/promptfoo/promptfoo/issues/9968",
    "date": "Sep 10, 2026 (checked, PDT)"
  },
  {
    "claim": "Citation analytics: counts and trends over observed citations, with a declared coverage boundary.",
    "why": "Bounds our novelty claim and shows the limits of a provider-defined citation view.",
    "ref": "Bing AI Performance preview",
    "url": "https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview",
    "date": "Feb 10, 2026"
  },
  {
    "claim": "Trigger / responsibility: the event starting an activity differs from the agent responsible for it.",
    "why": "Provides a stable vocabulary for task history without collapsing it into a human/bot label.",
    "ref": "W3C PROV-DM",
    "url": "https://www.w3.org/TR/2013/REC-prov-dm-20130430/",
    "date": "Apr 30, 2013"
  },
  {
    "claim": "The human/bot binary is contested in bot-authentication design",
    "why": "Records a concrete prior argument; this individual draft is not an agreed standard.",
    "ref": "Web Bot Auth use-case draft, Appendix A.4",
    "url": "https://datatracker.ietf.org/doc/html/draft-nottingham-webbotauth-use-cases-02#appendix-A.4",
    "date": "Apr 1, 2026"
  },
  {
    "claim": "Verified request identity: a signed request can identify its key holder; it does not establish a fresh human action or a citation.",
    "why": "Bounds what verified request identity can establish; the document remains a draft.",
    "ref": "HTTP Message Signatures for automated traffic, §4.6",
    "url": "https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-00#section-4.6",
    "date": "Sep 1, 2026"
  },
  {
    "claim": "Citation faithfulness: whether the model actually relied on the cited source.",
    "why": "Separates support review from causal attribution; its tested systems do not establish 2026 model-wide rates.",
    "ref": "Wallat et al., Correctness is not Faithfulness in RAG Attributions",
    "url": "https://arxiv.org/abs/2412.18004",
    "date": "Dec 23, 2024"
  },
  {
    "claim": "Citation support: whether a cited source supports the associated claim.",
    "why": "Provides the ALCE research basis for source-support evaluation, the real-answer review applies an explicitly narrower rubric.",
    "ref": "Gao et al., Enabling Large Language Models to Generate Text with Citations",
    "url": "https://aclanthology.org/2023.emnlp-main.398/",
    "date": "Dec 2023"
  },
  {
    "claim": "Real CLI capture: final answer and emitted tool records retained through Promptfoo exports",
    "why": "Shows the two subscription-backed runs, executable wrapper, reported usage, and preservation checks.",
    "ref": "Real CLI experiment",
    "url": "https://github.com/gkoreli/blog/blob/9d99ae8fac8fefc24fc45b4a962ef776d122f405/packages/blog/drafts/research/oss-radar-07/repro/cli/README.md",
    "date": "Sep 10, 2026 (PDT)"
  },
  {
    "claim": "Source review found a wrong denominator and two other material errors in Claude’s answer",
    "why": "Links both unchanged answers, source copies, tool events, and explicit review judgments.",
    "ref": "Real-answer source review",
    "url": "https://github.com/gkoreli/blog/blob/9d99ae8fac8fefc24fc45b4a962ef776d122f405/packages/blog/drafts/research/oss-radar-07/21-real-answer-source-review.md",
    "date": "Sep 10, 2026 (PDT)"
  },
  {
    "claim": "Codex accepts ChatGPT subscription sign-in for local work",
    "why": "Establishes the authentication route used by the installed client.",
    "ref": "Codex authentication",
    "url": "https://developers.openai.com/codex/auth/",
    "date": "Sep 11, 2026 (checked, UTC)"
  },
  {
    "claim": "Codex exec runs scripts with saved CLI authentication",
    "why": "Documents the non-interactive command and emitted JSONL events.",
    "ref": "Codex non-interactive mode",
    "url": "https://developers.openai.com/codex/noninteractive/",
    "date": "Sep 11, 2026 (checked, UTC)"
  },
  {
    "claim": "Claude -p continues to use subscription limits under the current notice",
    "why": "The top update pauses the proposed billing change; the older section below it is superseded.",
    "ref": "Claude subscription notice",
    "url": "https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan",
    "date": "Jun 16, 2026; checked Sep 11 UTC"
  },
  {
    "claim": "Promptfoo’s native Codex SDK provider supports saved login and retains its turn",
    "why": "Bounds the OpenRouter finding: another built-in adapter already preserves different evidence.",
    "ref": "Native Codex provider",
    "url": "https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/providers/openai/codex-sdk.ts",
    "date": "Sep 11, 2026 (checked, UTC)"
  },
  {
    "claim": "Promptfoo’s native Claude SDK provider supports subscription login with apiKeyRequired: false",
    "why": "Distinguishes its final-result capture from the complete CLI stdout retained in our experiment.",
    "ref": "Native Claude provider",
    "url": "https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/providers/claude-agent-sdk.ts",
    "date": "Sep 11, 2026 (checked, UTC)"
  }
];

export function preamble() {
  return OssRadarHero({
    issueNum: 'Issue #07', date: 'September 2026',
    tags: 'open source · AI evaluation · citations · analytics',
    title: html`<h1>Promptfoo: Can It Preserve the Evidence <em>Behind an AI Answer?</em></h1>`,
    subtitle: 'Real Codex and Claude answers, saved tool records, and a citation error we could trace back to the source.',
    author: 'Goga Koreli', readTime: '14 min read', canvasMode: 'evidence', canvasSeed: 7,
    footprint: { label: `${(researchFootprint.totalTokens / 1_000_000).toFixed(1)}M measured tokens · partial footprint`, url: '/oss-radar-07-promptfoo/prompts#research-footprint' },
  });
}

export function article() {
  return html`<article class="post-content">
<p class="post-lede">Promptfoo is a useful runner for checking cited AI answers when you capture the evidence and review the sources. On September 10, we ran Codex and Claude Code through our existing subscriptions. Both real answers survived Promptfoo 0.122.2&#39;s database and JSON exports. Claude&#39;s answer still misread a key number: 277 requests had been reclassified, but it called all 277 cloud-classified. The saved answer and tool records let us examine the mistake. <a href="https://github.com/gkoreli/blog/blob/9d99ae8fac8fefc24fc45b4a962ef776d122f405/packages/blog/drafts/research/oss-radar-07/repro/cli/README.md" target="_blank" rel="noopener">Experiment and records</a>; <a href="https://github.com/gkoreli/blog/blob/9d99ae8fac8fefc24fc45b4a962ef776d122f405/packages/blog/drafts/research/oss-radar-07/21-real-answer-source-review.md" target="_blank" rel="noopener">source review</a>.</p>
<ul>
<li><strong>Real answers survived the evaluation pipeline.</strong> A custom provider retained the final text and emitted CLI records through both JSON exporters, including a process reopening the database.</li>
<li><strong>A citation can accompany a wrong claim.</strong> Claude preserved the article&#39;s headline figures but changed their meaning in one sentence. The source review also caught an incorrect description of the classifier.</li>
<li><strong>Capture depends on the adapter.</strong> In a separate controlled test, the OpenRouter connector omitted supplied citation fields from its summary while its cache retained them. The runner can preserve evidence that its adapter supplies.</li>
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
<p>The MIT runner is inspectable and extensible, while some features still depend on a service: the scanner&#39;s <a href="https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/code-scan-action/action.yml" target="_blank" rel="noopener">default API host</a> is Promptfoo&#39;s cloud. That distinction gives the project two roles: a local evaluation runner you can extend, and an entry point to connected security services. Our citation experiment uses the former.</p>
<h2>Citation analytics needs the answer</h2>
<p>Our <a href="/first-party-analytics-for-a-personal-blog">blog analytics</a> can record requests that reach the site. A citation exists in an answer somewhere else. Bringing those observations together starts with preserving what each system can see.</p>
<p>AI citations are a topic; counting them is analytics, and checking whether their sources support an answer is evaluation. There is already publisher-facing prior art. Microsoft&#39;s <a href="https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview" target="_blank" rel="noopener">AI Performance preview</a>, announced February 10, reports citation activity across its supported AI surfaces and selected partners. Its coverage is defined by that product. It does not audit every cited claim.</p>
<p>For a publisher investigating an answer, the useful record is the question, answer, cited source, and a review of the associated claims. Request logs supply another observation when a connection can be established. They cannot reconstruct an answer that was never captured.</p>
<h2>Where provider evidence enters the result</h2>
<p>Promptfoo&#39;s <a href="https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/site/docs/providers/custom-api.md" target="_blank" rel="noopener">custom-provider interface</a> lets an operator bring an application into the runner. It separates the application call from the test runner, so an adapter can retain evidence specific to its provider.</p>
<p>The adapter and experiment sections are for engineers choosing or implementing this path. The pinned <a href="https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/providers/openrouter.ts" target="_blank" rel="noopener">OpenRouter provider</a> sends the request through a cache-aware transport, then builds a smaller response from answer text, usage, and completion information. It does not copy the fixture&#39;s citation list or answer annotations into that response. The evaluator receives the smaller object.</p>
<p>The shared <a href="https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/contracts/providers.ts" target="_blank" rel="noopener">response contract</a> allows both <code>raw</code> and arbitrary metadata. An adapter can use those fields to retain the original response alongside the answer being evaluated. The export checks below test that path.</p>
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
<p>The fixture&#39;s repeated URL is one source, not two lost citations. Its annotation offsets are not validated, and the text assertion checks transport rather than truth. Tracing, database persistence, CLI export, streaming, failure handling, and live billing were outside that original check. The failure and export checks below cover several of those gaps. The <a href="https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/repro/installed/recorded/result.json" target="_blank" rel="noopener">recorded result</a> keeps those limits beside the measurements.</p>
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
<p>A trace still describes only the participating system. We did not capture a remote provider&#39;s retrieval history, and the two retry attempts live in our metadata rather than separate spans. The fixture&#39;s reported cost remains invented. These controlled checks establish local retention and joins. The real CLI experiment below tests a different capture representation; neither experiment reconciles an invoice.</p>
<h2>Real answers through ChatGPT and Claude subscriptions</h2>
<p>The same runner also preserved real answers from subscription-backed coding agents. We asked Codex and Claude Code to explain <a href="/how-i-separate-readers-from-bots-without-javascript">what this blog measured about readers and bots</a>, cite the measurements, and state what the comparison with Cloudflare established. Each client received the same question once, in a fresh session with web tools. Both finished, and both records survived a database restart. <a href="https://github.com/gkoreli/blog/blob/9d99ae8fac8fefc24fc45b4a962ef776d122f405/packages/blog/drafts/research/oss-radar-07/repro/cli/README.md" target="_blank" rel="noopener">Full question, answers, settings, and checks</a>.</p>
<div class="compare-table-scroll"><table class="compare-table" style="min-width:44rem">
<thead>
<tr>
<th>Client</th>
<th>Actual run</th>
<th>Preserved by Promptfoo</th>
<th>Source review</th>
</tr>
</thead>
<tbody><tr>
<td>Codex CLI 0.153.4, GPT-6 Astra</td>
<td>One answer, seven emitted CLI events</td>
<td>Final answer, complete stdout, capture metadata</td>
<td>Kept the measured units and the article&#39;s limits</td>
</tr>
<tr>
<td>Claude Code 2.1.260, Opus 5</td>
<td>One answer, 41 emitted CLI events; five WebFetch calls</td>
<td>The same fields through both exporters</td>
<td>Retained headline figures but changed the 277-request denominator</td>
</tr>
</tbody></table></div>
<p>Claude&#39;s answer said that 60 of 277 cloud-classified requests passed the navigation checks. The article says 277 requests were <strong>reclassified in total</strong>, and that 60 cloud-classified requests passed the checks. Those are different populations. Its earlier fetch summary called 277 the reclassified population correctly; the changed denominator appears in the final answer. The <a href="https://github.com/gkoreli/blog/blob/9d99ae8fac8fefc24fc45b4a962ef776d122f405/packages/blog/drafts/research/oss-radar-07/21-real-answer-source-review.md" target="_blank" rel="noopener">reviewed source and answer</a> let a reader check the difference.</p>
<p>The tool record exposed another mistake that the final answer did correct. One WebFetch summary turned the two-day measurement window into <code>00:00 through 06:00 UTC</code>. A later extraction restored September 4 00:00 through September 6 00:00. These are summaries produced by a model, not exact copies of page HTML. Keeping them alongside the final answer makes an extraction error distinguishable from an error still present in the answer. Claude&#39;s result also reports Haiku usage for the fetching workflow, beyond the named Opus model.</p>
<p>A ChatGPT or Claude subscription can supply these experiments through the official coding clients. <a href="https://developers.openai.com/codex/auth/" target="_blank" rel="noopener">Codex supports ChatGPT sign-in</a> and <a href="https://developers.openai.com/codex/noninteractive/" target="_blank" rel="noopener">scripted execution with saved authentication</a>; <a href="https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan" target="_blank" rel="noopener">Anthropic's current notice</a> includes <code>claude -p</code> within subscription usage. We bought no API credits. Claude reported a list-price cost of $0.2654145; that field is not an observed subscription charge.</p>
<p>Promptfoo already has native integrations: its <a href="https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/providers/openai/codex-sdk.ts" target="_blank" rel="noopener">Codex SDK provider</a> accepts saved login and retains a serialized turn; its <a href="https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/providers/claude-agent-sdk.ts" target="_blank" rel="noopener">Claude Agent SDK provider</a> supports subscription login with <code>apiKeyRequired: false</code>, retaining the final result and selected metadata. We inspected those paths. The experiment used a custom provider calling the installed CLIs so we could retain the entire emitted stdout, including intermediate tool records. It did not test the native SDK providers or capture raw service HTTP responses.</p>
<p>These two directed answers demonstrate a working capture and review method. The question supplied the article URL; the run does not measure organic discovery, rank the models, or prove that a fresh request reached our site. Promptfoo preserved the evidence needed to find the error. Source review supplied the judgment.</p>
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
<h2>Where Promptfoo leaves work to the operator</h2>
<p>Promptfoo supplies execution, assertions, storage, and exports. The operator still has to choose what to capture and how to judge source support. Our real runs used no automatic correctness assertion: a successfully stored answer could still contain the errors found in review.</p>
<p>Our <a href="https://github.com/gkoreli/blog/blob/5fc2dc5dc40ad2397a78325e3a192485b44e8cb5/packages/blog/drafts/research/oss-radar-07/repro/capture/capture-provider.ts" target="_blank" rel="noopener">capture provider</a> saves request text and each decoded response before selecting fields. It records missing citation fields separately from empty lists and leaves charge unknown when the response does not expose it. Even a provider-reported charge needs reconciliation with its billing record. Source review needs its own claim boundaries and support rubric. Earlier work such as <a href="https://aclanthology.org/2023.emnlp-main.398/" target="_blank" rel="noopener">ALCE</a> gives citation evaluation a research basis; a returned URL alone is not a support judgment.</p>
<p>The <a href="https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/07-citation-measurement-contract.md" target="_blank" rel="noopener">proposed measurement contract</a> keeps counts honest. Citation presence uses assessable answers as its denominator and reports observation coverage alongside it. Support uses reviewed claim–citation relationships. Requests, unique URLs, citation occurrences, and people never become interchangeable units. A capture hash helps detect changed bytes; it does not authenticate the provider or make an answer true.</p>
<p>Collection also needs a known network boundary. Our first attempt encountered an unexpected telemetry request despite the opt-out. The final probe blocked one such POST before transmission, matching the pinned <a href="https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/telemetry.ts" target="_blank" rel="noopener">telemetry implementation</a> and the <a href="https://github.com/promptfoo/promptfoo/issues/9968" target="_blank" rel="noopener">upstream report</a>, still open at publication. This does not establish prompt disclosure. It does mean the opt-out alone was insufficient for this restricted local run. The method records the interruption and the guard.</p>
<p>The extra code in these experiments captures provider-specific records; Promptfoo handles the evaluation and persistence. That is a useful division when you need repeatable cases and comparisons. For a single answer you only want to save, a direct CLI script needs fewer parts.</p>
<h2>When to use Promptfoo</h2>
<p>Use Promptfoo when you need repeatable tests, assertions, and saved results across models or applications, and can verify the adapter&#39;s capture behavior. Its extension interface and exporters preserved both controlled failures and real CLI answers in these tests. If you need citation checking with no capture code or source-review work, it does not supply that workflow by itself. For a one-off answer archive, use the CLI directly.</p>
<hr>

<section id="sources-and-evidence" aria-label="Glossary and sources">
<h2 id="glossary">Glossary &amp; sources</h2>
<p>Definitions and supporting evidence share one table. Dates are publication dates unless marked <strong>checked</strong>. Promptfoo code links refer to the tested 0.122.2 baseline. The experiment records distinguish controlled responses, real CLI output, and source review.</p>
<div class="compare-table-scroll"><table class="compare-table" style="min-width:44rem">
<thead><tr><th>Term or finding</th><th>Source and why it matters</th><th>Date</th></tr></thead>
<tbody>${sources.map(s => html`<tr><td>${s.claim}</td><td><a href="${s.url}" target="_blank" rel="noopener">${s.ref}</a><p>${s.why}</p></td><td>${s.date}</td></tr>`)}</tbody>
</table></div>
<h3>Research record</h3>
<p>The <a href="https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-07/00-worklist-index.md" target="_blank" rel="noopener">worklist</a> links the experiments, research notes, and open work. The <a href="https://github.com/gkoreli/blog/blob/main/packages/blog/prompts/oss-radar-07-promptfoo.prompts.md" target="_blank" rel="noopener">verbatim shaping prompts</a> are preserved for this issue at the author&#39;s request. The methods record the runtimes, dependency lock, scripts, results, and failed setup attempts. Codex executed the experiments for this article; Goga supplied the workload and editorial direction. A <a href="/oss-radar-07-promptfoo/prompts#research-footprint">partial research footprint</a> records 43,272,331 tokens across eight recovered Codex sessions. The original ChatGPT research, mixed analytics/publication conversation, and subsequent real CLI experiments and reviews are excluded. The original fifteen-prompt snapshot remains frozen; the prompt page includes two later requests. The <a href="https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-07/19-research-footprint.md" target="_blank" rel="noopener">accounting method and exclusions</a> explain the measured portion; human hands-on time remains unmeasured.</p>

</section>
</article>`;
}
