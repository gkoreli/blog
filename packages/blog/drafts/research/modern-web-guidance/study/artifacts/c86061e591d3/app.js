const events = [];
const status = document.querySelector('#event-status');
let inFlight = false;
let attemptedWhileHidden = false;

function updateStatus() {
  status.textContent = events.length
    ? `${events.length} synthetic event${events.length === 1 ? '' : 's'} queued${inFlight ? ' (sending)' : ''}.`
    : 'No events pending.';
}

window.recordEvent = event => {
  events.push(event);
  updateStatus();
};

async function sendPendingEvents() {
  if (document.visibilityState !== 'hidden' || attemptedWhileHidden || inFlight || !events.length) return;
  attemptedWhileHidden = true;
  inFlight = true;
  const count = events.length;

  try {
    const body = JSON.stringify(events.slice(0, count));
    let accepted = false;
    if (typeof navigator.sendBeacon === 'function') {
      try {
        accepted = navigator.sendBeacon('/events', new Blob([body], { type: 'application/json' }));
      } catch {
        // A rejected beacon can still use the keepalive transport.
      }
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
    // Events appended during a fetch belong to the next batch.
    if (accepted) events.splice(0, count);
  } catch {
    // Keep the entire batch for a later hidden transition.
  } finally {
    inFlight = false;
    updateStatus();
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    sendPendingEvents();
  } else {
    attemptedWhileHidden = false;
  }
});

window.addEventListener('pagehide', sendPendingEvents);
window.addEventListener('pageshow', event => {
  if (event.persisted) attemptedWhileHidden = false;
});

const recordButton = document.querySelector('#record-event');
recordButton.disabled = false;
recordButton.addEventListener('click', () => {
  window.recordEvent({ name: 'sample' });
});
updateStatus();
