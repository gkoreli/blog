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
panel.addEventListener('cancel', event => {
  event.preventDefault();
  closeConfirmation();
});

// Backdrop events target the dialog. Check its bounds so padding clicks stay open.
// Keep this fallback independent of the newer native light-dismiss API.
function isBackdrop(event) {
  const bounds = panel.getBoundingClientRect();
  return event.target === panel && (
    event.clientX < bounds.left || event.clientX > bounds.right ||
    event.clientY < bounds.top || event.clientY > bounds.bottom
  );
}

panel.addEventListener('pointerdown', event => {
  backdropPress = isBackdrop(event);
});
panel.addEventListener('pointercancel', () => {
  backdropPress = false;
});
panel.addEventListener('click', event => {
  if (backdropPress && isBackdrop(event)) closeConfirmation();
  backdropPress = false;
});

confirmButton.addEventListener('click', () => {
  if (!panel.open) return;
  closeConfirmation();
  removeSavedReport();
});
