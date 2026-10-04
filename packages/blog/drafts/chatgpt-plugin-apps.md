# ChatGPT Plugins: What Can We Build Beyond Tool Calls?

*Historical September 29 exploratory draft. Superseded by [the published October 4 article](../posts/028-chatgpt-plugin-apps.md). Retained to show the initial research and editorial development.*

*Working draft, September 29, 2026. Documentation and source review; no live plugin test or distribution measurement yet.*

OpenAI now documents ways for plugins to open from ChatGPT’s sidebar, sit beside a conversation, and handle files in their own interface. That makes a different kind of product possible: an application someone can work in while their assistant reads its state and acts on it. The interesting question is what becomes worth building when the application can share the assistant the user already uses.

[Tibo’s announcement](https://x.com/thsottiaux/status/2104991765904375896) caught my attention because it joins that product idea to a distribution promise: relevant plugins appearing within conversations. I want to explore the possibility before deciding what I think of it. Researching and writing are part of how I get myself inspired; publishing gives someone else a chance to benefit from the work too.

The first pass gives us a few things to work with:

- Plugins can offer an interface as well as callable tools. OpenAI’s CAD example shows why the combination matters.
- A plugin listing, a recommendation, and a successful tool call are separate events. We have documentation for tool selection, but no measured evidence here for organic discovery.
- Shared standards help reuse parts of an integration. ChatGPT-specific extensions still need a host that supports them.

## The application can stay open

An app can have a place in ChatGPT that the user opens directly. It does not have to wait for the model to choose a tool each time the user wants to see it.

The [extension specification](https://github.com/openai/mcp-extensions/blob/e314720a0daac326217d1f123fcf51647868fa9f/docs/spec.md#mcp-app-entrypoints) defines three entrypoints. A global entrypoint opens an app from the sidebar. A thread entrypoint opens a separate instance within a conversation. A file entrypoint supplies a viewer for a supported file type.

| Entrypoint | What it gives the user | Product question it raises |
|---|---|---|
| Global | A place to open the application directly | Does this task need a lasting workspace? |
| Thread | A view tied to the current conversation | What should stay visible while the user talks? |
| File | A viewer or editor for the opened file | What can a specialist interface explain or change better? |

These are documented capabilities, with platform limits. The pinned specification lists file entrypoints and composer mentions as desktop-only at launch; it defines web support as the Work browser, excluding classic ChatGPT. The [developer page](https://developers.openai.com/plugins/build/extensions) also says web extensions for Free and Go users are coming soon. A builder needs to check the exact surface and plan rather than treat the whole ChatGPT audience as immediately reachable.

The word *native* needs care here. The source includes an MCP server and a web interface that integrates with the host. A sidebar entry does not by itself turn that interface into a compiled desktop application or give it unrestricted access to the computer.

## A CAD viewer makes the idea concrete

OpenAI’s [Bits & Bolts example](https://github.com/openai/mcp-extensions/blob/e314720a0daac326217d1f123fcf51647868fa9f/plugins/bits-and-bolts/README.md) lets users browse parts and inspect them in 3D. Its source also exposes actions for the current mounted view: read it, open a part, configure the camera, rotate geometry, and save a file.

Those actions distinguish things that an interface already knows are different. Changing the camera changes how you look at a part. Rotating geometry creates an unsaved edit. Saving writes the edited file.

The [controller](https://github.com/openai/mcp-extensions/blob/e314720a0daac326217d1f123fcf51647868fa9f/plugins/bits-and-bolts/src/app/controller.ts#L599-L664) gives each action its own tool. Its save path checks for a writable, versioned STL file, sends the version token with the write, and handles a conflict without saving over the outside change. This is source inspection, not a claim that we ran the example or verified every failure case.

That detail matters to the product idea. A useful app gives the assistant meaningful operations while keeping the state legible to the person. The user can inspect a part, ask for a change, and review the result in the same view. Text remains useful for intent and explanation; the viewer supplies the spatial information text handles poorly.

It also gives a way to judge a proposed plugin. What can the user inspect? What can the assistant change? Which changes remain drafts, and which persist? If those answers are vague, putting the app in a sidebar will not resolve them.

## Context becomes part of the interface design

An app can supply the model with selected content and current state instead of making the user explain everything again.

The specification’s [`ui/update-model-context` extension](https://github.com/openai/mcp-extensions/blob/e314720a0daac326217d1f123fcf51647868fa9f/docs/spec.md#uiupdate-model-context-extensions) supports text, images, resources, and structured content. An update replaces the context previously supplied by that app instance. Supported visible content blocks can appear as removable composer attachments, and the host can notify the app when context changes.

This gives the app developer a consequential design choice: which parts of the current view does the model need? Sending the whole application state would be easy to propose and often hard to justify. A selected part, the current view, and the user’s comment may be enough for a specific request.

That is an engineering hypothesis to test. The interface might make the assistant more useful by supplying precise state; it might also supply stale, excessive, or misleading state. The protocol provides a path for context. It does not establish that every use of that path improves the answer.

## Discovery needs its own evidence

The announcement’s promise of plugins appearing in relevant conversations is intriguing because it could put a product in front of someone who has already described a need. A builder would want to know how often that actually happens.

There are several separate questions: can someone find and install the plugin, does ChatGPT suggest it without a direct request, and does the model call the right tool once its capabilities are available?

[OpenAI’s metadata guide](https://developers.openai.com/plugins/guides/optimize-metadata) addresses tool invocation. Names, descriptions, and parameter documentation help the model decide when to call a tool. The guide recommends testing direct requests, requests that describe an outcome without naming the product, and requests the tool should leave alone. It asks builders to track precision and recall.

That is useful guidance for integration quality. It does not give us the ranking rules for competing plugins or a forecast of how many users a new listing will receive. The announcement’s audience figure is an attributed claim; this research has not independently verified it or measured the audience available to any particular plugin.

For a small product, I would keep the measurements separate: recommendations seen, installs, appropriate invocations, completed tasks, and repeat use. That is a proposed measurement plan, not a dashboard OpenAI has been shown to provide. Server logs can establish that a request reached the server. They cannot, by themselves, tell us every recommendation the user saw or whether the result was useful.

## This connects to a question I already care about

In [Bring Your Own AI Agent Everywhere](/bring-your-own-ai-agent), I argued for separating the application’s capabilities from the user’s agent. The application supplies the actions; the user brings the assistant they already use.

ChatGPT plugins make one version of that split concrete. The application can contribute domain tools and an interface inside an existing assistant. But the host still controls that assistant. Choosing a ChatGPT plugin is different from attaching any user-chosen agent to any application.

| Question | ChatGPT plugin approach | AgentPort’s stated goal |
|---|---|---|
| Where does the interaction happen? | In a supported ChatGPT or Codex surface | In the application surface lending capabilities |
| Who supplies the agent? | The host product | The user chooses a compatible agent |
| What does the application contribute? | Packaged instructions, tools, and optional UI | A scoped capability surface |
| What is the main attraction? | Work inside an assistant the user already uses | Carry the chosen agent across applications |

This is a comparison of product models, not a benchmark or a claim that AgentPort has finished every integration. My own article is evidence of what I wanted to build, not independent proof that the design succeeds.

The new platform is useful to think with precisely because it offers a concrete implementation of part of that ambition. It also makes the remaining ownership question easier to name: how much of the experience can move if the user or developer wants another host?

[OpenAI’s architecture guide](https://developers.openai.com/plugins/concepts/plugins) recommends the MCP Apps UI standard as the base, with ChatGPT extensions added when needed. That supports sharing some integration work. It does not make a ChatGPT sidebar entrypoint, file handler, or host-specific context feature work in every MCP client. The TypeScript SDK explicitly tells developers to check whether an extension is available after initialization.

## Two products I would explore

A research workspace is one candidate. While the conversation explores a topic, a panel could keep claims beside their sources, distinguish checked evidence from open questions, and let the user inspect the passages behind an assertion. The plugin’s value would be that evidence record and its editing rules. Another generic research chatbot would add less to the work I am doing here.

A specialist file editor is another. The CAD example suggests a pattern that could apply to a domain where people need to see and adjust a structured object. The assistant could handle a request in words while the interface exposes the actual result and the domain rules govern what can be saved.

Both are proposals. We have not tested whether users prefer them inside ChatGPT, whether the platform recommends them, or whether they can support a business. The [publication flow](https://developers.openai.com/plugins/deploy/submission) still requires verification, checks, review, and a separate publish step. And the current [checkout documentation](https://developers.openai.com/plugins/build/monetization) describes approved physical-goods flows and selected embedded-checkout partners; it does not establish a general paid-plugin model for these software ideas.

I want to start with one task whose current workflow I can compare. For the research workspace, that would mean checking whether a person can return to an article claim, inspect its evidence, and correct it more easily than with the tools already available. Then there is a second question: will they return to the plugin for the next article?

That is where the announcement leaves me interested. We have enough of the interface contract to imagine useful products and inspect how one example works. The next step is to find a task that benefits from sharing the assistant, then see whether the app earns a lasting place in the user’s work.

---

## Glossary

| Term / Claim | Primary source | Date |
|---|---|---|
| Plugin | [Architecture](https://developers.openai.com/plugins/concepts/plugins): a package of skills, MCP capabilities, and optional UI | Checked September 29, 2026 |
| Entrypoint | [Pinned specification](https://github.com/openai/mcp-extensions/blob/e314720a0daac326217d1f123fcf51647868fa9f/docs/spec.md#mcp-app-entrypoints): global, thread, and file access | Commit `e314720`, checked September 29, 2026 |
| Native integration and rollout | [Extensions](https://developers.openai.com/plugins/build/extensions): host surfaces and current access caveats | Checked September 29, 2026 |
| Mounted app actions | [CAD controller](https://github.com/openai/mcp-extensions/blob/e314720a0daac326217d1f123fcf51647868fa9f/plugins/bits-and-bolts/src/app/controller.ts#L599-L664): actions on the current view | Commit `e314720` |
| ETag | [Resource writes](https://github.com/openai/mcp-extensions/blob/e314720a0daac326217d1f123fcf51647868fa9f/docs/spec.md#resource-writes): a version token used for conditional saving | Commit `e314720` |
| Model context | [Context extension](https://github.com/openai/mcp-extensions/blob/e314720a0daac326217d1f123fcf51647868fa9f/docs/spec.md#uiupdate-model-context-extensions): state supplied by an app instance | Commit `e314720` |
| Tool-selection evaluation | [Metadata guide](https://developers.openai.com/plugins/guides/optimize-metadata): labelled prompts, precision, and recall | Checked September 29, 2026 |
| Publication | [Submission guide](https://developers.openai.com/plugins/deploy/submission): checks, review, approval, and publishing | Checked September 29, 2026 |
| Checkout scope | [Checkout reference](https://developers.openai.com/plugins/build/monetization): current eligible commerce flows | Checked September 29, 2026 |
| Agent ownership | [AgentPort article](/bring-your-own-ai-agent): the author’s prior position, not independent corroboration | August 20, 2026 |
