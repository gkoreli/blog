const toggle = document.querySelector('#menu-toggle');
const nav = document.querySelector('#site-nav');
const wideLayout = window.matchMedia('(min-width: 900px)');

function setNavigationOpen(open) {
  const expanded = open && !wideLayout.matches;
  nav.classList.toggle('open', expanded);
  toggle.setAttribute('aria-expanded', String(expanded));
}

function isNavigationOpen() {
  return toggle.getAttribute('aria-expanded') === 'true';
}

toggle.addEventListener('click', () => {
  setNavigationOpen(!isNavigationOpen());
});

nav.addEventListener('click', (event) => {
  if (event.target.closest('a[href]')) {
    setNavigationOpen(false);
  }
});

document.addEventListener('click', (event) => {
  if (!nav.contains(event.target) && !toggle.contains(event.target)) {
    setNavigationOpen(false);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && isNavigationOpen()) {
    event.preventDefault();
    setNavigationOpen(false);
    toggle.focus();
  }
});

wideLayout.addEventListener('change', () => {
  const focusedElement = document.activeElement;
  setNavigationOpen(false);
  if (wideLayout.matches && focusedElement === toggle) {
    nav.querySelector('a[href]').focus();
  } else if (!wideLayout.matches && nav.contains(focusedElement)) {
    toggle.focus();
  }
});

setNavigationOpen(false);
document.documentElement.classList.add('js');

document.querySelector('#outside-action').onclick = () => {
  document.querySelector('#outside-status').textContent = 'Outside action completed';
};
