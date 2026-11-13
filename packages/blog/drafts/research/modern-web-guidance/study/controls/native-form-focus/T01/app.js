const panel = document.querySelector('#confirm-modal');
const deleteButton = document.querySelector('#delete-report');

deleteButton.addEventListener('click', () => {
  if (panel.open) return;
  panel.returnValue = '';
  panel.showModal();
});

panel.addEventListener('close', () => {
  const confirmed = panel.returnValue === 'delete';
  panel.returnValue = '';
  if (confirmed) removeSavedReport();
  deleteButton.focus();
});

// Native light dismissal is newer than the project's Baseline 2024 target.
if (!('closedBy' in HTMLDialogElement.prototype)) {
  const isOutside = (event) => {
    const rect = panel.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom;
  };
  let pressedOutside = false;

  panel.addEventListener('pointerdown', (event) => {
    pressedOutside = event.isPrimary && event.button === 0 && isOutside(event);
  });
  panel.addEventListener('pointerup', (event) => {
    if (pressedOutside && event.isPrimary && isOutside(event) && panel.open) {
      panel.close();
    }
    pressedOutside = false;
  });
  panel.addEventListener('pointercancel', () => {
    pressedOutside = false;
  });
  panel.addEventListener('close', () => {
    pressedOutside = false;
  });
}
