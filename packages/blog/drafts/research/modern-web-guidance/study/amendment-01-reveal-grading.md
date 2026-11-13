# Amendment 01: correct reveal grading without regenerating trials

November 13, 2026, America/Los_Angeles. Recorded during execution, after the first eight result files were inspected for failed-check categories. Condition-level comparisons had not been computed. The original protocol, input manifest and grader remain unchanged.

## Evidence and reason

Opaque artifacts `5cf35dff774d` and `204030759c26` failed only T06's `offscreen-entry-reveals` check in both engines. Their source sets an offscreen card to opacity zero after reading its geometry, with a 750 ms transition. The frozen grader examines opacity after approximately 90 ms and rejects it for not yet being below 0.1. This does not establish that entry reveal is broken.

The task says offscreen cards **may** wait for entry. Requiring an initial hidden state is also stricter than the written task: a static readable fallback is permitted. The cleanup check similarly must permit an implementation that creates no observation at all; it should reject a retained observation, rather than require a cleanup call unconditionally.

These are grader defects discovered from preserved artifacts. They are not grounds to change the task, give an agent a follow-up turn or replace an implementation.

## Correction

[grade-v2.mjs](grade-v2.mjs) changes only T06-related checks/instrumentation:

- Entry reveal scrolls the card into view and waits for readable settled content, allowing up to four seconds. It does not demand initial invisibility.
- The initially visible card uses the same settled-readability wait instead of a fixed 900 ms sample.
- Removed-element cleanup measures whether that element remains in an observer's tracked targets. No observation is a valid case.

All other assertions, stimuli and generation settings remain byte-identical to the frozen version. This includes reduced-motion immediacy, missing-API and no-JS visibility checks.

## Analysis procedure

The supervisor continues generating all 54 attempts and records original v1 grades. Preserve them in `run-results/`. After generation, calibrate v2 against T06's reference, broken and starter controls, then regrade **all nine T06 artifacts**, regardless of condition or original outcome. Store those results separately in `regraded/`; never overwrite v1 results. Unaffected task grades are identical by construction.

Report both the preregistered v1 comparison and the corrected comparison. Identify which successes change and why. Use the corrected behavior assessment for the practical conclusion, with the post-start amendment disclosed. Freeze the amendment and v2 hashes before performing those regrades.
