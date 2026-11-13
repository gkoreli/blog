const panel = document.querySelector('#confirm-modal');

document.querySelector('#delete-report').addEventListener('click', () => {
  panel.showModal();
});

panel.addEventListener('close', () => {
  const confirmed = panel.returnValue === 'delete';
  panel.returnValue = '';
  if (confirmed) removeSavedReport();
});

// Native modal focus containment and Escape work throughout Baseline 2024.
// Light-dismiss is newer, so preserve it when closedby is unavailable.
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
    if (!event.isPrimary) return;
    const dismiss = pressedOutside && outside(event);
    pressedOutside = false;
    if (dismiss && panel.open) panel.close();
  });
  panel.addEventListener('pointercancel', () => { pressedOutside = false; });
  panel.addEventListener('close', () => { pressedOutside = false; });
}
