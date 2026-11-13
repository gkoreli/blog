const toggle = document.querySelector('#menu-toggle');
const nav = document.querySelector('#site-nav');
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
  if (!nav.contains(event.target) && !toggle.contains(event.target)) {
    setNavigationOpen(false);
  }
});

nav.addEventListener('click', (event) => {
  if (event.target.closest('a[href]')) setNavigationOpen(false);
});

wideLayout.addEventListener('change', () => {
  const focused = document.activeElement;
  setNavigationOpen(false);
  if (!wideLayout.matches && nav.contains(focused)) toggle.focus();
  if (wideLayout.matches && focused === toggle) nav.querySelector('a[href]').focus();
});

setNavigationOpen(false);
toggle.hidden = false;
document.documentElement.classList.add('js');

document.querySelector('#outside-action').onclick = () => {
  document.querySelector('#outside-status').textContent = 'Outside action completed';
};
