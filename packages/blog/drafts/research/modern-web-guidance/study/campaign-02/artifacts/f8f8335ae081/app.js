const toggle = document.querySelector('#menu-toggle');
const nav = document.querySelector('#site-nav');
const wideLayout = window.matchMedia('(min-width: 900px)');

function setExpanded(expanded) {
  const open = expanded && !wideLayout.matches;
  toggle.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('open', open);
  nav.hidden = !wideLayout.matches && !open;
}

function updateLayout() {
  const activeElement = document.activeElement;
  toggle.hidden = wideLayout.matches;
  setExpanded(false);

  // Keep keyboard focus on a visible control when the layout changes.
  if (wideLayout.matches && activeElement === toggle) {
    nav.querySelector('a').focus();
  } else if (!wideLayout.matches && nav.contains(activeElement)) {
    toggle.focus();
  }
}

toggle.addEventListener('click', () => {
  setExpanded(toggle.getAttribute('aria-expanded') !== 'true');
});

document.querySelector('#site-header').addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
    event.preventDefault();
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

wideLayout.addEventListener('change', updateLayout);
updateLayout();

document.querySelector('#outside-action').onclick = () => {
  document.querySelector('#outside-status').textContent = 'Outside action completed';
};
