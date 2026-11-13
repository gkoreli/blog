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
  status.textContent = '';
  error.textContent = email.validity.valueMissing
    ? 'Please enter your email address.'
    : 'Please enter a valid email address, such as you@example.com.';
  error.hidden = false;
  email.setAttribute('aria-invalid', 'true');
  email.setAttribute('aria-describedby', 'email-help email-error');
  email.focus();
}

clearError();

// Native validation runs before submit, including for an untouched empty field.
email.addEventListener('invalid', (event) => {
  event.preventDefault();
  showError();
});

function handleCorrection() {
  status.textContent = '';
  if (email.validity.valid) clearError();
}

email.addEventListener('input', handleCorrection);
email.addEventListener('change', handleCorrection);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  // Also guard submissions dispatched without the browser's validation step.
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
