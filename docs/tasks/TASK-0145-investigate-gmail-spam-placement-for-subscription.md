---
id: TASK-0145
title: Investigate Gmail spam placement for subscription confirmations
status: done
parent_id: FLDR-0010
created_at: '2026-09-09T02:42:23.190Z'
updated_at: '2026-11-05T16:50:30Z'
type: task
---
The authorized live signup on September 9 UTC completed after repairing the production Turnstile binding. One Resend-accepted confirmation appeared in Gmail Spam at 19:35 PDT; the owner-authorized test address became active after its confirmation POST. Gmail's displayed explanation was similarity to messages previously identified as spam. This is one mailbox observation, not a diagnosis or an audience-wide deliverability rate.

A bounded public DNS check at 02:41:50 UTC returned an SPF record for send.gkoreli.com and a DKIM record at resend._domainkey.gkoreli.com, but no TXT answer at _dmarc.gkoreli.com through the local resolver. Absence of DMARC is a configuration lead, not proof of why this message went to Spam. Original-message authentication headers were not successfully inspected because Chrome interaction was interrupted; do not claim SPF/DKIM/DMARC pass from DNS records alone.

Original bounded next action (resolved or transferred below): inspect the retained authorized confirmation's Authentication-Results and provider sender-domain configuration; verify authoritative DNS and align the sender domain before choosing a minimal DMARC policy. Preserve other legitimate senders. Re-test only the authorized recipient, within cooldown and send limits, if a specific change justifies another message. Keep provider acceptance, recipient-server delivery, and Inbox versus Spam distinct. Do not send an extra message merely to collect more data or claim a universal inbox guarantee. Research Markdown and sanitized receipts belong in packages/blog/drafts/research/newsletter-reliability/; start at 15-live-signup-acceptance.md. Private addresses, tokens, headers and provider IDs stay outside Git.

November 5 initial evidence: retained September message headers are now accessible and show aligned `dkim=pass` plus `spf=pass`, without a DMARC result. Its current Inbox label does not rewrite the original Spam observation. Both authoritative nameservers initially return no `_dmarc.gkoreli.com` TXT record; public SPF/DKIM records exist. Available Resend API access is send-only; native control is unavailable until the requested in-app browser is used. [Research 28](../../packages/blog/drafts/research/newsletter-reliability/28-managed-verification-and-diagnostics.md) initially proposes `p=none`, separately from subsequent activation.

November 5 bounded investigation accepted: one `_dmarc` TXT policy `v=DMARC1; p=none` is saved and independently returned by both authoritative nameservers. No aggregate-report recipient or stricter enforcement is selected. One fresh confirmation from the ordinary live signup arrives in the authorized Gmail Inbox at 16:33:20 UTC; its headers show SPF pass, aligned DKIM pass and DMARC pass. The owner's confirmation leaves it independently active in D1. [Live receipt](../../packages/blog/drafts/research/newsletter-reliability/subscription-recovery-live-acceptance.json). No extra message is needed. This completes the bounded authentication/placement check, with the original Spam cause unknown; it does not prove causality, population deliverability or universal future Inbox placement. Correct Resend-account inspection and signed feedback remain TASK-0142; broader sender inventory and any stricter DMARC policy need separate evidence.
