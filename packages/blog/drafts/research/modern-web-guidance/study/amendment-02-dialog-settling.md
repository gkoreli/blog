# Amendment 02: native dialog close events and persistent focus failures

November 13, 2026, America/Los_Angeles, during generation and before condition-level analysis. Original generation settings, input hashes, v1 scores and the reveal-only v2 grader remain preserved.

## Evidence

Opaque T01 artifact `b2fc3f4b2dd1` uses a native `<form method="dialog">` and handles deletion in the dialog's `close` event. V1 rejected its Chromium confirmation and its WebKit cancellation/focus behavior. The [read-only probe](dialog-probe.json) compared immediate state with state after 250 ms in both engines without changing the artifact.

In Chromium, the dialog had closed before the deletion event handler ran: the immediate deletion count was zero and the report remained visible; after 250 ms the count was one and the report was hidden. The synchronous assertion wrongly rejected this valid native event timing.

The WebKit focus misses were different. After Cancel and Escape, focus settled on `BODY` rather than `delete-report`, and remained there after 250 ms. Waiting does not satisfy the task's explicit focus-restoration requirement. This is a reproduced miss in the tested WebKit/macOS configuration, not a claim about every Safari version or operating system.

## Correction and unchanged requirements

[grade-v3.mjs](grade-v3.mjs) starts from the reveal-corrected v2 snapshot and changes only five T01 closing-action checks. It waits for the modal to hide and, where already required, for the callback or focus state, using the existing 1,600 ms action timeout. It does not remove or relax the focus-restoration requirement, change callback counts, or add an agent turn.

After all generation completes, calibrate v3 against T01's reference, broken and starter controls. Regrade all nine preserved T01 artifacts regardless of condition or original result and store those grades in `regraded-dialog/`. Keep the reveal v2 regrades in `regraded/`; other task grades remain v1. Report the original comparison and this complete corrected comparison, including persistent focus failures.

The probe and source were inspected by opaque artifact ID. Condition totals were not calculated to select this change. These are post-start measurement amendments and must remain visible in the practical interpretation.
