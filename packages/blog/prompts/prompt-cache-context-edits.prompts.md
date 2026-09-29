i want to learn about ai inference provider APIs and prompt caching, how different providers offer prompt caching, how does LLM prompt caching works, are there differences, how differenet agent harnesses implement it like pi, omp, codex, opencode, claude code and other battle tested open source agent harnesses. i want to learn and dissect, and at the same time write a blog article about it. start a worklist in the docs/worklist/{insightful-slug}


---

go ahead assemble resources, and the article, i want learn more overall, like questions i have are like, how does LLM prompt caching work? on the inference side, on the API side, on the SDK side, on the Agent Harness side. Each layer controls some aspect of it. Is it only incremental? The whole point is that cached inference is fast and cheap, even for the large models, but i have seen that caching only works incrementally, like you can't change the initial system prompt or the cache will bust, you can't change the middle of the context, otherwise you will lose half or a good chunk, or maintain only whatever was unchanged leading up to the change, its like a jenga, you remove a piece and everyhing above falls over, you remove a piece from the very bottom, and entire thing falls over. Is it possible to somehow maintain the jenga tower and be able to switch the pieces in and out on demand as needed. Will i be able to maintain the cache? Theoretically speaking i know that each token matters in the LLM inference and changing one word in the sentence, can change the entire meaning of it so theoretically speaking, it shouldn't be possible to hot-swap, redact, and mess with context, otherwise it will bust and inference provider has to recalculate entire thing. But I wanna lear i feel like some API providers, or SDK providers or Agent Harnesses have defects, or there are ways to improve the Prompt Caching that people don't realize. Like I am building a harness and I am curious if i am able to slightly modify a system prompt and still maintain the rest of the whole cache without paying for an entire context window like a whole new request. From this perspective meaning is not changing per say, but it is expensive and slow. The rationale or objective from my perspective is speed efficiency and price, and ergonomics. Thats why i want to know all of this. But also i have invariants, like correctness. I don't want to maintain the cache by llm becoming dumb or incorrect, or start to hallucinate. I feel like potentially there are ways during LLM inference or in the inference API provider layer that SDK authors don't realize and haven't fully utilized the strengths of LLM Caching, or in the Agent Harness layer they haven't fully utilized the strength of caching and as a result we have subpar and defective capabilities in the agentic harnesses and products. All of this is what i am trying to uncover and dissect, and learn. Please, explore, clone codebases, explore, write code as needed inside the worklist folder, write research artifacts with authoritative references on github or on web, iterate on the article and so on. Delegate as needed too. Explore, and get inspired, and you can ask couple more questions that you think i forgot to mention and you think ties everything together and are going to be valuable. We might want some infographics or something in the eventual article. Overall, i am going to read research artifacts, resources, code, sdk, apis that you dissect, and all of that. I want to learn, and we will also share this article on the blog eventually.


---

<send_user_message_question_reply>
[{"answer":"Both equally","question":"For the harness you’re building, which change matters most to preserve efficiently?","questionItemId":"[\"request_user_input_async\",\"call_JmTFMOBHvBBoycxisn8EUATH\",0]"}]
</send_user_message_question_reply>

---

<send_user_message_question_reply>
[{"answer":"Use docs and local experiments for now","question":"Should this first investigation include paid API experiments? I can complete the source audits, local reproductions, and draft without them.","questionItemId":"[\"request_user_input_async\",\"call_JmTFMOBHvBBoycxisn8EUATH\",1]"}]
</send_user_message_question_reply>

---

i just saved CLAUDE_API_KEY in the .env file, and feel free to use 5-10$ in total in api tokens and feel free to use sonnet-5.5 on low reasoning or smth like that...

---

<send_user_message_question_reply>
[{"answer":"ready with ANTHROPIC_WORKSPACE_ID","question":"Anthropic rejected the model-list request because this key is not scoped to a workspace. Please add ANTHROPIC_WORKSPACE_ID to .env, or replace CLAUDE_API_KEY with a workspace-scoped key. Let me know when it’s ready; I’ll continue the local experiments and article meanwhile.","questionItemId":"[\"request_user_input_async\",\"call_AopmRcTI5aTmvN2EYh6LDd3f\",0]"}]
</send_user_message_question_reply>

---

we might need some nice visuals or infographics and stuff like that and overall we might need to be writing and iterating on the .ts based article for the blog

---

iterate further what more can we learn, and mine and understand overall around caching. Iterate on writing, more human understandable writing, less jargon, less mannered prose, less meta speaking and meta conversations in the prose. I want to be able to read the research md files and read the article and learn the technical aspects of caching and context management, and have authoritative references from the implementations in the open source libraries and more. Iterate further polish it further. Not only writing, learning material, visuals, prose, dissecting the code, and so on.

---

you are in yolo mode, you should have access to chrome and computer use tools. As part of the goal, write the real ts based article /Users/goga/Documents/goga/blog/packages/blog/posts in here, and publish it. Iterate on it. Polish it. Consider different angles, like text, prose, structure, learning material, information, credibility, technical deep dive, visuals, infographics, and 2-3 other things that i haven't thought of.

---

do you see the established pattern how .ts based articles are written? why did you change it and invent something new? follow established patterns

---

> 1. Same text can have different state. 

this infographic seems a bit naive and simple
post about it on my x.com at the end once you are finished tag the creator of it

---

<send_user_message_question_reply>
[{"answer":"you figure out","question":"Who should I tag in the X post? Please give the creator’s name or @handle, and which project or paper you mean.","questionItemId":"[\"request_user_input_async\",\"call_Fh5exfgLS8UJIGSeXoynzIHW\",0]"}]
</send_user_message_question_reply>

---

wait actually don't tag anyone lmao

---

wait actually don't tag anyone lmao just make an x post and paste link

---

post in on hackernews too, i should be logged in, after you are completed with the goal


---

styling of infographics is not coherent, i know that you can do much better
