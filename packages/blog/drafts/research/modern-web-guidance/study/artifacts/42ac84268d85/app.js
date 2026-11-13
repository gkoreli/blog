const toggle = document.querySelector('#menu-toggle');
const nav = document.querySelector('#site-nav');
const desktop = window.matchMedia('(min-width: 900px)');

function setNavigationOpen(open) {
  const expanded = open && !desktop.matches;
  nav.classList.toggle('open', expanded);
  toggle.setAttribute('aria-expanded', String(expanded));
}

toggle.addEventListener('click', () => {
  setNavigationOpen(toggle.getAttribute('aria-expanded') !== 'true');
});

nav.addEventListener('keydown', event => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
    setNavigationOpen(false);
    toggle.focus();
    event.preventDefault();
  }
});

nav.addEventListener('click', event => {
  if (event.target.closest('a[href]')) setNavigationOpen(false);
});

document.addEventListener('click', event => {
  if (!nav.contains(event.target) && !toggle.contains(event.target)) {
    setNavigationOpen(false);
  }
});

desktop.addEventListener('change', () => setNavigationOpen(false));
setNavigationOpen(false);
document.documentElement.classList.add('js');

document.querySelector('#outside-action').onclick = () => {
  document.querySelector('#outside-status').textContent = 'Outside action completed';
};
