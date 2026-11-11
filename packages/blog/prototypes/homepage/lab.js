let size = 'mobile';
let theme = 'dark';
let active = document.querySelector('[data-concept]')?.dataset.concept ?? 'field-kit';
let toolsFocused = document.querySelector('#jump-tools').getAttribute('aria-pressed') === 'true';
const frames = [...document.querySelectorAll('[data-preview]')];

function resize() {
  for (const frame of frames) {
    const container = frame.closest('.preview-frame');
    const shell = frame.closest('.preview-shell');
    if (!container || !shell || !container.clientWidth) continue;
    const width = size === 'desktop' ? 1280 : size === 'narrow' ? 320 : 393;
    const scale = container.clientWidth / width;
    shell.style.setProperty('--preview-width', String(width));
    shell.style.setProperty('--preview-scale', String(scale));
    container.style.height = `${(size === 'desktop' ? 1000 : 910) * scale}px`;
  }
}

function scrollPreview(frame) {
  const child = frame.contentWindow;
  if (!child) return;
  if (toolsFocused) {
    const module = child.document.querySelector('.home-tool-study, .home-tools-invitation');
    if (module) child.scrollTo({ top: Math.max(0, module.getBoundingClientRect().top + child.scrollY - 24), behavior: 'instant' });
  } else child.scrollTo({ top: 0, behavior: 'instant' });
}

function update() {
  document.body.dataset.size = size;
  document.documentElement.dataset.theme = theme;
  for (const button of document.querySelectorAll('[data-size]')) button.setAttribute('aria-pressed', String(button.dataset.size === size));
  for (const button of document.querySelectorAll('[data-theme-choice]')) button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme));
  for (const button of document.querySelectorAll('[data-concept]')) button.setAttribute('aria-pressed', String(button.dataset.concept === active));
  for (const card of document.querySelectorAll('[data-concept-card]')) card.toggleAttribute('data-active', card.dataset.conceptCard === active);
  for (const frame of frames) {
    if (frame.contentDocument?.documentElement) frame.contentDocument.documentElement.dataset.theme = theme;
  }
  for (const link of document.querySelectorAll('[data-open]')) link.href = `/_design/homepage/${link.dataset.open}/?theme=${theme}`;
  resize();
  for (const frame of frames) scrollPreview(frame);
}

for (const button of document.querySelectorAll('[data-size]')) button.addEventListener('click', () => { size = button.dataset.size; update(); });
for (const button of document.querySelectorAll('[data-theme-choice]')) button.addEventListener('click', () => { theme = button.dataset.themeChoice; update(); });
for (const button of document.querySelectorAll('[data-concept]')) button.addEventListener('click', () => { active = button.dataset.concept; update(); });
document.querySelector('#jump-tools').addEventListener('click', (event) => {
  toolsFocused = !toolsFocused;
  event.currentTarget.setAttribute('aria-pressed', String(toolsFocused));
  event.currentTarget.innerHTML = toolsFocused ? 'Back to the homepage <span aria-hidden="true">↑</span>' : 'Focus on the tools <span aria-hidden="true">↓</span>';
  for (const frame of frames) scrollPreview(frame);
});
for (const frame of frames) frame.addEventListener('load', () => { update(); });
new ResizeObserver(resize).observe(document.querySelector('.studies'));
update();
