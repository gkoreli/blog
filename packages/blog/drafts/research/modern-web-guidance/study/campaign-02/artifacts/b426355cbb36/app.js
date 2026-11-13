const panel = document.querySelector('#confirm-modal');
const deleteButton = document.querySelector('#delete-report');

deleteButton.addEventListener('click', () => {
  // Also establish the native focus-return target on pointer activation.
  deleteButton.focus();
  panel.returnValue = '';
  panel.showModal();
});

panel.addEventListener('close', () => {
  const confirmed = panel.returnValue === 'delete';
  panel.returnValue = '';
  if (confirmed) removeSavedReport();
});

// closedby is newer than Baseline 2024. Keep backdrop cancellation available
// without dismissing clicks on the dialog's padding or selection drags.
if (!('closedBy' in HTMLDialogElement.prototype)) {
  const outside = (event) => {
    const rect = panel.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom;
  };
  let backdropPointer = null;
  panel.addEventListener('pointerdown', (event) => {
    backdropPointer = event.isPrimary && event.button === 0 && outside(event)
      ? event.pointerId : null;
  });
  panel.addEventListener('pointerup', (event) => {
    if (event.pointerId === backdropPointer && outside(event)) panel.close();
    backdropPointer = null;
  });
  panel.addEventListener('pointercancel', () => { backdropPointer = null; });
}
