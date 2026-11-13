const events = [];
const status = document.querySelector('#event-status');
let endAttempted = false;
let sending = false;

function updateStatus() {
  status.textContent = `${events.length} synthetic event${events.length === 1 ? '' : 's'} queued`;
}

window.recordEvent = event => {
  events.push(event);
  updateStatus();
};

async function sendPendingEvents() {
  // visibilitychange and pagehide can describe the same departure.
  if (endAttempted || sending || events.length === 0) return;
  endAttempted = true;
  sending = true;
  const count = events.length;

  try {
    const body = JSON.stringify(events.slice(0, count));
    let accepted = false;
    if (typeof navigator.sendBeacon === 'function') {
      try {
        accepted = navigator.sendBeacon(
          '/events',
          new Blob([body], { type: 'application/json' })
        );
      } catch {
        // A synchronous beacon failure should also try the fallback.
      }
    }

    if (!accepted && typeof window.fetch === 'function') {
      try {
        const response = await window.fetch('/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true
        });
        accepted = response.ok;
      } catch {
        // Retain this batch for a future hidden transition.
      }
    }

    // Events appended during fetch belong to the next batch.
    if (accepted) events.splice(0, count);
  } catch {
    // An unserializable event must not discard the queue.
  } finally {
    sending = false;
    updateStatus();
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    sendPendingEvents();
  } else if (document.visibilityState === 'visible') {
    endAttempted = false;
  }
});
window.addEventListener('pagehide', sendPendingEvents);
window.addEventListener('pageshow', event => {
  if (event.persisted) endAttempted = false;
});

document.querySelector('#record-event').addEventListener('click', () => {
  window.recordEvent({ name: 'sample' });
});
updateStatus();
