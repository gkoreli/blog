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

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
    setExpanded(false);
    toggle.focus();
    event.preventDefault();
  }
});

document.addEventListener('click', event => {
  if (!nav.contains(event.target) && !toggle.contains(event.target)) {
    setExpanded(false);
  }
});

nav.addEventListener('click', event => {
  if (event.target.closest('a[href]')) setExpanded(false);
});

desktop.addEventListener('change', () => {
  // Keep focus visible when a breakpoint hides the currently focused control.
  const focused = document.activeElement;
  setExpanded(false);
  if (!desktop.matches && nav.contains(focused)) toggle.focus();
  if (desktop.matches && focused === toggle) nav.querySelector('a[href]').focus();
});

setExpanded(false);
document.documentElement.classList.add('js');

document.querySelector('#outside-action').onclick = () => {
  document.querySelector('#outside-status').textContent = 'Outside action completed';
};
