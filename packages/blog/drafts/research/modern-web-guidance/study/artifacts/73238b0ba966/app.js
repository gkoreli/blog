const form = document.querySelector('#newsletter-form');
const email = document.querySelector('#email');
const error = document.querySelector('#email-error');
const status = document.querySelector('#subscribe-status');

function clearError() {
  email.removeAttribute('aria-invalid');
  error.hidden = true;
  error.textContent = '';
}

function showError() {
  error.textContent = email.validity.valueMissing
    ? 'Enter your email address.'
    : 'Enter a valid email address, such as name@example.com.';
  error.hidden = false;
  email.setAttribute('aria-invalid', 'true');
}

form.addEventListener('submit', event => {
  event.preventDefault();
  status.textContent = '';

  if (!email.validity.valid) {
    showError();
    email.focus();
    return;
  }

  clearError();
  status.textContent = acceptSubscription(email.value);
});

email.addEventListener('input', () => {
  status.textContent = '';
  if (email.validity.valid) {
    clearError();
  } else if (email.getAttribute('aria-invalid') === 'true') {
    showError();
  }
});

// Use inline feedback only after the handlers are ready. Without JavaScript,
// the required/email constraints and the original submit path remain native.
form.noValidate = true;
