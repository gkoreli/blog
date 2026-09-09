I have great news for you and me, the article #24 has performed really well on HackerNews... This is great news. I believe there is lot to be learned from this instance and this article... Lets ground ourselves, we might need to start a worklist for another article coming up.

---

I want to answer this question on hackernews comments thread as well, give me a quick response: quietraster 1 day ago | next [–]

74.5% of 'browser' requests being bots is wild. did any of the header/network rules produce false positives on real human readers?

---

you are using too much jargon, i feel like question needs to be answered in more human way, don't use mannered prose

---

what to do next, ideas?

---

what did we learn so far? it has been couple days after publishing the article... Clearly analytics worked and also the article proved to be worthy both at the same time... i am fully trying to understand what happened, like how did we crack the code? The goal right now is that publication is mature and provides good value, how do we increase the readership and build genuine, reliable user base that trust us and follow us?

---

i have fixed newsletter signup in parallel, but i am unsure if anyone signed up

---

signup fix went live before the article blew up on HN i believe

---

tell me explain to me, did you analyze the readers, and did the analytics work as intended? why do we have so many readers without a proper referrer?

---

what is this folder? /Users/goga/.local/share/gkoreli/analytics-evidence/2026-09-09-article-024-hn/referrer-analysis-20260909T011531Z/analyze.ts
why is it not commited to the main repo?

---

• I found a concrete issue in the wording: “No referrer” also includes clicks from another page on your own blog. Our code deliberately removes those internal
  referrers before saving the request. - Is this a best practice? i feel like there is a better way to do it than what we are doing

---

yes this is funneling and its a great way to understand the blog readers even further: 
  Our report counts referrals on each page request, but discards internal referrers. That combination is what makes the label misleading. I recommend preserving
  whether a referrer was external, internal, absent, or unusable; for internal clicks, we can also keep the public blog page path, without query strings. That would
  show which articles lead people to other articles.

---

yes this is funneling and its a great way to understand the blog readers even further: 
  Our report counts referrals on each page request, but discards internal referrers. That combination is what makes the label misleading. I recommend preserving
  whether a referrer was external, internal, absent, or unusable; for internal clicks, we can also keep the public blog page path, without query strings. That would
  show which articles lead people to other articles. And there must be authoritative references and prior art to further understand how this works and how to build a good funneling solution into our analytics
