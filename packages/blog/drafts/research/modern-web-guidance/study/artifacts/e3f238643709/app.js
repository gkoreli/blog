const panel = document.querySelector('#confirm-modal');
const deleteButton = document.querySelector('#delete-report');
const cancelButton = document.querySelector('#confirm-cancel');
const confirmButton = document.querySelector('#confirm-delete');
let backdropPointerDown = false;

function closeConfirmation() {
  if (!panel.open) return;
  panel.close();
  panel.hidden = true;
  backdropPointerDown = false;
  deleteButton.focus();
}

deleteButton.addEventListener('click', () => {
  if (panel.open) return;
  panel.hidden = false;
  // Modal dialogs make the rest of the document inert, including pointer access.
  panel.showModal();
  cancelButton.focus();
});

cancelButton.addEventListener('click', closeConfirmation);
panel.addEventListener('cancel', event => {
  event.preventDefault();
  closeConfirmation();
});

confirmButton.addEventListener('click', () => {
  if (!panel.open) return;
  closeConfirmation();
  removeSavedReport();
});

panel.addEventListener('keydown', event => {
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

// Explicit backdrop dismissal also works without native light-dismiss support.
panel.addEventListener('pointerdown', event => {
  backdropPointerDown = isBackdrop(event);
});
panel.addEventListener('pointercancel', () => {
  backdropPointerDown = false;
});
panel.addEventListener('click', event => {
  if (backdropPointerDown && isBackdrop(event)) closeConfirmation();
  backdropPointerDown = false;
});
