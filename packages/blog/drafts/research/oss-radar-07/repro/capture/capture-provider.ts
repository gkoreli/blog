import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ApiProvider, ProviderResponse } from 'promptfoo';

export function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseJson(text: string): unknown {
  return JSON.parse(text);
}

export const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');

function field(record: Record<string, unknown>, key: string) {
  if (!Object.hasOwn(record, key)) return { state: 'absent' };
  const value = record[key];
  if (value === null) return { state: 'null', value };
  if (!Array.isArray(value)) return { state: 'unexpected-type', value };
  return { state: value.length ? 'present' : 'empty', value };
}

export interface CaptureOptions {
  endpoint: string;
  model: string;
  runId: string;
  directory: string;
  apiKey?: string;
  maxAttempts?: 1 | 2;
}

// A bounded, non-streaming research adapter. Saves every received response before
// parsing it. It does not infer charge, source support, or provider identity.
export function captureProvider(options: CaptureOptions): ApiProvider {
  let invocation = 0;
  return {
    id: () => `citation-capture:${options.runId}`,
    async callApi(prompt, context): Promise<ProviderResponse> {
      const invocationId = `${options.runId}-${++invocation}`;
      const input = JSON.stringify({
        model: options.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 700,
        stream: false,
      });
      const attempts: Record<string, unknown>[] = [];
      const identity = {
        runId: options.runId, invocationId,
        evaluationId: context?.evaluationId ?? null,
        testCaseId: context?.testCaseId ?? null,
        traceparent: context?.traceparent ?? null,
      };
      await mkdir(options.directory, { recursive: true });
      await writeFile(join(options.directory, `${invocationId}-input.json`), input, { flag: 'wx' });
      for (let attempt = 1; attempt <= (options.maxAttempts ?? 1); attempt++) {
        const attemptId = `${invocationId}-attempt-${attempt}`;
        const startedAt = new Date().toISOString();
        const start = performance.now();
        let raw: string | undefined;
        let status: number | null = null;
        let requestId: string | null = null;
        let retryAfter: string | null = null;
        try {
          const response = await fetch(options.endpoint, {
            method: 'POST', redirect: 'error',
            headers: {
              'content-type': 'application/json',
              ...(options.apiKey ? { authorization: `Bearer ${options.apiKey}` } : {}),
            },
            body: input,
            signal: AbortSignal.timeout(90_000),
          });
          status = response.status;
          requestId = response.headers.get('x-request-id');
          retryAfter = response.headers.get('retry-after');
          raw = await response.text();
        } catch (error) {
          const record = {
            ...identity, attemptId, startedAt, finishedAt: new Date().toISOString(),
            elapsedMs: Math.round(performance.now() - start), status, requestId,
            outcome: 'transport-error', error: error instanceof Error ? error.name : 'UnknownError',
            charge: { state: 'unknown' }, cache: 'adapter-disabled',
          };
          attempts.push(record);
          await writeFile(join(options.directory, `${attemptId}.json`), JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });
          return { error: 'Capture transport failed; see attempt record', metadata: { evidence: { ...identity, attempts } } };
        }
        // Decode bytes as UTF-8 through Response.text(), preserving that exact
        // decoded text. HTTP wire bytes and content-encoding are not captured.
        await writeFile(join(options.directory, `${attemptId}-response.txt`), raw, { flag: 'wx' });
        let parsed: unknown;
        let parseError = false;
        try { parsed = parseJson(raw); } catch { parseError = true; }
        const body = object(parsed) ? parsed : {};
        const choices = Array.isArray(body.choices) ? body.choices : [];
        const choice = object(choices[0]) ? choices[0] : {};
        const message = object(choice.message) ? choice.message : {};
        const hasAnswer = typeof message.content === 'string' && message.content.length > 0;
        const outcome = status < 200 || status >= 300 ? 'http-error'
          : parseError ? 'invalid-json'
          : Object.hasOwn(body, 'error') ? 'provider-error'
          : !hasAnswer ? 'missing-answer'
          : choice.finish_reason === 'length' ? 'incomplete-answer' : 'success';
        const usage = object(body.usage) ? body.usage : {};
        const record = {
          ...identity, attemptId, startedAt, finishedAt: new Date().toISOString(),
          elapsedMs: Math.round(performance.now() - start), status, requestId, retryAfter,
          outcome, responseSha256: sha256(raw), inputSha256: sha256(input),
          providerResponseId: body.id ?? null,
          providerCitations: field(body, 'citations'), answerAnnotations: field(message, 'annotations'),
          providerReportedUsage: body.usage ?? null,
          charge: typeof usage.cost === 'number'
            ? { state: 'provider-reported', amount: usage.cost, currency: 'USD', field: 'usage.cost', billingReconciled: false }
            : { state: 'unknown' },
          cache: 'adapter-disabled',
        };
        attempts.push(record);
        await writeFile(join(options.directory, `${attemptId}.json`), JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });
        // Retries are opt-in, limited to one 429 retry, and only immediate when
        // the server explicitly supplies Retry-After: 0. No implicit paid retry.
        if (status === 429 && retryAfter === '0' && attempt < (options.maxAttempts ?? 1)) continue;
        const metadata = { evidence: { ...identity, attempts } };
        if (outcome !== 'success') return { error: `Capture outcome: ${outcome}`, raw, metadata };
        return { output: message.content, raw, metadata };
      }
      throw new Error('Unreachable capture state');
    },
  };
}
