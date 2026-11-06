# November 6 production verification without another email

This dated [acceptance receipt](browser-production-no-send-acceptance.json) covers one authorized already-active designated-address request at **07:45:29 UTC**. It does not replace the earlier Inbox/owner-confirmation cycle or certify every later deployment.

## Guard, request and result

Before any submission, targeted independent D1 reads found the designated address active, confirmed, unsuppressed and without a retained confirmation hash. A final read immediately before clicking matched the earlier state. The integrated application/SQL path returns `unchanged` for an active address before delivery, so this check did not require opt-out, reseeding or another email.

The native in-app browser opened the collection-excluded `/owner` setup page and used its newsletter form. The form had a nonempty public sitekey, an initialized handler and zero idle widget iframes. One submission passed silently; no interactive checkbox was completed. The browser displayed success, removed its busy state, restored the button and removed the widget iframe.

A retained native Cloudflare invocation independently records:

| Observation | Result |
|---|---|
| `verification_passed` | Siteverify HTTP 200, one call, 25 ms, no retry |
| `unchanged` | Same application/server/client attempt references; no delivery admission |
| Completed invocation | POST `/api/subscribe`, HTTP 202, 66 ms wall time |
| Independent D1 readback | Active state, creation/confirmation timestamps and hash-absence flag exactly unchanged; confirmation ledger count 1→1 |

The controlled trace and readback establish this no-send path. No independent new Resend/mailbox readback was needed, and no new mailbox-placement or activation result is claimed. Four targeted SQL statements reported **eight reads and zero writes**; application database work is additional and was not independently metered. No production fixture row was created, deleted or reset. The short-lived log tail was stopped.

## Record the page and request versions separately

The preflight joined source **0825a053** / native build **b17d6b3f-6472-4f59-ba7b-cd7c616f0be6** / Worker **b46ac412-df88-4d80-8131-64aaf2989c06**. Native deployment UI showed 100% allocation, and its downloaded native log recorded successful deployment at 07:30:50 UTC. The page's inline bootstrap still carried that build/source identity when inspected. This is page-bootstrap evidence, not independent proof of the bytes already executed from the browser cache; the coordinator's exact served-client comparison remains separate.

A newer deployment handled the actual POST. Its authenticated service metadata identifies Worker **7d12bcd3-e61d-4742-b511-dfa22defa7c9**. Native deployment history and build **2f0bad79-6930-42a6-a6d3-f1cecb5493b0** join that Worker to source **64a95314967f9b79a81c4f711dc27cae95fbb9c6**. The downloaded log reports that exact version at **07:43:06.260 UTC**, followed by successful deployment. Fourteen browser/default-logger source files match the separately native-tested **cd1684de** implementation byte for byte.

The initial tail was filtered to the preflight Worker and captured no events. That empty capture did not establish missing application logs: the bounded persisted lookup found the same controlled request under the newer Worker. Verification, unchanged decision and HTTP completion share the same invocation and lookup references. Those raw references and request metadata remain outside Git. No repeated POST was made to obtain a better trace.

Later deployment history already contained additional manual Wrangler versions. This acceptance belongs to the measured page/request pair above. It is not acceptance of the latest allocation, of a subsequent frozen server-domain revision, or of the article publication build.

## Limits and continuity

This is one controlled silent challenge and already-active result in one browser. It does not validate a human checkbox, a fresh-recipient delivery, arbitrary customer browsers/networks, or a conversion rate. The earlier dated full signup/Inbox/owner-activation cycle remains its own result. The cause of the retained generic challenge-error cohort remains unknown.

The [final native browser controls](browser-attempt-native-final-acceptance.json) cover the source-side race, ownership, retry and response-body cases separately. The publishing coordinator owns the article, release checks, current allocation receipt and worklist. No article file or server code was changed for this acceptance. Further tests should not repeat the owner email cycle merely to chase newer documentary builds.
