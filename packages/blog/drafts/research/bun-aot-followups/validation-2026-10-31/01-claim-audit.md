# Claim audit for the application follow-up

Status: experiments audited, October 31; publication receipt is tracked separately. [Acceptance plan](00-plan.md). This is a Bun project deep dive extended with application tests, not a ranking of validators or HTTP frameworks. The [original theory/claim audit](../../bun-aot/03-claim-audit.md) remains historical.

## Claims

| Claim | Source or experiment | State | What the reader can infer | Limit |
| --- | --- | --- | --- | --- |
| Bun's native compiler can reduce startup, executable bytes and application memory | Same source/revision JIT/native builds; 24 process starts per server mode and completed main load passes | Reproduced across the main pass, one-minute and selected one/32-connection controls | Testing an existing app can be cheaper than starting a rewrite | One host/canary, selected apps; server memory excludes PostgreSQL |
| Runtime-generated validators can remain slow under native AOT | ata's normal package condition and engine diagnostics; explicit code-generation/interpreter controls | Code-inspected and reproduced | Inspect the dependency path actually selected, not its advertised language | A library's interpreted validator and Bun interpreting generated JS are different paths |
| Emitting validation code before native compilation can avoid much of that penalty | Initial 360 different-API observations, then 192 matching-output processes after 103 full timed-schema cases | Reproduced with corrected scope | A build-step change can matter more than a compiler flag | With matching outputs native still took 49.5 versus 34.0 ms JIT for valid nested checks; mixed inputs remain slower |
| Equal Boolean verdicts do not prove a safe validator replacement | 133 expanded labeled cases; raw module omits data/defaults and adds error metadata; adapter retains one untimed defaults error-order difference | Reproduced | Check returned values, mutation and errors before accepting a faster module | Schema-specific adapter is not a general drop-in replacement; defaults stay untimed |
| Elysia's plugin and native Bun AOT are separate transformations | Pinned upstream build scripts and four combinations | Code-inspected; builds/parity and main load reproduced | Compare runtime route construction and plugin output under both engines | Framework version differs between the two pinned public studies |
| A successfully compiled binary can still fail at startup | Both original plain API executables could not resolve dynamic TypeBox loading; source and plugin modes worked | Reproduced | Check the executable, including hidden dependency imports | This failure is shared by JIT/native packaging; it is not evidence of a native-only regression |
| Smaller files do not prove lower warmed memory or better throughput | Old accepted results and completed new main memory/load samples | Reproduced with the separate one-minute and concurrency controls retained | Keep file size, memory phase and sustained request work separate | Lifetime peaks can include earlier routes in a process; avoid attribution to one route |
| JIT bytecode can recover startup while retaining JIT-like throughput in this API | Same-entry ESM bytecode build, parity, 24 startup runs per mode and six load blocks | Reproduced | It is a useful alternative when startup matters and RAM is sufficient | The default CJS bytecode attempt failed on top-level await; ESM format worked; one API/canary |
| The original CommonJS crash still affects the same minimal case | Fresh same-fixture JIT/native build and run | Contradicted in this canary | Remove the current warning or state the historical result and present passing fixture | Issue stays open; a passing minimal fixture does not certify the wider report fixed |

## Competing explanations

| Theory | Basis | Test that could change the verdict | Present state |
| --- | --- | --- | --- |
| Type-informed native layouts and removing runtime compiler work lower overhead | Bun's pinned compiler implementation and original reference-width experiment | Memory remains lower after real framework/database requests, rather than just at readiness | Memory stays lower during minute-long requests and at one/32 connections; the full causal contribution is not isolated |
| Startup gains dominate; a warmed JIT often catches up | Bun itself documents warmed counterexamples; original tiny-server and Zod tests | Same application, warmed routes, regular/plugin factors and concurrency controls | Main pass and separate controls support workload-dependent gains, including DB regressions |
| Dependency preparation controls practical performance | ata's package-selected engine and Elysia's separately generated route code | Compare native default versus explicit runtime codegen, prebuilt module, runtime framework and plugin | Supported, with corrected matching-output cost and remaining native lag |
| An already-supported JIT packaging option may be a better tradeoff | Bun's bytecode option preserves the JIT | Same source/behavior, bytecode/native/JIT startup and warmed work | API bytecode startup median 14.8 versus 29.2 ms JIT and 11.3 ms native, with JIT-like warmed speed |

Do not claim universal halving, Rust equivalence, stable-release compatibility, all-framework support, an independently operated rerun, a maintainer endorsement or measured adoption. Do not use a build success as application acceptance, or count an invitation as a collaboration. Distilled article additions use completed observations and link their retained numeric evidence.
