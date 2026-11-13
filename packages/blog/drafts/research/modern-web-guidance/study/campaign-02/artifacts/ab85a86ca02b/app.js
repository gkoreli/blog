const events = [];
let inFlight = false;
let attemptedThisDeparture = false;

window.recordEvent = event => {
  events.push(event);
};

async function sendPendingEvents() {
  if (attemptedThisDeparture || inFlight || events.length === 0) return;
  attemptedThisDeparture = true;

  // Keep the snapshot queued until accepted. Events added during fetch
  // belong to a later batch.
  const count = events.length;
  let body;
  try {
    body = JSON.stringify(events.slice(0, count));
  } catch {
    return;
  }

  inFlight = true;
  try {
    if (typeof navigator.sendBeacon === 'function') {
      try {
        const payload = new Blob([body], { type: 'application/json' });
        if (navigator.sendBeacon('/events', payload)) {
          events.splice(0, count);
          return;
        }
      } catch {
        // Beacon exceptions also leave the batch available for fetch.
      }
    }

    const response = await fetch('/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    });
    if (response.ok) events.splice(0, count);
  } catch {
    // Retain the batch for the next departure if both transports fail.
  } finally {
    inFlight = false;
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    sendPendingEvents();
  } else {
    attemptedThisDeparture = false;
  }
});

window.addEventListener('pagehide', sendPendingEvents);
window.addEventListener('pageshow', event => {
  if (event.persisted) attemptedThisDeparture = false;
});

const recordButton = document.querySelector('#record-event');
recordButton.disabled = false;
recordButton.onclick = () => {
  window.recordEvent({ name: 'sample' });
  document.querySelector('#event-status').textContent = 'Event queued until the page is hidden.';
};
