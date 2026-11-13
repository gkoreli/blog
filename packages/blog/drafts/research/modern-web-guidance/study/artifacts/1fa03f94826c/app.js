const form = document.querySelector('#newsletter-form');
const email = document.querySelector('#email');
const error = document.querySelector('#email-error');
const status = document.querySelector('#subscribe-status');

function clearError() {
  email.removeAttribute('aria-invalid');
  email.setAttribute('aria-describedby', 'email-help');
  error.hidden = true;
  error.textContent = '';
}

function showError() {
  error.textContent = email.validity.valueMissing
    ? 'Enter your email address.'
    : 'Enter a valid email address, such as name@example.com.';
  error.hidden = false;
  email.setAttribute('aria-invalid', 'true');
  email.setAttribute('aria-describedby', 'email-help email-error');
}

email.addEventListener('input', () => {
  status.textContent = '';
  if (email.validity.valid) {
    clearError();
  } else if (email.getAttribute('aria-invalid') === 'true') {
    showError();
  }
});

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

// Only replace native validation after the inline handlers are ready.
form.noValidate = true;
