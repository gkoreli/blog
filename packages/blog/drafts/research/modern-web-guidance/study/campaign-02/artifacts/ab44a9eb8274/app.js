const toggle = document.querySelector('#menu-toggle');
const nav = document.querySelector('#site-nav');
const desktop = window.matchMedia('(min-width: 900px)');

function setOpen(open) {
  const expanded = open && !desktop.matches;
  nav.classList.toggle('open', expanded);
  toggle.setAttribute('aria-expanded', String(expanded));
}

toggle.addEventListener('click', () => {
  setOpen(toggle.getAttribute('aria-expanded') !== 'true');
});

nav.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
    event.preventDefault();
    setOpen(false);
    toggle.focus();
  }
});

nav.addEventListener('click', (event) => {
  if (event.target.closest('a[href]')) setOpen(false);
});

document.addEventListener('click', (event) => {
  if (!nav.contains(event.target) && !toggle.contains(event.target)) {
    setOpen(false);
  }
});

desktop.addEventListener('change', () => setOpen(false));
setOpen(false);
document.documentElement.classList.add('js');
toggle.hidden = false;

document.querySelector('#outside-action').onclick = () => {
  document.querySelector('#outside-status').textContent = 'Outside action completed';
};
