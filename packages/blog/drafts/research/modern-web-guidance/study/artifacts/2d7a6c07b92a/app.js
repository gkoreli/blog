const events = [];
let sending = false;

window.recordEvent = event => {
  events.push(event);
};

async function sendPendingEvents() {
  if (document.visibilityState !== 'hidden' || sending || events.length === 0) {
    return;
  }

  // Keep this batch queued until a transport accepts it. Events recorded while
  // fetch is pending belong to the next batch.
  const batchSize = events.length;
  sending = true;
  try {
    const body = JSON.stringify(events);
    let accepted = false;

    if (typeof navigator.sendBeacon === 'function') {
      try {
        accepted = navigator.sendBeacon('/events', body);
      } catch {
        // A throwing beacon implementation can still fall back to fetch.
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
        // Retain the batch for the next hidden transition.
      }
    }

    if (accepted) {
      events.splice(0, batchSize);
    }
  } finally {
    // No permanent "sent" flag: the same queue survives a bfcache restore.
    sending = false;
  }
}

document.addEventListener('visibilitychange', sendPendingEvents);
window.addEventListener('pagehide', sendPendingEvents);

document.querySelector('#record-event').onclick = () => {
  window.recordEvent({ name: 'sample' });
  document.querySelector('#event-status').textContent = 'Event queued';
};
