# The current collector still sees an automated browser as Browser

October 30, 2026 UTC. Continues [the native reporting repair](112-native-booleans-need-their-own-denominators.md). This is a **new twelve-control production cohort**, not another replay of the original October 27 visits. Human trials remain deferred. The question is how the current collector/classifier and delivery stages behave under independently operated automation.

## What actually ran

One agent-operated browser profile and one actual curl profile each received the existing current-day owner mark. Twelve random, predeclared trial paths were admitted for at most fourteen minutes. Every successful trial persisted `is_owner=1`, so its public exclusion does not depend on keeping the daily mark. No production database failure, raw-capture mode, injected provider metadata or human label was added.

| Condition | Trials | Stored / owner-excluded | Script reports | Queue true | Accepted beacon receipts |
|---|---:|---:|---:|---:|---:|
| Normal agent browser | 3 | 3 / 3 | 3 | 3 | 3 |
| Script-blocked configuration | 3 | 3 / 3 | 0 | 0 | 0 |
| Beacon-blocked configuration | 3 | 3 / 3 | 3 | 3 | 0 |
| Actual curl | 3 | 3 / 3 | 0 | 0 | 0 |

[Per-trial aggregate and evaluation](current-production-calibration.json) match each independently recorded browser/curl execution and client receipt to an exact-ID D1 row. Every trial prepared one page response and stored one excluded observation. Collection is `2026-10-30.1`; classifier is `2026-10-29.3`. No duplicate or missing observation is accepted as a classifier abstention.

All nine agent-browser visits match **Browser signals**. Their stored facts say Chromium-family claim, navigation shape, network not listed, and activation true-claim. The three curl visits match Other bot. None of those browser indicators authenticates human operation; these visits were operated by the agent. Native verification booleans are unavailable on all twelve observations, so this is no managed-verifier comparison.

## What the error numbers mean

The existing evaluation-only operator policy makes **three correct automation decisions and nine abstentions**. Decision coverage is 3/12; zero wrong decisions among the three decided cases is not population accuracy. The counterfactual policy that calls Browser “human” makes nine wrong decisions in this selected cohort. That policy is not deployed.

The stored Browser classification describes matched request signals; it is not itself a wrong human prediction. Changing it merely to fit these controls would risk hiding that distinction. Zero accepted human labels leaves human false-positive and abstention rates null. Repeats from two profiles are correlated controls, not twelve independent readers. Physical devices, actual JavaScript-disabled operation, ordinary owner-browser verification and representative human behavior remain unmeasured.

This fresh run closes the previously missing **current production collector/stage experiment for known automation**. It does not append twelve observations to the original cohort or refresh the old cohort’s dates. The original [twelve-control ledger](../edge-vs-rum/09-trial-ledger-and-selective-evaluation.md), later relay study and this cohort keep separate denominators.

## Primary references and observation limits

[MDN’s sendBeacon return contract](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon#return_value) defines true as queue admission. The new beacon-blocked controls again show why an application must measure accepted receipt separately. [CSP connect-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/connect-src) governs beacon and Fetch destinations; the existing trial condition allows stage reports while withholding the beacon endpoint. A script-blocking condition is not an actual JavaScript-disabled browser.

[Cloudflare’s waitUntil contract](https://developers.cloudflare.com/workers/runtime-apis/context/#waituntil) describes bounded background execution. Scheduling collection does not prove persistence; independent row readback supplies that evidence here. These references were reread October 30. No measurement allocates the historical 694-versus-117 difference, and this first-party receiver is not Cloudflare Web Analytics ingestion. Counts cover accepted stages through the cutoff, not a complete wire trace. The developer-console export contains no recorded CSP messages; no complete network-log claim follows.

## Preflight, access, cost and cleanup

[Current native preflight](current-calibration-native.json) runs the actual composed Worker with native D1/crypto on four synthetic HTTP/stage conditions. The maintained helper now checks both minimum and maximum collection versions against the current implementation and explicitly uses `cf:{}` to avoid implicit provider fixtures. Those four supplied fixtures do not add browser/operator labels. A second twelve-ID ledger fixture verifies its index plan, bound/literal equality and 166 local reads.

Fresh D1 metadata succeeds, then one locally checked remote constant returns the expected value with zero reported reads/writes. This establishes current endpoint access; the cause of earlier authorization failures remains unknown. The first harness assumed local CLI row meters existed, but that response provided duration only. It stopped before the remote call; recovery reused the positive local result while preserving unavailable local meters.

One frozen exact-ID ledger SELECT returns twelve rows for **167 reads / zero writes / one reported attempt**, within the 500-read review threshold. That threshold is not server enforced. Owner guards, registration, collection, stage writes, receipts, metadata and provider work are additional; this is not the experiment’s total database cost. There is no public report fill or broad historical scan.

The native build record joins local source `0551880ac02cdb17cbb324dae136aa9ace51cfdd` to base Worker `98172983-9337-4373-9119-4b24add0d754` through successful build `f3e2d520-368a-4272-aab5-a658888f5426`. That build record was inspected after the cohort; base allocation/version metadata were captured before activation. Temporary activation has a fresh 100% allocation, with unchanged provider script ETag/runtime settings and other bindings across base, activation and cleanup. Those are deployment-context observations, not per-request version traces. Both optional bindings are removed; original secret names are restored and a registered namespace returns 404 while 518,882 milliseconds remain before the original expiry. Wrangler 4.71 rejected an unsupported `--force` flag before the first deletion handler. The supported noninteractive command then removed the two bindings; both outcomes remain preserved. Existing credential values were neither read nor supplied; the payload contained only the two previously absent optional bindings.

[Checks](current-calibration-checks.json) retain native preflight, the two helper syntax checks and twelve summary negatives covering missing/duplicate/swapped executions, human mislabelling, changed receipts/rows/profiles, cost and cleanup. The browser tab is closed; no tail was started. Counter rows were not physically deleted by this check; future cleanup and provider-wide erasure remain unproven. Raw diagnostics stay off, and privacy decisions stay open.

The concise article and its 32 shaping prompts remain unchanged because the new cohort confirms its existing distinction. The source/evidence index preserves this fresh acceptance without merging its measurements into the older narrative. The full goal remains active: native identity/oracle prerequisites, source operator/trigger, authenticated search/usefulness evidence, privacy decisions and deferred human/device trials still need their own inputs.

Publishing these helpers and research can create a later build. This receipt covers the captured experiment versions; it does not certify later service health.

The 148-file private archive has manifest SHA-256 `11e1756de113907780ca4d752aae9d5e8e77d9c13152d2ccc6dff48c516163da`. Activation plan `f7bb7752a291e724a842cf94a4ac9932932a14ab136731d27a6f3cafb8bbfb91` and read plan `265e74aa9bfd5651420c443f439c617c73029113fdbb7c3d68d4e1920088522d` reconcile with executed files. Browser manifests record actual CUA actions, but the browser procedure was not byte-archived before execution. October 31 is investigation-copy review, not automatic deletion.
