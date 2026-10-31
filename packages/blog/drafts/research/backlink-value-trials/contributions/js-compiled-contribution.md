# Ready contribution: runtime-generated validation workload

Prepared October 31, 2026 UTC. **Not submitted or accepted.** Target: [js-compiled at the inspected revision](https://github.com/jlucaso1/js-compiled/tree/418fda419afcb6dad58e1bc85f3ccbb7911c99ed). Its 22 existing benchmark fixtures contain no generated-validator pair. The proposed contribution adds that workload with a correctness oracle; it requests no backlink.

The [patch](js-compiled-validator.patch) adds two automatically discovered benchmark files and `harness/validator.test.mjs`. It changes no runner or existing fixture. It uses erasable TypeScript, the existing `RESULT` output convention, no dependencies and no type assertions. Both variants validate the same ten rows one million times, mutate an input each round and accept a minimum-age threshold at runtime. One uses a static predicate; the other creates the equivalent predicate with `new Function`.

## Apply and verify

Use Node 24+ in a checkout at the inspected revision. Save the linked patch outside the checkout, then:

```sh
git apply --check /absolute/path/js-compiled-validator.patch
git apply /absolute/path/js-compiled-validator.patch
node --test harness/validator.test.mjs
node harness/run.mjs --benches=60-validator,61-validator --runners=node --runs=5 --warmup=1 --rss-runs=1 --out=/absolute/path/new-results.json
```

The actual upstream harness was run on these files with Node v24.14.1 on macOS arm64. Both rows recorded `status: ok`, `matchesReference: true` and `2550000`. The independent test also checks thresholds 0, 18, 29 and 61 against counts derived from the input distribution, and rejects 18.5. This confirms the Node path, not every upstream compiler. Unsupported dynamic-code runtimes should retain their failure/unsupported result, rather than silently substitute a static validator.

## Separate Bun mechanism trial

The original [measurement script](measure-validator.py) needs Python 3.10+ and an explicitly supplied Bun binary. It performs no downloads or network requests and refuses an existing output directory:

```sh
python3 measure-validator.py --bun /absolute/path/bun --out /absolute/path/new-runtime-results
python3 measure-validator.py --bun /absolute/path/bun --out /absolute/path/new-literal-results --literal-control
```

Keep this script beside the two fixtures and `controls/`. The literal control files preserve the unsuccessful first hypothesis: a constant function body and constant threshold. Their default output is also `2550000`. The second trial makes the threshold a process argument in both fixtures, and assembles that value into the generated predicate. It is a separate condition, not a correction to the earlier result.

The tested binary was the already available October 27 Bun AOT preview, revision `1.4.4-canary.1+06888611e`, SHA-256 `6f3f644be027638c560bad1e728cfb0bf3cb7b2c40dca2acbdf03c757090c834`. This is not a claim about the latest Bun release. See [all original samples and controls](../validator-results.json) and the [interpretation](../01-findings.md#the-code-contribution-survived-a-negative-control).

## Proposed submission text

The suite has algorithm, parsing and allocation workloads but lacks a paired runtime-generated validator workload. These fixtures hold the input and predicate constant while changing how the predicate is supplied. They include an independent count test and use the existing output convention. I verified the Node harness and separately tested a Bun AOT preview; the latter result depends strongly on whether the generated source is literal or assembled from runtime configuration. The fixtures model that mechanism and make no claim about a named validation library. Would this be a useful compatibility workload for the suite?

Publisher acceptance and any resulting attribution remain unmeasured. Broader compiler coverage is a separate next step, not a completed result.
