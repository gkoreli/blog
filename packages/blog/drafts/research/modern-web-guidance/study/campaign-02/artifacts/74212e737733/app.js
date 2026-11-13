const form = document.querySelector('#newsletter-form');
const email = document.querySelector('#email');
const error = document.querySelector('#email-error');
const status = document.querySelector('#subscribe-status');

function updateError(show) {
  const descriptionIds = (email.getAttribute('aria-describedby') || '')
    .split(/\s+/)
    .filter(id => id && id !== error.id);

  email.setAttribute('aria-invalid', String(show));
  if (show) descriptionIds.push(error.id);
  if (descriptionIds.length) {
    email.setAttribute('aria-describedby', descriptionIds.join(' '));
  } else {
    email.removeAttribute('aria-describedby');
  }

  error.hidden = !show;
  error.textContent = show
    ? (email.validity.valueMissing
      ? 'Please enter your email address.'
      : 'Please enter a valid email address, such as name@example.com.')
    : '';
}

form.addEventListener('submit', event => {
  event.preventDefault();
  status.textContent = '';

  if (!email.validity.valid) {
    updateError(true);
    email.focus();
    return;
  }

  updateError(false);
  status.textContent = acceptSubscription(email.value);
});

email.addEventListener('input', () => {
  status.textContent = '';
  if (email.getAttribute('aria-invalid') === 'true') {
    updateError(!email.validity.valid);
  }
});

form.addEventListener('reset', () => {
  updateError(false);
  status.textContent = '';
});

// Enable inline validation only after its handlers are ready. Without JavaScript,
// the required/email constraints and the form's normal submit path remain active.
form.noValidate = true;
