import type { NewsletterEnv } from './db.js';
import { handleConfirmationRequest } from './confirmation-request.js';

export function handleSubscribe(request: Request, env: NewsletterEnv, _ctx: ExecutionContext): Promise<Response> {
  return handleConfirmationRequest(request, env, 'subscribe');
}
