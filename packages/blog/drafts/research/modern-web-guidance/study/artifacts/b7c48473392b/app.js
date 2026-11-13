const events = [];
let inFlight = false;
let visitEnded = false;

window.recordEvent = event => {
  events.push(event);
};

async function flushEvents() {
  if (inFlight || events.length === 0) return;

  // Keep the pending batch in the queue until a transport accepts it.
  const count = events.length;
  inFlight = true;
  try {
    const body = JSON.stringify(events.slice(0, count));
    if (typeof navigator.sendBeacon === 'function') {
      try {
        if (navigator.sendBeacon('/events', body)) {
          events.splice(0, count);
          return;
        }
      } catch {
        // A throwing beacon has not accepted the batch; try keepalive.
      }
    }

    if (typeof window.fetch === 'function') {
      const response = await window.fetch('/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true
      });
      if (response.ok) events.splice(0, count);
    }
  } catch {
    // Serialization, network, and quota failures leave the queue for retry.
  } finally {
    inFlight = false;
  }
}

function endVisit() {
  // visibilitychange and pagehide can describe the same departure.
  if (visitEnded) return;
  visitEnded = true;
  void flushEvents();
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    endVisit();
  } else if (document.visibilityState === 'visible') {
    visitEnded = false;
  }
});
window.addEventListener('pagehide', endVisit);
window.addEventListener('pageshow', event => {
  // A cached page retains its queue and listeners. Re-arm the next departure.
  if (event.persisted) visitEnded = false;
});

document.querySelector('#record-event').onclick = () => {
  window.recordEvent({ name: 'sample' });
  document.querySelector('#event-status').textContent = 'Event queued';
};
