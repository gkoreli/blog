import { staticHtml as html } from '@nisli/core/static';
import type { PostMeta } from '../src/lib/frontmatter.js';
import { OssRadarHero } from '../src/templates/components.js';

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
  "scope": "Measured portion of the earlier Promptfoo investigation: recovered Codex research, canvas work, automatic reviews, publication checks, sharing preparation, and accounting. Original ChatGPT research has no recovered usage log. The mixed analytics/publication parent and one review without usage are excluded. These are contributing-session totals, not the complete research total or an exclusive writing cost. This frozen snapshot covered 15 human prompts. It excludes the subsequent AI-citations cohort rewrite, later real CLI experiments, follow-up reviews, and claim corrections; the prompt page includes those later requests."
};

export const meta: PostMeta = {
  title: "OSS Radar #07: AI Citations — Do Agents Preserve the Evidence Behind an Answer?",
  seoTitle: 'AI Citations: Open Source Tools, Evidence, and Trust',
  alternativeHeadline: 'Open-source research agents, citation checks, and credible engineering sources',
  date: '2026-09-10', lastModified: '2026-09-22',
  description: 'OpenScholar, STORM, TruLens, and real Codex/Claude runs show where AI citations improve, where they fail, and what makes engineering evidence useful.',
  section: 'oss-radar', layout: 'immersive', featured: false,
  tags: ['oss-radar', 'ai-citations', 'open-source', 'ai-agents', 'source-attribution', 'analytics'],
  images: [], slug: 'oss-radar-07-ai-citations',
  researchFootprint,
};

const sources = [
  {
    "claim": "STORM: organization and verifiability are separate outcomes",
    "why": "Table 6 supplies the paired editor study, rating scale, and observed shares.",
    "ref": "STORM, Shao et al.",
    "url": "https://aclanthology.org/2024.naacl-long.347.pdf",
    "date": "Jun 2024"
  },
  {
    "claim": "OpenScholar: reported scores for scientific synthesis",
    "why": "Table 1 compares retrieval pipelines; its scores are not measurements of current blog discovery.",
    "ref": "OpenScholar, Asai et al.",
    "url": "https://www.nature.com/articles/s41586-025-10072-4",
    "date": "Feb 4, 2026"
  },
  {
    "claim": "Citation F1 combines citation precision and recall; it is not the fraction of citations that are correct",
    "why": "Defines the citation evaluator and sentence exclusions; the research audit records the unconfirmed final F1 aggregation.",
    "ref": "OpenScholar supplementary methods",
    "url": "https://media.springernature.com/original/springer-static/esm/art%3A10.1038%2Fs41586-025-10072-4/MediaObjects/41586_2025_10072_MOESM1_ESM.pdf",
    "date": "Feb 2026"
  },
  {
    "claim": "OpenScholar retains an initial answer and runs bounded feedback and attribution steps",
    "why": "Shows which revision and additional-retrieval paths are enabled by configuration.",
    "ref": "OpenScholar implementation",
    "url": "https://github.com/AkariAsai/OpenScholar/blob/0e9b8fb912273d3dae39e593da86e4f6d3bf8de1/src/open_scholar.py#L527-L708",
    "date": "Sep 11, 2026 (checked)"
  },
  {
    "claim": "Source ranking may include paper citation counts",
    "why": "Makes one source-popularity preference explicit in code.",
    "ref": "OpenScholar ranking adjustment",
    "url": "https://github.com/AkariAsai/OpenScholar/blob/0e9b8fb912273d3dae39e593da86e4f6d3bf8de1/src/open_scholar.py#L40-L60",
    "date": "Sep 11, 2026 (checked)"
  },
  {
    "claim": "Agentic research can change its questions and retrieve evidence during the task",
    "why": "Retains the queries, retrieved information, and generated research answer.",
    "ref": "STORM knowledge curation",
    "url": "https://github.com/stanford-oval/storm/blob/fb951af7744dab086e34962e9bc6fe878e145f83/knowledge_storm/storm_wiki/modules/knowledge_curation.py#L204-L243",
    "date": "Sep 11, 2026 (checked)"
  },
  {
    "claim": "Retrieved context: the material actually supplied to a generation step",
    "why": "Shows numbered snippets and the 1,500-word information limit.",
    "ref": "STORM section writing",
    "url": "https://github.com/stanford-oval/storm/blob/fb951af7744dab086e34962e9bc6fe878e145f83/knowledge_storm/storm_wiki/modules/article_generation.py#L144-L174",
    "date": "Sep 11, 2026 (checked)"
  },
  {
    "claim": "STORM reconciles citation numbers by source URL",
    "why": "Preserves a consistent source identity across separately written sections.",
    "ref": "STORM reference merging",
    "url": "https://github.com/stanford-oval/storm/blob/fb951af7744dab086e34962e9bc6fe878e145f83/knowledge_storm/storm_wiki/modules/storm_dataclass.py#L188-L207",
    "date": "Sep 11, 2026 (checked)"
  },
  {
    "claim": "Co-STORM can use previously unused material to ask its next question",
    "why": "Explains the moderator through its inputs and action rather than its role name.",
    "ref": "Co-STORM grounded-question generator",
    "url": "https://github.com/stanford-oval/storm/blob/fb951af7744dab086e34962e9bc6fe878e145f83/knowledge_storm/collaborative_storm/modules/grounded_question_generation.py#L81-L115",
    "date": "Sep 11, 2026 (checked)"
  },
  {
    "claim": "Post-hoc citation: a reference attached after the answer text exists",
    "why": "Shows citation insertion without an entailment acceptance test in that path.",
    "ref": "ALCE citation insertion",
    "url": "https://github.com/princeton-nlp/ALCE/blob/246c476a4edfc564266b7346b6e29ef4861ae937/post_hoc_cite.py#L38-L70",
    "date": "Sep 11, 2026 (checked)"
  },
  {
    "claim": "Citation precision and recall assess references and support coverage under a stated policy",
    "why": "Checks cited passages jointly and examines each reference’s contribution.",
    "ref": "ALCE evaluator",
    "url": "https://github.com/princeton-nlp/ALCE/blob/246c476a4edfc564266b7346b6e29ef4861ae937/eval.py#L340-L429",
    "date": "Sep 11, 2026 (checked)"
  },
  {
    "claim": "Reflection tokens let a generator score relevance, support, and utility",
    "why": "Exposes weighted scores and retrieval modes while retaining the supplied-context boundary.",
    "ref": "Self-RAG long-form decoder",
    "url": "https://github.com/AkariAsai/self-rag/blob/1fcdc420e48f50a7d7ab1ece5494221b93252e99/retrieval_lm/run_long_form_static.py#L72-L238",
    "date": "Sep 11, 2026 (checked)"
  },
  {
    "claim": "Citation correctness: whether the particular cited source supports its attached claim",
    "why": "Separates wrong-source attribution from policies that also penalize missing citations.",
    "ref": "TruLens citation criteria",
    "url": "https://github.com/truera/trulens/blob/72d60ce6c1af6f9a479bdc8f99d69796340d459a/src/feedback/trulens/feedback/templates/rag.py#L299-L502",
    "date": "Sep 11, 2026 (checked)"
  },
  {
    "claim": "DeepEval supplies a community citation metric with an overall verdict",
    "why": "Shows the numbered-input path and faithful/unfaithful score mapping.",
    "ref": "DeepEval citation metric",
    "url": "https://github.com/confident-ai/deepeval/blob/f94d940c1e5afc4b280420fe73fe17d146274018/deepeval/metrics/community/citation_faithfulness/citation_faithfulness.py",
    "date": "Sep 11, 2026 (checked)"
  },
  {
    "claim": "A supported claim can still cite the wrong passage",
    "why": "Explicitly checks each marker against its named passage.",
    "ref": "DeepEval citation prompt",
    "url": "https://github.com/confident-ai/deepeval/blob/f94d940c1e5afc4b280420fe73fe17d146274018/deepeval/metrics/community/citation_faithfulness/template.py#L15-L34",
    "date": "Sep 11, 2026 (checked)"
  },
  {
    "claim": "Quote matching checks whether quoted text occurs in supplied material",
    "why": "Shows concatenation and substring matching without citation-marker resolution.",
    "ref": "Ragas quoted-span utility",
    "url": "https://github.com/vibrantlabsai/ragas/blob/298b68274234c060deacab3cf5fb52aa3a20e885/src/ragas/metrics/collections/quoted_spans/util.py#L35-L66",
    "date": "Sep 11, 2026 (checked)"
  },
  {
    "claim": "Context faithfulness: judged support for answer statements within supplied context",
    "why": "Separates model-based statement support from string matching and cited-source identity.",
    "ref": "Ragas faithfulness implementation",
    "url": "https://github.com/vibrantlabsai/ragas/blob/298b68274234c060deacab3cf5fb52aa3a20e885/src/ragas/metrics/collections/faithfulness/metric.py#L116-L159",
    "date": "Sep 11, 2026 (checked)"
  },
  {
    "claim": "Two real subscription-backed answers and their emitted records survived capture",
    "why": "Retains the exact question, execution method, unchanged answers, and database/export checks.",
    "ref": "Codex and Claude Code experiment",
    "url": "https://github.com/gkoreli/blog/blob/9d99ae8fac8fefc24fc45b4a962ef776d122f405/packages/blog/drafts/research/oss-radar-07/repro/cli/README.md",
    "date": "Sep 10, 2026 (PDT)"
  },
  {
    "claim": "Claude cited the article while misdescribing the 277-request population",
    "why": "Makes the source-support judgments and their limits inspectable.",
    "ref": "Review against retained sources",
    "url": "https://github.com/gkoreli/blog/blob/9d99ae8fac8fefc24fc45b4a962ef776d122f405/packages/blog/drafts/research/oss-radar-07/21-real-answer-source-review.md",
    "date": "Sep 10, 2026 (PDT)"
  },
  {
    "claim": "Capture metadata can retain evidence alongside the answer being evaluated",
    "why": "Defines the extension path used by the real CLI experiment.",
    "ref": "Promptfoo custom-provider interface",
    "url": "https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/contracts/providers.ts#L62-L83",
    "date": "Sep 11, 2026 (checked)"
  },
  {
    "claim": "Trace: a record of instrumented operations and their relationships",
    "why": "Associates an evaluation and its annotator kind with a recorded span.",
    "ref": "Phoenix span annotations",
    "url": "https://github.com/Arize-ai/phoenix/blob/d69a92e16ac29dc8a7a7262aa18ddeaccfea2b70/src/phoenix/db/models.py#L1284-L1326",
    "date": "Sep 11, 2026 (checked)"
  },
  {
    "claim": "Phoenix’s platform uses Elastic License 2.0",
    "why": "Keeps the source-available comparator distinct from the permissively licensed projects.",
    "ref": "Phoenix license",
    "url": "https://github.com/Arize-ai/phoenix/blob/d69a92e16ac29dc8a7a7262aa18ddeaccfea2b70/LICENSE",
    "date": "Sep 11, 2026 (checked)"
  },
  {
    "claim": "Causal citation faithfulness asks whether the cited source influenced the claim",
    "why": "Defines the distinction and reports the conditional adversarial experiment, including excluded changed-answer cases.",
    "ref": "Wallat et al., Correctness Is Not Faithfulness",
    "url": "https://staff.fnwi.uva.nl/m.derijke/wp-content/papercite-data/pdf/wallat-2025-correctness.pdf",
    "date": "Jul 2025"
  },
  {
    "claim": "Source identity can affect choices among supplied candidates",
    "why": "Controls source labels and content; does not measure organic engineering-blog discovery.",
    "ref": "Khan et al., ICLR source-preference study",
    "url": "https://www.microsoft.com/en-us/research/wp-content/uploads/2026/04/khan26_iclr.pdf",
    "date": "2026"
  },
  {
    "claim": "Google AI-search eligibility uses ordinary search requirements",
    "why": "States index/snippet eligibility and that no special AI file or schema is required.",
    "ref": "Google AI features and your website",
    "url": "https://developers.google.com/search/docs/appearance/ai-features",
    "date": "Sep 11, 2026 (checked)"
  },
  {
    "claim": "Original work, methods, and authorship are documented publisher recommendations",
    "why": "Supports inspectable publishing practices without promising a ranking formula.",
    "ref": "Google helpful-content guidance",
    "url": "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
    "date": "Sep 11, 2026 (checked)"
  },
  {
    "claim": "Requests, citations, source support, and readership are different units",
    "why": "Separates observations and denominators; this is a design, not deployed citation analytics.",
    "ref": "Proposed citation measurement contract",
    "url": "https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/07-citation-measurement-contract.md",
    "date": "Sep 8, 2026"
  },
  {
    "claim": "Publisher citation analytics measures appearances within defined product coverage",
    "why": "Defines citation counts and cited-page metrics without claiming a source-support audit.",
    "ref": "Bing AI Performance announcement",
    "url": "https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview",
    "date": "Feb 10, 2026"
  },
  {
    "claim": "Selected-project inventory and full research record",
    "why": "Links the primary-source audits, pinned repositories, actual runs, and rejected headline comparisons.",
    "ref": "OSS Radar #07 worklist",
    "url": "https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-07/00-worklist-index.md",
    "date": "Sep 11, 2026"
  }
];

export function preamble() {
  return OssRadarHero({
    issueNum: 'Issue #07', date: 'September 2026',
    tags: 'open source · AI citations · research agents · attribution',
    title: html`<h1>AI Citations: Do Agents Preserve the Evidence <em>Behind an Answer?</em></h1>`,
    subtitle: 'How citations can misrepresent evidence, and what open-source tools can check, improve, and preserve.',
    author: 'Goga Koreli', readTime: '15 min read', canvasMode: 'evidence', canvasSeed: 7,
    footprint: { label: `${(researchFootprint.totalTokens / 1_000_000).toFixed(1)}M tokens from earlier research · partial footprint`, url: '/oss-radar-07-ai-citations/prompts#research-footprint' },
  });
}

export function article() {
  return html`<article class="post-content">
<p class="post-lede">In a 2025 experiment, <strong>the AI model Command-R+ newly cited a deliberately altered document in 273 of 476 comparable cases: 57.4%.</strong> Researchers copied a short phrase from its answer into a relevant document it had left uncited, then asked again. Of 702 attempted cases, 476 repeated the original statement; 273 of those cited the altered document. <a href="https://staff.fnwi.uva.nl/m.derijke/wp-content/papercite-data/pdf/wallat-2025-correctness.pdf" target="_blank" rel="noopener">Study, Figure 6</a>.</p>
<ul>
<li><strong>A citation needs a source check.</strong> Does the particular document support the claim? TruLens, DeepEval, and ALCE provide ways to ask that question.</li>
<li><strong>Research quality and citation quality need separate assessment.</strong> OpenScholar improves reported citation scores through a fuller research process. STORM&#39;s human reviewers rated its articles as better organized without a corresponding gain in verifiability.</li>
<li><strong>Our own captured answer exposed a different failure.</strong> Claude cited my blog and repeated a number while changing what it counted. Preserving the answer let us compare it with the source.</li>
</ul>
<p>I want agents to cite this blog. I also want readers to find evidence for what those agents say. These projects address different parts of that problem: selecting sources, checking claims, and retaining the records. Their results help decide what to build into a citation-checking workflow.</p>
<h2>How a document became a source after it was altered</h2>
<p>In a separate random-document test, researchers appended “Carl Weathers” to a document about Nixon&#39;s 1974 State of the Union address. Command-R+ then cited it for who played Apollo Creed in <em>Rocky</em>. That example illustrates the method; the <strong>57.4%</strong> comes from the relevant-but-uncited condition. <a href="https://staff.fnwi.uva.nl/m.derijke/wp-content/papercite-data/pdf/wallat-2025-correctness.pdf" target="_blank" rel="noopener">Figures 5–6 and Example 4</a>.</p>
<p>Wallat and colleagues investigate <strong>citation post-rationalization</strong>: attaching a source to an answer rather than deriving the answer from that source. The inserted text might itself influence generation; the follow-up tests do not establish every answer&#39;s origin. <a href="https://staff.fnwi.uva.nl/m.derijke/wp-content/papercite-data/pdf/wallat-2025-correctness.pdf" target="_blank" rel="noopener">Section 5.3</a>.</p>
<p>For builders, I would separate two questions: <strong>Does the source support this claim? Did the source cause the model to make it?</strong> A correct answer can still have a misleading citation. This is an attribution problem; it does not establish intent to deceive or require the answer itself to be false. The useful first check is the claim against its named source; causal attribution needs a separate experiment.</p>
<h2>Our experiment: the number stayed, its meaning changed</h2>
<p>Our blog experiment found a source-support error without altering any source. On September 10, Codex and Claude Code each received one question with the URL of my <a href="/how-i-separate-readers-from-bots-without-javascript">browser-and-bot classification article</a>. Promptfoo ran the official clients through our existing subscriptions and retained their answers. <a href="https://github.com/gkoreli/blog/blob/9d99ae8fac8fefc24fc45b4a962ef776d122f405/packages/blog/drafts/research/oss-radar-07/repro/cli/README.md" target="_blank" rel="noopener">Question, versions, and saved runs</a>.</p>
<div class="compare-table-scroll"><table class="compare-table" style="min-width:32rem;table-layout:fixed">
<thead>
<tr>
<th>What the source reported</th>
<th>What Claude&#39;s answer said</th>
<th>What changed</th>
</tr>
</thead>
<tbody><tr>
<td style="white-space:normal">277 requests were reclassified across more than one category</td>
<td style="white-space:normal">277 cloud-classified requests</td>
<td style="white-space:normal">A total across categories became a count for one category</td>
</tr>
</tbody></table></div>
<p>Codex reviewed the saved answers against retained source copies; a second Codex reviewer checked the judgments. This was an agent review, not independent human validation. It found three substantive errors in Claude&#39;s answer, including the changed population above, an incomplete description of the classifier, and a broadened claim attributed to a companion article. The <a href="https://github.com/gkoreli/blog/blob/9d99ae8fac8fefc24fc45b4a962ef776d122f405/packages/blog/drafts/research/oss-radar-07/21-real-answer-source-review.md" target="_blank" rel="noopener">source review</a> links the unchanged answers and the evidence for each judgment.</p>
<p>These were two directed runs, with the article URL supplied. They establish neither a model ranking nor how often agents discover or misrepresent this blog. They do give us a concrete failure to test: can a citation checker detect that the number is present but the population has changed? That is a source-support question, distinct from the opening study&#39;s manipulation of attribution.</p>
<h2>Which parts can open-source tools check?</h2>
<p>I would choose tools by the operation we need to inspect. A stored answer, a support judgment, and a better research process answer different questions. The following sections explain the inspected implementations and their evidence; these projects were selected for their different roles, rather than ranked against the whole market. The <a href="https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-07/00-worklist-index.md" target="_blank" rel="noopener">research inventory</a> records the projects and versions.</p>
<div class="compare-table-scroll"><table class="compare-table" style="min-width:32rem;table-layout:fixed">
<thead>
<tr>
<th>Engineering job</th>
<th>Projects examined here</th>
<th>What remains to check</th>
</tr>
</thead>
<tbody><tr>
<td style="white-space:normal">Test a claim against its particular cited passage</td>
<td style="white-space:normal">TruLens, DeepEval, ALCE</td>
<td style="white-space:normal">Whether the judge detects real errors, including changed quantities and qualifications</td>
</tr>
<tr>
<td style="white-space:normal">Select evidence and revise an answer</td>
<td style="white-space:normal">OpenScholar, STORM/Co-STORM, Self-RAG</td>
<td style="white-space:normal">Whether the resulting citations support the claims under the deployment&#39;s conditions</td>
</tr>
<tr>
<td style="white-space:normal">Match quoted text against supplied material</td>
<td style="white-space:normal">Ragas quote utility</td>
<td style="white-space:normal">Whether the named source supports the full claim</td>
</tr>
<tr>
<td style="white-space:normal">Retain answers and evaluation records</td>
<td style="white-space:normal">Promptfoo; Phoenix as a source-available comparator</td>
<td style="white-space:normal">What the capture includes and whether the recorded answer is correct</td>
</tr>
</tbody></table></div>
<p>The implementation details below are for engineers choosing or building these checks. None of the inspected support checks, by itself, establishes which source caused an answer. Their practical value is narrower: they make specific errors testable and the evidence available for review.</p>
<h2>TruLens, DeepEval, and Ragas: check the cited passage</h2>
<p>A claim can agree with the retrieved material and still point to the wrong source. TruLens and DeepEval have explicit checks for that mistake. For the blog experiment, the check would need to compare the claim about 277 requests with the passage defining that population.</p>
<p>TruLens exposes two policies. Its <a href="https://github.com/truera/trulens/blob/72d60ce6c1af6f9a479bdc8f99d69796340d459a/src/feedback/trulens/feedback/templates/rag.py#L299-L502" target="_blank" rel="noopener">citation attribution check</a> judges each numbered reference against the corresponding passage and deliberately ignores claims without citation markers. Its citation accuracy check also penalizes missing citations and returns a graded judgment. Those policies answer different questions.</p>
<div class="compare-table-scroll"><table class="compare-table" style="min-width:32rem;table-layout:fixed">
<thead>
<tr>
<th>Check</th>
<th>What its instructions ask</th>
<th>What a result leaves open</th>
</tr>
</thead>
<tbody><tr>
<td style="white-space:normal">TruLens <code>citation_attribution</code></td>
<td style="white-space:normal">Does each numbered citation point to a supporting passage?</td>
<td style="white-space:normal">Claims without citation markers are exempt</td>
</tr>
<tr>
<td style="white-space:normal">TruLens <code>citation_accuracy</code></td>
<td style="white-space:normal">Are citations supported, correctly attributed, and present where required?</td>
<td style="white-space:normal">The normalized judgment is not a measured fraction of correct citations</td>
</tr>
<tr>
<td style="white-space:normal">DeepEval community <code>CitationFaithfulnessMetric</code></td>
<td style="white-space:normal">Are factual claims supported, and does each marker point to the right passage?</td>
<td style="white-space:normal">One overall verdict does not provide a reviewed record for every claim</td>
</tr>
</tbody></table></div>
<p>DeepEval&#39;s <a href="https://github.com/confident-ai/deepeval/blob/f94d940c1e5afc4b280420fe73fe17d146274018/deepeval/metrics/community/citation_faithfulness/citation_faithfulness.py" target="_blank" rel="noopener">implementation</a> numbers the supplied passages before calling the judge. Its <a href="https://github.com/confident-ai/deepeval/blob/f94d940c1e5afc4b280420fe73fe17d146274018/deepeval/metrics/community/citation_faithfulness/template.py#L15-L34" target="_blank" rel="noopener">prompt</a> explicitly rejects a citation to the wrong passage even if another passage contains the answer. That is the relevant behavior to investigate when an answer cites the right website but the wrong evidence.</p>
<p>Ragas illustrates a narrower, useful operation. Its <a href="https://github.com/vibrantlabsai/ragas/blob/298b68274234c060deacab3cf5fb52aa3a20e885/src/ragas/metrics/collections/quoted_spans/util.py#L35-L66" target="_blank" rel="noopener">quote-matching function</a> joins source passages and checks whether quoted text occurs in the combined string. It does not resolve citation markers. Its separate <a href="https://github.com/vibrantlabsai/ragas/blob/298b68274234c060deacab3cf5fb52aa3a20e885/src/ragas/metrics/collections/faithfulness/metric.py#L116-L159" target="_blank" rel="noopener">faithfulness metric</a> uses model judgments of statement support against collected context. Neither operation, by itself, checks the identity of the particular source cited beside a claim.</p>
<p>These are code findings. We did not run these judges against our blog and establish their accuracy. For a question about attribution, I would choose an explicit citation policy such as TruLens or DeepEval&#39;s, and retain the judged passages and reasons. Before adopting one, I would test whether it detects the saved population error and preserves its reason for the judgment. That detection test remains unrun.</p>
<h2>ALCE and Self-RAG: separate citation creation from checking</h2>
<p>ALCE makes a distinction that every citation product should preserve. Its <a href="https://github.com/princeton-nlp/ALCE/blob/246c476a4edfc564266b7346b6e29ef4861ae937/post_hoc_cite.py#L38-L70" target="_blank" rel="noopener">post-hoc citation script</a> can find a matching document for an uncited sentence and insert a reference. Its separate <a href="https://github.com/princeton-nlp/ALCE/blob/246c476a4edfc564266b7346b6e29ef4861ae937/eval.py#L340-L429" target="_blank" rel="noopener">evaluator</a> asks whether the cited passages support that sentence. Creating the citation and assessing it are different operations in the same repository.</p>
<p>The evaluator also handles a subtle case: several citations can support a claim together. Checking each document in isolation can miss a valid combined explanation; accepting every attached document can reward irrelevant references. ALCE tests joint support and each reference&#39;s contribution. A checker needs to preserve which sources support which parts of the claim.</p>
<p>Self-RAG moves evidence assessment into generation. Its <a href="https://github.com/AkariAsai/self-rag/blob/1fcdc420e48f50a7d7ab1ece5494221b93252e99/retrieval_lm/run_long_form_static.py#L72-L238" target="_blank" rel="noopener">long-form decoder</a> combines relevance, support, and utility scores from special model-generated tokens that rate the retrieved evidence and the answer. Operators can change their weights. The inspected path works with supplied passages, so this code finding concerns evidence assessment during generation, rather than a test of fresh web searches.</p>
<p>When choosing a citation library, I would first ask where evidence affects the answer and how that decision can be checked. Attaching a source afterward may help verification. It does not establish that the source produced the claim in the first place.</p>
<h2>OpenScholar: improve evidence selection and revision</h2>
<p>OpenScholar is the most convincing project here for someone building scientific research tools. It makes the evidence collection and revision process part of the system you can inspect. Its February 2026 Nature paper reports a useful comparison: the same GPT-4o base model, first with standard retrieval from the OpenScholar datastore, then inside the fuller OpenScholar pipeline. <a href="https://www.nature.com/articles/s41586-025-10072-4" target="_blank" rel="noopener">Paper</a>.</p>
<p>The comparison uses 100 computer-science questions requiring answers drawn from scientific literature. Two scores assess different jobs:</p>
<ul>
<li><strong>Answer rubric score:</strong> how well the answer meets the question&#39;s content requirements.</li>
<li><strong>Citation F1:</strong> a combined score for whether cited evidence supports the answer and how much of the answer has citation support. It balances citation precision and recall; it is not a percentage of correct citations. The citation judge is itself a model. <a href="https://media.springernature.com/original/springer-static/esm/art%3A10.1038%2Fs41586-025-10072-4/MediaObjects/41586_2025_10072_MOESM1_ESM.pdf" target="_blank" rel="noopener">Evaluation methods</a>.</li>
</ul>
<div class="compare-table-scroll"><table class="compare-table" style="min-width:32rem;table-layout:fixed">
<thead>
<tr>
<th>On 100 Scholar-CS questions</th>
<th align="right">GPT-4o + standard retrieval</th>
<th align="right">OpenScholar-GPT-4o</th>
</tr>
</thead>
<tbody><tr>
<td style="white-space:normal">Answer rubric score</td>
<td align="right">52.4</td>
<td align="right">57.7</td>
</tr>
<tr>
<td style="white-space:normal">Reported citation F1</td>
<td align="right">31.1</td>
<td align="right">39.5</td>
</tr>
</tbody></table></div>
<p>The same base model scores higher with the fuller pipeline. That supports investigating how evidence is selected and answers are revised. Several components change together, and additional evidence can be retrieved, so the result does not isolate the benefit of adding an agent. The paper&#39;s PaperQA2 comparison using the OpenScholar datastore scores <strong>48.0</strong> on citation F1, higher than the OpenScholar-GPT-4o result here. <a href="https://www.nature.com/articles/s41586-025-10072-4" target="_blank" rel="noopener">Table 1</a>.</p>
<p>The <a href="https://github.com/AkariAsai/OpenScholar/blob/0e9b8fb912273d3dae39e593da86e4f6d3bf8de1/src/open_scholar.py#L527-L708" target="_blank" rel="noopener">OpenScholar runner</a> saves an initial answer, processes up to three feedback items, can retrieve additional Semantic Scholar material, and can run a final attribution pass. That pass asks a model to revise the citation-bearing text. It is a check with its own possible failures.</p>
<p>An optional ranking adjustment adds normalized paper citation counts. A paper can rank higher partly because other papers cite it. That is an explicit source-selection preference, separate from whether it supports the sentence being written. <a href="https://github.com/AkariAsai/OpenScholar/blob/0e9b8fb912273d3dae39e593da86e4f6d3bf8de1/src/open_scholar.py#L40-L60" target="_blank" rel="noopener">Ranking implementation</a>.</p>
<p>I would study this pipeline before treating a larger general-purpose model as the whole solution to literature research. It offers specific parts to examine and change: retrieval, ranking, feedback, and attribution. The reported gain makes those components worth investigating. Whether they improve a particular application still needs testing with that application&#39;s sources and questions.</p>
<h2>STORM and Co-STORM: better research does not guarantee better citations</h2>
<p>STORM&#39;s useful idea is to research an outline before writing the article. It generates different perspectives on a topic, has them ask questions, and gathers material through those conversations. That gives a research tool another job besides answering the first question: uncover questions the user had not thought to ask. <a href="https://aclanthology.org/2024.naacl-long.347.pdf" target="_blank" rel="noopener">STORM research</a>.</p>
<p>In the 2024 study, ten Wikipedia editors assessed <strong>20 pairs of generated articles</strong>, with two editors per pair. The comparison system first made an outline and retrieved material to fill it. STORM researched through questions before writing its outline.</p>
<p><strong>Organization</strong> meant a clear, logical article structure. <strong>Verifiability</strong> concerned whether the content could be checked against sources, including Wikipedia&#39;s restriction against unsupported original synthesis. Editors scored each from 1 to 7; the table counts ratings of at least 4.</p>
<div class="compare-table-scroll"><table class="compare-table" style="min-width:32rem;table-layout:fixed">
<thead>
<tr>
<th>Share of editor ratings at least 4 out of 7</th>
<th align="right">Outline-first comparison</th>
<th align="right">STORM</th>
</tr>
</thead>
<tbody><tr>
<td style="white-space:normal">Organization: clear article structure</td>
<td align="right">45%</td>
<td align="right">70%</td>
</tr>
<tr>
<td style="white-space:normal">Verifiability: content checkable against sources</td>
<td align="right">67.5%</td>
<td align="right">67.5%</td>
</tr>
</tbody></table></div>
<p>The study detected better organization, without a corresponding verifiability gain. The identical percentages do not prove the systems equally verifiable; this was a small study. They show why a report&#39;s structure and source support deserve separate assessment. <a href="https://aclanthology.org/2024.naacl-long.347.pdf" target="_blank" rel="noopener">Table 6, study method, and editor rubric</a>.</p>
<p>STORM&#39;s <a href="https://github.com/stanford-oval/storm/blob/fb951af7744dab086e34962e9bc6fe878e145f83/knowledge_storm/storm_wiki/modules/knowledge_curation.py#L204-L243" target="_blank" rel="noopener">curation code</a> retains search queries, retrieved material, and the answer formed from it. Its <a href="https://github.com/stanford-oval/storm/blob/fb951af7744dab086e34962e9bc6fe878e145f83/knowledge_storm/storm_wiki/modules/article_generation.py#L144-L174" target="_blank" rel="noopener">section writer</a> receives numbered snippets under a 1,500-word information limit. A page collected during research is therefore not necessarily a page included in a section&#39;s writing context.</p>
<p>It also <a href="https://github.com/stanford-oval/storm/blob/fb951af7744dab086e34962e9bc6fe878e145f83/knowledge_storm/storm_wiki/modules/storm_dataclass.py#L188-L207" target="_blank" rel="noopener">merges references by URL</a> and translates section-local citation numbers into one reference list. That solves a real bookkeeping problem in a report assembled from multiple sections. It does not check the truth of the attached claim.</p>
<p>Co-STORM adds a useful variation. Its <a href="https://github.com/stanford-oval/storm/blob/fb951af7744dab086e34962e9bc6fe878e145f83/knowledge_storm/collaborative_storm/modules/grounded_question_generation.py#L81-L115" target="_blank" rel="noopener">moderator's question generator</a> receives retrieved snippets that have not been used, alongside the knowledge summary and recent discussion. That gives the moderator a concrete way to redirect the research. The role matters because of the information it receives and the decision it makes.</p>
<p>This is research assistance I would want to inspect and steer. The unresolved problem is whether the questions expose an omission or elaborate the same incomplete framing. For a research product, better organization and better source support deserve separate tests.</p>
<h2>Promptfoo and Phoenix: retain what the checks need</h2>
<p>Promptfoo supplied the capture path for the two answers examined earlier. That makes it useful for repeating a test and retaining the result for review. It does not supply the source-support judgment by itself.</p>
<p>Both final answers and their emitted CLI records survived Promptfoo 0.122.2&#39;s summary and JSON exports, including an export from a new process reopening the database. No answer was regenerated to obtain a better result.</p>
<p>The relevant <a href="https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/contracts/providers.ts#L62-L83" target="_blank" rel="noopener">Promptfoo interface</a> accepts a raw response and metadata alongside the answer being scored. That makes it useful for an evidence-retaining test harness. It leaves us responsible for what we capture and how we assess it. For one answer we only want to archive, the CLI alone needs fewer parts.</p>
<p>Phoenix addresses the related problem of keeping execution and judgment connected. Its <a href="https://github.com/Arize-ai/phoenix/blob/d69a92e16ac29dc8a7a7262aa18ddeaccfea2b70/src/phoenix/db/models.py#L1284-L1326" target="_blank" rel="noopener">span-annotation model</a> associates scores, labels, and explanations with a recorded operation. It belongs in the comparison as a <strong>source-available platform under Elastic License 2.0</strong>, not silently in a permissive-OSS category. <a href="https://github.com/Arize-ai/phoenix/blob/d69a92e16ac29dc8a7a7262aa18ddeaccfea2b70/LICENSE" target="_blank" rel="noopener">License</a>.</p>
<p>I would keep this capture path for repeated tests, alongside source review. The useful record includes the answer, the relevant passages, and the source identities, so a future failure can be investigated without asking the model to recreate it.</p>
<h2>Citation analytics: count appearances and assess claims separately</h2>
<p>For a publisher, citation analytics needs to distinguish being mentioned from being represented correctly. A server request, a citation in a captured answer, a supported claim, and a human reading the article are separate observations. The <a href="https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/drafts/research/oss-radar-07/07-citation-measurement-contract.md" target="_blank" rel="noopener">measurement contract</a> we developed keeps those units separate. An agent&#39;s identity also does not tell the receiving site whether a person requested that particular task.</p>
<p>Microsoft&#39;s <a href="https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview" target="_blank" rel="noopener">AI Performance preview</a> announcement in February 2026 described cited URLs and citation activity across Microsoft Copilot, Bing AI summaries, and selected partners. Those counts show appearances within the product&#39;s coverage. They do not say whether the claim beside a citation is supported. The open-source evaluators above address that additional question when we have the answer and its sources.</p>
<p>I want to measure whether our writing is being represented correctly as well as whether it appears. Those are useful questions even when we cannot reconstruct everything that caused an answer.</p>
<h2>What makes an engineering source worth trusting?</h2>
<p>A credible engineering source gives a reader a way to evaluate its consequential claims. The author can show what ran, under which version and conditions, what happened, and where the interpretation stops. That applies to a personal blog and to a research paper. A recognizable name supplies context; it does not perform the check.</p>
<p>Models can react to that name. Khan and colleagues tested <strong>twelve models</strong> on choices involving news outlets, research venues, and sellers. Their controlled comparisons presented equivalent information under different source labels and found source preferences. This is evidence about selection among available candidates, not a demonstrated method for getting an unknown engineering blog discovered. <a href="https://www.microsoft.com/en-us/research/wp-content/uploads/2026/04/khan26_iclr.pdf" target="_blank" rel="noopener">ICLR 2026 paper</a>.</p>
<p>Google&#39;s <a href="https://developers.google.com/search/docs/appearance/ai-features" target="_blank" rel="noopener">guidance for AI Overviews and AI Mode</a> is more practical for the access problem: supporting pages must be indexed and eligible for a search snippet. It requires no special AI file or schema. Its <a href="https://developers.google.com/search/docs/fundamentals/creating-helpful-content" target="_blank" rel="noopener">helpful-content guidance</a> also asks about original work, authorship, sourcing, and how content was produced. Those are documented recommendations, not a promise that a byline or a pronoun will increase citations.</p>
<p>For this publication, I would put the effort into four things:</p>
<ul>
<li><strong>Original results with an inspectable method.</strong> Give a reader something they could not obtain by rephrasing another article. Keep the command, configuration, output, or source comparison available when it carries the argument.</li>
<li><strong>Numbers with their conditions attached.</strong> Put the population, version, time window, and important qualification beside the result. Our 277-request example shows what changes when the population is lost.</li>
<li><strong>Links to the evidence for the particular claim.</strong> A release announcement establishes an announcement. A pinned implementation establishes what that code does. A benchmark needs its task and scoring method.</li>
<li><strong>Readable access and a visible correction history.</strong> Publish text that people and tools can retrieve, use stable addresses, and correct material mistakes. Let the source remain useful after the first visit.</li>
</ul>
<p>These are the publishing practices I can act on now: make the evidence and its conditions available for inspection. Whether precise, current evidence wins selection over a familiar but outdated source remains a separate question to test.</p>
<h2>My bet: test citation support claim by claim</h2>
<p>I would start with the errors we can inspect: a claim attached to the wrong passage, a number assigned to the wrong population, or a qualification dropped from the answer. Keep the answer, source text, and citation mapping together, then test an explicit support checker against reviewed examples. The projects above supply components for that workflow; their presence does not establish that a particular judge catches our failures.</p>
<p><strong>My bet is that separate citation checks will catch important errors that overall answer scores miss.</strong> We have a saved error and candidate implementations, but have not run that comparison. The test needs to show additional errors caught, incorrect rejections, and a cost worth paying. If it adds no useful detections or rejects supported claims too often, I would reconsider adopting it.</p>
<p>Causal attribution remains a different problem: a support verdict cannot reconstruct why the generator produced its answer. For this blog, the first useful step is to retain and check the claims made under its citations. I want the person following a citation to find the evidence the answer promised.</p>

<hr>
<h2 id="glossary">Glossary &amp; sources</h2>
<p>Definitions and references share one table. Study findings belong to their named authors and dated conditions; repository links identify the inspected code. The research notes retain the complete inventory, comparison limits, and checks we declined to treat as headline evidence.</p>
<div class="compare-table-scroll"><table class="compare-table" style="min-width:38rem;table-layout:fixed">
<thead><tr><th style="width:30%">Term or finding</th><th style="width:52%">Source and why it matters</th><th style="width:18%">Date</th></tr></thead>
<tbody>${sources.map(s => html`<tr><td style="white-space:normal">${s.claim}</td><td><a href="${s.url}" target="_blank" rel="noopener">${s.ref}</a><p>${s.why}</p></td><td>${s.date}</td></tr>`)}</tbody>
</table></div>
<h3>Research record</h3>
<p>This issue combines primary-paper review, pinned code inspection, and the two real CLI runs linked above. Codex performed the research and experiments; Goga supplied the question, publication direction, and editorial judgment. The <a href="/oss-radar-07-ai-citations/prompts">complete shaping prompts</a> are public at his request. The <a href="https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-07/00-worklist-index.md" target="_blank" rel="noopener">worklist</a> preserves the narrower earlier Promptfoo investigation and the full rewrite. Historical local mock-response tests remain labeled in that record; they were not OpenRouter service or model calls.</p>
<p>The <a href="/oss-radar-07-ai-citations/prompts#research-footprint">partial research footprint</a> measures <strong>43,272,331 tokens across eight recovered sessions from the earlier investigation</strong>. It excludes the September rewrites, the later real CLI experiment, and other disclosed work. Its frozen manifest records integrity commitments to private logs; it is auditable by the author, not independently reconstructible by readers. Token volume is not evidence that the claims are correct.</p>
</article>`;
}
