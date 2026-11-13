const form = document.querySelector('#newsletter-form');
const email = document.querySelector('#email');
const error = document.querySelector('#email-error');
const status = document.querySelector('#subscribe-status');

function updateError(show) {
  const descriptionIds = (email.getAttribute('aria-describedby') || '')
    .split(/\s+/)
    .filter(id => id && id !== error.id);

  if (show) {
    error.textContent = email.validity.valueMissing
      ? 'Enter your email address.'
      : 'Enter a valid email address, such as name@example.com.';
    descriptionIds.push(error.id);
  } else {
    error.textContent = '';
  }

  error.hidden = !show;
  email.setAttribute('aria-invalid', String(show));
  if (descriptionIds.length) {
    email.setAttribute('aria-describedby', descriptionIds.join(' '));
  } else {
    email.removeAttribute('aria-describedby');
  }
}

// Preserve native validation, replacing its popup with associated inline feedback.
email.addEventListener('invalid', event => {
  event.preventDefault();
  status.textContent = '';
  updateError(true);
  email.focus();
});

email.addEventListener('input', () => {
  status.textContent = '';
  if (!error.hidden) updateError(!email.validity.valid);
});

email.addEventListener('blur', () => {
  if (email.matches(':user-invalid')) {
    updateError(true);
    // Announce errors found on blur through the existing polite status region.
    status.textContent = error.textContent;
  } else if (email.validity.valid) {
    updateError(false);
  }
});

form.addEventListener('submit', event => {
  event.preventDefault();
  // Also guard submissions dispatched directly by integration code.
  if (!email.validity.valid) {
    status.textContent = '';
    updateError(true);
    email.focus();
    return;
  }
  updateError(false);
  status.textContent = acceptSubscription(email.value);
});

form.addEventListener('reset', () => {
  updateError(false);
  status.textContent = '';
});
