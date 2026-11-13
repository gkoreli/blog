const events = [];
const status = document.querySelector('#event-status');
let hiddenHandled = false;
let sending = false;
let retryRequested = false;

function updateStatus() {
  status.textContent = `${events.length} event${events.length === 1 ? '' : 's'} queued`;
}

window.recordEvent = event => {
  events.push(event);
  updateStatus();
};

async function sendPendingEvents() {
  if (sending) {
    // A new hidden period may start before the previous fetch settles.
    retryRequested = true;
    return;
  }
  if (!events.length) return;

  const batch = events.slice();
  sending = true;
  let accepted = false;
  try {
    const body = JSON.stringify(batch);
    if (typeof navigator.sendBeacon === 'function') {
      try {
        accepted = navigator.sendBeacon('/events', body);
      } catch {
        // A throwing beacon should still allow the fetch fallback.
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
        // Keep the batch queued for a later hidden transition.
      }
    }
  } catch {
    // An unserializable event must not discard the pending queue.
  } finally {
    if (accepted) events.splice(0, batch.length);
    sending = false;
    updateStatus();
    if (retryRequested) {
      retryRequested = false;
      if (document.visibilityState === 'hidden') sendPendingEvents();
    }
  }
}

function handleHidden() {
  if (hiddenHandled) return;
  hiddenHandled = true;
  sendPendingEvents();
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    handleHidden();
  } else {
    hiddenHandled = false;
    retryRequested = false;
  }
});

window.addEventListener('pagehide', handleHidden);
window.addEventListener('pageshow', event => {
  if (event.persisted) {
    hiddenHandled = false;
    retryRequested = false;
  }
});

document.querySelector('#record-event').addEventListener('click', () => {
  window.recordEvent({ name: 'sample' });
});
updateStatus();
