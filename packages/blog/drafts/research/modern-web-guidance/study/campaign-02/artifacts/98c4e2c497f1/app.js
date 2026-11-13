const form = document.querySelector('#newsletter-form');
const email = document.querySelector('#email');
const error = document.querySelector('#email-error');
const status = document.querySelector('#subscribe-status');

function clearError() {
  email.removeAttribute('aria-invalid');
  error.textContent = '';
  error.hidden = true;
}

form.addEventListener('submit', event => {
  event.preventDefault();
  status.textContent = '';

  if (!email.validity.valid) {
    error.textContent = email.validity.valueMissing
      ? 'Enter your email address.'
      : 'Enter a valid email address, such as name@example.com.';
    error.hidden = false;
    email.setAttribute('aria-invalid', 'true');
    email.focus();
    return;
  }

  clearError();
  status.textContent = acceptSubscription(email.value);
});

email.addEventListener('input', () => {
  status.textContent = '';
  if (email.validity.valid) clearError();
});

// Enable inline validation only after its handlers are ready. Without this
// script, the browser still validates and submits to the form's action.
form.noValidate = true;
