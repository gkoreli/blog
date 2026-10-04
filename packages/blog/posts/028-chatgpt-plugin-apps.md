---
title: "ChatGPT Plugin Apps: What Changed, and What I'd Build"
date: "2026-10-04"
description: "What is new in ChatGPT plugin apps, why a specialist app might beat a generated interface, and what Jupyter and VS Code teach us about building one."
section: engineering
tags: [chatgpt, mcp, plugins, product-engineering]
---

# ChatGPT Plugin Apps: What Changed, and What I'd Build

OpenAI's example ChatGPT plugin is a CAD viewer. It can change the camera, rotate the geometry, and save the file. The code treats these as three different operations: looking at a part, editing it, and writing the change.

The [September 29 announcement](https://x.com/thsottiaux/status/2104991765904375896) adds ways to open an app directly and connect it to the current work. A specialist app can give ChatGPT actions on something the person can see and edit. The person can work in the app and bring the assistant into the task.

The SDK is published, and OpenAI plans to replace custom GPTs with plugins. This is a real platform change. Whether it creates a large new market for founders still needs evidence.

I want to explore what is worth building here. Researching and writing are part of how I get myself inspired. Publishing gives someone else a chance to benefit from that work too.

Three questions help me get past the launch announcement:

- **What changed?** Interactive apps and recommendations inside ChatGPT already existed. The new extensions give apps more places to open and closer integration with the host.
- **Why install an app the assistant could generate?** A one-time interface may be enough. A maintained product needs to contribute useful data, reliable operations, or a workflow worth returning to.
- **How much can work outside ChatGPT?** MCP Apps provides a shared UI protocol. Sidebar entries, file access, and other host features still need separate support.

The answers below come from documentation and source inspection on October 3–4. The release, rollout, commerce, and migration evidence was checked again October 4. We have not run a live plugin or measured its discovery.

## What changed since the earlier ChatGPT apps?

Interactive UI inside ChatGPT is older than this announcement. The history matters because it changes what we should credit to the new extensions.

| Date | What the primary source described |
|---|---|
| March 2023 | [ChatGPT plugins](https://openai.com/index/chatgpt-plugins/) that let the model call third-party backend APIs |
| October 2025 | [Apps in ChatGPT](https://openai.com/index/introducing-apps-in-chatgpt/) with interactive interfaces, explicit invocation, and relevant app suggestions |
| January 2026 | [MCP Apps](https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/) as an official extension for interactive UI, with support reported across several hosts |
| September 2026 | [OpenAI plugin extensions](https://developers.openai.com/plugins/build/extensions) for sidebar apps, conversation panels, file viewers, settings, context sharing, and other host features |

The [specification](https://github.com/openai/mcp-extensions/blob/ca16cb3bc015baaa1b849082d8755bbef18770cb/docs/spec.md#mcp-app-entrypoints) describes three ways to open an app: from the sidebar, inside a particular conversation, or when opening a supported file. A parts library, an article's evidence panel, and an STL editor fit different ways of starting a task.

This gives the person more control over the interaction. You can open an editor and inspect an object before asking for help. The app can remain visible as the conversation continues.

The package does not always need an interface. OpenAI's [architecture guide](https://developers.openai.com/plugins/concepts/plugins) distinguishes skills, MCP servers, and optional UI. Skills provide instructions for repeatable work. MCP servers expose tools and connect to services. Use UI when people need to inspect, compare, select, or edit something. Better instructions for checking claims may fit a skill; an app could make a saved collection of claims and their source relationships easier to work with.

There are rollout limits. The pinned specification's launch matrix defines web as the Work browser, excluding classic ChatGPT, and lists file entrypoints and file resources as desktop-only. The extensions page says web extensions for Free and Go are coming soon; composer mentions are desktop-only. Check the intended surface before building around one of those capabilities.

The word *native* describes integration here. The inspected example uses an MCP server and a web interface. It does not give the interface unrestricted access to the computer.

## A real release, with adoption still to prove

The [npm registry](https://registry.npmjs.org/@openai%2Fmcp-extensions) records publication of the extension SDK, version `0.1.0`, on September 29. The public specification and CAD source give developers something concrete to work from. That establishes a developer release; it does not establish availability of every feature to every user.

There is stronger evidence of a change in product direction too. OpenAI's current [migration FAQ](https://help.openai.com/en/articles/20001519-custom-gpt-retirement-and-migration-faq) schedules custom GPT retirement for December 11, 2026, with plugins as the replacement. Some Enterprise workspaces with approved deferrals have a February 11, 2027 date. These are scheduled changes, with account-specific notices and migration availability to check.

The migration details suggest a practical opportunity. Instructions become skills and knowledge files become reference files, but custom API actions do not transfer automatically. Sharing settings do not carry over either; replacements start private. Helping a team rebuild a connection, compare familiar tasks, and get the replacement to its users could be useful work. It addresses an existing workflow. Whether teams will pay for that help remains a question to test, and migration work alone may be temporary.

The larger founder prediction needs different evidence. At the [GPT Store launch](https://openai.com/index/introducing-the-gpt-store/), OpenAI reported more than three million custom GPTs created. A creation count tells us that people tried building; it cannot tell us how many products became habits or viable businesses.

There is precedent for a platform creating a substantial software market. Apple [reported](https://www.apple.com/newsroom/2018/07/app-store-turns-10/) more than $100 billion in cumulative developer earnings by June 2018, ten years after the App Store began. That is a company-reported result across an ecosystem, not the typical founder's profit. It also followed years of development in distribution, purchases, and subscriptions. It gives us a reason to take the possibility seriously, rather than evidence that ChatGPT will repeat it.

For everyday use, the promising change is working on the same object with the assistant: select something, ask for a change, inspect the result, then save it. Useful repeat use would support the interaction claim. Paying customers and a sustainable cost of serving them would support the business claim. Neither follows just from shipping an SDK.

## The CAD viewer gives the assistant actions on the open editor

[Bits & Bolts](https://github.com/openai/mcp-extensions/blob/ca16cb3bc015baaa1b849082d8755bbef18770cb/plugins/bits-and-bolts/README.md) has two sets of tools. Its [server tools](https://github.com/openai/mcp-extensions/blob/ca16cb3bc015baaa1b849082d8755bbef18770cb/plugins/bits-and-bolts/src/server/register.ts#L210-L271) search the catalog and open a part. The interface exposes additional tools that operate on the editor already open in front of the person.

| Action on the open editor | What it does |
|---|---|
| `read_view` | Reads the current part, camera, note, and unsaved changes |
| `configure_view` | Changes how the part is displayed without changing its geometry |
| `rotate_geometry` | Changes the geometry and marks an unsaved edit |
| `save_file` | Attempts to save the edited file using its current version token |

The [controller exposes these actions through `tools/list` and `tools/call`](https://github.com/openai/mcp-extensions/blob/ca16cb3bc015baaa1b849082d8755bbef18770cb/plugins/bits-and-bolts/src/app/controller.ts#L763-L777). The server's own view-configuration tool directs existing-view edits to these app tools.

That distinction helps explain what an assistant-connected application can contribute. *Show me the other side* and *rotate the geometry* are different requests. The app knows how to implement both and can make the result visible. In a writing app, selecting a paragraph, proposing a replacement, applying it, and publishing should also be separate operations.

![You select and review an object in the app. The app shares selected information with the assistant, which calls actions on the open app. The app shows the result. Saving checks the file version.](/images/chatgpt-plugin-apps/shared-workspace.svg)

This diagram explains the interaction; it is not a screenshot of a running plugin.

## The ordinary editor problems still matter

The most instructive part of the CAD source is saving. Its [implementation](https://github.com/openai/mcp-extensions/blob/ca16cb3bc015baaa1b849082d8755bbef18770cb/plugins/bits-and-bolts/src/app/controller.ts#L377-L410) requires a writable STL file and an ETag: a token identifying the file version it read. It sends that token as `ifMatch` with the write. If the file changed elsewhere, the [contract](https://github.com/openai/mcp-extensions/blob/ca16cb3bc015baaa1b849082d8755bbef18770cb/docs/spec.md#resource-writes) returns a conflict. The viewer keeps the unsaved edits and explains why they were not saved.

The code also handles edits made while a save is in progress. It remembers which edits existed when saving began. If newer edits exist when the response arrives, it reports that the earlier rotation was saved and the newer edits remain unsaved.

These problems have useful prior art. [VS Code custom editors](https://code.visualstudio.com/api/extension-guides/custom-editors) separate the document from its views. A document can appear in multiple editors. Changes must update the document and those views; custom edit events can provide undo and redo. Its guide also recommends that saving not depend on a visible editor panel.

[Jupyter widgets](https://ipywidgets.readthedocs.io/en/stable/examples/Widget%20Basics.html) make a related distinction: displaying the same widget twice creates two views of one Python object, with synchronized state. Displaying another view does not create another authoritative copy of the data.

I would borrow those choices for a plugin. Keep the saved claims or file contents separate from whichever panel happens to be open. Route a button click and an assistant's tool call through the same edit operation. Give the user an undo path, and keep saving available without relying on one visible panel. Those are design proposals; the ChatGPT extension contract does not implement all of them for us.

The context sent to the assistant should be a description of the relevant state. The application still needs to know which version is being edited and what has actually been saved.

## Help the assistant understand what *this* means

Bits & Bolts [shares the current part or file, camera, dimensions, selected surface, note, and edit state](https://github.com/openai/mcp-extensions/blob/ca16cb3bc015baaa1b849082d8755bbef18770cb/plugins/bits-and-bolts/src/app/controller.ts#L418-L458). It can include an image too. The assistant can receive both a picture and an account of what that picture represents.

The [`ui/update-model-context` contract](https://github.com/openai/mcp-extensions/blob/ca16cb3bc015baaa1b849082d8755bbef18770cb/docs/spec.md#uiupdate-model-context-extensions) replaces the contribution previously supplied by the same app instance. Earlier conversation messages remain. Supported visible content can appear as removable attachments, and the host can report changes to the attached context.

For an evidence workspace, I would send the selected claim, its source passage, and its revision. Sending every source for every request would make the relevant information harder to identify.

Selection can change while the assistant is working. Suppose a request concerns claim 17 at revision 4, then the person selects another row or edits claim 17. The correction operation should name its target and expected revision. It can then reject a stale edit instead of applying it to whichever row is selected when the call arrives. The file-saving example provides the idea; the model-context API alone does not guarantee this behavior.

That is a useful test for an app: can the person see what the assistant is using, and can an edit be matched to the state the request concerned?

## Why install an app if the assistant can generate one?

For a one-time task, generating an interface may be the better answer. [Simon Willison's artifact examples](https://simonwillison.net/2024/Oct/21/claude-artifacts/) include a QR decoder, a YAML-to-JSON converter, and a pricing calculator built for immediate needs. They are concrete examples of useful software made on demand, not a controlled comparison with plugins.

Anthropic also [describes building and sharing AI-powered artifacts](https://claude.com/blog/claude-powered-artifacts) that use the visitor's Claude subscription. A plugin's opportunity cannot rest solely on putting a small interface beside a chatbot or borrowing its model.

I would ask what the product supplies after the interface is easy to generate. Perhaps it has a maintained dataset, access to an existing account, editing rules that have been tested, or work that remains organized when the person returns next week. A generated app can acquire those features too. A maintained product has to earn its use through their quality and convenience.

The difference can be tested with the same task. Compare a plain document, a generated one-time interface, and the proposed plugin. If the plugin only adds another installation step, there is little reason to keep it. If it preserves useful work and makes the next session easier, it has a stronger case.

### An evidence workspace for this article

The research behind this article already has a source register and a claim ledger in Markdown. They distinguish what a source establishes from what remains an idea or open question. I would try an app that makes those relationships easier to inspect and correct while discussing the draft.

Take the sentence *New plugins will receive useful organic distribution*. A claim row could show the announcement behind it and label the outcome as unmeasured. Selecting the row would put the relevant passage beside the draft sentence. The assistant could propose narrower wording; the person would review the change before applying it.

The app would retain the source relationship and the previous wording. A correction would name the claim and revision. Marking a claim as checked would be a separate, visible decision with an explanation of what the passage supports. Attaching a citation would not automatically certify the sentence.

The first version could contain one claim list, one passage view, and one correction operation. Compare it with the current Markdown files and a generated interface. Include a passage that contradicts the sentence. Can the person find the evidence, notice the problem, correct it, undo the change, and return to it later?

I would start here because the task is already part of this research. It gives us a reason to try the app before making a claim about demand.

### A file editor that understands one format

A second candidate is an editor for one structured configuration format. It could show relationships among fields, check a proposed change, and display a diff before saving. The assistant could explain the request and call the operation; the editor would show what changed and reject invalid combinations.

VS Code's custom-editor guide supplies a useful warning here: a document can be temporarily invalid while someone edits it. The interface must handle that state and explain the error. It cannot assume every incoming change is well formed.

I would test one file type and one operation: open it, inspect it, make the change, review it, undo it, and save. Then change the file outside the app and attempt another save. Compare the same task in the existing editor. The plugin has to justify moving work into ChatGPT, and file entrypoints currently restrict where this experiment can run.

## How much could work in another host?

There is evidence for sharing some implementation work. The [January MCP Apps announcement](https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/) reported support in ChatGPT, Claude, Goose, and VS Code. [VS Code's launch post](https://code.visualstudio.com/blogs/2026/01/26/mcp-apps-support) described that support in Insiders at the time. These are provider reports, not our compatibility tests.

The common protocol lets a tool identify a UI resource, lets the host render it, and carries communication between the app and host. The [SDK's vanilla JavaScript example](https://github.com/modelcontextprotocol/ext-apps/blob/82221c0c8ce7661efa6771c9d461511b1650495f/examples/basic-server-vanillajs/src/mcp-app.ts#L81-L90) shows a button calling a server tool and displaying its result. That part uses MCP Apps rather than an OpenAI sidebar API.

I would separate the product into three parts:

| Part | What I would keep there | What needs checking |
|---|---|---|
| Product data and operations | Claims, source relationships, revisions, validation, export | That the same operations work through each adapter |
| MCP tools and UI | Tool schemas, structured results, rendered interface | Each host's supported protocol and capabilities |
| Host integration | Sidebar opening, file access, context attachments | Support for each extension on the intended surface |

OpenAI's [SDK](https://github.com/openai/mcp-extensions/blob/ca16cb3bc015baaa1b849082d8755bbef18770cb/typescript/README.md) says extension categories can remain unavailable after initialization. Its sidebar and file features do not become portable simply because the app uses MCP.

The shared SDK also contains [guidance for keeping a web app usable both standalone and inside an MCP host](https://github.com/modelcontextprotocol/ext-apps/blob/82221c0c8ce7661efa6771c9d461511b1650495f/plugins/mcp-apps/skills/convert-web-app/SKILL.md). The rendering logic stays shared while initialization and data access differ. That is a useful architecture to borrow, not proof that every existing app can be wrapped without changes.

For the evidence workspace, I would keep the claim data exportable and the correction rules independent of the host. Authentication and storage still need implementation; OpenAI's [authentication guide](https://developers.openai.com/plugins/build/auth) describes connecting an MCP server to an existing application's authorization server. A panel is not an account system.

This connects to my [AgentPort argument](/bring-your-own-ai-agent): the application should supply capabilities while the user brings the agent. ChatGPT brings the application into the host's assistant; AgentPort aims to bring a user-chosen agent into the application. Both let me examine the same question: how much of the product remains useful when the assistant changes?

## Treat distribution as a separate experiment

A relevant recommendation could introduce a specialist product when someone already needs its capability. That is attractive, but the 2025 announcement already made a similar promise. Neither announcement establishes the reach of a new listing.

I would measure recommendations, installations, appropriate tool calls, completed tasks, and repeat use separately. OpenAI's [metadata guide](https://developers.openai.com/plugins/guides/optimize-metadata) helps with tool selection: test requests that name the product, requests that describe the outcome, and requests it should leave alone. For this app, *Check this draft against its sources* and *Explain what an ETag is* should lead to different behavior.

That evaluation concerns available tools. It does not reveal recommendation ranking for uninstalled plugins. Server logs can establish a request; they cannot independently show every recommendation or whether the user found the result helpful.

There are business questions left too. [Publication](https://developers.openai.com/plugins/deploy/submission) requires checks, review, and approval. The current [checkout reference](https://developers.openai.com/plugins/build/monetization) describes physical-goods flows and selected embedded-checkout partners, not a general software-plugin subscription model. Borrowing the host's assistant also does not authorize arbitrary model calls from a plugin backend. The separate [ChatGPT plan-usage sign-in flow](https://developers.openai.com/siwc/token-sharing-open-source/sign-in) requires its own user authorization and granted permission. A claim about free inference or easy revenue would need a much more specific basis.

## What I would try first

I would begin with one real claim from this article, its evidence, and an editable sentence. Compare the Markdown workflow, a generated interface, and the smallest plugin that preserves the work. Ask the assistant to help, then inspect whether it changed the intended revision and whether the explanation matches the saved result.

If the plugin makes that task clearer and easier to revisit, expand it. If the document or generated app is just as useful, keep the simpler option.

Before treating it as a business, try the same task with people who already need it. Do they finish the work more easily, return for another task, and want to pay? Record those outcomes separately from installations. This is a proposed test, not a result of this research.

The opportunity that interests me is a focused product people can use with the assistant they already have. Jupyter and VS Code offer design choices we can borrow. The plugin extensions give us new places to try them. A small, useful task is enough to start finding out whether the combination helps.

---

## Glossary

| Term / Claim | Primary source | Date |
|---|---|---|
| Earlier plugins and apps | [Plugins](https://openai.com/index/chatgpt-plugins/) and [Apps SDK launch](https://openai.com/index/introducing-apps-in-chatgpt/): backend calls, then interactive apps and recommendations | March 2023; October 2025 |
| Release and planned migration | [SDK registry](https://registry.npmjs.org/@openai%2Fmcp-extensions) and [migration FAQ](https://help.openai.com/en/articles/20001519-custom-gpt-retirement-and-migration-faq): published developer package and scheduled GPT transition | Package published September 29; FAQ checked October 4, 2026 |
| MCP Apps | [Official extension announcement](https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/): shared UI protocol and reported host support | January 26, 2026 |
| New host integration | [OpenAI specification](https://github.com/openai/mcp-extensions/blob/ca16cb3bc015baaa1b849082d8755bbef18770cb/docs/spec.md) and [extensions guide](https://developers.openai.com/plugins/build/extensions) | Commit `ca16cb3`; checked October 3, 2026 |
| Actions and conditional saving | [CAD controller](https://github.com/openai/mcp-extensions/blob/ca16cb3bc015baaa1b849082d8755bbef18770cb/plugins/bits-and-bolts/src/app/controller.ts): operations on the open editor, version checks, and unsaved edits | Commit `ca16cb3` |
| Document and views | [Jupyter widgets](https://ipywidgets.readthedocs.io/en/stable/examples/Widget%20Basics.html) and [VS Code custom editors](https://code.visualstudio.com/api/extension-guides/custom-editors): shared state, editing, undo, and saving | Checked October 3, 2026 |
| Generated apps | [Willison's examples](https://simonwillison.net/2024/Oct/21/claude-artifacts/) and [Claude-powered artifacts](https://claude.com/blog/claude-powered-artifacts): practical prior art, not a plugin comparison | 2024 example journal; provider page checked October 3 |
| Reusing the implementation | [MCP Apps SDK](https://github.com/modelcontextprotocol/ext-apps/tree/82221c0c8ce7661efa6771c9d461511b1650495f): shared APIs and hybrid-web-app guidance | Commit `82221c0` |
| Invocation and commerce | [Metadata](https://developers.openai.com/plugins/guides/optimize-metadata), [submission](https://developers.openai.com/plugins/deploy/submission), and [checkout](https://developers.openai.com/plugins/build/monetization) | Checked October 3, 2026 |

---

This article was researched and co-written with AI.
