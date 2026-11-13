const panel = document.querySelector('#confirm-modal');
const deleteButton = document.querySelector('#delete-report');
const cancelButton = document.querySelector('#confirm-cancel');
const confirmButton = document.querySelector('#confirm-delete');
let awaitingConfirmation = false;

function closeConfirmation() {
  awaitingConfirmation = false;
  panel.close();
  panel.hidden = true;
  deleteButton.focus();
}

deleteButton.addEventListener('click', () => {
  if (panel.open) return;
  panel.hidden = false;
  // Native modal dialogs contain focus and make the rest of the page inert.
  panel.showModal();
  awaitingConfirmation = true;
  cancelButton.focus();
});

cancelButton.addEventListener('click', closeConfirmation);
panel.addEventListener('cancel', event => {
  event.preventDefault();
  closeConfirmation();
});

// Explicit backdrop dismissal also works without native light-dismiss support.
panel.addEventListener('click', event => {
  if (event.target !== panel) return;
  const bounds = panel.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom) {
    closeConfirmation();
  }
});

confirmButton.addEventListener('click', () => {
  if (!awaitingConfirmation) return;
  awaitingConfirmation = false;
  try {
    removeSavedReport();
  } finally {
    closeConfirmation();
  }
});
