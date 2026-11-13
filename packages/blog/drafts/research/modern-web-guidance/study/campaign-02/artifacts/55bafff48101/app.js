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

function showError() {
  error.textContent = email.validity.valueMissing
    ? 'Please enter your email address.'
    : 'Please enter a valid email address, such as you@example.com.';
  error.hidden = false;
  email.setAttribute('aria-invalid', 'true');
  email.setAttribute('aria-describedby', 'email-help email-error');
  status.textContent = '';
  email.focus();
}

// Native validation fires before submit, including for untouched required fields.
email.addEventListener('invalid', event => {
  event.preventDefault();
  showError();
});

email.addEventListener('input', () => {
  status.textContent = '';
  if (email.validity.valid) clearError();
});
email.addEventListener('change', () => {
  if (email.validity.valid) clearError();
});

form.addEventListener('submit', event => {
  event.preventDefault();
  // Also guard submissions dispatched without native interactive validation.
  if (!email.validity.valid) {
    showError();
    return;
  }
  clearError();
  status.textContent = acceptSubscription(email.value);
});

form.addEventListener('reset', () => {
  clearError();
  status.textContent = '';
});
