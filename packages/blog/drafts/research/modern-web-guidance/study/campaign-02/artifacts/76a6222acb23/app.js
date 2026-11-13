const events = [];
let attemptedThisVisitEnd = false;
let sending = false;

window.recordEvent = event => {
  events.push(event);
};

async function sendPendingEvents() {
  if (attemptedThisVisitEnd || sending || events.length === 0) return;
  attemptedThisVisitEnd = true;
  sending = true;

  // Keep the snapshot queued until accepted, preserving events added in flight.
  const count = events.length;
  try {
    const body = JSON.stringify(events.slice(0, count));
    let accepted = false;
    try {
      if (typeof navigator.sendBeacon === 'function') {
        accepted = navigator.sendBeacon('/events', body);
      }
    } catch {
      // A thrown beacon error uses the same fallback as a full beacon queue.
    }

    if (!accepted) {
      const response = await fetch('/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      });
      accepted = response.ok;
    }

    if (accepted) events.splice(0, count);
  } catch {
    // Retain the batch for a later hidden transition if delivery fails.
  } finally {
    sending = false;
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    sendPendingEvents();
  } else {
    attemptedThisVisitEnd = false;
  }
});

// Fallback for navigation without a hidden notification. The guard prevents
// pagehide from repeating a failed or still-pending attempt.
window.addEventListener('pagehide', sendPendingEvents);
window.addEventListener('pageshow', event => {
  if (event.persisted) attemptedThisVisitEnd = false;
});

document.querySelector('#record-event').onclick = () => {
  window.recordEvent({ name: 'sample' });
  document.querySelector('#event-status').textContent = 'Event queued';
};
