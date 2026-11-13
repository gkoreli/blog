const form = document.querySelector('#newsletter-form');
const email = document.querySelector('#email');
const error = document.querySelector('#email-error');
const status = document.querySelector('#subscribe-status');

function clearError() {
  email.removeAttribute('aria-invalid');
  const descriptions = (email.getAttribute('aria-describedby') || '')
    .split(/\s+/)
    .filter(id => id && id !== error.id);
  if (descriptions.length) {
    email.setAttribute('aria-describedby', descriptions.join(' '));
  } else {
    email.removeAttribute('aria-describedby');
  }
  error.textContent = '';
  error.hidden = true;
}

email.addEventListener('input', () => {
  status.textContent = '';
  if (email.validity.valid) clearError();
});

form.addEventListener('submit', event => {
  event.preventDefault();
  status.textContent = '';

  if (!email.validity.valid) {
    error.textContent = email.validity.valueMissing
      ? 'Enter your email address.'
      : 'Enter a valid email address, such as name@example.com.';
    error.hidden = false;
    email.setAttribute('aria-invalid', 'true');
    const descriptions = (email.getAttribute('aria-describedby') || '')
      .split(/\s+/)
      .filter(Boolean);
    if (!descriptions.includes(error.id)) descriptions.push(error.id);
    email.setAttribute('aria-describedby', descriptions.join(' '));
    email.focus();
    return;
  }

  clearError();
  status.textContent = acceptSubscription(email.value);
});

// Enable inline validation only after the handlers are installed.
// Without JavaScript, native validation and the form's submit path remain active.
form.noValidate = true;
