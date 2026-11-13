const events = [];
let attemptedThisVisitEnd = false;
let inFlight = false;

window.recordEvent = event => {
  events.push(event);
};

async function sendPendingEvents() {
  if (attemptedThisVisitEnd || inFlight || events.length === 0) return;
  attemptedThisVisitEnd = true;
  inFlight = true;

  // Keep the batch in the queue until accepted. Events appended while fetch
  // is pending belong to the next batch and must not be removed with this one.
  const batchSize = events.length;
  try {
    const body = JSON.stringify(events.slice(0, batchSize));
    let accepted = false;
    if (typeof navigator.sendBeacon === 'function') {
      try {
        accepted = navigator.sendBeacon('/events', new Blob([body], {
          type: 'application/json'
        }));
      } catch {
        // A synchronous beacon error should still try the fallback transport.
      }
    }

    if (!accepted && typeof window.fetch === 'function') {
      const response = await window.fetch('/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true
      });
      accepted = response.ok;
    }

    if (accepted) events.splice(0, batchSize);
  } catch {
    // Keep the batch for the next hidden transition if delivery fails.
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

// pagehide is a fallback signal; the shared guard prevents a second attempt
// when visibilitychange has already handled this departure, even on failure.
window.addEventListener('pagehide', sendPendingEvents);
window.addEventListener('pageshow', event => {
  if (event.persisted) attemptedThisVisitEnd = false;
});

document.querySelector('#record-event').onclick = () => {
  window.recordEvent({ name: 'sample' });
  document.querySelector('#event-status').textContent = 'Event queued';
};
