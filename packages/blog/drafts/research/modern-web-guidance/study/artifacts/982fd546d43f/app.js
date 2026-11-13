const toggle = document.querySelector('#menu-toggle');
const nav = document.querySelector('#site-nav');
const header = document.querySelector('#site-header');
const wideNavigation = window.matchMedia('(min-width: 900px)');

function setNavigationOpen(open) {
  const expanded = open && !wideNavigation.matches;
  nav.classList.toggle('open', expanded);
  toggle.setAttribute('aria-expanded', String(expanded));
}

toggle.addEventListener('click', () => {
  setNavigationOpen(toggle.getAttribute('aria-expanded') !== 'true');
});

header.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
    setNavigationOpen(false);
    toggle.focus();
    event.preventDefault();
  }
});

document.addEventListener('click', (event) => {
  if (!nav.contains(event.target) && !toggle.contains(event.target)) {
    // Leave the outside target's default action and focus behavior intact.
    setNavigationOpen(false);
  }
});

nav.addEventListener('click', (event) => {
  if (event.target.closest('a[href]')) setNavigationOpen(false);
});

wideNavigation.addEventListener('change', () => {
  const focused = document.activeElement;
  setNavigationOpen(false);
  if (!wideNavigation.matches && nav.contains(focused)) toggle.focus();
  if (wideNavigation.matches && focused === toggle) nav.querySelector('a[href]').focus();
});

// Enhance only after the disclosure handlers are ready; otherwise links stay visible.
header.classList.add('nav-ready');
toggle.hidden = false;

document.querySelector('#outside-action').onclick = () => {
  document.querySelector('#outside-status').textContent = 'Outside action completed';
};
