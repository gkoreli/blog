const toggle = document.querySelector('#menu-toggle');
const nav = document.querySelector('#site-nav');
const desktop = window.matchMedia('(min-width: 900px)');

function setExpanded(expanded) {
  const open = expanded && !desktop.matches;
  nav.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', String(open));
}

toggle.addEventListener('click', () => {
  setExpanded(toggle.getAttribute('aria-expanded') !== 'true');
});

nav.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
    setExpanded(false);
    toggle.focus();
  }
});

nav.addEventListener('click', (event) => {
  if (event.target.closest('a[href]')) setExpanded(false);
});

document.addEventListener('click', (event) => {
  if (!nav.contains(event.target) && !toggle.contains(event.target)) {
    setExpanded(false);
  }
});

desktop.addEventListener('change', () => setExpanded(false));
setExpanded(false);
document.documentElement.classList.add('js');
toggle.hidden = false;

document.querySelector('#outside-action').onclick = () => {
  document.querySelector('#outside-status').textContent = 'Outside action completed';
};
