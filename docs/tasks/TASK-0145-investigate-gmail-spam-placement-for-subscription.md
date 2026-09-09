---
id: TASK-0145
title: Investigate Gmail spam placement for subscription confirmations
status: open
parent_id: FLDR-0010
created_at: '2026-09-09T02:42:23.190Z'
updated_at: '2026-09-09T02:42:23.190Z'
type: task
---
The authorized live signup on September 9 UTC completed after repairing the production Turnstile binding. One Resend-accepted confirmation appeared in Gmail Spam at 19:35 PDT; the owner-authorized test address became active after its confirmation POST. Gmail's displayed explanation was similarity to messages previously identified as spam. This is one mailbox observation, not a diagnosis or an audience-wide deliverability rate.

A bounded public DNS check at 02:41:50 UTC returned an SPF record for send.gkoreli.com and a DKIM record at resend._domainkey.gkoreli.com, but no TXT answer at _dmarc.gkoreli.com through the local resolver. Absence of DMARC is a configuration lead, not proof of why this message went to Spam. Original-message authentication headers were not successfully inspected because Chrome interaction was interrupted; do not claim SPF/DKIM/DMARC pass from DNS records alone.

Next bounded action: inspect the retained authorized confirmation's Authentication-Results and provider sender-domain configuration; verify authoritative DNS and align the sender domain before choosing a minimal DMARC policy. Preserve other legitimate senders. Re-test only the authorized recipient, within cooldown and send limits, if a specific change justifies another message. Keep provider acceptance, recipient-server delivery, and Inbox versus Spam distinct. Do not send an extra message merely to collect more data or claim a universal inbox guarantee. Research Markdown and sanitized receipts belong in packages/blog/drafts/research/newsletter-reliability/; start at 15-live-signup-acceptance.md. Private addresses, tokens, headers and provider IDs stay outside Git.
