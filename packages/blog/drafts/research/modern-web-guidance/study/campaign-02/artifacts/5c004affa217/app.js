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
  // Close first so repeated activation cannot invoke the callback twice.
  closeConfirmation();
  removeSavedReport();
});

panel.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab') return;
  if (event.shiftKey && document.activeElement === cancelButton) {
    event.preventDefault();
    confirmButton.focus();
  } else if (!event.shiftKey && document.activeElement === confirmButton) {
    event.preventDefault();
    cancelButton.focus();
  }
});

function isBackdrop(event) {
  if (event.target !== panel) return false;
  const bounds = panel.getBoundingClientRect();
  return event.clientX < bounds.left || event.clientX > bounds.right ||
    event.clientY < bounds.top || event.clientY > bounds.bottom;
}

// Explicit dismissal also works without the newer dialog closedby behavior.
panel.addEventListener('pointerdown', (event) => {
  backdropPress = isBackdrop(event);
});
panel.addEventListener('pointercancel', () => {
  backdropPress = false;
});
panel.addEventListener('click', (event) => {
  if (backdropPress && isBackdrop(event)) closeConfirmation();
  backdropPress = false;
});
