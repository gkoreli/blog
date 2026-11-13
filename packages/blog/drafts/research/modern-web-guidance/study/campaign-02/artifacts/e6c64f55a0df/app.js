const panel = document.querySelector('#confirm-modal');
const deleteButton = document.querySelector('#delete-report');

deleteButton.addEventListener('click', () => {
  if (!panel.open) {
    panel.returnValue = '';
    panel.showModal();
  }
});

panel.addEventListener('close', () => {
  const confirmed = panel.returnValue === 'delete';
  panel.returnValue = '';
  if (confirmed) removeSavedReport();
});

// Native light-dismiss is newer than Baseline 2024. Keep backdrop
// cancellation available without treating dialog padding as the backdrop.
if (!('closedBy' in HTMLDialogElement.prototype)) {
  const outside = (event) => {
    const rect = panel.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom;
  };
  let pressedOutside = false;

  panel.addEventListener('pointerdown', (event) => {
    pressedOutside = event.isPrimary && event.button === 0 && outside(event);
  });
  panel.addEventListener('pointerup', (event) => {
    if (!event.isPrimary) return;
    if (pressedOutside && outside(event)) panel.close();
    pressedOutside = false;
  });
  panel.addEventListener('pointercancel', () => {
    pressedOutside = false;
  });
}
