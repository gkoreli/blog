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
  error.hidden = true;
  error.textContent = '';
}

email.addEventListener('input', () => {
  clearError();
  status.textContent = '';
});

form.addEventListener('submit', event => {
  event.preventDefault();
  clearError();
  status.textContent = '';

  if (!email.validity.valid) {
    error.textContent = email.validity.valueMissing
      ? 'Enter your email address.'
      : 'Enter a valid email address, such as name@example.com.';
    error.hidden = false;
    email.setAttribute('aria-invalid', 'true');
    const descriptions = email.getAttribute('aria-describedby');
    email.setAttribute('aria-describedby', [descriptions, error.id].filter(Boolean).join(' '));
    email.focus();
    return;
  }

  status.textContent = acceptSubscription(email.value);
});

// Enable inline validation only once the handlers are ready. Without JavaScript,
// the required/email constraints and normal submission remain available.
form.noValidate = true;
