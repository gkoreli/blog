const panel = document.querySelector('#confirm-modal');
const deleteButton = document.querySelector('#delete-report');

deleteButton.addEventListener('click', () => {
  if (panel.open) return;
  panel.returnValue = '';
  // Save the invoker for native focus restoration, including pointer activation.
  deleteButton.focus();
  panel.showModal();
});

panel.addEventListener('close', () => {
  const confirmed = panel.returnValue === 'delete';
  // Escape and backdrop dismissal must never reuse an earlier confirmation.
  panel.returnValue = '';
  if (confirmed) removeSavedReport();
});

// Baseline 2024 browsers may not implement native light-dismiss yet.
if (!('closedBy' in HTMLDialogElement.prototype)) {
  let pressedOutside = false;
  const outside = (event) => {
    const rect = panel.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom;
  };

  panel.addEventListener('pointerdown', (event) => {
    pressedOutside = event.isPrimary && event.button === 0 && outside(event);
  });
  panel.addEventListener('pointerup', (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    const dismiss = pressedOutside && outside(event);
    pressedOutside = false;
    if (dismiss && panel.open) panel.close();
  });
  panel.addEventListener('pointercancel', () => { pressedOutside = false; });
  panel.addEventListener('close', () => { pressedOutside = false; });
}
