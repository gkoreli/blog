const events = [];
let inFlight = false;

window.recordEvent = event => {
  events.push(event);
};

function sendPendingEvents() {
  if (inFlight || events.length === 0) return;

  // Keep this prefix in the queue until a transport accepts it. Events recorded
  // while fetch is pending belong to the next batch.
  const batchSize = events.length;
  let body;
  try {
    body = JSON.stringify(events.slice(0, batchSize));
  } catch {
    return;
  }

  if (typeof navigator.sendBeacon === 'function') {
    try {
      const payload = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon('/events', payload)) {
        events.splice(0, batchSize);
        return;
      }
    } catch {
      // A throwing beacon is also a rejection; try the keepalive transport.
    }
  }

  if (typeof window.fetch !== 'function') return;

  inFlight = true;
  try {
    window.fetch('/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true
    }).then(response => {
      if (response.ok) events.splice(0, batchSize);
    }).catch(() => {
      // Leave the batch queued for a later hidden transition.
    }).finally(() => {
      inFlight = false;
    });
  } catch {
    inFlight = false;
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') sendPendingEvents();
});

// Some navigations reach pagehide without a visibilitychange notification.
// The queue and in-flight guard also survive a persisted pageshow unchanged.
window.addEventListener('pagehide', sendPendingEvents);

document.querySelector('#record-event').onclick = () => {
  window.recordEvent({ name: 'sample' });
  document.querySelector('#event-status').textContent = 'Event queued';
};
