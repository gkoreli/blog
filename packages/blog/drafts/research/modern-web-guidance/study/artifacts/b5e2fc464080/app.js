const toggle = document.querySelector('#menu-toggle');
const nav = document.querySelector('#site-nav');
const wideLayout = window.matchMedia('(min-width: 900px)');

function setNavOpen(open) {
  const expanded = open && !wideLayout.matches;
  nav.classList.toggle('open', expanded);
  toggle.setAttribute('aria-expanded', String(expanded));
}

toggle.addEventListener('click', () => {
  setNavOpen(toggle.getAttribute('aria-expanded') !== 'true');
});

nav.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
    event.preventDefault();
    setNavOpen(false);
    toggle.focus();
  }
});

nav.addEventListener('click', (event) => {
  if (event.target.closest('a[href]')) setNavOpen(false);
});

document.addEventListener('click', (event) => {
  if (!nav.contains(event.target) && !toggle.contains(event.target)) {
    setNavOpen(false);
  }
});

wideLayout.addEventListener('change', () => setNavOpen(false));
setNavOpen(false);
document.documentElement.classList.add('nav-ready');

document.querySelector('#outside-action').onclick = () => {
  document.querySelector('#outside-status').textContent = 'Outside action completed';
};
