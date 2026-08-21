---
title: "Bring Your Own AI Agent Everywhere"
seoTitle: "AgentPort: One AI Agent Across Every Application"
alternativeHeadline: "One private agent, one subscription, every application surface"
date: "2026-08-08"
description: "AgentPort lets applications attach a user-owned AI agent with scoped grants, private transport, and no new model subscription per app."
section: engineering
tags: [agentport, webmcp, ai-agents, privacy, agentic-engineering]
---

# Bring Your Own AI Agent Everywhere

Every new app seems to come with the same offer: pay another $20 a month for its AI feature.

A writing app wants one subscription. A task app wants another. A research tool wants a third. Each gives you a new chatbot with no memory of the work you did elsewhere. Each asks you to trust a new company with your prompts and data. Cancel the app and the agent goes with it.

Enough.

I want one AI subscription. I want one agent that knows how I work, runs where I choose, and comes with me into every application.

> "Bring your own agent everywhere."

## The user should own the agent

Most AI products bind the agent to the app. The app chooses the model, pays for inference, stores the chat, and charges the user for access. This repeats the same stack in every product.

The split should be much simpler:

- The application supplies the capabilities: read this document, update this task, search this catalog.
- The user supplies the agent: their model, subscription, memory, prompts, and tools.

The application lends a small set of capabilities for one session. The user's agent does the work, then disconnects.

This is what AgentPort does.

## The competition is an ownership model

The market is building several answers to the same problem. App teams add their own copilot. Browser teams add one assistant that can see many pages. Integration platforms give an agent a catalog of SaaS APIs.

These are real alternatives. [Composio](https://docs.composio.dev/docs) lets existing agents use authenticated tools across more than 1,000 apps. It solves part of the portability problem.

[Brave Leo's Bring Your Own Model](https://brave.com/blog/byom-nightly/) is the closest useful comparison I have found. It lets a user connect a local model, a remote endpoint, or a third-party API straight to Leo. Requests can bypass Brave's servers. That is real user control, and AgentPort should not pretend otherwise.

But a model is not an agent. Brave's BYOM contract is an OpenAI-compatible model endpoint; it does not standardize portable agent identity, memory, MCP servers, files, runtime, or approval rules. Brave lets the user bring inference into Brave's assistant. AgentPort lets the user bring the assistant they already run into a capability surface that another application owns.

Composio reaches the other side of the problem. It gives an agent tools and authentication for outside services. That is useful when the agent starts the interaction and the service has a suitable API. AgentPort lets the application start a live session and lend the agent its current, surface-local capabilities. A WebMCP tool can act on the document already open in the tab without turning the whole product into a remote API or handing an integration platform the user's account token.

The difference becomes clearer when ownership is written down:

| Approach | What follows the user | Who controls the agent | How the application becomes usable |
|---|---|---|---|
| App copilot | an account and chat history inside one product | the application | the application builds the whole agent stack |
| Browser assistant | browser context across pages | the browser vendor | the browser reads or drives the page |
| Bring your own model | a model endpoint or API key | the host assistant still owns the loop | the host assistant supplies its own capabilities |
| Agent tool platform | an agent plus connected account grants | the agent builder or user | a platform supplies API tools and OAuth connections |
| AgentPort | the whole agent: runtime, memory, prompts, tools, and subscription | the user | the application lends a session-scoped capability surface |

That ownership split is the claim:

- the user chooses and owns the agent;
- the application defines the actions it is willing to lend;
- the wallet grants a narrow, expiring connection between them;
- the relay cannot read the session;
- the application never receives the user's model key or inference bill.

Each part exists elsewhere. I have not found another system that joins all five around a user-chosen remote agent. This is a claim someone can disprove: show me an open system where any application can lend its own bounded capabilities to the agent a user already runs, with consent at the user's key and sealed transport through the middle.

The direct competition is any product that becomes the permanent owner of the user's agent relationship: the app, the browser, or an integration cloud. AgentPort wins only if users value carrying their existing agent more than they value an assistant bundled into each surface.

## WebMCP gives a web app a voice

The web already has a draft answer for how a site can describe its actions. It is called [WebMCP](https://webmachinelearning.github.io/webmcp/).

WebMCP lets a page say, in a form an agent can use: “Here are the tools available here.” A writing app can publish `readDocument` and `replaceSelection`. A shop can publish `searchProducts` and `addToCart`. The tool runs inside the page, where the product already knows how its own data and controls work.

That is the right input to AgentPort. AgentPort does not ask developers to rewrite WebMCP in a private format. It collects the tools a page registers through `document.modelContext` and lends them to the user's agent for the session.

WebMCP and AgentPort solve different parts of the problem:

- WebMCP says what the website can do.
- AgentPort says which user-owned agent may do it, with whose consent, for how long, and over which private connection.

WebMCP does not choose the user's agent. It does not prove that the agent belongs to the user, connect to an agent on a laptop or VPS, or set the bounds of a session. AgentPort adds that missing trust and transport layer.

The full path is simple: **WebMCP tools in, the user's agent in the middle, and streamed results back to the app.**

## The parts exist. The composition does not

AgentPort did not invent tool descriptions, agent event streams, browser-held keys, consent choosers, or fine-grained grants. The design makes more sense when those sources are treated as constraints instead of competitors. The project's [prior-art review](https://github.com/gkoreli/agentport/blob/main/docs/reviews/prior-art-synthesis.md) traces six related fields; these are the references that bear most directly on the product claim.

| Prior art | What it already solves | What remains outside its boundary |
|---|---|---|
| [WebMCP](https://webmachinelearning.github.io/webmcp/) | a page exposes JavaScript tools, their schemas, origin, and security hints to a browser agent | choosing a user-owned agent, proving ownership, and carrying a private remote session |
| [AG-UI](https://docs.copilotkit.ai/ag-ui/introduction) and [ACP](https://github.com/agentclientprotocol/agent-client-protocol/blob/main/docs/protocol/v2/overview.mdx) | AG-UI standardizes agent-to-interface events; ACP standardizes how a client drives an agent process | who owns the agent, where its key lives, and what one application may grant it |
| [NIP-07](https://nips.nostr.com/7) | a web page asks a browser extension to use a key the page does not hold | an agent session, tool grants, streaming, and revocation |
| [WalletConnect Sign](https://github.com/WalletConnect/walletconnect-docs/blob/main/docs/api/sign/wallet-usage.md) and [Network](https://docs.walletconnect.network/network) | a dapp and wallet pair, approve method-scoped sessions, exchange requests through an end-to-end encrypted relay, and disconnect | portable agent identity, application-lent tools, and an agent conversation |
| [Credential Management](https://w3c.github.io/webappsec-credential-management/) | browser-mediated selection, an origin shown in trusted UI, and rules for silent versus required mediation | agent discovery, agent transport, and application capabilities |
| [OAuth Rich Authorization Requests](https://www.rfc-editor.org/rfc/rfc9396.html) | structured, fine-grained authorization data such as actions and locations | a browser attachment and end-to-end encrypted agent session |

These sources do not prove that AgentPort's implementation is secure. They show that separate fields reached the same design pressure: keep keys out of the requesting page, put consent in trusted UI, describe authority as data, and bind it to a limited target.

The narrower novelty claim survives that comparison. AgentPort joins a **user-chosen remote agent** to an **application-defined capability surface** through a **user-held, scoped, revocable grant**, while a blind relay carries the **end-to-end encrypted session**. I have found each phrase elsewhere. I have not found the full sentence elsewhere.

## The web is the first surface, not the boundary

The current public integration starts in a browser. That is why AgentPort has `connect.js`, a wallet extension, a hosted wallet, and WebMCP support. It is the shortest path to proving that an application can borrow an agent without owning it.

The protocol underneath does not attach an agent to “a website.” It attaches an agent to a **surface**: a named application context with a route, a capability grant, an expiry, and a place where consent can be judged.

That distinction now runs through the code:

- the wire connects a generic client surface to an agent daemon through a relay;
- the client can identify a non-browser application as `app://local`;
- the AG-UI adapter turns an AgentPort session into events that existing agent interfaces can render;
- ACP lets the daemon drive Claude Code, Codex, Goose, or another compatible runtime;
- the authority layer decides what an attachment may do without depending on one browser widget.

WebMCP is one capability adapter. It is the right adapter for websites because the page can publish its own tools. A desktop app, IDE, terminal UI, or another client can lend a different set of functions through the same attachment model.

The browser is the supported public integration today. The other client surfaces are a direction already exposed by the protocol and libraries, not a claim that finished integrations ship for each one. The goal is one agent across every application surface, with the same ownership, consent, grant, and encrypted-session rules.

## One script connects the web

An app developer starts with one script:

```html
<script src="https://agentport.gogakoreli.workers.dev/connect.js"></script>
```

The page can then register an ordinary WebMCP tool:

```javascript
await document.modelContext.registerTool({
  name: 'inkwell.document.read',
  description: 'Read the current document',
  inputSchema: { type: 'object', properties: {} },
  execute: () => ({ text: editor.value }),
});

const session = await AgentPort.connect({ name: 'Inkwell', tools: [] });
await session.prompt('Tighten the opening paragraph.');
```

AgentPort collects that registration when the user connects. A site can also pass tools straight to `AgentPort.connect`, but WebMCP is the path that lets the same site tools work with more than one agent system.

The site does not need an AI provider, an API key, a model picker, or an inference bill. It publishes what its product can do and lets the user choose the agent.

The script alone cannot know what “send invoice” or “publish article” means inside every product. The app must expose those actions. This is a good limit: the app defines what can happen, while the user decides who does it.

WebMCP remains an experimental draft, so the current claim must stay narrow. AgentPort supports imperative tools registered after its script loads, including the older `navigator.modelContext` form. It does not claim full WebMCP support. Today, every tool collected from a page asks for user approval on each call because the page cannot grant authority to itself.

## The WalletConnect mental model

If you know crypto wallets, WalletConnect is the useful mental model. [Trust Wallet](https://developer.trustwallet.com/developer/develop-for-trust/mobile) is one wallet product that accepts WalletConnect sessions. WalletConnect is the connection layer: a dapp proposes chains, methods, and events; the wallet shows the request; the user approves or rejects it; and the settled session has an expiry and a disconnect path. Its network relay carries end-to-end encrypted messages without reading them.

The mapping is close:

| WalletConnect | AgentPort |
|---|---|
| dapp session proposal | application attachment request |
| wallet and selected accounts | user wallet and selected agent |
| approved chains and methods | approved application capabilities |
| session topic and expiry | attachment identity and expiry |
| encrypted relay | encrypted relay |
| session disconnect | teardown or revocation |

> "AgentPort is WalletConnect-shaped infrastructure for user-owned agents, with one crucial reversal: the application lends capabilities to the agent."

In WalletConnect, the dapp asks to use capabilities held by the wallet, such as signing or sending a transaction. In AgentPort, the application offers capabilities it holds, such as reading the open document or updating a task, to the agent the user chose.

The other limit is that an agent is more than a key holder. It has a runtime, model, memory, prompts, private tools, a streaming conversation, and work in progress. Calling AgentPort “Trust Wallet for agents” would make it sound like one agent app. Trust Wallet is closer to one possible wallet implementation at the edge of AgentPort. WalletConnect better captures the pairing and trust shape, while AgentPort's north star remains one agent across every application surface.

[NIP-07's `window.nostr`](https://nips.nostr.com/7) supplies a second useful piece: the page asks a browser-held signer to act without receiving its secret key. AgentPort applies that custody split to agent ownership and session consent.

A site asks to connect. The user picks one of their agents and approves the actions the site wants to lend it. The agent may run on the user's laptop, a home server, or a VPS. The site does not need to know which runtime or model sits behind it.

The user keeps control of:

- the agent and where it runs;
- the model and the bill;
- its memory, prompts, files, and private tools;
- which site actions it may use, and for how long.

The website learns only what it needs for the session: that an agent connected and what happened through the actions the site supplied. It does not receive the user's model key, private memory, other tools, or past chats.

## Private by design

The agent can run anywhere because the session content is encrypted from end to end. AgentPort's relay pairs the browser with the agent and passes sealed messages between them. It carries ciphertext; it cannot read the conversation.

The relay also stores no session history. Durable identity stays at the edges, with the user's wallet and agent. Secret keys never cross the wire.

This needs one precise caveat. End-to-end encryption protects the connection from the relay and other middlemen. It does not make an app blind to data that the user or agent chooses to send through that app's own actions. If an agent replaces text in an editor, the editor can see the new text. Privacy comes from a narrow grant, clear consent, encryption in transit, and keeping the agent's wider context out of the site.

Prompts and transcripts belong with the agent, under the user's control. AgentPort is not an inference router and does not become another company that collects the user's chats.

If you do not want to trust the hosted relay even with ciphertext, you can run your own.

## The tenets

AgentPort can change its transport, wallet, runtime adapters, and user interface. It cannot trade away these rules without becoming a different product:

1. **The user owns the agent.** AgentPort never chooses the model, keeps the transcript, or sits on the inference path.
2. **The application owns its capabilities.** It decides what the attached agent can read or change. The agent does not inherit the rest of the product.
3. **Consent stays with the user's key.** A page cannot approve its own request. The wallet or daemon shows the decision and signs the grant.
4. **Every attachment has bounds.** A grant names one agent, one surface, a set of actions, and an expiry. Both ends enforce it, and the user can revoke it.
5. **The middle stays blind.** Session content is sealed between the application surface and the agent. The relay moves ciphertext and stores no chat history.
6. **The connection stays small.** One call should attach an agent. AgentPort consumes WebMCP, ACP, AG-UI, and MCP instead of replacing them.

These are not feature preferences. They are the test for every feature. An inference proxy would break the first rule. Consent drawn by the page would break the third. A broad, permanent tool grant would break the fourth.

## Stop rebuilding the same chatbot

Today, app teams keep building chat panels, model menus, prompt stores, rate limits, billing systems, and tool loops. Then they charge users to fund the same parts every other app also built.

With a user-owned agent, an app can focus on its real value. A writing app should build a fine editor. A task app should build a fine way to plan work. Both can expose useful actions to the same agent.

The user gets continuity. The agent that helped research an idea can edit the draft and create the follow-up tasks without becoming three separate bots. Its memory and working style do not reset at each domain.

The developer gets a smaller product. There is no model contract to pick, no inference cost to hide inside a paid tier, and no need to hold the user's AI credentials.

## It should work everywhere

Sites that publish WebMCP tools give AgentPort clear, named actions with tight grants. That gives the agent the safest and most useful view of the product. A site can add the AgentPort script to offer its users a direct connection, while the extension can collect the same WebMCP tools on sites that did not add AgentPort itself.

Sites that do not add it can still work through a browser extension that lends common page actions such as reading, filling, clicking, and scrolling. Native actions remain better because they carry the site's intent, but users should not have to wait for every site to opt in.

In both cases, the important part stays the same: it is the user's agent. A browser vendor does not replace it with another assistant. A website does not rent the user a fresh bot. The agent they already chose gains limited access to the page in front of them.

The browser proves the model, but it should not own the model. The same agent should attach to a desktop editor, an IDE, a terminal application, or a product surface that has no DOM and no WebMCP. Each application lends only its own capabilities. AgentPort carries the identity, attachment, consent, and private session between them.

## The north star: one agent everywhere

> "A person should own one agent and carry it everywhere."

Software subscriptions will not vanish, nor should they. People should pay for products that help them. But access to an AI model should not become a separate $20 toll inside every product.

Let users pay once for the agent they want. Let them run it where they want. Let each application lend it only the capabilities needed for the task.

For developers, the front door starts here:

```html
<script src="https://agentport.gogakoreli.workers.dev/connect.js"></script>
```

For users, the promise is even shorter:

> "Your agent. Your subscription. Your data. Every app."

The core path works now: WebMCP tool collection, pairing, ownership checks, scoped grants, streaming, tool calls, approvals, and teardown. Under the hood, ACP lets the daemon drive different agent runtimes, while AG-UI-shaped events carry the output. AgentPort sits between those parts as the trust and transport layer they do not provide.

The long-term goal is bigger than one web integration. Websites should publish capabilities through WebMCP. Other applications should expose the capabilities native to their surface. Users should bring the agent that uses them.

One agent should move through all of them.

The end state is not a larger AgentPort service. It is a common application primitive. A user attaches the same agent to two unrelated products and thinks nothing of it. Then browser and operating-system teams argue that this belongs in the platform, and the project no longer needs to explain why it exists.

---

## Glossary

| Cross-reference | What the source establishes | Why it matters to AgentPort | Date |
|---|---|---|---|
| [Brave Leo BYOM](https://brave.com/blog/byom-nightly/) | Leo can connect straight to local or remote model endpoints, bypassing Brave's servers | It is the closest evidence that users want inference choice and local privacy. It also marks AgentPort's boundary: bringing a model is narrower than bringing an agent. | Jun 2024, updated Aug 2024 |
| [Composio](https://docs.composio.dev/docs) | Existing agents can receive authenticated tools for more than 1,000 external apps | It proves that one agent acting across products has demand. Its agent-to-SaaS direction differs from an application lending its live surface to a visiting user-owned agent. | Accessed Aug 2026 |
| [WebMCP](https://webmachinelearning.github.io/webmcp/) | Web applications can expose JavaScript tools to browser agents; the draft does not prescribe the agent-side transport | This is AgentPort's web capability input. AgentPort should consume it, not create another tool format. | Aug 2026 Community Group draft |
| [AG-UI](https://docs.copilotkit.ai/ag-ui/introduction) and [ACP](https://github.com/agentclientprotocol/agent-client-protocol/blob/main/docs/protocol/v2/overview.mdx) | AG-UI defines application-facing events; ACP defines client-to-agent process communication | They make AgentPort's UI and runtime edges replaceable. Neither assigns ownership of the agent or its grant to the user. | Accessed Aug 2026 |
| [NIP-07](https://nips.nostr.com/7) | A page can request work from a browser-injected signer without receiving its private key | It supplies the custody pattern behind `navigator.agent`: the requester asks, while the user's trusted component holds the key. | May 2022, updated Feb 2025 |
| [WalletConnect Sign](https://github.com/WalletConnect/walletconnect-docs/blob/main/docs/api/sign/wallet-usage.md) and [Network](https://docs.walletconnect.network/network) | A dapp proposes a method-scoped session, the wallet approves it, and an end-to-end encrypted relay carries requests | This is the closest architectural analogy for AgentPort's pairing, bounded session, blind relay, expiry, and disconnect. AgentPort reverses the capability direction and connects a stateful agent rather than a signer. | Accessed Aug 2026 |
| [Credential Management Level 1](https://w3c.github.io/webappsec-credential-management/) | The browser mediates credential selection, identifies the requesting origin, and distinguishes silent, optional, conditional, and required mediation | It is prior art for an agent chooser and for consent that the page cannot draw or silently upgrade. The document remains an editor's draft. | Accessed Aug 2026 |
| [OAuth Rich Authorization Requests, RFC 9396](https://www.rfc-editor.org/rfc/rfc9396.html) | Authorization can carry structured, fine-grained details such as actions and locations instead of a flat scope string | It supports AgentPort's choice to make a grant a concrete, inspectable boundary over actions and a surface. AgentPort does not implement OAuth RAR. | May 2023 |
| [AgentPort north star](https://github.com/gkoreli/agentport/blob/main/docs/NORTH-STAR.md) and [prior-art review](https://github.com/gkoreli/agentport/blob/main/docs/reviews/prior-art-synthesis.md) | The project separates user-owned agency from application-owned capability and records the sources reviewed against that split | They expose the reasoning behind the product claim, including which ideas AgentPort consumes and which gap it claims to fill. | Aug 2026 |
