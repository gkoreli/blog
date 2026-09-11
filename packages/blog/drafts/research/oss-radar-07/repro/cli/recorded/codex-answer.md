The blog measures **requests and classification outcomes, not verified readership**:

- Without JavaScript, its Worker records eligible successful page GETs, including HTML and negotiated Markdown; it excludes prefetches, `/stats`, APIs, non-page responses, and direct `.md` requests. [Source](https://gkoreli.com/how-i-separate-readers-from-bots-without-javascript#the-request-rules-in-the-cloudflare-worker)
- Network metadata, navigation headers, HTML acceptance, language headers, and declared User-Agents support explainable classifications. Signatures identify signers, not human intent. “Browsers” can include automation and exclude legitimate access; it provides neither an upper nor lower bound on people. [Source](https://gkoreli.com/how-i-separate-readers-from-bots-without-javascript)

The Cloudflare comparison establishes **a counter discrepancy and measured rule effects**:

- The initial 1,209-versus-113 page comparison used different windows; 578 daily identifiers versus 52 visits compared different units. It did not establish eleven times as many readers. [Source](https://gkoreli.com/how-i-separate-readers-from-bots-without-javascript#comparing-edge-page-views-with-a-script-counter)
- For September 4–5 UTC, rules reclassified 277/372 browser-UA observations (74.5%), leaving 95 Browser HTML observations versus 14 non-bot Cloudflare loads: 6.79×. This measures reclassification, not independently validated accuracy. Collection differences and incomplete owner marking remain; blockers or beacon loss can reduce script counts, while automation can execute scripts. [Source](https://gkoreli.com/how-i-separate-readers-from-bots-without-javascript)

I accessed the article; these are its reported results, not my independent verification of private telemetry.