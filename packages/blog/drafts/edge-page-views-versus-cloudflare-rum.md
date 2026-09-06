# Why Edge Page Views Disagree With Cloudflare Web Analytics

Working draft, September 6, 2026. Unpublished; the browser and beacon experiments are pending.

My edge counter recorded 95 browser-classified HTML requests while Cloudflare's script counter recorded 14 page loads over the same two complete UTC days. The first controlled checks found something I could fix before explaining that gap: seven selected HTTP headers were interpreted incorrectly, and every test request lost its network-provenance marker on the way into the database. Correcting those defects gives the next experiment a better starting point. It does not tell me what generated the historical difference.

- The historical comparison is **95 versus 14**, with different collection boundaries and no exact request join.
- The local ingestion experiment changed **seven of twelve** selected HTML-acceptance results to their expected values and retained provenance on **twelve of twelve** requests with supplied networks.
- The repair moved requests in both directions. A correct parser can increase a category as well as decrease it.
- Real-browser trials must distinguish edge arrival, script execution, beacon delivery, and recorded RUM events before I can attribute a collection difference.

## What the two counters observed

The existing comparison identifies disagreement between instruments. It does not identify 81 bots or 81 missing beacons. September 4–5 produced 372 browser-UA observations; the network and navigation rules left 95 Browser HTML observations. Non-bot Cloudflare RUM, after excluding the dashboard, recorded 14 page loads. The recorded RUM groups were unsampled, but unsampled returned data does not establish complete collection.

[The preceding article](/how-i-separate-readers-from-bots-without-javascript) reports the classification rules and their measured effect. This investigation asks where the collection paths diverge. Cloudflare documents beacon blocking and delivery loss, while browser caching and different eligibility rules introduce other possible differences. Those are candidate mechanisms, not explanations assigned to our historical rows. [Cloudflare FAQ](https://developers.cloudflare.com/web-analytics/faq/), checked September 6, 2026.

I need known visits whose path through both systems I can observe. Agreement after changing a rule would be less informative than showing why a specific event entered one counter and missed the other.

## The first experiment corrected request interpretation

A controlled local experiment found errors independently of visitor identity. This section is for someone implementing the counter: the inputs are synthetic Request objects passed through our actual ingestion function into an in-memory database. They are not browser navigations, and no RUM beacon runs.

I held the browser declaration, navigation headers, response, and synthetic network constant, varying twelve Accept values. The original parser returned a positive HTML flag whenever it found `text/html` or `*/*` as a substring. That admitted `text/html;q=0`, which explicitly rejects HTML, and rejected `text/*`, which admits it.

| Selected input | Before | After |
|---|---|---|
| `text/html;q=0` | Browsers | HTTP client |
| `text/*` | HTTP client | Browsers |
| `text/html;q=0, */*;q=1` | Browsers | HTTP client |
| `application/json, text/*;q=0.5` | HTTP client | Browsers |

The corrected parser evaluates quality and the most specific matching range for the site's UTF-8 HTML representation. In the twelve selected cases, seven original results disagreed with their expected acceptance; the repaired run has none. Five requests leave Browsers and two enter it. This is a targeted regression experiment, not a measured seven-in-twelve error rate in real traffic. [RFC 9110, Accept](https://www.rfc-editor.org/rfc/rfc9110.html#section-12.5.1).

The same run exposed the missing provenance write: all twelve requests supplied an ASN, but all twelve inserted rows had a null source marker. Adding the existing `asn_source` column to the INSERT preserves `request` for those networks. A separate absent-network test keeps the source null. This does not invent provenance for old rows.

The repair currently lives on the analytics iteration branch and has not been deployed. Its value is independently checkable behavior. It leaves the historical 95-versus-14 question unchanged because the old Accept flags cannot reconstruct the original headers.

## The browser experiment still has to run

The next result must come from paired real-browser navigations with known conditions. Three repetitions each will compare a normal load, the same load with the beacon blocked, JavaScript disabled, and warm-cache/back-forward behavior. Each trial needs its own recorded sequence: edge arrival, successful response, injected script, execution, beacon attempt, delivery evidence, and eventual RUM presence.

Existing Cloudflare diagnostics come first. The historical investigation found candidate zone matches for 77 of the 95 rows, but matching time, path, and network information without a shared identifier does not prove that two records describe the same request. Where the tools leave a stage unobservable, that missing evidence should determine the instrumentation added.

This draft will gain a results section after those trials execute. A demonstrated cause of disagreement will still need its conditions and limits; it will not automatically explain how often that cause occurred in September's ordinary traffic.
