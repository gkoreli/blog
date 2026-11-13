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

function showError() {
  error.textContent = email.validity.valueMissing
    ? 'Enter your email address.'
    : email.validity.typeMismatch
      ? 'Enter a valid email address, such as name@example.com.'
      : email.validationMessage;
  error.hidden = false;
  email.setAttribute('aria-invalid', 'true');
  const descriptions = (email.getAttribute('aria-describedby') || '')
    .split(/\s+/)
    .filter(Boolean);
  if (!descriptions.includes(error.id)) descriptions.push(error.id);
  email.setAttribute('aria-describedby', descriptions.join(' '));
}

email.addEventListener('input', () => {
  status.textContent = '';
  if (email.getAttribute('aria-invalid') === 'true') {
    if (email.validity.valid) clearError();
    else showError();
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

// Enable inline validation only after its handlers are installed. Without
// JavaScript, the browser retains native validation and the form's submit path.
form.noValidate = true;
