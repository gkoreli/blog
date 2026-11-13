const form = document.querySelector('#newsletter-form');
const email = document.querySelector('#email');
const error = document.querySelector('#email-error');
const status = document.querySelector('#subscribe-status');
const announcement = document.querySelector('#validation-announcement');
let announceTimer;

function updateError(invalid, announce = false) {
  const wasInvalid = email.getAttribute('aria-invalid') === 'true';
  const message = invalid
    ? (email.validity.valueMissing
      ? 'Please enter your email address.'
      : 'Please enter a valid email address, such as name@example.com.')
    : '';

  email.setAttribute('aria-invalid', String(invalid));
  const descriptions = (email.getAttribute('aria-describedby') || '')
    .split(/\s+/).filter(id => id && id !== error.id);
  if (invalid) descriptions.push(error.id);
  if (descriptions.length) email.setAttribute('aria-describedby', descriptions.join(' '));
  else email.removeAttribute('aria-describedby');
  error.textContent = message;
  error.hidden = !invalid;

  if (!invalid) {
    clearTimeout(announceTimer);
    announcement.textContent = '';
  } else if (announce && !wasInvalid) {
    clearTimeout(announceTimer);
    announcement.textContent = '';
    announceTimer = setTimeout(() => {
      announcement.textContent = `Email address: ${message}`;
    }, 500);
  }
}

// Native validation still gates submission; replace its popup with inline feedback.
email.addEventListener('invalid', event => {
  event.preventDefault();
  clearTimeout(announceTimer);
  announcement.textContent = '';
  status.textContent = '';
  updateError(true);
  email.focus();
});

email.addEventListener('input', () => {
  clearTimeout(announceTimer);
  announcement.textContent = '';
  status.textContent = '';
  updateError(!email.validity.valid &&
    (email.getAttribute('aria-invalid') === 'true' || email.matches(':user-invalid')));
});

for (const eventName of ['blur', 'change']) {
  email.addEventListener(eventName, () => {
    updateError(!email.validity.valid &&
      (email.getAttribute('aria-invalid') === 'true' || email.matches(':user-invalid')), true);
  });
}

form.addEventListener('submit', event => {
  event.preventDefault();
  // Also guard submit events dispatched directly by integrations.
  if (!email.validity.valid) {
    status.textContent = '';
    updateError(true);
    email.focus();
    return;
  }
  updateError(false);
  status.textContent = acceptSubscription(email.value);
});

form.addEventListener('reset', () => {
  updateError(false);
  status.textContent = '';
});
