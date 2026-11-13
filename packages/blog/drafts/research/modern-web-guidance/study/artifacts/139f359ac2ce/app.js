const panel = document.querySelector('#confirm-modal');
const deleteButton = document.querySelector('#delete-report');
const cancelButton = document.querySelector('#confirm-cancel');
const confirmButton = document.querySelector('#confirm-delete');
let backdropPress = false;

function closeConfirmation() {
  if (!panel.open) return;
  panel.close();
  backdropPress = false;
  deleteButton.focus();
}

deleteButton.addEventListener('click', () => {
  if (panel.open) return;
  panel.showModal();
  cancelButton.focus();
});

cancelButton.addEventListener('click', closeConfirmation);
panel.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeConfirmation();
});

confirmButton.addEventListener('click', () => {
  if (!panel.open) return;
  // Close first so repeated activation cannot call the callback twice.
  closeConfirmation();
  window.removeSavedReport();
});

function isBackdrop(event) {
  if (event.target !== panel) return false;
  const bounds = panel.getBoundingClientRect();
  return event.clientX < bounds.left || event.clientX > bounds.right ||
    event.clientY < bounds.top || event.clientY > bounds.bottom;
}

// Explicit light dismissal works without the newer dialog closedby API.
// Require the press to start outside too, avoiding dismissal after a drag out.
panel.addEventListener('pointerdown', (event) => {
  backdropPress = isBackdrop(event);
});
panel.addEventListener('click', (event) => {
  if (backdropPress && isBackdrop(event)) closeConfirmation();
  backdropPress = false;
});
