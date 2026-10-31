# Inspect a saved external reference

Use this offline tool when checking whether a captured public page actually links to a research URL. It distinguishes direct targets, link qualifiers and possible redirect wrappers without visiting any destination or executing HTML.

```sh
python3 packages/blog/scripts/inspect_reference_links.py /absolute/path/source.html \
  --source-url https://publisher.example/guide \
  --target-url https://gkoreli.com/which-ai-fetchers-send-which-headers \
  > /absolute/path/new-reference-result.json
```

Supply the final response URL recorded during acquisition. Preserve the response status, capture time and original bytes separately; the output hashes those exact bytes but cannot authenticate their source. UTF-8 input is capped at four MiB. Python 3.10+ and its standard library are sufficient; no package installation or account is needed.

The inspector resolves relative URLs using the document's first `base` href. It ignores anchors inside script, style and template content. Exact retrieval URLs match after removing fragments; query strings remain distinct. Anchor text and `rel` tokens are recorded, including `nofollow`, `sponsored` and `ugc`. A link containing an embedded target URL is only an unverified wrapper candidate. It must never be counted as a resolved direct backlink without checking its redirect separately.

Five repeated anchors on one captured page remain one source observation. A `nofollow` token is a qualification to record, not proof of zero visibility or no reader/agent value. An unqualified link is not a guarantee of ranking credit. This tool establishes neither rendered visibility, fragment existence, editorial independence, traffic nor use of the cited evidence. Inspect the surrounding prose before recording evidence reuse.

Run the meaningful parsing controls:

```sh
python3 -m unittest discover -s packages/blog/test -p inspect_reference_links_test.py -v
```

The [October 31 trials](../drafts/research/backlink-value-trials/00-worklist.md) exercise it on captured Arcjet, Web Pulse, Vuink and Daily Artifact pages. Raw HTML remains private; the public record supplies provenance hashes, inspected reference results and their limits.
