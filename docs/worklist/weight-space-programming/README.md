# Weight-space programming: article research

Checked November 2, 2026, Pacific time. Status: initial source research and score-arithmetic audit complete. Article drafting, model execution, and publication have not happened. Proposed experiments below are unrun.

## Recommendation

Develop an **engineering investigation** around this question: **What can an agent repair inside a neural network, and how would we verify the repair?**

The strongest material connects model internals to a familiar engineering practice: diagnose a failure, localize its cause, change a component, and test the result against controls and unseen cases. An agent can propose the intervention while the harness preserves the evidence needed to judge it. That gives this publication a useful subject beyond repeating the launch numbers.

Possible working title: **Can an AI agent debug a neural network's weights?** This is a research question, not a claim that we have reproduced the behavior. Reader payoff: distinguish capability gains, repaired execution failures, inference controls, and weight edits; understand what evidence would justify deploying a patch. Search phrases such as “weight-space programming” and “LLM weight editing” are discovery hypotheses, not measured demand.

| Form | What would make it work | Assessment |
|---|---|---|
| Engineering investigation | Trace the intervention and independently compare patched weights with a fair baseline | Strongest fit; existing audit is a start, not a behavioral reproduction |
| OSS Radar project deep dive | Review the released logs, rebuilding tools, licensing, missing harness pieces, and adoption limits | Viable with the narrow verdict that this is a research release for reproductions; avoid presenting it as a ready model-maintenance product |
| Essay of inquiry | Examine whether neural weights are becoming another medium in which agents write programs | Interesting secondary route; explain competing interpretations before predicting a change in engineering |
| Exposed personal essay | Goga supplies an actual experience, uncertainty, and personal stakes | No such material supplied; do not invent it |

The reader promise is supported by the research. Goga's documented contribution so far is choosing this topic; this session's audit is agent-assisted work. Before a full practical article, preserve his predictions, judgments, and any hands-on decisions through the actual investigation. Do not attribute the agent's interpretation or a future successful reproduction to him.

## Entry points and baseline

- [Original X post](https://x.com/rikiyatakehi/status/2117313742891327994), dated November 2, 2026. Read through the signed-in browser after the web fetch returned 403. Author thread was visible; no public-reply corpus, sentiment analysis, or video transcription was collected.
- [Authors' research post](https://rikiyat.github.io/blog/weight-space-programming/), Rikiya Takehi, Jayden Teoh, Alex Zhang, Omar Khattab; November 2, 2026. It describes early reading, repair, and construction experiments and proposes a future benchmark and harness. Those plans are **stated**, rather than evidence of a shipped benchmark product.
- [Released repository baseline](https://github.com/RikiyaT/lm_understand-logs/tree/4d09ba6d6a7e891dd8063974dfe81b3d78e3494f), branch `main`, SHA `4d09ba6d6a7e891dd8063974dfe81b3d78e3494f`. Downloaded to `/tmp/weight-space-programming-2026-11-02`; raw third-party logs stay outside this repository.
- Qwen base revision recorded by the release: `2fc06364715b967f1860aea9cf38778875588b17`. Gemma follow-up base revision: `ac82b4e820549b854eebf28ce6dedaf9fdfa17b3`.
- [Independent audit script](audit_scores.py) and [its result](score-audit.json). The result hashes its input JSON files and records the upstream SHA. It recomputes arithmetic from released correctness labels. It does **not** independently grade answers, run inference, rebuild tensors, authenticate logs, or reproduce the editor's discovery.

## Claims and evidence

All repository links in this section use the same baseline. “Reproduced” below applies only to the arithmetic explicitly checked by our script.

| Claim | Product says | Code or test | Evidence state | Inference | Why it matters |
|---|---|---|---|---|---|
| Qwen MATH-500 increases from 7.9% to 48.1% | Small edit improves measured performance | [Evaluation shards](https://github.com/RikiyaT/lm_understand-logs/tree/4d09ba6d6a7e891dd8063974dfe81b3d78e3494f/exp8_math/eval); our audit checks all 500 IDs and four labels each, shard totals, and merged values for all four checkpoints | Reported behavior; reproduced label aggregation | Substantial result in this protocol; generality remains open | Gives the headline an inspectable denominator |
| The mechanism targets looping | Reasoning-loop diagnosis and repair | [Final report](https://github.com/RikiyaT/lm_understand-logs/blob/4d09ba6d6a7e891dd8063974dfe81b3d78e3494f/exp8_math/runs/p50c/work_notes/final_report.md) describes matched contexts, interventions, random control, and confirmation | Reported controls; artifact-inspected | Supports a repair interpretation; does not isolate every possible cause | Changes what “better at math” means |
| Edit is small | 131,072 values targeted | [Manifest](https://github.com/RikiyaT/lm_understand-logs/blob/4d09ba6d6a7e891dd8063974dfe81b3d78e3494f/exp8_math/runs/p50c/edit/manifest.json): two tensors, 64 columns each, 130,188 differing BF16 entries after rounding | Code/artifact-inspected; count sum reproduced | Parameter fraction describes edit size, not absence of side effects | Prevents equating sparse edits with safe deployment |
| Edit can be rebuilt | Exact diff against public base | [apply_edit.py](https://github.com/RikiyaT/lm_understand-logs/blob/4d09ba6d6a7e891dd8063974dfe81b3d78e3494f/exp8_math/code/apply_edit.py) checks shape, dtype, base hash and edited hash | Code-inspected, not executed | Strong artifact identity path | Separate rebuilding a patch from rediscovering it |
| Fifty passes is a bounded budget | No gradient training | [Run state](https://github.com/RikiyaT/lm_understand-logs/blob/4d09ba6d6a7e891dd8063974dfe81b3d78e3494f/exp8_math/runs/p50c/state.json) records 158 turns, 80 Python runs, 50 passes; [experiment README](https://github.com/RikiyaT/lm_understand-logs/blob/4d09ba6d6a7e891dd8063974dfe81b3d78e3494f/exp8_math/README.md) defines batched generations and teacher-forced activation reads | Artifact-inspected; state fields checked | Gradient-free still consumes substantial inference and analysis | No claim of fifty individual inferences or zero compute |
| Improvement extends to models without loops | Follow-up tests the broader possibility | [Gemma follow-up](https://github.com/RikiyaT/lm_understand-logs/blob/4d09ba6d6a7e891dd8063974dfe81b3d78e3494f/exp8_math/gemma_followup/README.md) reports 6.8% baseline and 7.0–7.7% edited; no established improvement | Reported negative result | Recovery of useful execution is better supported than general capability creation | Keep this counterexample central |
| Weights alone reveal behavior | Small demonstrations motivate broader auditing | [Sycophancy experiment](https://github.com/RikiyaT/lm_understand-logs/blob/4d09ba6d6a7e891dd8063974dfe81b3d78e3494f/exp7_sycophancy/README.md) reports failure without activations, success after adding attention observations | Reported | Static inspection has a demonstrated boundary | Do not promise evaluation-free auditing |

The prompt also matters. [The initial Qwen instructions](https://github.com/RikiyaT/lm_understand-logs/blob/4d09ba6d6a7e891dd8063974dfe81b3d78e3494f/exp8_math/runs/p50c/turns/t001/prompt.txt) explicitly teach diagnosis, causal localization, dose-response, paired evaluation, and confirmation on unused problems. This is an agent working inside a deliberately designed scientific workflow. A bare request to improve math is an incomplete description of the engineering setup.

The final report's held-out **practice** analysis attributes 576 of 579 rescued answers to previously truncated generations; it reports unchanged aggregate accuracy on originally finished answers. These strata were not independently recomputed here, and they are distinct from benchmark results. They suggest a useful causal question for our own test without proving a universal account of mathematical ability.

The [official Qwen card](https://huggingface.co/Qwen/Qwen3.5-0.8B/blob/main/README.md#thinking-mode) itself warns about thinking loops and advises tuning and monitoring generation. Its current recommendations vary with task and mode. The experiment's temperature 0.6 protocol must be named explicitly; do not call it the single canonical current setting. Comparing base and edit under identical decoding supports that comparison, but does not establish superiority to a well-tuned unedited model.

## What we checked locally

[score-audit.json](score-audit.json) records the following counts from public artifacts:

| Qwen checkpoint | Correct / 2,000 generations | Accuracy | Hit 32,768-token cap |
|---|---|---|---|
| Unedited | 158 | 7.90% | 93.00% |
| 10-pass edit | 247 | 12.35% | 87.25% |
| 25-pass edit | 282 | 14.10% | 86.35% |
| 50-pass edit | 962 | 48.10% | 33.05% |

Each checkpoint covers the same 500 unique problems, with four samples per problem. This is mean sample accuracy, not pass@4. The launch displays one decimal place; the audit retains the exact counts, including 247 correct answers for the 10-pass edit. The script checks published per-problem labels against each shard's totals, then checks aggregate accuracy, cap share, and mean length against `merged.json`. All assertions passed. Labels and grading decisions remain upstream evidence.

## Existing reruns and release limits

The [Hugging Face checkpoint card](https://huggingface.co/RikiyaT/Qwen3.5-0.8B-weight-space-programming) credits akhaliq / ML Intern with a rebuilt, hash-verified checkpoint and a separate evaluation. It reports 51.0% on the full MATH-500 (2,000 generations), versus 5.0% on a **25-problem baseline smoke test**. [Edited scores](https://huggingface.co/RikiyaT/Qwen3.5-0.8B-weight-space-programming/blob/main/eval/scores_edited_math500.json) and [baseline scores](https://huggingface.co/RikiyaT/Qwen3.5-0.8B-weight-space-programming/blob/main/eval/scores_base_math500.json) are public. This supports a reported checkpoint rerun; it is not a matched full baseline replication or a new agent rediscovering the patch. We did not execute it. The card records a multimodal release in place of the original text-only export, with language tensors reported hash-identical.

The pinned release supports substantial inspection but is not a turnkey reproduction of every discovery path. Its [Experiment 8 README](https://github.com/RikiyaT/lm_understand-logs/blob/4d09ba6d6a7e891dd8063974dfe81b3d78e3494f/exp8_math/README.md) lists absent agent-harness code and graders. `evaluate.py` imports `weightenv.lmo.tasks`, retains internal path placeholders, and contains historical defaults; the caller's protocol matters. A rebuilding script is more directly usable than this full evaluation entry point.

[PR #1](https://github.com/RikiyaT/lm_understand-logs/pull/1) was open when checked: it proposes an Experiment 5 parser/scorer and reports network reconstruction and MinAtar reruns. Treat its code as **proposed** and its scores as **reported**. A visible automated review identifies malformed-statement recovery as a parser issue; that observation does not invalidate scores on valid released replies. Recheck the PR before any article publication. GitHub displays November 3 UTC dates while this work is dated November 2 Pacific.

The [release license](https://github.com/RikiyaT/lm_understand-logs/blob/4d09ba6d6a7e891dd8063974dfe81b3d78e3494f/LICENSE) distinguishes CC BY 4.0 logs/data/networks, MIT scripts, GPL-3.0 quoted MinAtar code, and separately licensed benchmark content. Link upstream rather than copying raw logs or question corpora into the blog.

## Novelty and competing explanations

Earlier work already makes direct weight intervention a concrete engineering subject:

- [ROME, 2022](https://rome.baulab.info/) localizes factual associations and modifies an MLP using a rank-one update. It establishes a predecessor for targeted editing, not this particular agent workflow.
- [Arditi et al., NeurIPS 2024](https://papers.neurips.cc/paper_files/paper/2024/hash/f545448535dfde4f9786555403ab7c49-Abstract-Conference.html) demonstrates a direction mediating refusal across tested models, with an interpretable weight edit. This supports the relevance of directional interventions without proving that every behavior has one removable direction.
- [AdderBoard](https://github.com/anadim/AdderBoard) separates learned and analytically constructed weights. Its fixed generic decoding requirement is useful when asking whether an agent actually compiled a program into weights or left the task's logic in external code. No AdderBoard submission was executed in this investigation.

| Theory | Whose view | Evidence for | Evidence against / limit | Direction state | What would test it |
|---|---|---|---|---|---|
| General-purpose agents can become model diagnosticians and editors | Maintainers' direction; editorial reconstruction | Repair and construction artifacts, patch diffs, analysis traces | Missing full harness; small set of tasks and selected runs | Stated direction; released examples exist | Independent editors repeatedly discover useful patches on fresh tasks |
| The near-term value is recovering behavior in unusually favorable cases | Our narrower interpretation | Qwen termination pathology and Gemma failure | Does not explain away separate construction demonstrations | Inference from reported results | Tuned baseline retains the deficit; new patches help non-looping models |
| Some construction results are agents compiling known algorithms into networks | Our interpretation | [MinAtar setup](https://github.com/RikiyaT/lm_understand-logs/blob/4d09ba6d6a7e891dd8063974dfe81b3d78e3494f/exp5_write_from_scratch/README.md) supplies game rules, source, and input semantics | Does not imply broad weight understanding or unfamiliar-task transfer | Interpretation of released examples | Obfuscate/permutate representations and use unfamiliar held-out tasks |

For a possible OSS article, the product map is: replaces a particular manual diagnosis/editing step; wraps an editor model and Python analysis; extends mechanistic interpretation with an agent loop; relies on pretrained models, benchmark data, inference compute, and runtime software. A standardized benchmark/harness is a stated future. A dependable model-maintenance service additionally needs discovery repeatability, regression policy, deployment checks, and operating-cost evidence; that is our proposed product direction, not the authors' shipped promise.

## Proposed bounded next step

First independently rebuild the published Qwen patch against its pinned base and verify tensor hashes. Then compare both checkpoints on the same frozen problem sample and runtime, reporting correctness, termination, token count, and regressions. This would reproduce **application of a discovered patch**. A separate fresh editor run is required to test discovery.

Add a tuned, unedited baseline using a decoding configuration chosen on disjoint practice data before evaluation, plus thinking-disabled and simple repetition-control conditions where supported. Keep quantization, tokenizer/template, token budget, grading, and sample seeds explicit. Aggregate repeated samples by problem for uncertainty estimates; do not treat 2,000 generations as 2,000 independent questions. A pilot can estimate cost, followed by a declared full evaluation if warranted. No paid compute or model download was started here.

Decide before running: retaining a gain over the tuned baseline supports a useful weight repair; losing that advantage changes the deployment advice even if the original comparison reproduces. Discovery reliability, regressions, and total editing/evaluation cost remain separate outcomes. Prefer that result-led ending over a prediction that gradient training is ending.

Potential article sequence: explain the observed failure → trace diagnosis and intervention → show the exact patch and identity checks → compare evaluation conditions → examine negative results and prior work → give a bounded engineering decision. A small worked matrix example could teach a directional edit; label it illustrative rather than a reproduction of Qwen's behavior.

## Continuity

Completed: original announcement read; primary post and release inspected; upstream baseline pinned; patch application and scoring code inspected; all four Qwen MATH-500 score aggregations checked; existing rerun and open scorer PR located; article forms and competing interpretations compared. No article or deployment artifact changed.

Remaining for a publishable engineering investigation: independent model execution, decoding controls, a broader regression check, current source/PR recheck, and Goga's actual predictions and judgments. These are proposed follow-up work, not missing acceptance checks for this initial research request. Next bounded action is the CPU patch rebuild and hash verification, followed by a costed evaluation plan.

The [original research request](initial.prompt.md) is preserved verbatim. Future collaborative engineering drafting should carry materially shaping prompts into the article's provenance; no article prompt page exists yet. No research-footprint total has been measured or claimed.
