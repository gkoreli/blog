const toggle = document.querySelector('#menu-toggle');
const nav = document.querySelector('#site-nav');
const wideLayout = window.matchMedia('(min-width: 900px)');

function setOpen(open) {
  nav.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', String(open));
}

function syncLayout() {
  const focused = document.activeElement;
  setOpen(false);
  // Keep focus usable when a breakpoint hides its current control.
  if (wideLayout.matches && focused === toggle) {
    nav.querySelector('a[href]').focus();
  } else if (!wideLayout.matches && nav.contains(focused)) {
    toggle.focus();
  }
}

toggle.addEventListener('click', () => {
  if (!wideLayout.matches) setOpen(!nav.classList.contains('open'));
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !wideLayout.matches && nav.classList.contains('open')) {
    setOpen(false);
    toggle.focus();
    event.preventDefault();
  }
});

document.addEventListener('click', event => {
  if (!nav.contains(event.target) && !toggle.contains(event.target)) {
    setOpen(false);
  }
});

nav.addEventListener('click', event => {
  if (event.target.closest('a[href]')) setOpen(false);
});

wideLayout.addEventListener('change', syncLayout);
toggle.hidden = false;
document.documentElement.classList.add('js');
syncLayout();

document.querySelector('#outside-action').onclick = () => {
  document.querySelector('#outside-status').textContent = 'Outside action completed';
};
