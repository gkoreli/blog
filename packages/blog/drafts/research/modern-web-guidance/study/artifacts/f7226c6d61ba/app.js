const form = document.querySelector('#newsletter-form');
const email = document.querySelector('#email');
const error = document.querySelector('#email-error');
const status = document.querySelector('#subscribe-status');

function clearError() {
  email.setAttribute('aria-invalid', 'false');
  email.setAttribute('aria-describedby', 'email-help');
  error.hidden = true;
  error.textContent = '';
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  status.textContent = '';

  // Read native constraints without firing another validation event.
  if (!email.validity.valid) {
    error.textContent = email.validity.valueMissing
      ? 'Please enter your email address.'
      : 'Please enter an email address in the format you@example.com.';
    error.hidden = false;
    email.setAttribute('aria-invalid', 'true');
    email.setAttribute('aria-describedby', 'email-help email-error');
    email.focus();
    return;
  }

  clearError();
  status.textContent = acceptSubscription(email.value);
});

function clearCorrectedError() {
  status.textContent = '';
  if (email.validity.valid) clearError();
}

email.addEventListener('input', clearCorrectedError);
email.addEventListener('change', clearCorrectedError);
form.addEventListener('reset', () => {
  clearError();
  status.textContent = '';
});

// Enhance only after handlers are installed; HTML retains native validation.
form.noValidate = true;
