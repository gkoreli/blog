const toggle = document.querySelector('#menu-toggle');
const nav = document.querySelector('#site-nav');
const wideNavigation = window.matchMedia('(min-width: 900px)');

function setNavigationOpen(open) {
  nav.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', String(open));
}

toggle.addEventListener('click', () => {
  if (!wideNavigation.matches) {
    setNavigationOpen(toggle.getAttribute('aria-expanded') !== 'true');
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && nav.classList.contains('open')) {
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
  if (event.target.closest('a[href]')) {
    setNavigationOpen(false);
  }
});

wideNavigation.addEventListener('change', () => {
  // Avoid leaving focus on a control or link that the new layout hides.
  const activeElement = document.activeElement;
  setNavigationOpen(false);
  if (wideNavigation.matches && activeElement === toggle) {
    nav.querySelector('a[href]').focus();
  } else if (!wideNavigation.matches && nav.contains(activeElement)) {
    toggle.focus();
  }
});

// Enhance only after the handlers are ready; without JavaScript links stay visible.
document.documentElement.classList.add('js');

document.querySelector('#outside-action').onclick = () => {
  document.querySelector('#outside-status').textContent = 'Outside action completed';
};
