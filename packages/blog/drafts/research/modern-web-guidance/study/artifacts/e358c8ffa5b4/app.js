const toggle = document.querySelector('#menu-toggle');
const nav = document.querySelector('#site-nav');
const desktop = window.matchMedia('(min-width: 900px)');

function setNavigationOpen(open) {
  nav.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', String(open));
}

toggle.addEventListener('click', () => {
  if (!desktop.matches) {
    setNavigationOpen(!nav.classList.contains('open'));
  }
});

nav.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !desktop.matches && nav.classList.contains('open')) {
    event.preventDefault();
    setNavigationOpen(false);
    toggle.focus();
  }
});

nav.addEventListener('click', event => {
  if (event.target.closest('a[href]')) {
    setNavigationOpen(false);
  }
});

document.addEventListener('click', event => {
  if (!nav.contains(event.target) && !toggle.contains(event.target)) {
    setNavigationOpen(false);
  }
});

desktop.addEventListener('change', () => setNavigationOpen(false));
setNavigationOpen(false);
document.querySelector('#site-header').classList.add('nav-ready');
toggle.hidden = false;

document.querySelector('#outside-action').onclick = () => {
  document.querySelector('#outside-status').textContent = 'Outside action completed';
};
