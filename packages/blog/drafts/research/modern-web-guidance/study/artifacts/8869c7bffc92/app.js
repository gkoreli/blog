const form = document.querySelector('#newsletter-form');
const email = document.querySelector('#email');
const error = document.querySelector('#email-error');
const status = document.querySelector('#subscribe-status');

function showError(message = '') {
  const invalid = Boolean(message);
  error.textContent = message;
  error.hidden = !invalid;
  email.setAttribute('aria-invalid', String(invalid));

  // Preserve help text and any other descriptions when linking the error.
  const descriptions = (email.getAttribute('aria-describedby') || '')
    .split(/\s+/).filter(id => id && id !== error.id);
  if (invalid) descriptions.push(error.id);
  if (descriptions.length) {
    email.setAttribute('aria-describedby', descriptions.join(' '));
  } else {
    email.removeAttribute('aria-describedby');
  }
}

function validationMessage() {
  if (email.validity.valid) return '';
  return email.validity.valueMissing
    ? 'Enter your email address.'
    : 'Enter a valid email address, such as name@example.com.';
}

form.addEventListener('submit', event => {
  event.preventDefault();
  status.textContent = '';
  const message = validationMessage();
  showError(message);
  if (message) {
    email.focus();
    return;
  }
  status.textContent = acceptSubscription(email.value);
});

function updateAfterEdit() {
  status.textContent = '';
  // Wait for a submit attempt before showing errors, then keep them current.
  if (email.getAttribute('aria-invalid') === 'true') {
    showError(validationMessage());
  }
}

email.addEventListener('input', updateAfterEdit);
email.addEventListener('change', updateAfterEdit);
form.addEventListener('reset', () => {
  showError();
  status.textContent = '';
});

// Enable inline validation only after the enhancement is ready. Without JS,
// the required/email constraints and normal form submission remain native.
form.noValidate = true;
