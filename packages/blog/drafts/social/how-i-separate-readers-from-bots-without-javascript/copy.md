# X thread: Bot Detection Without JavaScript

Draft copy for Goga's review. Not posted to X. The [launch brief](launch-brief.md) contains the posting steps, sources, and claim boundaries. These are proposed social posts, not quotations of earlier owner prompts.

Five posts, each below 280 characters. Counts include numbering and line breaks, with each URL counted as 23 characters under [X's link-counting rule](https://help.x.com/en/using-x/how-to-post-a-link), checked September 6, 2026 Pacific time. Copy only the contents of each text block. The article link appears in posts 1 and 5; one #BuildInPublic tag appears in post 1.

## 1. Measured result and article link

Length: 276 characters.

```text
1/5

My blog's bot rules reclassified 74.5% of browser-UA traffic without a browser script.

That left 95 Browser observations versus 14 Cloudflare script page loads (Sept 4–5, UTC).

A smaller count still doesn't establish readership.

https://gkoreli.com/how-i-separate-readers-from-bots-without-javascript

#BuildInPublic
```

Media: attach the measurement loop if it has been produced and checked using [shot-list.md](shot-list.md). The copy also works without an attachment; inspect the article-link preview.

## 2. Network evidence and useful agent access

Length: 247 characters.

```text
2/5

Headers weren't enough: 60 requests on hosting networks passed the browser-navigation checks.

Network evidence changed their classification. It didn't tell me who triggered them.

I want useful agent access to remain visible in my analytics.
```

Media: no attachment.

## 3. Executed parser repair

Length: 247 characters.

```text
3/5

Accept: text/html;q=0 means HTML is unacceptable. My parser counted it as acceptable.

I replaced the substring check with HTTP quality and media-range parsing. In 12 selected local regression cases, incorrect results fell from seven to zero.
```

Media: no attachment.

## 4. Signer identity and request purpose

Length: 245 characters.

```text
4/5

A verified signature doesn't establish that a person asked an agent to fetch a page.

Exa's search crawler signs requests too.

I need separate fields for the claimed client, verified signer, documented role, and any directly known trigger.
```

Media: no attachment.

## 5. Practical method and a specific reply invitation

Length: 276 characters.

```text
5/5

If you maintain analytics: compare the event definitions, time windows, exclusions, and collection failures before interpreting a counter gap.

Have you reproduced a server-versus-script discrepancy and isolated its cause?

Methods, numbers, code:
https://gkoreli.com/how-i-separate-readers-from-bots-without-javascript
```

Media: no attachment. Inspect the article-link preview in the composer.

## Publication record

No X status URL exists for this draft. Record the root and final status URLs, actual publication time, and observed responses in [metrics.md](metrics.md) after publication.
