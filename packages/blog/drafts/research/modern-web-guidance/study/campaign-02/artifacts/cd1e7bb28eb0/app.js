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

nav.addEventListener('click', (event) => {
  if (event.target.closest('a[href]')) setExpanded(false);
});

document.addEventListener('click', (event) => {
  if (!nav.contains(event.target) && !toggle.contains(event.target)) {
    setExpanded(false);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
    event.preventDefault();
    setExpanded(false);
    toggle.focus();
  }
});

wideLayout.addEventListener('change', () => {
  // Keep focus on a visible control when the layout changes.
  if (!wideLayout.matches && nav.contains(document.activeElement)) {
    toggle.focus();
  } else if (wideLayout.matches && document.activeElement === toggle) {
    nav.querySelector('a[href]').focus();
  }
  setExpanded(false);
});

setExpanded(false);
document.documentElement.classList.add('js');

document.querySelector('#outside-action').onclick = () => {
  document.querySelector('#outside-status').textContent = 'Outside action completed';
};
