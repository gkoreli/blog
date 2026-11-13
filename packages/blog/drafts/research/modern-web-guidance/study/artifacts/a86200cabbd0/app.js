const panel = document.querySelector('#confirm-modal');
const deleteButton = document.querySelector('#delete-report');

deleteButton.addEventListener('click', () => {
  panel.returnValue = '';
  panel.showModal();
});

panel.addEventListener('close', () => {
  const confirmed = panel.returnValue === 'delete';
  panel.returnValue = '';
  if (confirmed) removeSavedReport();
});

// Native modal behavior handles focus, background inertness and Escape.
// Older browsers need pointer-based light dismissal in place of closedby.
if (!('closedBy' in HTMLDialogElement.prototype)) {
  const isOutside = (event) => {
    const rect = panel.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom;
  };
  let outsidePointerId = null;

  panel.addEventListener('pointerdown', (event) => {
    outsidePointerId = event.isPrimary && event.button === 0 && isOutside(event)
      ? event.pointerId : null;
  });
  panel.addEventListener('pointerup', (event) => {
    const dismiss = outsidePointerId === event.pointerId && isOutside(event);
    outsidePointerId = null;
    if (panel.open && dismiss) panel.close();
  });
  panel.addEventListener('pointercancel', () => {
    outsidePointerId = null;
  });
  panel.addEventListener('close', () => {
    outsidePointerId = null;
  });
}
