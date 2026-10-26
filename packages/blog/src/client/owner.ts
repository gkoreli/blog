import { markOwner } from './owner-request.js';

const form = document.getElementById('owner-form');
const credential = document.getElementById('owner-credential');
const submit = document.getElementById('owner-submit');
const status = document.getElementById('owner-status');
const next = document.getElementById('owner-next');
if (form instanceof HTMLFormElement && credential instanceof HTMLInputElement
  && submit instanceof HTMLButtonElement && status !== null && next !== null) {
  submit.disabled = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled || !form.reportValidity()) return;
    submit.disabled = true;
    next.hidden = true;
    const value = credential.value;
    credential.value = '';
    status.textContent = 'Marking this browser…';
    try {
      const day = await markOwner(value);
      status.textContent = `This browser was marked for ${day} UTC. The browser verification and public-report checks are still needed.`;
      next.hidden = false;
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : 'Owner marking could not be confirmed.';
      submit.disabled = false;
    }
  });
}
