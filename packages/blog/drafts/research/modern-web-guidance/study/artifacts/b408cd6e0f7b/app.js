const form = document.querySelector('#newsletter-form');
const email = document.querySelector('#email');
const error = document.querySelector('#email-error');
const status = document.querySelector('#subscribe-status');

function setError(message) {
  const invalid = Boolean(message);
  error.textContent = message;
  error.hidden = !invalid;
  email.setAttribute('aria-invalid', String(invalid));

  // Preserve other descriptions, such as the existing email help text.
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
  if (email.validity.valueMissing) return 'Please enter your email address.';
  if (!email.validity.valid) return 'Please enter a valid email address, such as name@example.com.';
  return '';
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const message = validationMessage();
  setError(message);
  status.textContent = '';
  if (message) {
    // When focus is already here, announce through the existing live status.
    if (document.activeElement === email) status.textContent = message;
    email.focus();
    return;
  }
  status.textContent = acceptSubscription(email.value);
});

email.addEventListener('input', () => {
  status.textContent = '';
  // Do not introduce errors while the user is first entering their address.
  if (email.getAttribute('aria-invalid') === 'true') {
    setError(validationMessage());
  }
});

form.addEventListener('reset', () => {
  setError('');
  status.textContent = '';
});

// Only replace native validation once the inline handlers are ready.
form.noValidate = true;
