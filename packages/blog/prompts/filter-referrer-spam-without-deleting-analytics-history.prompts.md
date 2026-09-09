we are on the third iteration of analytics, do you want to check hows things going? I feel like we need to put some work in. But I don't want to change things just the sake of it, i nede to ground ourselves first

---

are we missing out on certain data that we should capture to improve the analytics? like what? need authoritative references and all that.

---

write the plan, explore authoritative references and cross references, open source code and existing prior art to further iterate on the plan

---

why do i see this as the main referrer: Referrer hosts by views
uniuit.com
35 views
Lmao this website is a toxic, not genuine godd website at all... why are we referred from there at all, its a potential scam and 21+ site

---

we need to start a worklist on that, write the adr doc and fix that... We need to eradicate: It’s likely automated traffic carrying a misleading referrer.  One purpose is to make
  the domain appear in analytics so the site owner notices and visits it. <- We need a system that defends us from it. We need to stop referrer abuse

---

what does it mean for the existing Referrer hosts that we seE? Referrer hosts by views
uniuit.com
35 views

Why should we allow the abuser to rank high and show up in my analytics? i guess for truthfulness and correctness, we need to know that someone is trying abuse or scam, but at the same time, i feel like we need to deterministically know who is who, and kind of like shadow ban the abusers... thoughts? whats your idea of defence?

---

do we respect this list? https://github.com/matomo-org/referrer-spam-list

---

we still need to save those data for hostproca; reaspms cprrect

---

we still need to save those data for historical provenance reasons right?

---

proceed with engineering, write adr with references, need domain driven engineering, fanout as needed

---

does this require an article? is it something that others will find useful and valuable? or maybe a snippet in one of the future/upcoming articles

---

proceed

---

are we going to be able to serve the customers in the meanwhile lmao?

---

i upgraded to $5/month but its insane to me like we don't have that much data, how did we go through the 5000000 rows_read: Your D1 rows_read limit has been exceeded

---

how do we even have  182,388 rows in production db lmao

---

How I Filter Referrer Spam Without Deleting Analytics History
 i feel like Without Deleting Analytics History, this is much less significant in the scope of this article, why are we focusing on that?

---

Also I received a positive message on X, they followed me and gave me advice that I would like to incorporate in the article #25 and improve the skills and agents.md instructions as well. read /Users/goga/Documents/goga/blog/x-message.md

---

please measure and add researchFootprint properly

---

In the September 6 capture, that hostname was uniuit.com, we need to explicitly say that this is a malicious website and the fact that it topped our list of Referrers which is a public information due to our blog's full transparency model, even analytics are public, they unded up surfaced on the top of the list, if someone accesses this malicious site we lose credeibility as a blog, and also these referrers are fake, nobody really visited from those pages. We need to explicitly explain why it is bad to have fake/malicious actors trying to be at the top of our analytics and rankings, why do we need to avoid lying to ourselves as if we have lots of readers and referrers from this website, we need authentic transparency not just false, naive transparency.

---

Also, why is this "The D1 cost of filtering every report" a big part of the article? What does this D1 optimization have anything to do with this article? Maybe I am wrong so please explain to me properly

---

Did we eradicate the referrer spam entirely? I feel like its a really valuable lesson to share to the public, we implement the solution and share the values and learnings to the open world
