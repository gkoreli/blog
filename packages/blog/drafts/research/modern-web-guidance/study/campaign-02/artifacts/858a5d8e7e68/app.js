const panel = document.querySelector('#confirm-modal');
const deleteReport = document.querySelector('#delete-report');
const confirmDelete = document.querySelector('#confirm-delete');

deleteReport.addEventListener('click', () => {
  if (panel.open) return;
  // Also establish the invoker in browsers that do not focus clicked buttons.
  deleteReport.focus();
  panel.showModal();
});

confirmDelete.addEventListener('click', () => {
  if (!panel.open) return;
  // Close first so repeated activation cannot repeat this confirmation.
  panel.close();
  removeSavedReport();
});

// Baseline 2024 supports modal dialogs, but not native light dismissal.
if (!('closedBy' in HTMLDialogElement.prototype)) {
  const isOutside = (event) => {
    const rect = panel.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom;
  };

  let pressedOutside = false;
  panel.addEventListener('pointerdown', (event) => {
    pressedOutside = event.target === panel && isOutside(event);
  });
  panel.addEventListener('pointerup', (event) => {
    if (pressedOutside && event.target === panel && isOutside(event)) {
      panel.close();
    }
    pressedOutside = false;
  });
  panel.addEventListener('pointercancel', () => { pressedOutside = false; });
  panel.addEventListener('close', () => { pressedOutside = false; });
}
