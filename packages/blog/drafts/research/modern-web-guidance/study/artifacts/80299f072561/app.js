const events = [];
const eventStatus = document.querySelector('#event-status');
let hiddenHandled = false;
let sending = false;

window.recordEvent = event => {
  events.push(event);
  eventStatus.textContent = `${events.length} synthetic event${events.length === 1 ? '' : 's'} queued`;
};

function sendPendingEvents() {
  // visibilitychange and pagehide can describe the same departure.
  if (hiddenHandled) return;
  hiddenHandled = true;
  if (sending || events.length === 0) return;

  const batchSize = events.length;
  let body;
  try {
    body = JSON.stringify(events);
  } catch {
    // Keep an unserializable batch rather than lose events.
    return;
  }

  function acceptBatch() {
    // Events appended while fetch is pending belong to the next batch.
    events.splice(0, batchSize);
    eventStatus.textContent = events.length
      ? `${events.length} synthetic event${events.length === 1 ? '' : 's'} queued`
      : 'Queued events accepted for delivery';
  }

  try {
    if (typeof navigator.sendBeacon === 'function' &&
        navigator.sendBeacon('/events', new Blob([body], { type: 'application/json' }))) {
      acceptBatch();
      return;
    }
  } catch {
    // A thrown beacon error should still allow the fetch fallback.
  }

  if (typeof window.fetch !== 'function') return;
  sending = true;
  try {
    window.fetch('/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).then(response => {
      if (response.ok) acceptBatch();
    }).catch(() => {
      // Retain the batch for a later hidden transition.
    }).finally(() => {
      sending = false;
    });
  } catch {
    sending = false;
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    sendPendingEvents();
  } else if (document.visibilityState === 'visible') {
    hiddenHandled = false;
  }
});

window.addEventListener('pagehide', sendPendingEvents);
window.addEventListener('pageshow', event => {
  if (event.persisted) hiddenHandled = false;
});

const recordButton = document.querySelector('#record-event');
recordButton.disabled = false;
recordButton.onclick = () => window.recordEvent({ name: 'sample' });
