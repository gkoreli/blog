const events = [];
let deliveryPending = false;
const eventStatus = document.querySelector('#event-status');

function updateEventStatus() {
  const count = events.length;
  eventStatus.textContent = count
    ? `${count} ${count === 1 ? 'event' : 'events'} queued for delivery.`
    : 'No events waiting for delivery.';
}

window.recordEvent = event => {
  events.push(event);
  updateEventStatus();
};

async function sendPendingEvents() {
  // A hidden transition and pagehide may describe the same departure.
  if (deliveryPending || events.length === 0) return;

  deliveryPending = true;
  const batchSize = events.length;
  let accepted = false;

  try {
    const body = JSON.stringify(events.slice(0, batchSize));
    if (typeof navigator.sendBeacon === 'function') {
      try {
        accepted = navigator.sendBeacon('/events', body);
      } catch {
        // A rejected beacon can still be delivered by keepalive fetch.
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
        // Keep the batch for a later hidden transition.
      }
    }

    if (accepted) {
      // Events recorded while fetch was pending belong to the next batch.
      events.splice(0, batchSize);
    }
  } catch {
    // An event that cannot be serialized must not discard queued events.
  } finally {
    deliveryPending = false;
    updateEventStatus();
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') sendPendingEvents();
});
window.addEventListener('pagehide', sendPendingEvents);
window.addEventListener('pageshow', event => {
  if (event.persisted) updateEventStatus();
});

document.querySelector('#record-event').onclick = () => {
  window.recordEvent({ name: 'sample' });
};
updateEventStatus();
