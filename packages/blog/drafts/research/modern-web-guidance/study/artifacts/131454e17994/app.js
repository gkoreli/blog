const panel = document.querySelector('#confirm-modal');
const deleteButton = document.querySelector('#delete-report');

deleteButton.addEventListener('click', () => {
  panel.showModal();
});

panel.addEventListener('close', () => {
  const confirmed = panel.returnValue === 'delete';
  // Escape and backdrop dismissal must never reuse a previous confirmation.
  panel.returnValue = '';
  if (confirmed) removeSavedReport();
});

// Native modal dialogs provide focus containment, inert background and Escape.
// Light-dismiss is newer than Baseline 2024, so retain it where unsupported.
if (!('closedBy' in HTMLDialogElement.prototype)) {
  let outsidePointer = null;
  const isOutside = (event) => {
    const rect = panel.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom;
  };

  panel.addEventListener('pointerdown', (event) => {
    outsidePointer = isOutside(event) ? event.pointerId : null;
  });
  panel.addEventListener('pointerup', (event) => {
    const dismiss = outsidePointer === event.pointerId && isOutside(event);
    outsidePointer = null;
    if (dismiss && panel.open) panel.close();
  });
  panel.addEventListener('pointercancel', () => { outsidePointer = null; });
  panel.addEventListener('close', () => { outsidePointer = null; });
}
