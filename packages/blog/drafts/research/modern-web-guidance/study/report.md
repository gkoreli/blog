# Modern Web Guidance: completed interface study

Completed November 13, 2026, America/Los_Angeles. **The ordinary skill did not increase checked-task success on these six fixtures: both baseline and MWG availability passed 18/18.** Directly supplied guides passed 16/18. An exploratory code review found a narrower benefit: guided dialog implementations avoided manual Tab handling present in all three baseline dialogs.

This is the result of the repaired, frozen [54-attempt campaign](campaign-02/protocol.md). An earlier 54-attempt campaign had a launcher integration defect and is retained separately as [diagnostic evidence](diagnostic-campaign.md). Total experimental generation attempts: **108**, plus three identified engineering preflights. No article was drafted and no trial patch was applied to the production blog.

## Primary results

Every condition received six tasks and three fresh sessions per task, using requested model `gpt-6.1-sol` at medium reasoning in Codex CLI 0.169.0. Each delivered artifact was checked in Chromium 156.0.8078.4 and WebKit 27.2 through Playwright 1.64.0. A successful attempt completed within the five-minute cap and passed every applicable check in both engines.

| Condition | Checked tasks passed | Browser checks passed | Median generation time | Reported uncached input tokens, all 18 attempts |
| --- | ---: | ---: | ---: | ---: |
| Existing instructions, no MWG | 18/18 | 288/288 | 68.3 s | 235,969 |
| MWG available through normal skill discovery | 18/18 | 288/288 | 79.1 s | 550,690 |
| Predetermined guides supplied directly | 16/18 | 284/288 | 65.7 s | 238,207 |

All 54 primary attempts completed. There were **zero generation timeouts and zero grading infrastructure failures**. The skill-availability condition's observed median was 15.9% longer than baseline and its reported uncached input total was 2.33× baseline. These are descriptive measurements under concurrent execution, not isolated latency effects or dollar charges.

| Owned task | Baseline | MWG available | Guides supplied |
| --- | ---: | ---: | ---: |
| Saved-report confirmation dialog | 3/3 | 3/3 | 1/3 |
| Expandable evidence, preservation control | 3/3 | 3/3 | 3/3 |
| Mobile publication navigation | 3/3 | 3/3 | 3/3 |
| Newsletter inline errors | 3/3 | 3/3 | 3/3 |
| Visit-end event queue | 3/3 | 3/3 | 3/3 |
| Progressive reveals and motion preference | 3/3 | 3/3 | 3/3 |

The [JSON summary](campaign-02/summary.json), [CSV rows](campaign-02/runs.csv), [complete artifact index](campaign-02/artifacts.md) and [task definitions](tasks.json) expose the denominators and individual results. The 864 browser assertions are repeated checks within 54 attempts and six selected tasks; they are not 864 independent tasks.

## The focus-return miss

Both failing supplied-guide outputs used native dialogs and relied on automatic focus return. In the tested WebKit/macOS pointer path, Cancel and Escape left focus on the page body instead of the task's required Delete trigger. Both passed the corresponding Chromium behavior.

The bundled [dialog guide](supplied-guides/T01.txt) says, at line 104: **“DON'T write code to return focus on close.”** It states that the browser returns focus to the invoker. Our fixture exposes a missing precondition in that simplified advice: the trigger must be established as the return target when pointer activation has not focused it.

The successful directly supplied output [focuses Delete before opening](campaign-02/artifacts/b426355cbb36/app.js). The ordinary skill's successful [representative output](campaign-02/artifacts/1435b48d3e52/app.js) does the same:

```js
deleteButton.focus();
panel.showModal();
```

The two failing primary outputs are [e6c64f55a0df](campaign-02/artifacts/e6c64f55a0df/app.js) and [0dbde8f9b1e1](campaign-02/artifacts/0dbde8f9b1e1/app.js). Their saved [result rows](campaign-02/run-results/e6c64f55a0df.json) preserve the two WebKit focus misses each.

A separate [read-only timing/focus probe](dialog-probe.json), performed on an earlier diagnostic artifact, showed the distinction: Chromium's confirmation callback completed asynchronously, whereas WebKit's focus still rested on `BODY` after 250 ms. A [parent-created mechanism control](controls/native-form-focus/T01/control.json) added explicit trigger focus in that artifact's close handler and passed [18/18 checks](focus-control.json). The control is not an experimental attempt and does not replace any original output. The measured successful pre-opening focus approach also demonstrates that the task can be satisfied while retaining native focus return.

These observations concern the tested fixtures and engine configuration. They do not establish that native dialogs generally fail or that every Safari version behaves identically.

## A structural improvement without a pass-rate gain

This source inspection is exploratory, separate from the preregistered success metric. All nine primary dialog implementations used native dialogs. Every baseline dialog also added a manual Tab loop; none of the three ordinary-skill dialogs did. Their focus containment still passed the same browser checks.

For this subgroup, baseline `app.js` files had 56, 61 and 68 text lines; ordinary-skill files had 39, 39 and 43. These counts include comments and formatting. The useful distinction is delegation of keyboard containment to the platform, not a claim that fewer lines prove maintainability. Across all six tasks, median added patch lines were similar: 57.5 baseline, 56 skill and 56 supplied.

Compare the [baseline dialog](campaign-02/artifacts/8fe8bcf4fbf0/app.js) with the [ordinary-skill dialog](campaign-02/artifacts/1435b48d3e52/app.js). This supports a concrete code-simplification observation. No independent maintainability study, human review score or performance improvement was measured.

## Was the guidance actually available and used?

The [primary execution audit](campaign-02/execution-audit.json) records:

- Skill file read in **18/18** availability-arm attempts.
- Successful instrumented search and retrieval in **16/18**.
- **Zero failures** among the 32 adapter calls.
- One attempt used real `npm exec` outside the frozen npx/pnpx adapter and received `ENOTCACHED`; another read the skill but made no observed lookup.

Both non-retrieval attempts remain in the denominator. This is an intention-to-treat comparison of skill availability in this offline harness, not a claim that all 18 consumed guide content. Successful retrieval records a command result; it does not establish comprehension or faithful implementation. All three ordinary-skill dialog attempts did retrieve guides, including broader HTML/accessibility guidance in addition to the targeted guides. The directly supplied arm used a predetermined narrower guide selection, so its comparison with ordinary discovery does not isolate retrieval alone.

The residual npm-exec coverage limit is preserved in [execution notes](campaign-02/execution-notes.md). The [actual command-tool preflight](campaign-02/execution-preflight.json) verified the repaired Node version, pinned npx resolution, both offline runner-option forms and returned guide text before the primary campaign began.

## Why the first batch is separate

The first campaign's process-level PATH shim did not reliably survive the agent's login shell. Thirteen skill-arm event streams contained npm cache-miss errors and only four runs had locally logged search/retrieval. The original wrapper also lacked support for valid runner options. Those are study integration defects, not findings about the product's retrieval algorithm.

The repair isolated zsh startup, disabled shell snapshots, preserved the real user home and exercised search/retrieval through the agent's actual command tool. A complete new balanced batch was frozen before generation. No selected failure was silently replaced. Original code, scores and corrected scores remain in the diagnostic campaign.

Two grader amendments were also completed before the primary batch: [settled reveal behavior](amendment-01-reveal-grading.md) and [native close-event settling](amendment-02-dialog-settling.md). Original measurements are retained. The second campaign used the corrected grader from its start. The [integrity receipt](verification.json) verifies 108 unique attempts, both frozen manifests and all 324 delivered runtime-file hashes; [runtime verification](runtime-verification.json) confirms the pinned package snapshots and primary shell startup files.

Final delivery checks also parsed the study's Python files, checked JavaScript syntax in all 54 primary outputs and the mechanism control, and resolved 303 local links across this report, the primary artifact index and the owning research README. These integrity and syntax checks supplement the browser results; they are not an independent review of every acceptance criterion.

## Interpretation and next decision

The primary behavior result is a ceiling: this model already passed every selected baseline task. Ordinary skill availability matched that result and produced simpler dialog keyboard code, while direct guide injection missed a concrete browser focus requirement in two of three dialog repetitions. The data does not support a broad claim of improved correctness on our current fixture set, nor a claim that MWG is generally ineffective or harmful.

The six-task cluster bootstrap reports a degenerate zero interval for the tied ordinary-skill comparison and an interval of roughly −33.3 to 0 percentage points for the supplied comparison. These describe resampling of the observed six task clusters. The zero interval at a ceiling does not establish certainty about unseen tasks or models; the supplied difference is concentrated in one task.

Limits that matter: six purposefully selected small vanilla fixtures adapted from blog responsibilities, one requested model/effort, two current engines, restricted agent browser access, controlled API-absence simulations, selected accessibility mechanics and no full Nisli integration or assistive-technology audit. The fixed, detailed task requirements may themselves leave less room for guidance to help. Historical browser compatibility, maintenance over time and harder modern-feature knowledge gaps remain outside this study.

The bounded practical result is to retain explicit behavior checks when using guidance and to verify the focus-return target in this dialog pattern. Research is complete for the accepted 54-run design. The next decision is author review of these findings before choosing any article; a larger or harder study remains a separate proposal, not an automatic continuation.
