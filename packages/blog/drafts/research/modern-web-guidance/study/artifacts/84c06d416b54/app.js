const events = [];
let deliveryPending = false;

window.recordEvent = event => {
  events.push(event);
};

function flushEvents() {
  if (deliveryPending || events.length === 0) return;

  // Keep this prefix queued until a transport accepts it. Events recorded while
  // fetch is pending belong to the next batch.
  const count = events.length;
  let body;
  try {
    body = JSON.stringify(events.slice(0, count));
  } catch {
    return;
  }

  try {
    if (typeof navigator.sendBeacon === 'function' &&
        navigator.sendBeacon('/events', body)) {
      events.splice(0, count);
      return;
    }
  } catch {
    // A throwing beacon implementation can still fall back to fetch.
  }

  if (typeof window.fetch !== 'function') return;

  deliveryPending = true;
  try {
    window.fetch('/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true
    }).then(response => {
      if (response.ok) events.splice(0, count);
    }).catch(() => {
      // Leave the batch queued for the next hidden/pagehide transition.
    }).finally(() => {
      deliveryPending = false;
    });
  } catch {
    deliveryPending = false;
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flushEvents();
});
window.addEventListener('pagehide', flushEvents);
// No permanent "ended" flag: a page restored from the back/forward cache
// keeps its queue and can record and deliver new events normally.

document.querySelector('#record-event').onclick = () => {
  window.recordEvent({ name: 'sample' });
  document.querySelector('#event-status').textContent = 'Event queued';
};
