# Real third-party fetches, with the service answer and exact stored row

November 1, 2026 UTC. Continues the [frozen plan](16-third-party-validation-plan.md) after the owner explicitly questioned whether the earlier evidence was entirely from third-party services and manually validated. The answer was **no**: the earlier live positives were our own browser controls, the traffic aggregate was programmatically analyzed production data, and the fresh Gemini/Perplexity tasks failed. Those historical findings remain real within their stated boundaries.

## New successful trials

Codex operated actual service interfaces in the in-app browser, read their returned content, inspected native Cloudflare receipts, tailed the production Worker and queried the exact stored rows. This is agent-operated hands-on validation, **not Goga personally clicking every interface or hand-inspecting all 628 older records**. The Mac remained locked; no signed-in desktop session or new account was used. The owner explicitly approved the Duck.ai and Grok first-message Terms before submission.

| Service and configuration | Actual visible result | Origin and persistence |
| --- | --- | --- |
| Duck.ai, signed out, GPT-6 Luna, Fast; submitted 08:12:19.886 UTC | Correct original-study H1; quoted the requested section | Assigned request 08:12:21.373 UTC, HTTP200, DuckAssistBot declaration, local signature verified, uniquely joined acknowledged insert and exact D1 row |
| Jina public hosted reader, no account | Returned article title and full Markdown, including “Maintaining this reference” | Assigned request 08:12:08.978 UTC, HTTP200, unsigned and undeclared, stored as Cloud browser, uniquely joined acknowledged insert and exact D1 row |
| Grok, signed out, Fast; submitted 08:12:20.183 UTC | “Continue your conversation” / “Sign up to continue seamlessly with Grok’s full power”; no assistant answer | No assigned-URL match in the captured stream; no accepted fetch chain |

Both assistant outcomes were inspected before 08:12:33.170 UTC. Returned content was inspected again at 08:18:00.019 UTC. Jina's exact navigation clock was not recorded; its received request clock is not presented as that navigation clock. Gemini and Perplexity r2 labels were reserved but not submitted; their earlier failures remain separately dated.

Duck.ai answered:

> H1: “Which AI Fetchers Send Which Headers, Measured on a Live Site”
>
> From “Maintaining this reference”: “The broader monthly vendor repeats have not been completed; later rechecks should retain the original captures alongside changed behavior.”

The quoted sentence exists verbatim in the article source. The service's displayed source link points to its exact assigned URL. Jina's visible response names its assigned URL as `URL Source`, returns the same article title and includes the sentence “Browser remains a request classification, not a human count.” in the requested section. Neither assigned blog URL was opened directly as a browser control. Each received one matched GET in this finite stream. URL assignment and timing support controlled attribution; unsigned fields remain cryptographically unsigned.

The [minimized findings and source commitments](third-party-findings.json) preserve configurations, exact prompts, returned content checks, closed request/receipt fields, time bounds, query checks and limits. Private conversation URLs, row and operation references, signatures, nonces, raw headers, client addresses and unrelated requests remain outside Git.

## The signed request is fresh too

The actual DuckAssistBot request's component list is `("@authority" "signature-agent")`, with a **600-second validity window**. Its method, path, query, User-Agent, full target URL and content digest remain unsigned. The local production verifier is profile `2026-10-31.3`; classifier `2026-10-31.1`, collector `2026-10-30.1`, execution Worker `2aaa3854-77d3-41fa-9a76-7bcaa5ce65af`. Native verified-bot/signed-agent booleans are unavailable. No claim is made that the local verdict is Cloudflare's managed verification.

The exact acknowledged-reference native query returns one stored message. Its rendered receipt was inspected, then the invocation view displayed HTTP200 and its three records: incoming request, attempt and stored acknowledgement. The actual native JSON download preserves all three; no reconstructed native envelope is used for replay. Their request and operation joins, URL, observation second and **full current receipt projection** agree with the exact stored row. Jina's native acknowledged receipt was separately inspected and its full projected row also agrees.

The public DuckDuckGo signing directory was fetched once after the request with a truthful research User-Agent. [`replay-real-proof.mjs`](replay-real-proof.mjs), now accepting `--service=duck`, consumes the unchanged native request and recorded attempt time. Node24.14.1, native local workerd and the pinned independent `pyauth/http-message-signatures` implementation all verify it. The [fresh proof receipt](duck-real-proof-replay.json) records source hashes, directory date, covered fields and exact comparisons. No generated signature, counterfactual mutation or external replay request is involved. A later public key capture does not reconstruct the Worker's original resolver response; the directory response signature is not independently checked here.

The independent source's eighteen files and five exact dependency versions were checked. The old temporary source/dependency copy was missing; the pinned official source was restored and hashes matched. The first restored dependency target selected a different Python ABI and failed to import cffi. An explicit Python3.14 target repaired that execution prerequisite. Both failed local attempts remain private; the final `duck-replay-03` supplies the accepted three-verifier result. The earlier actual Exa capture still passes all three executions with the generalized script's default mode. These are untouched real-request replays, distinct from new live service actions and from generated regression cases.

## Collection and cost

The GET tail started before 08:12:02.427747 UTC and stopped before **08:13:46.960322 UTC**. Its final84,002 bytes contain14 complete JSON objects, two assigned-URL matches, zero malformed complete frames, zero outside-text fragments and no unparsed suffix. The controller and raw stream hashes are in the minimized receipt. This is a captured stream, not a proof of complete provider logging. Missing matches do not prove no request was made anywhere.

Existing Cloudflare account/database metadata succeeded before the query. A constant SELECT confirmed query access at zero reads/zero writes. The exact two-reference selector passed a fresh native local D1/schema preflight with integer-primary-key selection. One remote `--command` SELECT returned two rows, acknowledged **four reads and zero writes**, and executed once. Both full receipts match; no broad data query or new traffic export was necessary. A default-sandbox loopback preflight failed EPERM; the permitted native execution then passed. Initial default-sandbox metadata access failed DNS; existing-login metadata succeeded with permitted network access. No credential repair or permission change is inferred.

Both requests have `is_owner=0` and are deliberate public-counted experiments. They occur after the frozen October31 analysis day and are excluded from that article's628-event selection by its time boundary. They are not organic audience growth or verified human readers. Jina's actual Chrome navigation metadata includes `Sec-Fetch-User: ?1`; its Cloud browser classification does not identify the operator or authenticate the service.

No site protection, diagnostic capture setting, credential, permission, public exclusion policy or analytics runtime changed. Grok's gate was not bypassed and no new account was created. Generated inputs remain labelled software regression checks. The current empirical findings now include **one fresh prompted assistant fetch and one actual hosted-reader fetch**, with complete service-result/origin/storage chains. They do not establish an all-vendor survey or individually validate every historical production record.
