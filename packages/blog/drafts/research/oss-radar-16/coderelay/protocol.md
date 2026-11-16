# CodeRelay contract and receipt trial

Declared November 16 before execution; this record preserves that scope. Source: [`ba0f79b7d81c3508e5d6fd95fd915b0babf54ac8`](https://github.com/AymanAhsan/CodeRelay/tree/ba0f79b7d81c3508e5d6fd95fd915b0babf54ac8). The snapshot's relationship to `main-latest` installer artifacts is not established.

## Question

Does the hub bind agreement and task acceptance to the same observed contract version? What does a persisted completion receipt certify?

Run unchanged `HubStore` and `createHubServer` code with actual contract schemas/helpers. Bundle only these modules and their imports. Alias the contracts barrel's runtime `ThreadId` export to its actual `baseSchemas.ts` implementation; the fetched `index.ts` confirms that re-export. Type-only contract imports are erased normally. This avoids installing the unrelated application workspace and does not replace the hub's logic or schema with a mock.

Use a fresh owned temporary SQLite database and ephemeral loopback HTTP server. Fictional Alice and Bob receive real local hub credentials kept only in memory. A, B and C are authored forty-character commit strings; no Git repository, pushed branch, teammate, model, Tailscale or Docker is involved.

## Declared inputs and controls

1. Alice proposes a task at A. Bob reads it. Alice revises it to B. Compare stale explicit agreement at A with manual task acceptance, whose API has no observed-SHA field. Inspect contract pin, status and awaiting party after each call.
2. Agree explicitly at B, then accept. Try to revise an accepted task. These are success/refusal controls, not a claim all consent is absent.
3. Bob proposes his own revision to B. Acceptance must remain blocked while author consent is outstanding; Alice's agreement should allow it.
4. Submit a syntactically valid authored completion commit and test-success text. Inspect state after database close/reopen. Compare another member, malformed SHA and repeated completion.
5. Verify an unauthenticated snapshot is refused.

## Acceptance and limits

Record all setup/fixture failures and actual output. Inspect SQLite-derived state, not only exit status. An API version-binding difference supplies a follow-up question; it does not alone prove a GUI race or an agent working against the wrong contract. The actual local decision service must be exercised separately.

Completion is documented as an agent readiness report, not an independent test certification or automatic merge. Accepting a valid fictional receipt tests that boundary rather than alleging a defect. No claim is made about provider output, real Git fetches, concurrent production use, packaged applications or team adoption.

The final run used Node 24.14.1 on macOS arm64, Effect 4.0.0-rc.115, ws 8.21.3 and esbuild 0.27.3. Effect and ws match the selected source's exact dependency versions; Node satisfies its engine range. esbuild is the fixture's compilation tool. The portable-fixture check repeats the same conditions; it is not additional independent test coverage.
