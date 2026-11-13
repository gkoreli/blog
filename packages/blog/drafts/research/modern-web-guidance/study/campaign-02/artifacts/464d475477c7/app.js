const form = document.querySelector('#newsletter-form');
const email = document.querySelector('#email');
const error = document.querySelector('#email-error');
const status = document.querySelector('#subscribe-status');
let interacted = false;

function updateError() {
  const invalid = interacted && !email.validity.valid;
  const descriptions = (email.getAttribute('aria-describedby') || '')
    .split(/\s+/).filter(id => id && id !== error.id);

  email.setAttribute('aria-invalid', String(invalid));
  if (invalid) descriptions.push(error.id);
  if (descriptions.length) {
    email.setAttribute('aria-describedby', descriptions.join(' '));
  } else {
    email.removeAttribute('aria-describedby');
  }

  error.textContent = invalid
    ? (email.validity.valueMissing
      ? 'Enter your email address.'
      : 'Enter a valid email address, such as name@example.com.')
    : '';
  error.hidden = !invalid;
  return invalid;
}

email.addEventListener('blur', () => {
  interacted = true;
  const wasInvalid = email.getAttribute('aria-invalid') === 'true';
  if (updateError() && !wasInvalid) {
    status.textContent = error.textContent;
  }
});

email.addEventListener('input', () => {
  status.textContent = '';
  updateError();
});

email.addEventListener('change', () => {
  status.textContent = '';
  interacted = true;
  updateError();
});

form.addEventListener('submit', event => {
  event.preventDefault();
  interacted = true;
  status.textContent = '';
  if (updateError()) {
    email.focus();
    status.textContent = error.textContent;
    return;
  }
  status.textContent = acceptSubscription(email.value);
});

form.addEventListener('reset', () => {
  // The browser restores field values after dispatching the reset event.
  setTimeout(() => {
    interacted = false;
    status.textContent = '';
    updateError();
  });
});

// Enable inline validation only after the handlers are ready. Without JavaScript,
// the required/email constraints and the original submit destination still work.
form.noValidate = true;
