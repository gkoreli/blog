const events = [];
let pendingRequest = false;

window.recordEvent = event => {
  events.push(event);
};

function flushEvents() {
  if (pendingRequest || events.length === 0) return;

  // Snapshot the queue so events recorded during a request stay queued.
  const batchSize = events.length;
  let body;
  try {
    body = JSON.stringify(events.slice(0, batchSize));
  } catch {
    // Keep the queue intact if a supplied event cannot be serialized.
    return;
  }

  try {
    if (typeof navigator.sendBeacon === 'function' &&
        navigator.sendBeacon('/events', new Blob([body], { type: 'application/json' }))) {
      events.splice(0, batchSize);
      return;
    }
  } catch {
    // A rejected beacon can still be delivered through the fetch fallback.
  }

  if (typeof window.fetch !== 'function') return;

  // pagehide can follow visibilitychange while this request is still pending.
  pendingRequest = true;
  try {
    Promise.resolve(window.fetch('/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true
    })).then(response => {
      if (response.ok) events.splice(0, batchSize);
    }).catch(() => {
      // Retry retained events on a later hidden transition.
    }).finally(() => {
      pendingRequest = false;
    });
  } catch {
    pendingRequest = false;
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flushEvents();
});
window.addEventListener('pagehide', flushEvents);
// The queue and pending request survive a persisted pageshow naturally; do not
// clear or resend them on restoration from the back/forward cache.

document.querySelector('#record-event').onclick = () => {
  window.recordEvent({ name: 'sample' });
  document.querySelector('#event-status').textContent = 'Event queued';
};
