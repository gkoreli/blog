const events = [];
let attemptedWhileHidden = false;
let pendingFlush = false;
let sending = false;

window.recordEvent = event => {
  events.push(event);
};

async function flushEvents() {
  if (sending || !pendingFlush) return;
  pendingFlush = false;
  if (!events.length) return;

  // Events recorded during a fetch stay behind this snapshot.
  const batch = events.slice();
  sending = true;
  try {
    const body = JSON.stringify(batch);
    let accepted = false;
    if (typeof navigator.sendBeacon === 'function') {
      try {
        accepted = navigator.sendBeacon('/events', body);
      } catch {
        // A throwing beacon is also eligible for the fetch fallback.
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
    if (accepted) events.splice(0, batch.length);
  } catch {
    // Keep failed batches available for the next hidden transition.
  } finally {
    sending = false;
    // A restored page may hide again while the previous fetch is pending.
    if (pendingFlush && document.visibilityState === 'hidden') flushEvents();
  }
}

function sendWhenHidden() {
  if (document.visibilityState !== 'hidden' || attemptedWhileHidden) return;
  attemptedWhileHidden = true;
  pendingFlush = true;
  flushEvents();
}

function resumeQueue() {
  attemptedWhileHidden = false;
  pendingFlush = false;
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') sendWhenHidden();
  else resumeQueue();
});
window.addEventListener('pagehide', sendWhenHidden);
window.addEventListener('pageshow', event => {
  if (event.persisted) resumeQueue();
});

document.querySelector('#record-event').onclick = () => {
  window.recordEvent({ name: 'sample' });
  document.querySelector('#event-status').textContent = 'Event queued';
};
