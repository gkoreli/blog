const toggle = document.querySelector('#menu-toggle');
const nav = document.querySelector('#site-nav');
const wideLayout = window.matchMedia('(min-width: 900px)');

function setMenuOpen(open) {
  const expanded = open && !wideLayout.matches;
  toggle.setAttribute('aria-expanded', String(expanded));
  nav.hidden = !wideLayout.matches && !expanded;
}

function updateLayout() {
  const activeElement = document.activeElement;
  toggle.hidden = wideLayout.matches;
  setMenuOpen(false);

  // Keep focus usable when the element containing it becomes hidden.
  if (wideLayout.matches && activeElement === toggle) {
    nav.querySelector('a[href]').focus();
  } else if (!wideLayout.matches && nav.contains(activeElement)) {
    toggle.focus();
  }
}

toggle.addEventListener('click', () => {
  setMenuOpen(toggle.getAttribute('aria-expanded') !== 'true');
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
    setMenuOpen(false);
    toggle.focus();
    event.preventDefault();
  }
});

document.addEventListener('click', (event) => {
  if (!nav.contains(event.target) && !toggle.contains(event.target)) {
    // Let the outside control receive its normal click and focus.
    setMenuOpen(false);
  }
});

nav.addEventListener('click', (event) => {
  if (event.target.closest('a[href]')) {
    setMenuOpen(false);
  }
});

wideLayout.addEventListener('change', updateLayout);
updateLayout();

document.querySelector('#outside-action').onclick = () => {
  document.querySelector('#outside-status').textContent = 'Outside action completed';
};
