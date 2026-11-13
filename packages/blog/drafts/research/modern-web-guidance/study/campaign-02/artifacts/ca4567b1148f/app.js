const events = [];
let attemptedThisVisitEnd = false;
let inFlight = false;

window.recordEvent = event => {
  events.push(event);
};

async function sendPendingEvents() {
  if (attemptedThisVisitEnd || inFlight || events.length === 0) return;
  attemptedThisVisitEnd = true;

  // Retain the snapshot until accepted, without consuming later additions.
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
    // A thrown Beacon error should also allow the fetch fallback.
  }

  inFlight = true;
  try {
    const response = await fetch('/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true
    });
    if (response.ok) events.splice(0, count);
  } catch {
    // Keep the queue for a later hidden transition when transport fails.
  } finally {
    inFlight = false;
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    sendPendingEvents();
  } else {
    attemptedThisVisitEnd = false;
  }
});

// Some navigations reach pagehide without a visibilitychange notification.
// The attempt guard also covers a failed or still-pending hidden send.
window.addEventListener('pagehide', sendPendingEvents);
window.addEventListener('pageshow', event => {
  if (event.persisted) attemptedThisVisitEnd = false;
});

document.querySelector('#record-event').onclick = () => {
  window.recordEvent({ name: 'sample' });
  document.querySelector('#event-status').textContent = 'Event queued';
};
