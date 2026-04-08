/**
 * @gkoreli/newsletter — Email subscription handlers for Cloudflare Workers + D1 + Resend.
 *
 * Public API surface:
 *   handleSubscribe  — POST /api/subscribe
 *   handleConfirm    — GET  /api/confirm/:token
 *   handleUnsubscribe — GET /api/unsubscribe/:token
 *   NewsletterEnv    — Worker env bindings required by this package
 */

export type { NewsletterEnv } from './db.js';
export { handleSubscribe } from './subscribe.js';
export { handleConfirm } from './confirm.js';
export { handleUnsubscribe } from './unsubscribe.js';
