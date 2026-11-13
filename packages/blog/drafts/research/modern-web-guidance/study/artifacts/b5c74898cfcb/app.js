const toggle = document.querySelector('#menu-toggle');
const nav = document.querySelector('#site-nav');
const header = document.querySelector('#site-header');
const wideLayout = window.matchMedia('(min-width: 900px)');

function setNavigationOpen(open) {
  const expanded = open && !wideLayout.matches;
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
  if (!header.contains(event.target)) setNavigationOpen(false);
});

nav.addEventListener('click', (event) => {
  if (event.target.closest('a[href]')) setNavigationOpen(false);
});

wideLayout.addEventListener('change', () => {
  // Keep focus on a visible control when crossing the layout breakpoint.
  if (wideLayout.matches && document.activeElement === toggle) {
    nav.querySelector('a').focus();
  } else if (!wideLayout.matches && nav.contains(document.activeElement)) {
    toggle.focus();
  }
  setNavigationOpen(false);
});

setNavigationOpen(false);
document.documentElement.classList.add('js');

document.querySelector('#outside-action').onclick = () => {
  document.querySelector('#outside-status').textContent = 'Outside action completed';
};
