# Agent subscriptions: existing protocols and a practical blog path

Research date: September 9, 2026 UTC / September 8 PDT. This is a protocol and implementer-document review, not a tested integration or publication proposal. Repository baseline: `f6b1f404b3b3bda0bb4ff447efad1c546b12228e`. All external sources below were accessed during this review.

An agent can already follow a publication by adding its feed to the person's reader or agent host. The publisher can remain unaware of that subscription. Other protocols support publisher-to-host delivery or federated follows, but those relationships establish different facts about who requested what.

- RSS/Atom plus a reader API can implement a personal following list today.
- WebSub verifies a callback's requested subscription; it does not authenticate the human behind that callback.
- Microsub and IndieAuth separate a person's reader data from the client operating it. MCP can expose similar actions to agents.
- WebMCP exposes browser tools. Future article delivery still needs a reader, polling, callbacks, or another durable service.

## Protocol status and responsibility

| Mechanism | Inspected version/status | What it supplies |
|---|---|---|
| RSS / Atom | [RSS 2.0.11, March 30, 2009](https://www.rssboard.org/rss-specification); [Atom 1.0, RFC 4287, December 2005, Proposed Standard](https://www.rfc-editor.org/info/rfc4287/) | Feed documents with item identifiers and content/links; the reader chooses retrieval and keeps its following list. |
| WebSub | [W3C Recommendation, June 2, 2026](https://www.w3.org/TR/2026/REC-websub-20260602/) | Hub-mediated subscription verification, leases, and HTTP callback delivery. |
| Microsub + IndieAuth | [Microsub early Editor's Draft](https://indieweb.org/Microsub-spec); [IndieAuth Living Standard, July 11, 2024](https://indieauth.spec.indieweb.org/) | Authenticated management and reading of feeds collected by the user's server. |
| ActivityPub | [W3C Recommendation, January 23, 2018](https://www.w3.org/TR/2018/REC-activitypub-20180123/) | Actor-based follows and federated delivery to inboxes. |
| MCP | [July 28, 2026 revision](https://modelcontextprotocol.io/specification/2026-07-28/changelog) | Agent-facing tools/resources, optional HTTP authorization, and explicitly requested notification streams. |
| WebMCP | [Draft Community Group Report, September 4, 2026](https://webmachinelearning.github.io/webmcp/) | JavaScript and form tools in web documents; neither a W3C Standard nor on its Standards Track. |

These mechanisms can compose. A reader server can poll RSS or receive WebSub, while an agent manages that reader through Microsub or MCP. Protocol availability does not establish support in any particular agent product.

## Where the subscription lives

For a public feed, saving the URL in a person's reader creates reader-side state. Fetching the feed ordinarily requires no publisher account or email address. The reader can deduplicate items using RSS `guid` or Atom `id`, then fetch linked articles when it needs more than the feed contains. Those identifiers describe entries; they establish nothing about human readership. [RSS item identifiers](https://www.rssboard.org/rss-specification), [Atom identifiers](https://www.rfc-editor.org/rfc/rfc4287.html#section-4.2.6).

Polling has an ordinary HTTP optimization: retain an `ETag` or `Last-Modified` value and send a conditional GET; an unchanged representation can return `304`. A persistent host must still choose a schedule, store seen IDs, recover after downtime, and decide when to notify its person. Conditional retrieval alone supplies none of that workflow. [HTTP Semantics, RFC 9110, June 2022](https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1).

Publisher-managed email enrollment instead adds an address to a delivery system. A hub callback subscription adds a topic/callback relationship. A federated follow adds an actor relationship. A single reader host may serve many people, so one callback or fetch cannot be treated as one human subscriber. These are architectural distinctions, not interchangeable subscriber counts.

## What verification establishes

**WebSub verifies the receiving endpoint's intent.** The subscriber discovers `hub` and `self` links, requests a subscription, and answers a challenge against a pending action. `202 Accepted` precedes verification; leases require renewal. Optional `hub.secret` enables HMAC verification of delivered payloads. This establishes a callback relationship, not an end human's authorization of an agent. The June 2026 update adds XSS mitigations, including a safe media type for challenge responses. [WebSub §§4–8](https://www.w3.org/TR/2026/REC-websub-20260602/).

**Microsub authorizes a client at the person's reader server.** Its `follow` and `unfollow` actions change a channel's following list; the server collects new entries using available mechanisms, commonly WebSub with polling fallback. Bearer tokens authenticate API access. The `read` scope permits reading channels, while `follow` permits managing subscriptions. Neither is a publisher newsletter authorization. A granted `follow` scope also does not encode which particular blog the person wanted followed. [Microsub actions and scopes](https://indieweb.org/Microsub-spec).

IndieAuth supplies the authorization flow and URL-based identity. Implement its current metadata discovery and PKCE requirements; the abbreviated examples in the Microsub draft are not a complete current security recipe. The authorization server and reader enforce the grant; application policy must preserve the person's requested action and limits. [IndieAuth §§4–5](https://indieauth.spec.indieweb.org/).

**ActivityPub expresses a follow between actors.** `Follow` requests updates, `Accept` can establish the relationship, and `Undo` reverses an earlier activity; the undoing actor must match the original actor. Acceptance can be automatic. The Recommendation leaves the concrete authentication mechanism unsettled and explicitly includes bots among clients. Consequently, a valid actor relationship cannot by itself prove a particular human's instruction. Operating federation also entails actor discovery, inbox processing, delivery, and abuse handling. [ActivityPub §§6.5, 6.10, 7.5–7.6, B.1](https://www.w3.org/TR/2018/REC-activitypub-20180123/).

**MCP separates tool access from notification delivery.** In the July 2026 revision, `subscriptions/listen` replaces the former `resources/subscribe` RPC and HTTP GET listening endpoint. A client requests resource updates or list-change notifications; the server first acknowledges the supported subset. The stream ends on cancellation or transport closure. This can notify an active agent connection about a feed resource; persistent following and recovery still require application state. [Pinned subscription specification, September 8 source commit](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/aa8ce049f089f92618340190d4ece141f663310d/docs/specification/2026-07-28/basic/patterns/subscriptions.mdx). The official Python SDK documents no replay or automatic re-listen and instructs reconnecting clients to refetch dependencies. [Python SDK subscriptions](https://py.sdk.modelcontextprotocol.io/v2/api/mcp/client/subscriptions/).

MCP's optional HTTP authorization uses OAuth with resource/audience binding and scopes. It can authorize an agent client to manage a reader account or call a publisher's enrollment tool. The application's granted scopes and operation determine what is authorized; using MCP does not independently establish permission for a specific subscription or email recipient. [MCP authorization, July 2026](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization).

**WebMCP can make an enrollment action callable in a browser.** The September draft uses `document.modelContext`; older `navigator.modelContext` examples should not be copied uncritically. Chrome documents an origin trial beginning with Chrome 149 and requires clients to visit a site to discover its tools. [Draft API](https://webmachinelearning.github.io/webmcp/), [Chrome documentation, updated August 7, 2026](https://developer.chrome.com/docs/ai/webmcp). Background service-worker discovery has a separate proposed explainer. Neither the document API nor that proposal establishes a publication-delivery service. [Service-worker proposal](https://github.com/webmachinelearning/webmcp/blob/main/docs/service-workers.md).

## Concrete prior art and its limits

- **Miniflux:** its maintained API documents per-application keys, `POST /v1/feeds`, entry retrieval, and feed deletion. An authorized agent could operate that API without changes at each publisher. This review inspected the contract, not an enrollment. [Miniflux API](https://miniflux.app/docs/api.html).
- **Aperture and independent readers:** Aperture collects RSS, Atom, JSON Feed, and Microformats behind a Microsub endpoint; clients such as Monocle provide the reading interface. This is implemented separation of collection from presentation, not evidence that a particular agent already supports it. [Aperture](https://aperture.p3k.io/).
- **Feedly through an agent adapter:** Zapier documents a Feedly MCP “Subscribe to Feed” action. Feedly itself documents adding public RSS sources and bearer-token API access. Its current self-service token documentation is Enterprise-focused; the older official subscription/OAuth pages returned `403` during this review. Personal OAuth onboarding and the adapter's actual enrollment behavior remain unverified. [Zapier action](https://zapier.com/mcp/feedly), [Feedly following guide](https://docs.feedly.com/article/288-how-to-follow-a-feed-in-your-feedly-account), [Feedly authorization](https://developers.feedly.com/reference/authorization).
- **Publisher delivery:** Automattic's ActivityPub plugin lets people follow WordPress blogs from tested federated platforms. Google's YouTube guide documents Atom webhook subscriptions through its PubSubHubbub hub. The latter demonstrates deployed predecessor-protocol use; it is not a June 2026 WebSub conformance test. [WordPress plugin](https://wordpress.org/plugins/activitypub/), [YouTube push guide](https://developers.google.com/youtube/v3/guides/push_notifications).

A2A was screened only for relevance: its push configuration delivers updates about an existing task. It could support an agent's monitoring job, but supplies no blog-follow contract by itself. It is outside the proposed experiments. [A2A task push configuration](https://a2a-protocol.org/latest/specification/#317-create-push-notification-config).

## Recommendation and two bounded experiments

Keep the existing RSS URL as the public subscription interface. The inspected [RSS generator](../../../src/templates/rss.ts) emits descriptions and canonical article URLs as GUIDs; [page markup](../../../src/templates/page.ts) advertises it, and articles already have HTML/Markdown representations. No new publisher endpoint is required for a reader-host experiment. Treat feed ingestion, an agent's summary, and a person's reading as separate observations.

1. **Delegated reader subscription.** In a disposable reader account, use a Microsub client authorized through IndieAuth with `read follow`, plus an independent client against the same server. Follow a controlled fixture feed, observe the following list in both clients, publish one fixture item, restart the agent, and verify one persisted entry. Then unfollow and revoke the client grant; check that new retrieval with that token fails. Record server/client versions, scope, identifiers, and outcomes. This tests management interoperability and grant enforcement, not human attention or narrowly scoped delegation to one publication.

2. **WebSub delivery and recovery.** Use a controlled feed, two independent hub implementations, and one subscriber callback. Test discovery, challenge validation against pending state, payload authentication, duplicate delivery, lease renewal/expiry, unsubscription, and a receiver outage followed by reconciliation through the feed. Record activation separately from HTTP acceptance and compare delivered item IDs with the feed. This tests actual interoperability; callback counts remain host relationships. Choose hubs and pin versions before execution.

Both are proposed experiments. No accounts, subscriptions, emails, production endpoints, or newsletter settings were changed. A publisher-side MCP or WebMCP tool becomes justified when a demonstrated reader workflow needs it; its presence alone does not create subscribers or prove delegated consent.
