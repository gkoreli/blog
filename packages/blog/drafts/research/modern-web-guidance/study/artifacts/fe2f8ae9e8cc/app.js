(() => {
  const events = [];
  const status = document.querySelector('#event-status');
  let departureAttempted = false;
  let sending = false;

  function showStatus(message) {
    status.textContent = `${message} Pending events: ${events.length}.`;
  }

  window.recordEvent = event => {
    events.push(event);
    showStatus('Event queued.');
  };

  async function sendPending() {
    if (departureAttempted || sending || events.length === 0) return;
    departureAttempted = true;
    sending = true;

    // Keep this snapshot in the queue until a transport accepts it. Events
    // recorded during a fetch belong to the next batch.
    const batch = events.slice();
    let accepted = false;
    try {
      const body = JSON.stringify(batch);
      if (typeof navigator.sendBeacon === 'function') {
        try {
          accepted = navigator.sendBeacon(
            '/events',
            new Blob([body], { type: 'application/json' })
          );
        } catch {
          // A thrown beacon error can still use the keepalive fallback.
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
          // Keep the batch for the next departure if the request fails.
        }
      }
      if (accepted) events.splice(0, batch.length);
    } catch {
      // Unserializable input must not discard any queued events.
    } finally {
      sending = false;
      showStatus(accepted ? 'Batch accepted.' : 'Delivery failed; retry on next departure.');
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void sendPending();
    } else {
      departureAttempted = false;
    }
  });

  // Both events can describe the same departure, including entry into bfcache.
  window.addEventListener('pagehide', () => { void sendPending(); });
  window.addEventListener('pageshow', () => {
    departureAttempted = false;
  });

  document.querySelector('#record-event').addEventListener('click', () => {
    window.recordEvent({ name: 'sample' });
  });
  showStatus('Ready to record synthetic events.');
})();
