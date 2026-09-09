# What Promptfoo is building

Checked September 8, 2026, UTC. This note supports the dedicated section in the [Radar draft](../../oss-radar-07-promptfoo.md). Blog revision at the start of this update: `37302bad96a681a0d9a980c2c9d6f22411d758b7`. It adds primary-source research and code inspection, not a new experiment.

**Finding:** Promptfoo's public purpose centers on testing and securing AI applications. Its open-source CLI and library combine evaluation with adversarial testing, while the wider product includes code scanning and enterprise workflows. The recent tracing and accounting work strengthens inspection of executed tests. Our citation experiment tests whether those parts suit an additional workload; it should not redefine Promptfoo's mission around citation analytics.

## Scope, versions, and current state

The source baseline stays **Promptfoo 0.122.2**, commit `89052308bce06f53645b1f189ada5ac9d1897347`, matching the installed experiment. All repository code and documentation links below use it. The release-list check returned CLI 0.122.2, published August 28, and the separately versioned `code-scan-action-0.2.0`, also published August 28. The latter's release metadata points to `2c45764ca1daf4587c83d68b940ba0eb14cb7ac4`; that is a release reference, not a second implementation baseline used for these claims.

The default-branch freshness check returned `35f343479aae4c68071f475eb3eccd2cadd3ea58`, committed September 8 at 21:26:44 UTC. Recent commit subjects concerned provider connection settings, discovery guidance, and loading behavior. We did not rebase or rerun the experiment against that branch. Those subjects do not prove a feature's behavior or a fix to the citation omission. The draft continues to name the installed version explicitly.

No new issue or PR is used as evidence in this addition. The prior telemetry issue retains its separately recorded state. No upstream message, scanner run, account integration, or model call occurred.

## Purpose and public commitments

The [pinned README](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/README.md) describes a CLI and library for evaluating and red-teaming LLM applications, including comparisons, CI checks, and code scanning. The [licence](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/LICENSE) contains the MIT text. The existing installed probe establishes working evaluation and custom-provider export for its narrow fixture. It does not establish the quality of the security products.

In their [March 9 announcement](https://www.promptfoo.dev/blog/promptfoo-joining-openai/), Ian Webster and Michael D'Angelo describe security, safety, and behavioral risks as major obstacles they encountered while building application-testing tools. They commit to maintaining the open-source suite across diverse providers and models. This supplies the maintainers' stated purpose and continuity commitment; future maintenance remains a commitment, not something a snapshot can guarantee.

The current [About page](https://www.promptfoo.dev/about/) and the pinned README identify Promptfoo as part of OpenAI. Use those for its current public description. The March announcement described an acquisition agreement subject to closing conditions, so do not invent a closing date from that announcement.

[OpenAI's March 9 announcement](https://openai.com/index/openai-to-acquire-promptfoo/) describes planned Frontier integration for security testing, development workflows, and oversight records. It also commits to continued open-source development. This supports a stated enterprise direction, not a finding that Frontier already exposes every promised capability.

## What the code establishes

| Surface | Inspected execution path | Evidence state | What it establishes and what it does not |
|---|---|---|---|
| Evaluation | Existing installed `evaluate()` calls, assertions, and serialized public summaries | Reproduced in the [recorded experiment](repro/installed/README.md) | The fixture executes and custom evidence survives; no live model or security-quality result |
| Red teaming | [Command](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/redteam/commands/run.ts) calls `doRedteamRun`; [shared implementation](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/redteam/shared.ts) invokes test generation and then evaluation | Code-inspected | A concrete generation-to-evaluation workflow; not a measured attack success rate |
| Extensible attacks | [Architecture](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/site/docs/red-team/architecture.md) separates plugins, strategies, and targets | Reported design, consistent with the run path | An extension model for application testing; no claim that all targets run locally |
| Code scanning | [Action](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/code-scan-action/src/main.ts) constructs CLI arguments, runs the scan, and handles review output; [scanner](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/codeScan/scanner/index.ts) creates a `code-scan` agent client and sends a scan request | Code-inspected | A development/review integration backed by a service; no accuracy or end-to-end execution claim |
| Scanner service boundary | [Action configuration](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/code-scan-action/action.yml) defaults `api-host` to `https://api.promptfoo.app` | Code-inspected | An open-source client does not establish that the selected feature is a self-contained local engine |
| Execution records | [Tracing implementation](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/tracing/evaluatorTracing.ts) checks explicit enablement, creates per-test roots, and returns trace/evaluation/test relationships | Code-inspected | Shipped recording mechanisms; trace/export completeness was not tested in our fixture |

## The recent trajectory, with dates kept intact

| Date | Development | Why it matters here | Boundary |
|---|---|---|---|
| December 16, 2025 | [Engineering introduction of the security scanner](https://www.promptfoo.dev/blog/building-a-security-scanner-for-llm-apps/) describes agent-assisted review of LLM-related risks in pull requests | Establishes an earlier move into the code-review workflow | Attributed engineering report; its detection claims were not reproduced |
| March 9, 2026 | Founders and OpenAI announce the acquisition agreement and intended integration | Connects the open-source tools to a larger security/evaluation purpose | Agreement and future plans in those announcements; current affiliation checked separately |
| August 26, 2026 | [0.122.1](https://github.com/promptfoo/promptfoo/releases/tag/0.122.1) adds test roots, target spans, agent telemetry integrations, and richer accounting | Strengthens the ability to inspect a test's execution and resources | Release evidence and pinned source; does not establish answer-source completeness |
| August 28, 2026 | [CLI 0.122.2](https://github.com/promptfoo/promptfoo/releases/tag/0.122.2) and [scanner action 0.2.0](https://github.com/promptfoo/promptfoo/releases/tag/code-scan-action-0.2.0) ship on separate version tracks | Identifies our test release and continuing scanner maintenance | The scanner release hardens supply-chain/dependency handling; it is not the scanner's launch |

The article's interpretation is that Promptfoo is investing in repeated testing, inspection, and repair throughout AI development. The founders' purpose, shipped run paths, and dated releases support that reading. The evidence does not support replacing it with a claim that Promptfoo is primarily building publisher analytics, a universal truth checker, or a complete autonomous-agent operating system.

## Competing product readings

| Reading | Whose view | Evidence for | Limit or counterevidence | Direction state |
|---|---|---|---|---|
| A reusable, cross-provider testing and security toolkit remains valuable on its own | Maintainer commitment and our adoption theory | MIT source, provider/custom interfaces, continued releases, and the executed fixture | Every provider path needs verification; licence alone does not guarantee future attention | Stated purpose with shipped parts |
| The tools increasingly support a larger enterprise platform | Explicit OpenAI plan; our reading of the commercial direction | Frontier announcement, service-backed scanner, reporting/trace work | The open-source suite continues; these sources do not establish that Frontier integration is complete or that standalone use is being withdrawn | Stated integration plan; completion unverified |

These can coexist. Open source provides inspectable code, extension points, and a reusable runner. Connected products can add service dependencies. Judge the path the operator will use instead of assigning one deployment model to every feature.

For the blog, the next decision remains the one in [06-promptfoo-design-and-prior-art.md](06-promptfoo-design-and-prior-art.md): use the evaluation runner with explicit capture for a bounded trial, then verify live and trace/export behavior. The broader purpose explains why the project deserves an OSS Radar review even though our experiment covers a small part of it.

## Claim handling for the article

- Present the current tool, maintainers' purpose, recent shipped work, and enterprise plan in that order.
- Keep maintainer commitments, code-inspected behavior, our reproduced result, and our interpretation distinct.
- Do not infer a completed Frontier feature from an announcement, a new scanner launch from a maintenance release, or local execution from an open-source licence.
- Do not use adoption counts, stars, or corporate ownership as proof that the tool preserves citation evidence.
- Keep the detailed audit here; the dedicated article section supplies the context needed to judge the experiment.
