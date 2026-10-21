function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
async function drain() {
  for (let turn = 0; turn < 20; turn++) await Promise.resolve();
  // Response.text() can settle through the browser task queue.
  await new Promise<void>(resolve => setTimeout(resolve, 0));
}

export async function run() {
  const requests = new Map<string, { signal: AbortSignal; resolve: (response: Response) => void }>();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (input, init) => {
    check(typeof input === 'string', 'Expected the example URL');
    check(init?.signal instanceof AbortSignal, 'Resource must supply an AbortSignal');
    const id = input.split('/').at(-2);
    check(id, 'Missing session ID');
    const signal = init.signal;
    // Ignore abort deliberately: cancellation alone must not establish correctness.
    return new Promise<Response>(resolve => requests.set(id, { signal, resolve }));
  };
  try {
    const reply = await import('./reply');
    await drain();
    const host = document.querySelector('demo-reply');
    const input = host?.querySelector('input');
    const paragraph = host?.querySelector('p');
    check(host && input && paragraph, 'Reply must mount its native elements');
    check(customElements.get('demo-reply'), 'Reply must be a registered custom element');
    input.value = 'My unfinished draft';
    input.focus(); input.setSelectionRange(3, 9);
    const textNode = paragraph.firstChild;
    for (let i = 1; i <= 100; i++) {
      reply.reply.value = `Chunk ${i}`;
      check(reply.reply.value === `Chunk ${i}`, 'State read must be immediate');
      await drain();
      check(paragraph.textContent === `Chunk ${i}`, 'Reactive prop did not update');
      check(paragraph.firstChild === textNode, 'Text node was replaced');
      check(host.querySelector('input') === input, 'Draft input was replaced');
      check(input.value === 'My unfinished draft', 'Draft value changed');
      check(document.activeElement === input, 'Draft lost focus');
      check(input.selectionStart === 3 && input.selectionEnd === 9, 'Input selection changed');
    }
    host.remove(); await drain(); reply.view.dispose();

    const preview = await import('./preview');
    await drain();
    // The article's selection event coalesces to B before loading starts.
    check(requests.has('B'), 'Initial B request missing');
    requests.get('B')?.resolve(new Response('B response'));
    await drain();
    const pane = document.querySelector('demo-session-preview');
    check(pane, 'Preview must mount');
    check(pane.textContent?.trim() === 'B response', 'B response missing');

    preview.selected.value = 'A'; await drain();
    check(pane.textContent?.trim() === 'Loading…', 'Old data should be hidden');
    const oldA = requests.get('A'); check(oldA, 'A request missing');
    preview.selected.value = 'B'; await drain();
    check(oldA.signal.aborted, 'Superseded A not aborted');
    requests.get('B')?.resolve(new Response('Newest B'));
    await drain();
    oldA.resolve(new Response('Stale A')); await drain();
    check(pane.textContent?.trim() === 'Newest B', 'Stale A overwrote B');

    preview.selected.value = 'error'; await drain();
    requests.get('error')?.resolve(new Response('failure', { status: 503 }));
    await drain();
    check(pane.textContent?.trim() === 'Could not load this session.', 'Error presentation missing');

    preview.selected.value = 'C'; await drain();
    const pending = requests.get('C'); check(pending, 'Pending C missing');
    pane.remove(); await drain();
    check(pending.signal.aborted, 'Removal did not abort pending C');
    const detachedText = pane.textContent;
    pending.resolve(new Response('Late C')); await drain();
    preview.selected.value = 'D'; await drain();
    check(!requests.has('D'), 'Removed component still starts requests');
    check(pane.textContent === detachedText, 'Removed component still updates');
    preview.view.dispose();
    return {
      streamWrites: 100,
      reactiveProps: true, immediateStateReads: true, textNodePreserved: true,
      draftNodeValueFocusAndSelectionPreserved: true,
      loadingHidesOldData: true, supersededRequestAborted: true,
      abortIgnoringStaleResultSuppressed: true, httpErrorPresented: true,
      removalAborts: true, noWorkAfterRemoval: true,
    };
  } finally {
    globalThis.fetch = originalFetch;
  }
}
