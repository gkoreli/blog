const toggle = document.querySelector('#menu-toggle');
const nav = document.querySelector('#site-nav');
const wideLayout = window.matchMedia('(min-width: 900px)');

function setExpanded(expanded) {
  const open = expanded && !wideLayout.matches;
  nav.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', String(open));
}

toggle.addEventListener('click', () => {
  setExpanded(toggle.getAttribute('aria-expanded') !== 'true');
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && nav.classList.contains('open') &&
      (nav.contains(event.target) || toggle.contains(event.target))) {
    event.preventDefault();
    setExpanded(false);
    toggle.focus();
  }
});

document.addEventListener('click', (event) => {
  if (!nav.contains(event.target) && !toggle.contains(event.target)) {
    setExpanded(false);
  }
});

nav.addEventListener('click', (event) => {
  if (event.target.closest('a[href]')) setExpanded(false);
});

wideLayout.addEventListener('change', () => {
  const activeElement = document.activeElement;
  setExpanded(false);
  // Keep focus usable when a layout change hides the focused control.
  if (wideLayout.matches && activeElement === toggle) {
    nav.querySelector('a[href]').focus();
  } else if (!wideLayout.matches && nav.contains(activeElement)) {
    toggle.focus();
  }
});

setExpanded(false);
document.documentElement.classList.add('js');

document.querySelector('#outside-action').onclick = () => {
  document.querySelector('#outside-status').textContent = 'Outside action completed';
};
