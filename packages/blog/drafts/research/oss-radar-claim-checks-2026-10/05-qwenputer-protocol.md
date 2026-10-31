# Qwenputer: compiled CPU versus learned ability

Frozen before execution, October 30, 2026 Pacific. Project deep dive, third investigation. Reader need and original question are in the [intake](00-worklist-index.md). Baseline `divagr18/qwenputer@f07a0b2e38271454c4d455dc2b9bf78d3d399170`; launch October 22, discussed October 29.

Question: do the added weights implement computation, or is a host interpreter supplying answers? Distinguish circuit evaluation, emitted stock Qwen modules and the full 4B merged model. Training is separately answered by compiler provenance; a correct output alone cannot establish how weights were produced.

Plan: inspect compiler, recurrence, initial-state injection, decoder and RvChat. Build the pinned standalone CPU or a bounded emitted-model test on the available Mac. Compare multiple instructions and memory operations to expected results; include a changed operand and invalid-instruction control. Compare emitted module outputs to the circuit/reference where feasible, naming teacher-forced versus free-running tests. Instrument or block reference execution during the model run if claiming independent free-running computation. Use the project's declared dependencies in a temporary virtual environment; do not change global tools or download the 18.8 GB merged checkpoint without a feasible local runtime.

Acceptance: a reproduced model-level calculation, its exact trace/output, build/runtime versions, limits and a tested alternative explanation. Full-model arithmetic scores, CUDA throughput, unchanged base-model behavior and experimental filesystem remain author-reported unless independently run. A CPU-only reference interpreter pass does not fulfill the model-level claim. If hardware or runtime makes the test infeasible, record the concrete failure and defer publication rather than substitute a paraphrase of the launch.

No paid compute, private prompts, external outreach or delegation. Temporary source: `/tmp/oss-radar-five-claims-2026-10-30/qwenputer-fixture`; environment: `qwen-venv` beside it. Owned processes must finish or be stopped before handoff. Raw output outside Git; public methods and synthetic results only.
