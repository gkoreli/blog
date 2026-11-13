# First campaign: retained diagnostic evidence

All 54 generation attempts completed without a cap hit. This campaign is excluded from the primary working-skill comparison because its offline command integration was defective. The complete replacement batch is [campaign 02](campaign-02/protocol.md).

[Execution audit](execution-audit.json): all 18 skill-arm runs read the skill file; four had locally logged search/retrieve use, 13 raw event streams contained npm `ENOTCACHED` errors, and one had neither a locally logged lookup nor that error marker. The host login shell bypassed the process PATH shim. The shim also lacked support for valid `--no`/`--no-install` options; that source defect is separate from the observed npm cache errors. This is a harness failure, not a product retrieval-quality finding.

The [original scores](summary.json) were baseline 15/18, skill 16/18 and supplied 14/18. [Corrected behavior scores](summary-corrected.json), after the two documented grading amendments, were 18/18, 18/18 and 15/18. Neither table is the primary controlled result. Original run rows and generated runtime code remain in `run-results/` and `artifacts/`; original and corrected CSVs remain separate.

The corrections removed overly strict reveal/timing failures. Three directly supplied dialog outputs still missed explicit focus restoration in WebKit; the [dialog probe](dialog-probe.json) distinguishes persistent focus loss from asynchronous close-event timing. This observation is local to these outputs and engines, not a general claim that guidance worsens code.

The original frozen inputs and grader, both amendment snapshots, calibration, regrades and hashes remain available. No failed attempt was overwritten or silently replaced. The first three engineering preflights (file write, skill advertisement, then repaired command execution) are separate from the two 54-attempt campaigns. No article or production patch follows automatically from these results.
