const panel = document.querySelector('#confirm-modal');
const deleteButton = document.querySelector('#delete-report');
const cancelButton = document.querySelector('#confirm-cancel');
const confirmButton = document.querySelector('#confirm-delete');

function closeConfirmation() {
  if (!panel.open) return;
  panel.close();
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

// Backdrop clicks target the dialog. Bounds distinguish them from padding
// clicks, including in browsers without native light-dismiss support.
panel.addEventListener('click', (event) => {
  if (event.target !== panel) return;
  const bounds = panel.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom) {
    closeConfirmation();
  }
});

confirmButton.addEventListener('click', () => {
  if (!panel.open) return;
  closeConfirmation();
  removeSavedReport();
});
