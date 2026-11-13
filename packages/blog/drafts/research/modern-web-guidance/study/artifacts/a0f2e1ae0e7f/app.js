const panel = document.querySelector('#confirm-modal');
const deleteButton = document.querySelector('#delete-report');
const cancelButton = document.querySelector('#confirm-cancel');
const confirmButton = document.querySelector('#confirm-delete');

function closeConfirmation() {
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

// Native modal dialogs make the background inert. Wrap Tab explicitly so
// keyboard focus stays on the two choices, including at either boundary.
panel.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab') return;
  event.preventDefault();
  if (event.shiftKey) {
    (document.activeElement === cancelButton ? confirmButton : cancelButton).focus();
  } else {
    (document.activeElement === confirmButton ? cancelButton : confirmButton).focus();
  }
});

// Backdrop clicks target the dialog itself. Check its bounds so clicks on
// the dialog's padding do not dismiss it. This also works without closedby.
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
