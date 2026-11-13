const panel = document.querySelector('#confirm-modal');
const deleteButton = document.querySelector('#delete-report');
const cancelButton = document.querySelector('#confirm-cancel');
const confirmButton = document.querySelector('#confirm-delete');
let backdropPress = false;

function closeConfirmation() {
  if (!panel.open) return;
  panel.close();
  panel.hidden = true;
  backdropPress = false;
  deleteButton.focus();
}

deleteButton.addEventListener('click', () => {
  if (panel.open) return;
  panel.hidden = false;
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
  // Close first so repeated activation cannot submit the same confirmation twice.
  closeConfirmation();
  removeSavedReport();
});

// Native modal dialogs make the rest of the document inert. Keep Tab cycling
// between these two actions as well, including at the keyboard boundaries.
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
  const bounds = panel.getBoundingClientRect();
  return event.target === panel && (
    event.clientX < bounds.left || event.clientX > bounds.right ||
    event.clientY < bounds.top || event.clientY > bounds.bottom
  );
}

// Preserve backdrop dismissal without the newer native light-dismiss API.
// Requiring a backdrop press also avoids dismissal when dragging out of content.
panel.addEventListener('pointerdown', event => {
  backdropPress = isBackdrop(event);
});
panel.addEventListener('pointercancel', () => {
  backdropPress = false;
});
panel.addEventListener('click', event => {
  const dismiss = backdropPress && isBackdrop(event);
  backdropPress = false;
  if (dismiss) closeConfirmation();
});
