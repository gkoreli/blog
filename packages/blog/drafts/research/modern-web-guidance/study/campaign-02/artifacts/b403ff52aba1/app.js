const panel = document.querySelector('#confirm-modal');
const deleteButton = document.querySelector('#delete-report');
const cancelButton = document.querySelector('#confirm-cancel');
const confirmButton = document.querySelector('#confirm-delete');
let confirming = false;

function closeConfirmation() {
  panel.close();
  panel.hidden = true;
  deleteButton.focus();
}

deleteButton.addEventListener('click', () => {
  if (panel.open) return;
  confirming = false;
  panel.hidden = false;
  panel.showModal();
  cancelButton.focus();
});

cancelButton.addEventListener('click', closeConfirmation);
panel.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeConfirmation();
});

// Explicit dismissal works without the newer native light-dismiss API.
panel.addEventListener('click', (event) => {
  if (event.target !== panel) return;
  const bounds = panel.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom) {
    closeConfirmation();
  }
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

confirmButton.addEventListener('click', () => {
  if (!panel.open || confirming) return;
  confirming = true;
  try {
    removeSavedReport();
  } finally {
    closeConfirmation();
  }
});
