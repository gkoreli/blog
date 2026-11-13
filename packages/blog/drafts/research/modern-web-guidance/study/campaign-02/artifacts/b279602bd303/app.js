const toggle = document.querySelector('#menu-toggle');
const nav = document.querySelector('#site-nav');
const wideNavigation = window.matchMedia('(min-width: 900px)');

function setNavigationOpen(open) {
  const expanded = open && !wideNavigation.matches;
  nav.classList.toggle('open', expanded);
  toggle.setAttribute('aria-expanded', String(expanded));
}

toggle.addEventListener('click', () => {
  setNavigationOpen(toggle.getAttribute('aria-expanded') !== 'true');
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
    event.preventDefault();
    setNavigationOpen(false);
    toggle.focus();
  }
});

document.addEventListener('click', (event) => {
  if (!nav.contains(event.target) && !toggle.contains(event.target)) {
    setNavigationOpen(false);
  }
});

nav.addEventListener('click', (event) => {
  if (event.target.closest('a[href]')) setNavigationOpen(false);
});

wideNavigation.addEventListener('change', () => {
  // Keep focus on a visible navigation control when the layout changes.
  if (wideNavigation.matches && document.activeElement === toggle) {
    nav.querySelector('a[href]').focus();
  } else if (!wideNavigation.matches && nav.contains(document.activeElement)) {
    toggle.focus();
  }
  setNavigationOpen(false);
});

setNavigationOpen(false);
document.querySelector('#site-header').classList.add('navigation-ready');

document.querySelector('#outside-action').onclick = () => {
  document.querySelector('#outside-status').textContent = 'Outside action completed';
};
