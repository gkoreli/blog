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

The market is building in two directions. App teams add their own copilot, so the app chooses and runs the agent. Browser teams add one assistant that can see many pages, so the browser vendor chooses the agent.

Both can make good products. An app-owned agent can know its product in depth. A browser-owned agent can work across tabs without waiting for each site to integrate.

[Brave Leo's Bring Your Own Model](https://brave.com/blog/byom-nightly/) is the closest useful comparison I have found. It lets a user connect a local model, a remote endpoint, or a third-party API straight to Leo. Requests can bypass Brave's servers. That is real user control, and AgentPort should not pretend otherwise.

But a model is not an agent. A model endpoint does not carry the user's memory, prompts, MCP servers, files, runtime, approval rules, and work in progress. Brave lets the user bring inference into Brave's assistant. AgentPort lets the user bring the assistant they already run into a capability surface that another application owns.

That ownership split is the claim:

- the user chooses and owns the agent;
- the application defines the actions it is willing to lend;
- the wallet grants a narrow, expiring connection between them;
- the relay cannot read the session;
- the application never receives the user's model key or inference bill.

Each part exists elsewhere. I have not found another system that joins all five around a user-chosen remote agent. This is a claim someone can disprove: show me an open system where any application can lend its own bounded capabilities to the agent a user already runs, with consent at the user's key and sealed transport through the middle.

The protocols around AgentPort are not rivals. [AG-UI](https://docs.copilotkit.ai/ag-ui/introduction) gives agents and user-facing applications a common event stream. WebMCP lets a web page publish tools. MCP connects agents to tools, while ACP lets a client drive an agent process. AgentPort uses those layers. It supplies the ownership, attachment, consent, and grant that sit between them.

## WebMCP gives a web app a voice

The web already has a draft answer for how a site can describe its actions. It is called WebMCP.

WebMCP lets a page say, in a form an agent can use: “Here are the tools available here.” A writing app can publish `readDocument` and `replaceSelection`. A shop can publish `searchProducts` and `addToCart`. The tool runs inside the page, where the product already knows how its own data and controls work.

That is the right input to AgentPort. AgentPort does not ask developers to rewrite WebMCP in a private format. It collects the tools a page registers through `document.modelContext` and lends them to the user's agent for the session.

WebMCP and AgentPort solve different parts of the problem:

- WebMCP says what the website can do.
- AgentPort says which user-owned agent may do it, with whose consent, for how long, and over which private connection.

WebMCP does not choose the user's agent. It does not prove that the agent belongs to the user, connect to an agent on a laptop or VPS, or set the bounds of a session. AgentPort adds that missing trust and transport layer.

The full path is simple: **WebMCP tools in, the user's agent in the middle, and streamed results back to the app.**

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

## A wallet for AI agents

MetaMask gave websites a standard way to ask for a user's wallet without taking custody of the user's keys. AgentPort uses the same shape for agents.

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

| Term / Claim | Source | Date |
|---|---|---|
| Bring Your Own Model | [Brave](https://brave.com/blog/byom-nightly/) — Leo can connect straight to local or remote model endpoints | Jun 2024, updated Aug 2024 |
| WebMCP | [Web Machine Learning Community Group](https://webmachinelearning.github.io/webmcp/) — web applications expose JavaScript tools to agents | Aug 2026 draft |
| AG-UI | [AG-UI documentation](https://docs.copilotkit.ai/ag-ui/introduction) — event protocol between agents and user-facing applications | Accessed Aug 2026 |
