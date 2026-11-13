const events = [];
let deliveryPending = false;
let handledHiddenTransition = false;

window.recordEvent = event => {
  events.push(event);
};

async function sendPendingEvents() {
  if (deliveryPending || events.length === 0) return;

  // Keep the batch in the queue until a transport accepts it. Events added
  // during delivery stay behind this snapshot for the next hidden transition.
  const batchSize = events.length;
  deliveryPending = true;

  try {
    const body = JSON.stringify(events.slice(0, batchSize));
    let accepted = false;

    if (typeof navigator.sendBeacon === 'function') {
      try {
        accepted = navigator.sendBeacon(
          '/events',
          new Blob([body], { type: 'application/json' })
        );
      } catch {
        // A thrown beacon error can still be handled by the fetch fallback.
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
    // Serialization errors and failed fetches leave the batch queued to retry.
  } finally {
    deliveryPending = false;
  }
}

function handleHiddenTransition() {
  // visibilitychange and pagehide commonly describe the same departure.
  if (handledHiddenTransition) return;
  handledHiddenTransition = true;
  void sendPendingEvents();
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    handleHiddenTransition();
  } else {
    handledHiddenTransition = false;
  }
});

window.addEventListener('pagehide', handleHiddenTransition);
window.addEventListener('pageshow', event => {
  if (event.persisted) handledHiddenTransition = false;
});

document.querySelector('#record-event').onclick = () => {
  window.recordEvent({ name: 'sample' });
  document.querySelector('#event-status').textContent = 'Event queued';
};
