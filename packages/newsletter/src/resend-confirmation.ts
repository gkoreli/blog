import type { NewsletterEnv } from './db.js';
import { handleConfirmationRequest } from './confirmation-request.js';
import { allowedOrigin, corsPreflightResponse } from './responses.js';

export async function handleResendConfirmationPreflight(request: Request): Promise<Response> {
  return corsPreflightResponse(allowedOrigin(request));
}

/** Resend is a public email-send operation and uses the same controls as signup. */
export function handleResendConfirmation(request: Request, env: NewsletterEnv, _ctx: ExecutionContext): Promise<Response> {
  return handleConfirmationRequest(request, env, 'resend');
}
