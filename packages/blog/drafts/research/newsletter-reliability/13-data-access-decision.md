# Data access: prepared SQL or an ORM?

Recorded September 9, 2026 UTC, during implementation. This is a scoped implementation recommendation, not an owner decision to reject ORMs across the blog.

Goga asked: “should we be using ORM or something better than RAW sql?”

Keep the current confirmation repair on D1 prepared statements. The important invariant is that budget checks, reservation, and subscriber state change share a transaction. Introducing an ORM during this repair does not establish that invariant; either implementation still needs concurrency and rollback tests.

There are real costs to the current approach. D1 result generics do not validate selected columns at runtime or check the SQL against the TypeScript interface. Schema names, result types, and migrations can drift. Parameter binding keeps request values out of SQL syntax, but it does not prove query logic or result shape correct. Local D1 execution and lifecycle tests cover concrete failures, not every possible future edit.

[Drizzle's D1 documentation](https://orm.drizzle.team/docs/sqlite/connect-cloudflare-d1), checked September 9, 2026, documents a supported D1 driver and schema/query tooling. It is a credible candidate if the owner wants a common typed database layer. Such adoption should cover the existing database and migration ownership deliberately, preserve the admission transaction, and test generated SQL on D1. Do not introduce a private ORM or a generic database framework to avoid adopting an established tool.

[Cloudflare's D1 database API](https://developers.cloudflare.com/d1/worker-api/d1-database/), checked September 9, 2026, documents prepared bindings and transactional batches with rollback on statement failure. Those are the primitives used in this implementation. Using an ORM would change how the statements are expressed, not the need for these guarantees.

Revisit this recommendation if schema/result drift recurs, query composition spreads, or the owner prefers Drizzle's maintenance tradeoff. An ORM migration is not required to ship the current protection and has not been authorized or started by this question alone.
