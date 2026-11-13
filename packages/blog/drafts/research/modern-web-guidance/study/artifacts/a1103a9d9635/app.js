const form = document.querySelector('#newsletter-form');
const email = document.querySelector('#email');
const error = document.querySelector('#email-error');
const status = document.querySelector('#subscribe-status');
const description = email.getAttribute('aria-describedby');

function clearError() {
  email.removeAttribute('aria-invalid');
  email.setAttribute('aria-describedby', description);
  error.hidden = true;
  error.textContent = '';
}

function showError() {
  error.textContent = email.validity.valueMissing
    ? 'Enter your email address.'
    : 'Enter a valid email address, such as name@example.com.';
  error.hidden = false;
  email.setAttribute('aria-invalid', 'true');
  email.setAttribute('aria-describedby', `${description} email-error`);
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
  } else if (!error.hidden) {
    showError();
  }
});

// Native validation and submission remain available when JavaScript is disabled.
form.noValidate = true;
