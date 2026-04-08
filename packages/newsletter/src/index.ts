/**
 * @gkoreli/newsletter — Email subscription handlers for Cloudflare Workers + D1 + Resend.
 *
 * Public API:
 *   handleSubscribe      — POST /api/subscribe
 *   handleConfirm        — GET  /api/confirm/:rawToken
 *   handleUnsubscribe    — GET  /api/unsubscribe/:rawToken
 *   handleResendWebhook  — POST /api/webhooks/resend  (bounce + complaint)
 *   handleScheduled      — Cloudflare Cron Trigger    (nightly cleanup)
 *   allowedOrigin        — CORS origin validation
 *   corsPreflightResponse — OPTIONS preflight for /api/subscribe
 *   NewsletterEnv        — Worker env type
 */

export type { NewsletterEnv, SubscriberStatus } from './db.js';
export { handleSubscribe } from './subscribe.js';
export { handleConfirm } from './confirm.js';
export { handleUnsubscribe } from './unsubscribe.js';
export { handleResendWebhook } from './webhook.js';
export { handleScheduled } from './cleanup.js';
export { allowedOrigin, corsPreflightResponse } from './responses.js';
