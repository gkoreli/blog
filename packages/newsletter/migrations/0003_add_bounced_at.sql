-- Migration 0003: add bounced_at column for accurate GDPR purge timing.
-- Apply to: blog-analytics D1 database
-- Command: wrangler d1 execute blog-analytics \
--            --file packages/newsletter/migrations/0003_add_bounced_at.sql

-- Previously, purgeOldInactive used unsubscribed_at for both 'unsubscribed' and
-- 'bounced' rows. Bounced rows never set unsubscribed_at, so they were never deleted.
-- bounced_at fixes this: set on bounce, used as the aging timestamp for GDPR purge.

ALTER TABLE subscribers ADD COLUMN bounced_at TEXT;
