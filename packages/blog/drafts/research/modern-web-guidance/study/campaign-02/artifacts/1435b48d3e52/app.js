const panel = document.querySelector('#confirm-modal');
const deleteButton = document.querySelector('#delete-report');
let reportRemoved = false;

deleteButton.addEventListener('click', () => {
  if (panel.open || reportRemoved) return;
  // Pointer activation does not focus buttons in every browser. Establish the
  // return target before native dialog focus handling runs.
  deleteButton.focus();
  panel.showModal();
});

document.querySelector('#confirm-cancel').addEventListener('click', () => {
  panel.close();
});

document.querySelector('#confirm-delete').addEventListener('click', () => {
  if (!panel.open || reportRemoved) return;
  reportRemoved = true;
  panel.close();
  removeSavedReport();
});

// Baseline 2024 browsers may lack native light dismiss.
if (!('closedBy' in HTMLDialogElement.prototype)) {
  let pressedOutside = false;
  const isOutside = (event) => {
    const rect = panel.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom;
  };

  panel.addEventListener('pointerdown', (event) => {
    pressedOutside = event.isPrimary && event.button === 0 && isOutside(event);
  });
  panel.addEventListener('pointerup', (event) => {
    // Both ends must be outside; padding clicks and drags out must stay open.
    if (pressedOutside && event.isPrimary && isOutside(event)) panel.close();
    pressedOutside = false;
  });
  panel.addEventListener('pointercancel', () => { pressedOutside = false; });
  panel.addEventListener('close', () => { pressedOutside = false; });
}
