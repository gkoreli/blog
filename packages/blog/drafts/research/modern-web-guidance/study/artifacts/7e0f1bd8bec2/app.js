(() => {
  const events = [];
  let sending = false;
  let handledHide = false;
  const status = document.querySelector('#event-status');

  window.recordEvent = event => {
    events.push(event);
  };

  async function sendPendingEvents() {
    if (sending || events.length === 0) return;

    // Keep this batch in the queue until a transport accepts it. Events added
    // while fetch is pending belong to a later batch.
    const batchSize = events.length;
    let body;
    try {
      body = JSON.stringify(events.slice(0, batchSize));
    } catch {
      return;
    }

    sending = true;
    try {
      if (typeof navigator.sendBeacon === 'function') {
        try {
          if (navigator.sendBeacon('/events', body)) {
            events.splice(0, batchSize);
            return;
          }
        } catch {
          // A rejected beacon can still be delivered using keepalive fetch.
        }
      }

      if (typeof window.fetch === 'function') {
        const response = await window.fetch('/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true
        });
        if (response.ok) events.splice(0, batchSize);
      }
    } catch {
      // Leave the batch queued for the next hidden transition.
    } finally {
      sending = false;
    }
  }

  function endVisit() {
    if (handledHide) return;
    handledHide = true;
    void sendPendingEvents();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      endVisit();
    } else {
      handledHide = false;
    }
  });

  // pagehide covers navigation when visibilitychange is not dispatched.
  // It shares a guard with the hidden transition to avoid duplicate batches.
  window.addEventListener('pagehide', endVisit);
  window.addEventListener('pageshow', () => {
    handledHide = false;
  });

  document.querySelector('#record-event').addEventListener('click', () => {
    window.recordEvent({ name: 'sample' });
    status.textContent = 'Event queued';
  });
})();
