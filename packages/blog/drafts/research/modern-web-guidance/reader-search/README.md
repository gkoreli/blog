# Reader-style blog search investigation

November 14, 2026, America/Los_Angeles. Active engineering investigation following the [frozen local E5 comparison](../passage-search/README.md). The original MWG and E5 experiments remain unchanged. This work checks actual article discovery, source coverage, paragraph selection and navigation before making further usefulness claims.

Initial observed problem: a natural-language article-location question returned unrelated passages, while a short topic term had no literal occurrence in the local article corpus. Neither vector similarity nor generic word overlap establishes that an answer exists. Raw author queries, page captures and operational records remain outside Git. Public examples and evaluation cases are separately authored and identified.

The current public index was fetched directly on November 14 and lists 46 articles, matching the earlier source snapshot's slug set. A search engine's cached index response was older and was not accepted as current production evidence. The live HTML capture records each status, response hash and cache condition; it does not equate CDN delivery with uncached origin content or with reader use.

Work in this directory is separate from reproducing MWG's seven-line calculation. General passage search continues to use the matched local E5 encoder. No Gemini article index or production search deployment is implied.
